import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const iren=read("web/src/components/IrenGuidedContinuance.tsx");
const styles=read("web/src/iren-living-v088.css");
const shell=read("web/src/components/Shell.tsx");
const routes=read("web/src/App.tsx");

test("First contact extends the existing IREN instance instead of adding another dock",()=>{
 assert.doesNotThrow(()=>parse(iren,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.equal((iren.match(/className="ir80-dock ir87-scout"/g)||[]).length,1);
 assert.match(shell,/<IrenGuidedContinuance memberId=/);
 assert.match(iren,/welcomeOpen\?<div className="ir92-first-contact"/);
 assert.match(iren,/IrenLivingCanvas mood=\{mood\}/);
 assert.doesNotMatch(iren,/dangerouslySetInnerHTML|SpeechSynthesisUtterance|navigator\.geolocation/);
});

test("Guest first contact is contextual, delayed, remembered and easily dismissed",()=>{
 assert.match(iren,/const firstContactStorageKey="anevum\.iren\.first-contact\.v092"/);
 assert.match(iren,/pathname!=="\/"\|\|hidden\|\|panelOpen\|\|tourIndex!==null\|\|firstContactSeen\(\)/);
 assert.match(iren,/document\.visibilityState!=="visible"/);
 assert.match(iren,/document\.querySelector\("dialog\[open\]"\)/);
 assert.match(iren,/window\.setTimeout\(\(\)=>\{/);
 assert.match(iren,/rememberFirstContact\(\)/);
 assert.match(iren,/window\.localStorage\.setItem\(firstContactStorageKey,"seen"\)/);
 assert.match(iren,/firstContactShownInMemory=true/);
 assert.match(iren,/className="ir92-not-now" onClick=\{closeWelcome\}/);
 assert.match(iren,/if\(welcomeOpen&&pathname!=="\/"\)/);
 assert.match(iren,/event\.key==="Escape"/);
 assert.match(iren,/setWelcomeOpen\(false\)/);
 assert.match(iren,/setStoredHidden\(storageKey,true\)/);
});

test("Every first-contact destination has an existing route and tour remains opt-in",()=>{
 assert.match(iren,/<Link to="\/discover" onClick=\{closeWelcome\}>/);
 assert.match(iren,/<Link to="\/studio" onClick=\{closeWelcome\}>/);
 assert.match(iren,/<Link to="\/community" onClick=\{closeWelcome\}>/);
 assert.match(iren,/<button type="button" onClick=\{\(\)=>start\(true\)\}>/);
 assert.match(routes,/<Route path="discover" /);
 assert.match(routes,/<Route path="studio" /);
 assert.match(routes,/<Route path="community" /);
 assert.match(iren,/aria-modal="true"/);
 assert.match(iren,/const start=useCallback/);
 assert.doesNotMatch(iren,/fetch\(|Math\.random\(|document\.cookie/);
});

test("Compact first-contact choices work at phone widths and in accessibility modes",()=>{
 assert.match(styles,/\.ir92-intent-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(styles,/@media\(max-width:650px\)/);
 assert.match(styles,/\.ir92-first-contact :is\(a,button\):focus-visible/);
 assert.match(styles,/@media\(forced-colors:active\)/);
 assert.match(styles,/min-height:70px/);
});
