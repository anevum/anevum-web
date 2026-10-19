import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const creators=read("web/src/pages/CreatorsPage.tsx");
const status=read("web/src/pages/StatusPage.tsx");
const states=read("web/src/components/States.tsx");
const bootstrap=read("web/src/main.tsx");
const css=read("web/src/continuance-experience-v091.css");
const publicPage=read("web/src/pages/Phase1PublicMemberPage.tsx");
const app=read("web/src/App.tsx");
const shell=read("web/src/components/Shell.tsx");

test("V091 updates compile as genuine TSX with bounded public navigation",()=>{
  for(const code of [creators,status,states,bootstrap]){
    assert.doesNotThrow(()=>parse(code,{sourceType:"module",plugins:["typescript","jsx"]}));
  }
  assert.match(app,/path="creators\/:handle" element=\{<CreatorPage\/>\}/);
  assert.match(app,/path=":memberHandle" element=\{<CanonicalPublicHandle\/>\}/);
  assert.match(publicPage,/canonicalPublic\(handle,signal\)/);
});

test("V091 repairs unavailable legacy creator channel only through an independently public canonical world",()=>{
  assert.match(creators,/readCreator\(handle,signal\)/);
  assert.match(creators,/status\?:number/);
  assert.match(creators,/\.status===404/);
  assert.match(creators,/canonicalPublic\(handle,signal\)/);
  assert.match(creators,/member\.profile\.handle===handle/);
  assert.match(creators,/kind:"member"/);
  assert.match(creators,/<Navigate to=\{"\/@"/);
  assert.match(creators,/kind:"missing"/);
  assert.doesNotMatch(creators,/memberClaim|canonicalClaim|memberSaveProfile|memberCreateProject|localStorage|Math\.random/);
});

test("V091 status no longer claims a stale launch date or invented service readiness",()=>{
  for(const token of [
    "readStatus(signal)","canonicalMethods(signal)","memberHealth(signal)",
    "auth.registration","auth.availability","health.status","studioReady",
    "studioUploadsReady","progressionReady",
    "catalogue.counts.publishedProjects","catalogue.counts.publishedCreators",
    "PUBLIC READ / ROLE-GATED WRITE","AUTHORIZED STAFF ONLY"
  ])assert.ok(status.includes(token),"Missing live status input or access boundary: "+token);
  assert.doesNotMatch(status,/JAN 01|OPENING TARGET|public submissions remain closed|all services operational|public launch complete/i);
  assert.doesNotMatch(status,/fetch\(|localStorage|sessionStorage|Math\.random|memberCreateProject|canonicalClaim/);
});

test("V091 visual integration follows V089 and respects core mobile/reduced-motion contracts",()=>{
  assert.match(bootstrap,/import "\.\/continuance-experience-v091\.css";/);
  assert.ok(bootstrap.indexOf("continuance-experience-v091.css")>bootstrap.indexOf("iren-living-v088.css"));
  for(const token of [
    ".av9-shell",".av79-navigation",".portal-browse-layout",".portal-wide-search",
    ".v091-status-page",".v091-status-service-grid",".state-card",
    "max-width:900px","max-width:650px","max-width:380px",
    "prefers-reduced-motion:reduce","forced-colors:active"
  ])assert.ok(css.includes(token),"Missing responsive styling: "+token);
  assert.doesNotMatch(css,/url\(https?:|image-rendering:\s*pixelated|animation:\s*[^;]*infinite/);
  assert.match(shell,/<IrenGuidedContinuance/);
  assert.match(shell,/id="av79-navigation"/);
});

test("V091 public data error states give meaningful navigation and an explicit retry",()=>{
  assert.match(states,/role="alert"/);
  assert.match(states,/window\.location\.reload\(\)/);
  assert.match(states,/to="\/discover"/);
  assert.match(states,/to="\/status"/);
  assert.match(states,/v091-recovery-actions/);
  assert.doesNotMatch(states,/setTimeout|setInterval|unbounded/i);
});
