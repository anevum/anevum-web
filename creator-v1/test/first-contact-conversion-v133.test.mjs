import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const source=relative=>readFileSync(new URL("../"+relative,import.meta.url),"utf8");
const home=source("web/src/pages/CinematicLandingPage.tsx");
const join=source("web/src/pages/Phase1JoinPage.tsx");
const app=source("web/src/App.tsx");
const styles=source("web/src/continuance-first-contact-v133.css");
const entry=source("web/src/main.tsx");

test("V133 is the original canonical route, not a replacement site",()=>{
  for(const file of [home,join,app])assert.doesNotThrow(()=>parse(file,{sourceType:"module",plugins:["typescript","jsx"]}));
  assert.match(app,/<Route index element={<CinematicLandingPage\/>}\s*\/>/);
  assert.match(app,/<Route path="join" element={<Phase1JoinPage\/>}\s*\/>/);
  assert.match(home,/av79-hero av114-arrival av115-arrival av125-arrival av133-arrival/);
  assert.match(home,/className="av115-iren-console"/);
  assert.match(home,/className="av79-gateways av115-gateways"/);
  assert.equal((home.match(/MEET IREN/g)||[]).length,1);
  assert.doesNotMatch(home,/dangerouslySetInnerHTML|fakeProject|fakeActivity|Math\.random/);
});

test("V133 tells guests what ANEVUM is before asking for an account",()=>{
  assert.match(home,/Find something <em>worth trying\.<\/em>/);
  assert.match(home,/independently made games, useful apps and creative experiments/);
  assert.match(home,/Explore real projects/);
  assert.match(home,/Join the early community/);
  assert.match(home,/to="\/discover"/);
  assert.match(home,/to={signedIn\?"\/member":"\/join"}/);
  assert.match(home,/Free to explore\. No account required\./);
  assert.match(home,/Creator publishing is still in testing\./);
  assert.match(home,/aria-label="Visitor access and creator publishing status"/);
});

test("First look is sourced from real approved project records, including games",()=>{
  assert.match(home,/readProjects\({limit:"32"},signal\)/);
  assert.match(home,/const firstLook=projects\[0\]\|\|null/);
  assert.match(home,/const showcase=projects\.slice\(1,4\)/);
  assert.match(home,/firstLook\.title/);
  assert.match(home,/firstLook\.summary/);
  assert.match(home,/categoryName\[firstLook\.category\]/);
  assert.match(home,/projectDetailPath\(firstLook\.id,"\/"\)/);
  assert.match(home,/role="status"/);
  assert.match(home,/INDEX TEMPORARILY UNAVAILABLE/);
  assert.ok(home.indexOf('className="av133-first-look"')<home.indexOf('id="wayfinder"'));
  assert.doesNotMatch(home,/projects\.filter\(project=>project\.category!=="games"\)/);
  assert.doesNotMatch(home,/const firstGame=|fakeUsers|testRatings|randomShowcase/);
});

test("Signup value copy keeps authentic OTP flow and creator release gate",()=>{
  assert.match(join,/Why join ANEVUM/);
  assert.match(join,/!codeSent&&!requiresEmailVerification&&<aside/);
  assert.match(join,/WHAT YOU GET AS A MEMBER/);
  assert.match(join,/Private profile/);
  assert.match(join,/Saved discoveries/);
  assert.match(join,/Eligible recognition/);
  assert.match(join,/creator publishing is still in testing/);
  assert.match(join,/Creator publishing requires separate review/);
  assert.match(join,/canonicalAuthClient\.emailOtp\.sendVerificationOtp/);
  assert.match(join,/canonicalAuthClient\.signIn\.emailOtp/);
  assert.match(join,/SEND A NEW CODE/);
  assert.match(join,/USE A DIFFERENT EMAIL/);
  assert.match(join,/EXPLORE AS A GUEST/);
  assert.doesNotMatch(join,/localStorage|sessionStorage|dangerouslySetInnerHTML/);
});

test("V133 style remains responsive, keyboard visible and asset-free",()=>{
  assert.match(entry,/import "\.\/continuance-first-contact-v133\.css";/);
  assert.ok(entry.indexOf("continuance-first-contact-v133.css")>entry.indexOf("continuance-signal-atlas-v125.css"));
  for(const token of [
    ".av133-first-look-card",".av133-first-look-empty",".av133-first-look-orbit",
    ".av133-join-context",":focus-visible","@media(max-width:760px)",
    "@media(max-width:650px)","@media(max-width:380px)",
    "@media(prefers-reduced-motion:reduce)","@media(forced-colors:active)"
  ])assert.ok(styles.includes(token),token);
  assert.doesNotMatch(styles,/@import|url\(|https?:\/\/|<script/);
  assert.doesNotMatch(home,/localStorage|sessionStorage|sendBeacon|fetch\(|performance\.mark|document\.cookie/);
});
