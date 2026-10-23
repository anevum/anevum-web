import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const iren=read("web/src/components/IrenGuidedContinuance.tsx");
const styles=read("web/src/iren-living-v088.css");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const arrival=read("web/src/first-contact-wayfinder-v115.css");
const shell=read("web/src/components/Shell.tsx");
const routes=read("web/src/App.tsx");

test("First contact extends the existing IREN rather than mounting a competing bot",()=>{
 assert.doesNotThrow(()=>parse(iren,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.doesNotThrow(()=>parse(home,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.equal((iren.match(/className="ir80-dock ir87-scout"/g)||[]).length,1);
 assert.match(shell,/<IrenGuidedContinuance memberId=/);
 assert.match(iren,/welcomeOpen\?<div className="ir92-first-contact"/);
 assert.match(iren,/IrenLivingCanvas mood=\{mood\}/);
 assert.match(home,/className="av115-iren-console"/);
 assert.doesNotMatch(iren,/dangerouslySetInnerHTML|SpeechSynthesisUtterance|navigator\.geolocation/);
});

test("V115 leaves first paint uninterrupted and waits for an explicit IREN intro action",()=>{
 assert.match(iren,/const firstContactStorageKey="anevum\.iren\.first-contact\.v092"/);
 assert.match(iren,/firstContactShownInMemory=true/);
 assert.match(iren,/window\.localStorage\.setItem\(firstContactStorageKey,"seen"\)/);
 assert.match(iren,/const onIntro=\(\)=>\{/);
 assert.match(iren,/addEventListener\("anevum:iren-intro",onIntro\)/);
 assert.match(iren,/removeEventListener\("anevum:iren-intro",onIntro\)/);
 assert.match(iren,/setWelcomeExpanded\(true\)/);
 assert.match(iren,/setWelcomeOpen\(true\)/);
 assert.match(iren,/setPanelOpen\(true\)/);
 assert.match(home,/new Event\("anevum:iren-intro"\)/);
 assert.doesNotMatch(iren,/window\.setTimeout\(attempt,1100\)/);
 assert.doesNotMatch(iren,/setTimeout\([^)]*setPanelOpen\(true\)/);
 assert.match(iren,/const focusRequested=useRef\(false\)/);
 assert.match(iren,/focusRequested\.current=true/);
});

test("Visitor tour starts at actual homepage arrival and wayfinder then public routes",()=>{
 assert.match(iren,/id:"arrival",route:"\/",anchor:'\[data-iren-anchor="arrival"\]'/);
 assert.match(iren,/id:"wayfinder-home",route:"\/",anchor:'\[data-iren-anchor="arrival-paths"\]'/);
 assert.match(home,/data-iren-anchor="arrival"/);
 assert.match(home,/data-iren-anchor="arrival-paths"/);
 assert.match(iren,/memberSteps\[4\],\s*memberSteps\[5\],\s*memberSteps\[6\]/);
 assert.match(iren,/addEventListener\("anevum:iren-tour",onStart\)/);
 assert.match(iren,/const start=useCallback/);
 assert.match(iren,/Creator Studio while publishing is in testing/);
 assert.doesNotMatch(home,/Play a game|FEATURED RELEASE|const firstGame=/);
});

test("Every visitor orientation destination is routed and studio permissions remain explicit",()=>{
 assert.match(iren,/<Link to="\/discover" onClick=\{closeWelcome\}>/);
 assert.match(iren,/<Link to="\/studio" onClick=\{closeWelcome\}>/);
 assert.match(iren,/<Link to="\/community" onClick=\{closeWelcome\}>/);
 assert.match(iren,/<button type="button" onClick=\{\(\)=>start\(true\)\}>/);
 assert.match(routes,/<Route path="discover" /);
 assert.match(routes,/<Route path="studio" /);
 assert.match(routes,/<Route path="community" /);
 assert.match(iren,/membership alone does not grant publishing or staff access/);
 assert.match(iren,/aria-modal="true"/);
 assert.doesNotMatch(iren,/fetch\(|Math\.random\(|document\.cookie/);
});

test("IREN retains mobile access, reduced-motion controls, focus and dismiss safeguards",()=>{
 assert.match(styles,/\.ir92-intent-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)/);
 assert.match(styles,/@media\(max-width:650px\)/);
 assert.match(styles,/\.ir92-first-contact :is\(a,button\):focus-visible/);
 assert.match(styles,/@media\(forced-colors:active\)/);
 assert.match(styles,/min-height:70px/);
 assert.match(arrival,/\.av115-iren-console>button/);
 assert.match(arrival,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(arrival,/@media\(forced-colors:active\)/);
 assert.match(iren,/className="ir92-not-now" onClick=\{closePanel\}/);
 assert.match(iren,/event\.key==="Escape"/);
 assert.match(iren,/ref=\{closePanelRef\} className="ir80-icon-button"/);
 assert.match(iren,/closePanelRef\.current\?\.focus\(\{preventScroll:true\}\)/);
 assert.match(iren,/setStoredHidden\(storageKey,true\)/);
 assert.match(iren,/window\.requestAnimationFrame\(\(\)=>dockRef\.current\?\.focus\(\{preventScroll:true\}\)\)/);
});
