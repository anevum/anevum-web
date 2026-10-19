import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../web/src/pages/Phase1JoinPage.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../web/src/join-page.css",import.meta.url),"utf8");
const memberSource=readFileSync(new URL("../web/src/pages/Phase1MemberPage.tsx",import.meta.url),"utf8");
test("signup opens the email form immediately and retains live server method verification",()=>{
 assert.doesNotMatch(source,/emailOpen/);
 assert.match(source,/useResource\(canonicalMethods,\[availabilityAttempt\]\)/);
 assert.match(source,/onClick=\{\(\)=>setAvailabilityAttempt\(value=>value\+1\)\}/);
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

test("social callbacks return to account-safe error recovery, not a dead-end page",()=>{
 assert.match(source,/useSearchParams/);
 assert.match(source,/account_not_linked/);
 assert.match(source,/errorCallbackURL:"\/join"/);
 assert.match(memberSource,/errorCallbackURL:"\/member"/);
 assert.match(memberSource,/account_already_linked_to_different_user/);
 assert.match(memberSource,/RETRY PROVIDER CHECK/);
 assert.doesNotMatch(memberSource,/disabled=\{Boolean\(busy\)\|\|Boolean\(error\)\}/);
});

test("unverified OAuth sessions cannot enter the member page without OTP verification",()=>{
 assert.match(source,/member\?\.emailVerified===true&&ready/);
 assert.match(source,/requiresEmailVerification/);
 assert.match(source,/sessionEmail/);
 assert.match(source,/emailForVerification\.trim\(\)\.toLowerCase\(\)/);
 assert.match(source,/readOnly=\{requiresEmailVerification\}/);
 assert.match(source,/EMAIL VERIFICATION REQUIRED/);
 assert.match(source,/signOutUnverified/);
 assert.match(source,/\!requiresEmailVerification&&\(\["google"/);
});
