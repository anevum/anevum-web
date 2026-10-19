import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const rig=read("web/src/lib/iren-living-rig-v088.ts");
const context=read("web/src/lib/iren-companion-context-v089.ts");
const viewport=read("web/src/components/IrenLivingCanvas.tsx");
const guide=read("web/src/components/IrenGuidedContinuance.tsx");
const signals=read("web/src/components/AnevumNotifications.tsx");
const styles=read("web/src/iren-living-v088.css");
const bootstrap=read("web/src/main.tsx");

test("A real perspective WebGL robot replaces the icon-only presentation",()=>{
 for(const [name,code] of [["rig",rig],["viewport",viewport],["guide",guide],["context",context]]){
  assert.doesNotThrow(()=>parse(code,{sourceType:"module",plugins:["typescript","jsx"]}),name);
 }
 assert.match(rig,/getContext\("webgl"/);
 assert.match(rig,/gl\.createBuffer\(\)/);
 assert.match(rig,/gl\.drawArrays\(gl\.TRIANGLES/);
 assert.match(rig,/function normalMatrix\(m:Mat\)/);
 assert.match(rig,/gl\.uniformMatrix3fv\(this\.uniforms\.normal/);
 assert.match(rig,/const orbitalPhase=/);
 assert.match(rig,/const dy=ny\+\.19/);
 assert.match(rig,/for\(let index=0;index<3;index\+\+\)/);
 assert.match(rig,/\.lookTarget/);
 assert.match(rig,/this\.armPose\[slot\]=mix\(/);
 assert.match(rig,/this\.mood==="rest"\?12/);
 assert.match(rig,/uniform mat4 uModel/);
 assert.match(rig,/perspective|projection\(aspect/);
 assert.match(rig,/const head=chain\(root/);
 assert.match(rig,/const arm=chain\(shoulder/);
 assert.match(rig,/thruster/);
 assert.match(rig,/const blink=/);
 assert.doesNotMatch(rig,/fetch\(|XMLHttpRequest|WebSocket/);
 assert.doesNotMatch(rig,/rewardModelBase|RewardModelRenderer|earned.levels/);
 assert.match(viewport,/import\("\.\.\/lib\/iren-living-rig-v088"\)/);
 assert.match(viewport,/webglcontextlost/);
 assert.match(viewport,/\.dispose\(\)/);
 assert.match(viewport,/visibilitychange/);
 assert.match(viewport,/prefers-reduced-motion/);
 assert.match(viewport,/fallback/);
 assert.ok(bootstrap.lastIndexOf("iren-living-v088.css")>bootstrap.lastIndexOf("iren-guided-v080.css"));
});

test("Personality states include genuine articulated motions and controlled traversal",()=>{
 for(const mood of ["idle","greet","curious","guide","travel","think","notify","celebrate","rest"])
  assert.ok(rig.includes('"'+mood+'"'),mood);
 for(const action of ["setMood","setLook","setReducedMotion","setVisible","setExpanded","dispose"])
  assert.ok(rig.includes(action+"("),action);
 assert.match(guide,/ir88-guide-bot/);
 assert.match(guide,/!embeddedGuideBot&&<div className="ir88-guide-bot"/);
 assert.match(guide,/embeddedGuideBot\?<IrenLivingCanvas mood=/);
 assert.match(guide,/spotlight\.height>viewport\.height\*\.48/);
 assert.match(guide,/wideSpotlight/);
 assert.match(styles,/\.ir88-guide-avatar/);
 assert.match(guide,/guideTravelling\?"travel":"guide"/);
 assert.match(guide,/spotlight\.left/);
 assert.match(guide,/onPointerDown=\{beginDrag\}/);
 assert.match(guide,/onPointerMove=\{moveDrag\}/);
 assert.match(guide,/onPointerUp=\{finishDrag\}/);
 assert.match(guide,/writePosition\(storageKey,next\)/);
 assert.match(guide,/readPosition\(storageKey\)/);
 assert.match(guide,/motionPaused/);
 assert.match(guide,/irenStationForPath\(pathname,Boolean\(memberId\)\)/);
 assert.match(guide,/attendFocus/);
 assert.match(guide,/attendPointer/);
 assert.match(guide,/restoreDock/);
 assert.match(guide,/setMood\(previous=>previous==="idle"\?"rest":previous\)/);
 assert.match(context,/STAFF CLEARANCE/);
 assert.match(context,/verifiedMember/);
 assert.doesNotMatch(context,/fetch\(|XMLHttpRequest|sessionStorage|navigator\.geolocation|localStorage/);
 assert.match(styles,/\.ir80-guide-layer \.ir88-guide-bot/);
 assert.match(styles,/transition:left \.72s/);
 assert.match(styles,/touch-action:none/);
});

test("V087 navigation, tours, real notification entitlements and fallback survive",()=>{
 assert.equal((guide.match(/className="ir80-dock ir87-scout"/g)||[]).length,1);
 assert.match(guide,/useIrenSignals\(\)/);
 assert.match(guide,/markSignalsSeen\(\)/);
 assert.match(guide,/start\(\)/);
 assert.match(guide,/LevelEmblem level=\{item\.level!\}/);
 assert.match(guide,/AwardEmblem award=\{item\.award\}/);
 assert.match(guide,/IrenLivingCanvas mood=\{mood\}/);
 assert.match(guide,/fallback=\{<IrenScout\/>\}/);
 assert.match(signals,/progressionRequest<RewardInbox>\('notifications'/);
 assert.doesNotMatch(guide,/fetch\(|dangerouslySetInnerHTML/);
 assert.match(styles,/@media\(max-width:650px\)/);
 assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(styles,/@media\(forced-colors:active\)/);
});

test("IREN presents deterministic station guidance without claiming sitewide AI or leaking data",()=>{
 for(const name of ["THE WAYFINDER","CREATOR STUDIO","THE COMMONS","DISCOVER","MEMBER SPACE",
   "CONTINUANCE RECORD","STAFF CLEARANCE"]){
   assert.ok(context.includes(name),name);
 }
 assert.match(guide,/station\.code/);
 assert.match(guide,/station\.line/);
 assert.match(guide,/aria-live="off"/);
 assert.match(guide,/Return to corner/);
 assert.match(guide,/motionPaused\?"Enable animation":"Pause animation"/);
 assert.match(rig,/normalMatrix\(model\)/);
 assert.match(rig,/this\.look\[0\]=mix\(/);
 assert.match(rig,/gl\.drawArrays\(gl\.TRIANGLES/);
 assert.doesNotMatch(context,/dangerouslySetInnerHTML|evaluate\(|\bMath\.random\(/);
});
