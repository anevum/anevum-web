/**
 * V136.026 first-visit clarity / regression guard.
 * Source assertions complement the actual compiled React browser checks.
 * No runtime, signup, data migrations, publication, or telemetry.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const first=read("web/src/parity/FirstVisitClarityV136.tsx");
const styles=read("web/src/parity/first-visit-clarity-v136.css");
const home=read("web/src/parity/ParityPortalV136.tsx");
const start=read("web/src/pages/StartPage.tsx");
const app=read("web/src/App.tsx");
const join=read("web/src/pages/Phase1JoinPage.tsx");

test("new first-visit guidance compiles as valid TSX and belongs to existing arrival",()=>{
 for(const source of [first,home,start])assert.doesNotThrow(()=>
  parse(source,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(home,/import \{FirstVisitClarityV136\} from '\.\/FirstVisitClarityV136'/);
 assert.match(home,/<FirstVisitClarityV136 signedIn=\{signedIn\}\/\>/);
 assert.equal((home.match(/<FirstVisitClarityV136/g)||[]).length,1);
 assert.match(first,/import "\.\/first-visit-clarity-v136\.css"/);
 assert.doesNotMatch(first,/fetch\(|localStorage|sessionStorage|setInterval|navigator\.sendBeacon|dangerouslySetInnerHTML|Math\.random/);
 assert.doesNotMatch(first,/IREN.*new|IrenGuidedContinuance|<form|input type="email"/);
});

test("clarity copy honors public browse, server-controlled accounts and private publishing",()=>{
 for(const url of ["/discover","/community","/join","/member","/status","/start"])
  assert.ok(first.includes(url),'Clarity contains actual existing route '+url);
 for(const route of ['path="join"','path="start"','path="discover"','path="community"','path="status"'])
  assert.ok(app.includes(route),'Canonical app still owns '+route);
 assert.match(first,/uploading and publication have separate access and review requirements/i);
 assert.match(first,/Signing up does not grant upload or publication permissions\./);
 assert.match(first,/dedicated public feedback inbox and feature voting are not live yet/);
 assert.match(first,/Verified members with discussion access/);
 assert.match(first,/to=\{signedIn\?"\/member":"\/join"\}/);
 assert.match(first,/Check what works now/);
 assert.match(home,/Browse approved independent games, useful apps, art and experiments/);
 assert.match(home,/Publishing requires separate access and review/);
});

test("answers use native optional disclosures, remain keyboard accessible and fit phones",()=>{
 assert.equal((first.match(/<details>/g)||[]).length,3);
 assert.equal((first.match(/<summary>/g)||[]).length,3);
 assert.doesNotMatch(first,/defaultOpen|<dialog|aria-modal|role="tab"/);
 for(const token of ['min-height:49px','max-width:520px','focus-visible','prefers-reduced-motion:reduce','forced-colors:active'])
  assert.ok(styles.includes(token),'Missing accessibility/layout safeguard: '+token);
 assert.doesNotMatch(styles,/position:fixed|@keyframes|background-image:\s*url\(/);
});

test("Start Here no longer asserts retired launch restrictions or invents access",()=>{
 for(const old of ['The public discussion board and open member registration are not live yet.',
  'Creator accounts and submissions are invitation-only during testing;',
  'As member access opens'])
  assert.equal(start.includes(old),false,'Outdated first-visit assertion remains: '+old);
 assert.match(start,/Joining ANEVUM does not automatically grant upload or publication access/);
 assert.match(start,/Posting and moderation depend on verified accounts/);
 assert.match(start,/EXPLORE CREATOR STUDIO/);
 assert.match(start,/to: "\/status"/);
 assert.match(join,/function submitEmail|async function submitEmail/);
});
