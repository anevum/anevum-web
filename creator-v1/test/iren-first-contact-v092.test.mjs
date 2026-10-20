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
 assert.match(iren,/window\.setTimeout\(attempt,1100\)/);
 assert.match(iren,/rememberFirstContact\(\)/);
 assert.match(iren,/window\.localStorage\.setItem\(firstContactStorageKey,"seen"\)/);
 assert.match(iren,/firstContactShownInMemory=true/);
 assert.match(iren,/className="ir92-not-now" onClick=\{closePanel\}/);
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

test("First contact waits for a visible nonediting page, even after backgrounding",()=>{
 assert.match(iren,/document\.addEventListener\("visibilitychange",schedule\)/);
 assert.match(iren,/document\.removeEventListener\("visibilitychange",schedule\)/);
 assert.match(iren,/document\.addEventListener\("focusout",schedule,true\)/);
 assert.match(iren,/document\.removeEventListener\("focusout",schedule,true\)/);
 assert.match(iren,/document\.visibilityState!=="visible"/);
 assert.match(iren,/document\.querySelector\('\[role="dialog"\]\[aria-modal="true"\]'\)/);
 assert.match(iren,/active\.matches\('input,textarea,select,\[contenteditable\],\[role="textbox"\]'\)/);
 assert.match(iren,/active\.closest\('\[contenteditable="true"\]'\)/);
 assert.match(iren,/if\(timer!==undefined\)window\.clearTimeout\(timer\)/);
 assert.match(iren,/const attempt=\(\)=>\{/);
 assert.match(iren,/timer=window\.setTimeout\(attempt,650\)/);
 assert.match(iren,/rememberFirstContact\(\);\s*setWelcomeOpen\(true\)/);
});

test("Automatic arrival announces without focus theft; explicit help can receive keyboard focus",()=>{
 assert.match(iren,/className="ir92-voice" role="status" aria-live="polite"/);
 assert.match(iren,/const focusRequested=useRef\(false\)/);
 assert.match(iren,/if\(panelOpen&&focusRequested\.current\)/);
 assert.match(iren,/closePanelRef\.current\?\.focus\(\{preventScroll:true\}\)/);
 assert.match(iren,/if\(!panelOpen\)focusRequested\.current=true/);
 assert.match(iren,/ref=\{closePanelRef\} className="ir80-icon-button"/);
 assert.match(iren,/onClick=\{closePanel\}>Not now/);
 assert.match(iren,/window\.requestAnimationFrame\(\(\)=>dockRef\.current\?\.focus\(\{preventScroll:true\}\)\)/);
 assert.doesNotMatch(iren,/setWelcomeOpen\(true\);\s*focusRequested\.current=true/);
});
