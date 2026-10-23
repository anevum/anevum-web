import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const bootstrap=read("web/src/main.tsx");
const css=read("web/src/home-arrival-v114.css");
const guide=read("web/src/components/IrenGuidedContinuance.tsx");
const notifications=read("web/src/components/AnevumNotifications.tsx");

test("V114 announces a creative network, not the original pilot game",()=>{
 assert.doesNotThrow(()=>parse(home,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(home,/Enter a universe <em>in the making\.<\/em>/);
 assert.match(home,/A CREATIVE UNIVERSE IN THE MAKING/);
 assert.match(home,/to="\/discover"[\s\S]{0,100}EXPLORE ANEVUM/);
 assert.match(home,/to=\{signedIn\?"\/member":"\/join"\}/);
 assert.doesNotMatch(home,/firstGame|Play a game|Explore games|Find your next <em>obsession/);
 assert.doesNotMatch(home,/to=\{.*\/discover\?category=games.*\}/);
});

test("V114 preserves real published records without preferentially featuring pilot games",()=>{
 assert.match(home,/readStatus\(signal\)/);
 assert.match(home,/readProjects\(\{limit:"32"\},signal\)/);
 assert.match(home,/readCreators\(\{limit:"8"\},signal\)/);
 assert.match(home,/sort\(byPublication\)/);
 assert.match(home,/const featured=projects\[0\]\|\|null/);
 assert.doesNotMatch(home,/const featured=games\[0\]/);
 assert.match(home,/projectDetailPath\(featured\.id/);
 assert.match(home,/CreatorSignature project=\{featured\} creators=\{creators\}/);
 assert.match(home,/only real published work is shown/i);
 assert.match(home,/if\(!handle\)return/);
 assert.doesNotMatch(home,/fakeUser|fakeProject|fakeActivity|sampleProjects|sampleRatings|dangerouslySetInnerHTML/);
});

test("The original homepage structure, onboarding and IREN remain single-owned",()=>{
 for(const token of ["av79-gateways","av111-onramp","av79-feature","av79-latest","av79-member-section","av79-member-invitation","CompactMemberIdentity"])
  assert.ok(home.includes(token),token);
 assert.equal((home.match(/className="av114-portal-signal/g)||[]).length,3);
 assert.equal((home.match(/className="av114-portal-ring/g)||[]).length,2);
 assert.match(home,/window\.dispatchEvent\(new Event\("anevum:iren-tour"\)\)/);
 assert.match(guide,/addEventListener\("anevum:iren-tour",onStart\)/);
 assert.equal((guide.match(/className="ir80-dock ir87-scout"/g)||[]).length,1);
 assert.match(notifications,/activeTransmission:active\|\|null/);
});

test("V114 uses scoped responsive CSS, focus treatment and accessible motion fallbacks",()=>{
 assert.match(bootstrap,/import "\.\/home-first-contact-v111\.css";\s*import "\.\/home-arrival-v114\.css";/);
 assert.match(css,/\.av79-hero\.av114-hero/);
 assert.match(css,/\.av114-portal-core/);
 assert.match(css,/@media\(max-width:920px\)/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/@media\(max-width:380px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(css,/pointer-events:none/);
 assert.doesNotMatch(css,/(^|\n)(html|body)\s*\{/);
});
