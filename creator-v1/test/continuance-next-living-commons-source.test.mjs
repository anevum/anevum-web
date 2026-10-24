import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const path=new URL("../web/review/continuance-community-profile/living-commons.html",import.meta.url);
const html=fs.readFileSync(path,"utf8");
test("standalone Commons review contains no network dependency",()=>{
 assert.match(html,/<style>/);
 assert.match(html,/<script>/);
 assert.match(html,/connect-src 'none'/);
 assert.doesNotMatch(html,/<script[^>]+src=/);
 assert.doesNotMatch(html,/<link[^>]+stylesheet/);
});
test("ANEVUM existing orbital glyph geometry is retained",()=>{
 assert.match(html,/M256 56 274 211 326 256 274 301 256 456 238 301 186 256 238 211Z/);
 assert.match(html,/rx="188" ry="76"/);
 assert.match(html,/cx="391" cy="132" r="20"/);
});
test("fixtures are clearly fictional and never claim earned grants",()=>{
 assert.match(html,/Fictional people and activity/);
 assert.match(html,/Only the actual member inventory/);
 assert.match(html,/No verified level, badge/);
 assert.match(html,/No join, invite or follow/);
});
test("accessible navigation and Atlas equivalent list are present",()=>{
 assert.match(html,/aria-label="Primary ANEVUM Commons navigation"/);
 assert.match(html,/ACCESSIBLE LIST/);
 assert.match(html,/role="dialog" aria-modal="true"/);
 assert.match(html,/data-action="move-pin"/);
});
test("optional motion respects user and system preferences",()=>{
 assert.match(html,/prefers-reduced-motion:reduce/);
 assert.match(html,/visibilitychange/);
 assert.match(html,/data-motion=off/);
});
test("inline review script parses without external imports",()=>{
 const script=html.match(/<script>([\s\S]+?)<\/script>/)?.[1];
 assert.ok(script);
 new vm.Script(script,{filename:"living-commons.js"});
});
test("demo cannot persist or transmit account content",()=>{
 const script=html.match(/<script>([\s\S]+?)<\/script>/)?.[1]||"";
 assert.doesNotMatch(script,/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest\(|WebSocket\(/);
});
