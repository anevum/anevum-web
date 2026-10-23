import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const join=read("web/src/pages/Phase1JoinPage.tsx");
const css=read("web/src/continuance-entry-v117.css");
const entry=read("web/src/main.tsx");
const app=read("web/src/App.tsx");
const guide=read("web/src/components/IrenGuidedContinuance.tsx");

test("V117 improves the existing homepage and join routes instead of creating a competing site",()=>{
 for(const source of [home,join,guide])
  assert.doesNotThrow(()=>parse(source,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(app,/<Route index element={<CinematicLandingPage\/>}\/>/);
 assert.match(app,/<Route path="join" element={<Phase1JoinPage\/>}\/>/);
 assert.match(home,/className="av79-hero av114-arrival av115-arrival"/);
 assert.match(home,/href="#wayfinder"/);
 assert.match(home,/id="wayfinder" tabIndex={-1} className="av115-wayfinder"/);
 assert.match(home,/Find your direction/);
 assert.match(home,/Enter ANEVUM/);
 assert.match(home,/MEET IREN/);
 assert.doesNotMatch(home,/Play a game|FEATURED RELEASE|fullScreenIntro|<video|autoplay/);
});

test("V117 IREN assistance opens the existing guide without introducing another companion",()=>{
 assert.match(join,/new Event\("anevum:iren-open"\)/);
 assert.match(join,/ASK IREN/);
 assert.match(join,/will never ask for your verification code/);
 assert.match(guide,/window\.addEventListener\("anevum:iren-open",onOpen\)/);
 assert.match(guide,/window\.addEventListener\("anevum:iren-intro",onIntro\)/);
 assert.match(guide,/pathname==="\/join"\?"Joining ANEVUM"/);
 assert.match(guide,/never share it with IREN/);
 assert.equal((join.match(/anevum:iren-open/g)||[]).length,1);
 assert.doesNotMatch(join,/IrenLivingCanvas|<IrenGuidedContinuance|dangerouslySetInnerHTML/);
});

test("V117 preserves backend authority and the private email verification process",()=>{
 assert.match(join,/const ready=capability\.state==="ready"/);
 assert.match(join,/const emailReady=ready&&capability\.data\.methods\.email\.available===true/);
 assert.match(join,/canonicalAuthClient\.emailOtp\.sendVerificationOtp/);
 assert.match(join,/canonicalAuthClient\.signIn\.emailOtp/);
 assert.match(join,/requestReplacementCode\(\)/);
 assert.match(join,/normalized\.length>254/);
 assert.match(join,/aria-describedby="av117-otp-instructions"/);
 assert.match(join,/id="av117-otp-instructions"/);
 assert.match(join,/ref={otpRef}/);
 assert.match(join,/useEffect\(\(\)=>\{if\(codeSent\)otpRef\.current\?\.focus\(\)\},\[codeSent\]\)/);
 assert.match(join,/aria-current=\{codeSent\?"step":undefined\}/);
 assert.match(join,/role="listitem"/);
 assert.match(join,/!codeSent&&<div className="join-methods"/);
 assert.match(join,/SEND A NEW CODE/);
 assert.match(join,/SERVICE UNAVAILABLE/);
 assert.match(join,/REGISTRATION PAUSED/);
 assert.doesNotMatch(join,/setInterval\(|localStorage|sessionStorage|grantReward|memberCreate|publishProject/);
});

test("V117 presentation stays dependency-free, accessible and optimized for narrow screens",()=>{
 assert.match(entry,/import "\.\/continuance-entry-v117\.css"/);
 assert.ok(entry.lastIndexOf("continuance-entry-v117.css")>entry.lastIndexOf("first-contact-wayfinder-v115.css"));
 for(const value of [
  ".av117-hero-path",".av117-join-progress",".av117-step-context",
  ".av117-join-guide","@media(max-width:540px)",
  "@media(max-width:380px)","@media(prefers-reduced-motion:reduce)",
  "@media(forced-colors:active)",":focus-visible","min-height:44px"
 ])assert.ok(css.includes(value),"Missing "+value);
 assert.doesNotMatch(css,/@import|https?:\/\/|background-image:\s*url\(|@font-face|position:\s*fixed/);
 assert.match(join,/className="join-experience av12-phase1-join"/);
 assert.match(home,/aria-label="Jump to the ANEVUM Wayfinder"/);
});
