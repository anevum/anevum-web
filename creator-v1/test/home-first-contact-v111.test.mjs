import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const bootstrap=read("web/src/main.tsx");
const css=read("web/src/home-first-contact-v111.css");
const guide=read("web/src/components/IrenGuidedContinuance.tsx");

test("V111 first contact retains canonical public home and original four gateways",()=>{
 assert.doesNotThrow(()=>parse(home,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(home,/const featured=games\[0\]\|\|projects\[0\]\|\|null/);
 assert.match(home,/av79-hero/);
 assert.match(home,/av79-gateways/);
 assert.match(home,/av79-feature/);
 assert.match(home,/av79-member-invitation/);
 assert.match(home,/av111-onramp-title/);
 assert.ok(home.indexOf('className="av111-onramp"')>home.indexOf('className="av79-gateways"'));
 assert.ok(home.indexOf('className="av111-onramp"')<home.indexOf('className="av79-now"'));
 assert.doesNotMatch(home,/fakeProject|fakeActivity|sampleRatings|dangerouslySetInnerHTML/);
});

test("First-contact choices take visitors to verified member route or authentic IREN tour",()=>{
 assert.match(home,/to=\{signedIn\?"\/member":"\/join"\}/);
 assert.match(home,/emailVerified===true/);
 assert.match(home,/onClick=\{\(\)=>window\.dispatchEvent\(new Event\("anevum:iren-tour"\)\)\}/);
 assert.match(guide,/addEventListener\("anevum:iren-tour",onStart\)/);
 assert.match(home,/publishing tools are still in testing/);
 assert.match(home,/Studio publishing is still being tested/);
 assert.doesNotMatch(home,/signupCount|fakeUsers|Math\.random/);
});

test("First-contact styling is responsive, accessible, and stops animation when requested",()=>{
 assert.match(bootstrap,/import "\.\/home-first-contact-v111\.css"/);
 assert.match(css,/\.av111-onramp/);
 assert.match(css,/\.av111-onramp-actions/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/min-height:46px/);
 assert.match(css,/@media\(max-width:420px\)/);
 assert.match(css,/\.av79-section-heading>a/);
});
