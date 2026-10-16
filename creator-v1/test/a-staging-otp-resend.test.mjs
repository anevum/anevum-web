import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../web/src/pages/Phase1JoinPage.tsx",import.meta.url),"utf8");
const resendStart=source.indexOf("async function requestReplacementCode()");
const resendEnd=source.indexOf("function resetCode()",resendStart);
const resend=resendStart<0||resendEnd<0?"":source.slice(resendStart,resendEnd);

test("staging resend control requests another email OTP rather than resetting only local form state",()=>{
 assert.ok(resendStart>0&&resendEnd>resendStart,"Dedicated replacement handler exists");
 assert.match(resend,/canonicalAuthClient\.emailOtp\.sendVerificationOtp\(\{email:normalized,type:"sign-in"\}\)/);
 assert.match(source,/onClick=\{\(\)=>void requestReplacementCode\(\)\}/);
 assert.doesNotMatch(source,/onClick=\{resetCode\}[^>]*>SEND A NEW CODE/);
});
test("replacement request is gated, remains on code entry, and clears stale code only after acknowledgement",()=>{
 assert.match(resend,/!emailReady\|\|busy\|\|!codeSent/);
 assert.match(resend,/if\(result\.error\)throw/);
 assert.ok(resend.indexOf("if(result.error)throw")<resend.indexOf('setOtp("")'),"Clear stale OTP only on success");
 assert.doesNotMatch(resend,/setCodeSent\(false\)/);
 assert.match(source,/No replacement is sent automatically/);
 assert.match(source,/Use the newest 8-digit code/);
 assert.match(resend,/wait up to 10 minutes/);
});
