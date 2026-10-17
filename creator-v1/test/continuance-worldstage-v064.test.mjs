import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const get=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const world=get("web/src/components/ContinuanceWorldStage.tsx");
const css=get("web/src/continuance-worldstage-v064.css");
const shell=get("web/src/components/Shell.tsx");
const entry=get("web/src/main.tsx");
const canary=get("ops/canonical-live-signup-canary.mjs");

test("V064 scene is a real, parseable responsive React drawing layer",()=>{
  assert.doesNotThrow(()=>parse(world,{sourceType:"module",plugins:["typescript","jsx"]}));
  for(const scene of ["home","discover","community","creators","levels","support","studio","member","field"]){
    assert.match(world,new RegExp('"'+scene+'"'));
  }
  assert.match(world,/data-continuance-scene=\{room\}/);
  assert.match(world,/aria-hidden="true"/);
  assert.match(world,/ref=\{ref\}/);
  assert.match(shell,/<ContinuanceWorldStage path=\{location.pathname\}\/>/);
  assert.ok(entry.lastIndexOf("continuance-worldstage-v064.css")>entry.lastIndexOf("continuance-sitewide-v063.css"));
});

test("V064 is a bounded presentation-only compositor with reduced-motion support",()=>{
  assert.match(world,/2400000/);
  assert.match(world,/Math\.min\(window\.devicePixelRatio/);
  assert.match(world,/now-last>=50/);
  assert.match(world,/prefers-reduced-motion: reduce/);
  assert.match(world,/connection\?\.saveData/);
  assert.match(world,/document\.visibilityState/);
  assert.match(world,/window\.cancelAnimationFrame/);
  assert.match(world,/observer\?\.disconnect\(\)/);
  assert.doesNotMatch(world,/fetch\(|localStorage|sessionStorage|user\.id|document\.cookie|WebGLRenderingContext/);
  assert.match(css,/pointer-events:none/);
  assert.match(css,/image-rendering:auto/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
  assert.match(css,/@media\(forced-colors:active\)/);
  assert.doesNotMatch(css,/@import|https?:\/\/|url\(/);
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});

test("auth canary targets the public canonical origin without weakening checks",()=>{
  assert.match(canary,/origin:\s*"https:\/\/anevum.com"/);
  assert.match(canary,/PUBLIC_REGISTRATION_NOT_OPEN/);
  assert.match(canary,/CANONICAL_ISSUER_MISMATCH/);
  assert.match(canary,/EMAIL_CODE_UNAVAILABLE/);
  assert.match(canary,/PROVIDER_AVAILABILITY_MISMATCH/);
  assert.match(canary,/method:"GET",redirect:"error",cache:"no-store"/);
  assert.doesNotMatch(canary,/https:\/\/a\.anevum\.com/);
});
