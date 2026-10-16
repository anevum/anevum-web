import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../web/src/pages/Phase1JoinPage.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../web/src/join-page.css",import.meta.url),"utf8");
test("signup opens the email form immediately and retains live server method verification",()=>{
 assert.doesNotMatch(source,/emailOpen/);
 assert.match(source,/useResource\(canonicalMethods,\[\]\)/);
 assert.match(source,/emailReady&&<form/);
 assert.doesNotMatch(source,/join-method-unavailable/);
 assert.match(source,/METHODS\.filter\(method=>method\.key!=="email"&&socialReady/);
});
test("verification keeps a real resend and an explicit change-email control",()=>{
 assert.match(source,/async function requestReplacementCode\(\)/);
 assert.match(source,/canonicalAuthClient\.emailOtp\.sendVerificationOtp/);
 assert.match(source,/onClick=\{\(\)=>void requestReplacementCode\(\)\}/);
 assert.match(source,/USE A DIFFERENT EMAIL/);
 assert.match(source,/onClick=\{resetCode\}/);
 assert.match(source,/navigate\("\/member",\{replace:true\}\)/);
});
test("the signup copy and responsive styling lead with joining, not unreleased integrations",()=>{
 assert.match(source,/YOUR STORY STARTS HERE/);
 assert.match(source,/CONTINUE WITH EMAIL/);
 assert.match(css,/V026/);
 assert.match(css,/@media\(max-width:500px\)/);
});
