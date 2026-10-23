import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const atlas=read("web/src/components/ContinuanceSignalAtlas.tsx");
const css=read("web/src/continuance-signal-atlas-v125.css");
const main=read("web/src/main.tsx");
const shell=read("web/src/components/Shell.tsx");

test("V125 visually upgrades only genuine approved homepage, not the auth or creator routes",()=>{
 assert.doesNotThrow(()=>parse(home,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.doesNotThrow(()=>parse(atlas,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(home,/A universe <em>in the making\.<\/em>/);
 assert.match(home,/to="\/discover"/);
 assert.match(home,/to=\{signedIn\?"\/member":"\/join"\}/);
 assert.match(home,/href="#wayfinder"/);
 assert.match(home,/data-iren-anchor="arrival"/);
 assert.equal((home.match(/<ContinuanceSignalAtlas\/>/g)||[]).length,1);
 assert.equal((home.match(/MEET IREN/g)||[]).length,1);
 assert.equal((shell.match(/<IrenGuidedContinuance memberId=/g)||[]).length,1);
 assert.doesNotMatch(home,/Play a game|FEATURED RELEASE|const firstGame=/);
});
test("Actual motion control is accessible and does not fetch, store or track visitor state",()=>{
 assert.match(home,/aria-pressed=\{scenePaused\}/);
 assert.match(home,/setScenePaused\(previous=>!previous\)/);
 assert.match(home,/av125-is-paused/);
 assert.match(css,/animation-play-state:paused!important/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.doesNotMatch(atlas,/fetch\(|localStorage|sessionStorage|window\.|setInterval|canvas|getUserMedia/);
 assert.match(atlas,/viewBox="0 0 720 720"/);
 assert.match(atlas,/aria-hidden="true"/);
});
test("Charter section provides real guide navigation, not fabricated platform data",()=>{
 assert.match(home,/className="av125-charter"/);
 assert.match(home,/to="\/guide" className="av125-charter-action"/);
 assert.ok(home.indexOf('className="av125-charter"')>home.indexOf("av115-public-index"));
 assert.match(main,/import "\.\/continuance-signal-atlas-v125\.css";/);
 for(const token of [".av125-signal-atlas",".av125-motion-toggle",".av125-charter",
 ".av125-charter-instrument","@media(max-width:650px)",
 "@media(max-width:380px)",":focus-visible"])assert.ok(css.includes(token),token);
 assert.doesNotMatch(css,/@import|url\(/);
});
