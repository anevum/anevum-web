import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";
import {placeIrenSpatialGuide,isIrenTargetUnobscured} from "../web/src/lib/iren-spatial-placement-v097.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const view=(width,height)=>({left:0,top:0,width,height});
const bubble={width:240,height:130};
const bot={width:64,height:80};
const bounds=(result,viewport,bubbleHeight=130)=>{
  assert.ok(result.bubbleLeft>=viewport.left+9,"bubble left");
  assert.ok(result.botLeft>=viewport.left+9,"bot left");
  assert.ok(result.bubbleLeft+result.bubbleWidth<=viewport.left+viewport.width-9,"bubble right");
  assert.ok(result.botLeft+bot.width<=viewport.left+viewport.width-9,"bot right");
  assert.ok(result.bubbleTop>=viewport.top+9,"bubble top");
  assert.ok(result.botTop>=viewport.top+9,"bot top");
  assert.ok(result.bubbleTop+bubbleHeight<=viewport.top+viewport.height+1,"bubble bottom");
  assert.ok(result.botTop+bot.height<=viewport.top+viewport.height+1,"bot bottom");
};
test("spatial view compiles and retains only one canonical IREN assistant",()=>{
 const guide=read("web/src/components/IrenGuidedContinuance.tsx");
 const spatial=read("web/src/components/IrenSpatialTour.tsx");
 const placement=read("web/src/lib/iren-spatial-placement-v097.ts");
 const css=read("web/src/iren-spatial-v097.css");
 const main=read("web/src/main.tsx");
 for(const item of [guide,spatial,placement]) assert.doesNotThrow(()=>parse(item,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(main,/import "\.\/iren-spatial-v097\.css"/);
 assert.match(guide,/VITE_IREN_SPATIAL_GUIDE/);
 assert.match(guide,/spatialTourEnabled\?<IrenSpatialTour/);
 assert.equal((guide.match(/className="ir80-dock ir87-scout"/g)||[]).length,1);
 assert.match(spatial,/IrenLivingCanvas/);
 assert.match(spatial,/mood=\{travelling\?"travel":"guide"\}/);
 assert.match(spatial,/aria-live="polite"/);
 assert.match(css,/pointer-events:none/);
 assert.doesNotMatch(spatial,/aria-modal="true"|ir80-shade|setInterval\(/);
 assert.match(guide,/anevum:member-created/);
 assert.match(guide,/irenStationForPath/);
});
test("safe geometry at 320, 390, 768 and 1440px",()=>{
 for(const [width,height] of [[320,720],[390,844],[768,1024],[1440,900]]){
  const v=view(width,height);
  const anchor={left:width*.26,top:height*.52,width:width*.4,height:54};
  const p=placeIrenSpatialGuide(v,anchor,bubble,bot,{headerBottom:76});
  bounds(p,v);
  assert.ok(p.bubbleTop>=76,"header safe "+width);
  assert.equal(p.targetVisible,true);
 }
});
test("top and bottom edge anchors avoid covering highlighted element",()=>{
 for(const v of [view(390,844),view(320,720)]){
  const a=[{left:12,top:90,width:v.width-24,height:58},{left:12,top:v.height-105,width:v.width-24,height:50}];
  for(const anchor of a){
   const p=placeIrenSpatialGuide(v,anchor,bubble,bot,{headerBottom:68});
   bounds(p,v);
   assert.equal(isIrenTargetUnobscured(anchor,p,{...bubble,width:p.bubbleWidth},bot),true);
  }
 }
});
test("full-width target and tight small screen never overspill",()=>{
 const v=view(320,568);
 const anchor={left:0,top:240,width:320,height:160};
 const p=placeIrenSpatialGuide(v,anchor,bubble,bot,{headerBottom:88,safeBottom:22});
 bounds(p,v);
 assert.equal(p.bubbleWidth<=v.width-30,true);
});
test("visual viewport offsets preserve visible bounds",()=>{
 const v={left:35,top:112,width:320,height:440};
 const anchor={left:55,top:285,width:275,height:60};
 const p=placeIrenSpatialGuide(v,anchor,bubble,bot,{headerBottom:135,safeBottom:8});
 bounds(p,v);
});
test("avoids the real Search field while keeping the selected heading visible",()=>{
 const v=view(390,844);
 const heading={left:12,top:110,width:366,height:55};
 const search={left:12,top:235,width:366,height:72};
 const filters={left:12,top:315,width:366,height:52};
 const actualBubble={width:245,height:135};
 const actualBot={width:76,height:94};
 const p=placeIrenSpatialGuide(v,heading,actualBubble,actualBot,{
  headerBottom:76,obstacles:[search,filters]
 });
 assert.equal(isIrenTargetUnobscured(heading,p,actualBubble,actualBot),true);
 const box={left:p.bubbleLeft,top:p.bubbleTop,width:p.bubbleWidth,height:actualBubble.height};
 const robot={left:p.botLeft,top:p.botTop,...actualBot};
 const overlap=(a,b)=>Math.max(0,Math.min(a.left+a.width,b.left+b.width)-Math.max(a.left,b.left))*
   Math.max(0,Math.min(a.top+a.height,b.top+b.height)-Math.max(a.top,b.top));
 assert.equal(overlap(search,box)+overlap(search,robot),0);
});
test("absence of a private or delayed target is truthful and safe",()=>{
 const v=view(390,844);
 const p=placeIrenSpatialGuide(v,null,bubble,bot,{headerBottom:74});
 bounds(p,v);
 assert.equal(p.targetVisible,false);
 assert.equal(isIrenTargetUnobscured(null,p,bubble,bot),false);
});
test("reduced viewport or keyboard uses compact placement within visible area",()=>{
 const v={left:0,top:0,width:390,height:490};
 const p=placeIrenSpatialGuide(v,{left:12,top:260,width:365,height:115},bubble,bot,{headerBottom:78,safeBottom:12});
 bounds(p,v);
});
test("edge and obstacle layout accepts zero-sized invalid anchors without throwing",()=>{
 const v=view(390,844);
 for(const bad of [null,{left:NaN,top:20,width:100,height:20},{left:10,top:30,width:0,height:0}]){
  const p=placeIrenSpatialGuide(v,bad,bubble,bot,{headerBottom:74,obstacles:[{left:0,top:0,width:390,height:74}]});
  bounds(p,v);
  assert.equal(p.targetVisible,false);
 }
});
test("legacy tour data and privacy gates stay intact in default-off release",()=>{
 const source=read("web/src/components/IrenGuidedContinuance.tsx");
 for(const key of ['identity','progress','privacy','studio','discover','community','wayfinder']){
  assert.ok(source.includes('id:"'+key+'"'));
 }
 for(const token of ['storagePrefix','status:"paused"','finish("skipped")','memberId||"visitor"','useIrenSignals','LevelEmblem','AwardEmblem','hiddenInStorage','setStoredHidden','readPaused','readPosition']){
  assert.ok(source.includes(token),token);
 }
 assert.match(source,/aria-modal="true"/);
 assert.match(source,/if\(event\.key==="Tab"&&!spatialTourEnabled\)/);
});
