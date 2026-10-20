import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyPointerDepth,clearPointerDepth} from "../web/src/lib/pointer-depth.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

function mock(pointerType,x,y){
 const changed=new Map();
 const style={
  setProperty:(key,value)=>changed.set(key,value),
  removeProperty:key=>changed.delete(key)
 };
 return {
  changed,event:{pointerType,clientX:x,clientY:y,currentTarget:{
   getBoundingClientRect:()=>({left:100,top:200,width:200,height:100}),
   style
  }}
 };
}
test("pointer depth creates bounded cosmetic transforms for mouse or pen only",()=>{
 for(const type of ["mouse","pen"]){
  const p=mock(type,250,225);
  applyPointerDepth(p.event,8);
  assert.equal(p.changed.get("--depth-rotate-x"),"2.00deg");
  assert.equal(p.changed.get("--depth-rotate-y"),"2.00deg");
  assert.equal(p.changed.get("--depth-light-x"),"75.0%");
  assert.equal(p.changed.get("--depth-light-y"),"25.0%");
  clearPointerDepth(p.event);
  assert.equal(p.changed.size,0);
 }
 const t=mock("touch",250,225);
 applyPointerDepth(t.event);
 assert.equal(t.changed.size,0);
});
test("out-of-bounds pointer coordinates never produce unbounded angles",()=>{
 const p=mock("mouse",-1000,90000);
 applyPointerDepth(p.event,10);
 assert.equal(p.changed.get("--depth-rotate-x"),"-5.00deg");
 assert.equal(p.changed.get("--depth-rotate-y"),"-5.00deg");
 assert.equal(p.changed.get("--depth-light-x"),"0.0%");
 assert.equal(p.changed.get("--depth-light-y"),"100.0%");
});
test("dimensional treatment is site-wide and respects motion and touch accessibility",()=>{
 const css=read("web/src/depth-system.css");
 const jsx=read("web/src/components/OrbitalStage.tsx");
 const mark=read("web/src/components/OrbitalMark.tsx");
 const cards=read("web/src/components/ProjectCard.tsx");
 const home=read("web/src/pages/HomePage.tsx");
 const main=read("web/src/main.tsx");
 assert.match(main,/import "\.\/depth-system\.css"/);
 for(const selector of [
  ".portal-welcome", ".portal-page-heading", ".levels-masthead",
  ".portal-creator-tile", ".portal-room", ".member-panel",
  ".portal-project-art",".engagement-panel",".member-draft-form",
  ".depth-hover-card",".depth-stage-scene",".levels-symbol"
 ])assert.ok(css.includes(selector),selector);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(hover:none\),\(pointer:coarse\)/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.doesNotMatch(css,/\.mobile-bottom-nav/);
 assert.match(jsx,/aria-hidden="true"/);
 assert.match(jsx,/applyPointerDepth/);
 assert.match(jsx,/clearPointerDepth/);
 assert.match(jsx,/<OrbitalMark/);
 assert.match(mark,/ellipse cx="256"/);
 assert.match(cards,/onPointerMove=\{e=>applyPointerDepth/);
 assert.match(cards,/projectDetailPath/);
 assert.match(cards,/creator-inline/);
 assert.match(home,/No fake projects, ratings or activity/);
 for(const path of [jsx,css,cards])assert.doesNotMatch(path,/Math\.random|dangerouslySetInnerHTML|setInterval|localStorage/);
});
