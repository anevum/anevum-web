import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const join=read("web/src/pages/Phase1JoinPage.tsx");
const guide=read("web/src/components/IrenGuidedContinuance.tsx");
const shell=read("web/src/components/Shell.tsx");
const member=read("web/src/pages/Phase1MemberPage.tsx");
const styles=read("web/src/continuance-journey-v123.css");
const app=read("web/src/App.tsx");

test("V124 reconciliation parses and keeps one production-facing app and IREN guide",()=>{
 for(const s of [home,join,guide,shell,member,app])
  assert.doesNotThrow(()=>parse(s,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(app,/<Route index element={<CinematicLandingPage\/>}\/>/);
 assert.equal((shell.match(/<IrenGuidedContinuance memberId=/g)||[]).length,1);
 assert.equal((home.match(/MEET IREN/g)||[]).length,1);
 assert.doesNotMatch(home,/Play a game|FEATURED RELEASE|const firstGame=/);
});

test("Discovery, member entry, Wayfinder and real IREN compose in one first load",()=>{
 assert.match(home,/A universe <em>in the making\.<\/em>/);
 assert.match(home,/to="\/discover"/);
 assert.match(home,/className="av123-member-entry" to=\{signedIn\?"\/member":"\/join"\}/);
 assert.match(home,/href="#wayfinder"/);
 assert.match(home,/id="wayfinder" tabIndex=\{-1\}/);
 assert.match(home,/data-iren-anchor="arrival-paths"/);
 assert.match(home,/new Event\("anevum:iren-intro"\)/);
});

test("Email first, accessible step progress, no social interruption of OTP",()=>{
 assert.ok(join.indexOf('id="anevum-email"')<join.indexOf('className="join-methods"'));
 assert.match(join,/className="av52-form-progress av124-join-progress" role="list"/);
 assert.match(join,/aria-current=\{!codeSent\?"step":undefined\}/);
 assert.match(join,/aria-current=\{codeSent\?"step":undefined\}/);
 assert.match(join,/className="av124-step-context" aria-live="polite"/);
 assert.match(join,/id="anevum-otp" ref=\{otpRef\}/);
 assert.match(join,/aria-describedby="av124-otp-instructions"/);
 assert.match(join,/id="av124-otp-instructions"/);
 assert.match(join,/some\(socialReady\)&&!codeSent&&<div className="join-methods"/);
 assert.equal((join.match(/className="join-methods"/g)||[]).length,1);
 assert.match(join,/canonicalAuthClient\.emailOtp\.sendVerificationOtp/);
 assert.match(join,/canonicalAuthClient\.signIn\.emailOtp/);
 assert.match(join,/sendVerificationOtp\(\{email:normalized,type:"sign-in"\}\)/);
 assert.match(join,/serviceUnavailable/);
 assert.match(join,/account_not_linked/);
});

test("Exactly one opt-in IREN help surface; no email code disclosure",()=>{
 assert.equal((join.match(/new Event\("anevum:iren-open"\)/g)||[]).length,1);
 assert.doesNotMatch(join,/className="av117-join-guide"/);
 assert.match(join,/className="av123-iren-join"/);
 assert.match(member,/className="av123-first-claim-assist"/);
 assert.match(guide,/id:"joining",label:"Join & verify"/);
 assert.match(guide,/Keep your sign-in code in the official form/);
 assert.doesNotMatch(guide,/signIn\.emailOtp|document\.cookie|fetch\(/);
});

test("Merged styles add visual continuity without extra runtime or remote art",()=>{
 for(const token of [".av123-member-entry",".av124-hero-wayfinder",
 ".av124-join-progress",".av124-step-context",".av123-iren-join",
 "@media(max-width:650px)","@media(max-width:380px)",
 "@media(prefers-reduced-motion:reduce)","@media(forced-colors:active)",":focus-visible"])
 assert.ok(styles.includes(token),"missing CSS "+token);
 assert.doesNotMatch(styles,/@import|url\(/);
});
