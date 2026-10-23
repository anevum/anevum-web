import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const bootstrap=read("web/src/main.tsx");
const css=read("web/src/home-first-contact-v111.css");
const guide=read("web/src/components/IrenGuidedContinuance.tsx");

test("V115 supersedes V111 intro rail but keeps public access and genuine member routes",()=>{
 assert.doesNotThrow(()=>parse(home,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(home,/className="av79-hero av114-arrival av115-arrival"/);
 assert.match(home,/className="av79-gateways av115-gateways"/);
 assert.match(home,/className="av115-iren-console"/);
 assert.match(home,/className="av79-now av115-public-index"/);
 assert.match(home,/av79-member-invitation/);
 assert.doesNotMatch(home,/className="av111-onramp"/);
 assert.doesNotMatch(home,/fakeProject|fakeActivity|sampleRatings|dangerouslySetInnerHTML/);
});

test("Arrival uses genuine existing IREN orientation and verified join rather than a test game",()=>{
 assert.match(home,/to=\{signedIn\?"\/member":"\/join"\}/);
 assert.match(home,/emailVerified===true/);
 assert.match(home,/new Event\("anevum:iren-intro"\)/);
 assert.match(guide,/addEventListener\("anevum:iren-intro",onIntro\)/);
 assert.match(home,/Studio publishing is still in testing/);
 assert.match(home,/to="\/discover"/);
 assert.doesNotMatch(home,/Play a game|FEATURED RELEASE|firstGame\|\||signupCount|fakeUsers|Math\.random/);
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
