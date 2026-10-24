import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const join=read("web/src/pages/Phase1JoinPage.tsx");
const member=read("web/src/pages/Phase1MemberPage.tsx");
const guide=read("web/src/components/IrenGuidedContinuance.tsx");
const shell=read("web/src/components/Shell.tsx");
const entry=read("web/src/main.tsx");
const style=read("web/src/continuance-journey-v123.css");

test("V123 preserves cinematic V116 discovery-first arrival and a single IREN companion",()=>{
 for(const source of [home,join,member,guide,shell]){
  assert.doesNotThrow(()=>parse(source,{sourceType:"module",plugins:["typescript","jsx"]}));
 }
 assert.match(home,/Find something <em>worth trying\.<\/em>/);
 assert.match(home,/to="\/discover"/);
 assert.match(home,/className="av123-member-entry"/);
 assert.match(home,/to=\{signedIn\?"\/member":"\/join"\}/);
 assert.match(home,/Join the early community/);
 assert.match(home,/new Event\("anevum:iren-intro"\)/);
 assert.equal((home.match(/MEET IREN/g)||[]).length,1);
 assert.equal((shell.match(/<IrenGuidedContinuance memberId=/g)||[]).length,1);
 assert.doesNotMatch(home,/Play a game|FEATURED RELEASE|const firstGame=/);
});

test("Email-first signup uses verified canonical authentication and intact recovery",()=>{
 assert.ok(join.indexOf('id="anevum-email"')<join.indexOf('className="join-methods"'));
 assert.match(join,/useResource\(canonicalMethods,\[availabilityAttempt\]\)/);
 assert.match(join,/emailReady&&\(!requiresEmailVerification\|\|Boolean\(sessionEmail\)\)&&<form/);
 assert.match(join,/canonicalAuthClient\.emailOtp\.sendVerificationOtp/);
 assert.match(join,/canonicalAuthClient\.signIn\.emailOtp/);
 assert.match(join,/ref=\{otpRef\}/);
 assert.match(join,/if\(codeSent\)otpRef\.current\?\.focus/);
 assert.match(join,/SEND A NEW CODE/);
 assert.match(join,/USE A DIFFERENT EMAIL/);
 assert.match(join,/account_not_linked/);
 assert.match(join,/serviceUnavailable/);
 assert.match(join,/Your profile starts private/);
 assert.doesNotMatch(join,/localStorage|sessionStorage|dangerouslySetInnerHTML|autoFocus/);
});

test("New-member identity is private by default, with opt-in IREN help and no code access",()=>{
 assert.match(join,/new Event\("anevum:iren-open"\)/);
 assert.match(join,/Creator publishing requires separate review/);
 assert.match(member,/!claimed&&<aside className="av123-first-claim-assist"/);
 assert.match(member,/new Event\("anevum:iren-open"\)/);
 assert.match(guide,/id:"joining",label:"Join & verify"/);
 assert.match(guide,/pathname==="\/join"\?"joining"/);
 assert.match(guide,/Keep your sign-in code in the official form/);
 assert.match(guide,/window\.addEventListener\("anevum:iren-open",onOpen\)/);
 assert.match(guide,/const broadcast=Boolean\(activeTransmission&&!hidden&&!panelOpen&&tourIndex===null\)/);
 assert.doesNotMatch(guide,/emailOtp|signIn\.emailOtp|document\.cookie|fetch\(|dangerouslySetInnerHTML/);
});

test("V123 CSS loads after V116, preserves responsive / accessible first contact",()=>{
 assert.ok(entry.indexOf("first-contact-wayfinder-v115.css")<entry.indexOf("continuance-journey-v123.css"));
 for(const token of [".av123-member-entry",".av123-member-promise",".av123-iren-join",
  ".av123-first-claim-assist",".ir123-code-boundary","@media(max-width:650px)",
  "@media(max-width:380px)","@media(prefers-reduced-motion:reduce)",
  "@media(forced-colors:active)",":focus-visible"])assert.ok(style.includes(token),token);
 assert.doesNotMatch(style,/@import|url\(/);
});
