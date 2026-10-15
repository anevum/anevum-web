import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const join=readFileSync(new URL("../web/src/pages/Phase1JoinPage.tsx",import.meta.url),"utf8");
const auth=readFileSync(new URL("../canonical-auth/auth.mjs",import.meta.url),"utf8");
const worker=readFileSync(new URL("../canonical-auth/worker.mjs",import.meta.url),"utf8");

test("resend button sends a fresh email OTP instead of just resetting a form",()=>{
 assert.match(join,/async function requestReplacementCode\(\)/);
 const body=join.split("async function requestReplacementCode()")[1].split("function resetCode()")[0];
 assert.match(body,/canonicalAuthClient\.emailOtp\.sendVerificationOtp\(\{email:normalized,type:"sign-in"\}\)/);
 assert.match(body,/setOtp\(""\)/);
 assert.match(join,/onClick=\{\(\)=>void requestReplacementCode\(\)\}/);
 assert.doesNotMatch(join,/onClick=\{resetCode\}[^>]*>SEND A NEW CODE/);
});

test("OTP retry is explicit, guarded while busy, and errors do not imply delivery",()=>{
 const body=join.split("async function requestReplacementCode()")[1].split("function resetCode()")[0];
 assert.match(body,/!emailReady\|\|busy\|\|!codeSent/);
 assert.match(body,/if\(result\.error\)throw/);
 assert.match(body,/wait up to 10 minutes/);
 assert.match(join,/No replacement is sent automatically/);
 assert.match(join,/Use the newest 8-digit code/);
});

test("server still verifies same-origin and applies OTP throttling",()=>{
 assert.match(worker,/!sameOriginMutation\(request\)/);
 assert.match(auth,/\/email-otp\/send-verification-otp":\{window:600,max:3\}/);
 assert.match(auth,/otpLength:8/);
});
