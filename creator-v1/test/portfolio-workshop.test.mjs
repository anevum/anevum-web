import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { Script } from "node:vm";
const read=path=>readFileSync(new URL("../web/public/portfolio/"+path,import.meta.url),"utf8");
const html=read("index.html");
const css=read("styles.css");
const js=read("app.js");
const worlds=read("worlds.js");

test("portfolio is an original independent maker archive, not generic portfolio sculpture",()=>{
  assert.match(html,/I MAKE/);
  assert.match(html,/THE PROOF/);
  assert.match(html,/THE AKINS ARCHIVE/);
  assert.match(html,/family|father of two/i);
  assert.match(html,/devon@anevum.com/i);
  assert.doesNotMatch(html,/material-note|id="play-sculpture"|data-material=|id="sculpture"/i);
  assert.doesNotMatch(js,/class Sculpture|getContext\(['"]webgl['"]\).*sculpture/i);
  assert.match(html,/src="\/portfolio\/app\.js"/);
  assert.match(html,/href="\/portfolio\/styles\.css"/);
});

test("3D architectural scene is real local WebGL with fallback, performance caps, safe failure",()=>{
  assert.match(html,/<canvas id="architecture-canvas" aria-hidden="true"><\/canvas>/);
  assert.match(html,/world-fallback/);
  assert.match(js,/getContext\("webgl"/);
  assert.match(js,/gl\.drawArrays\(gl\.TRIANGLES,0,6\)/);
  assert.match(js,/class ArchitectureScene/);
  assert.match(js,/const fragment = window\.PORTFOLIO_SCENES/);
  assert.match(worlds,/fragment: String\.raw/);
  for(const needle of ["powerPreference:\"low-power\"","webglcontextlost","webglcontextrestored","requestAnimationFrame","document.hidden","this.isMobile?640:1100","this.isMobile?1000/16:1000/30"]){
    assert.ok(js.includes(needle),needle);
  }
  assert.match(js,/worldNode\.classList\.remove\("ready"\)/);
  assert.match(css,/\.world-fallback\{/);
});

test("Continuance Institute canon mark is exact and confined to fiction",()=>{
  assert.match(html,/M118 35 A68 68 0 1 0 118 145/);
  assert.match(html,/M10 69H166M10 90H166M10 111H166/);
  assert.match(js,/const CONTINUANCE_MARK =/);
  assert.doesNotMatch(html,/brand-sigil|interlocking D and A/i);
  assert.match(html,/CONTINUANCE INSTITUTE ARCHIVE/);
  assert.match(js,/fictional institutional world/);
});

test("all four project files remain honest and offer usable navigation",()=>{
  for(const key of ["anevum","rhen","fold","transcosmic"]){
    assert.match(html,new RegExp('data-select="'+key+'"'));
    assert.match(html,new RegExp('data-open="'+key+'"'));
    assert.match(js,new RegExp("\\b"+key+": \\{"));
  }
  for(const file of ["anevum-interface.webp","rhen-interface.webp","fold-interface.webp","devon-akins.jpg"]){
    assert.ok(existsSync(new URL("../web/public/portfolio/assets/"+file,import.meta.url)),file);
  }
  assert.match(js,/synthetic offline review/i);
  assert.match(js,/Read-only research/i);
  assert.match(js,/not GPS/i);
  assert.match(js,/not presented as a real operating research institution/);
  assert.match(js,/dossier\.showModal\(\)/);
  assert.match(js,/dossier\.addEventListener\("close"/);
  assert.match(js,/data-select/);
  assert.match(js,/event\.key === "ArrowRight"/);
  assert.match(js,/touchend/);
  assert.match(js,/artifact\.addEventListener\("click"/);
});

test("tactile type and marks are not generic icon sets, and mobile and motion remain usable",()=>{
  assert.match(css,/--display:Impact/);
  assert.match(css,/\.brand-dash/);
  assert.match(css,/\.artifact\{/);
  assert.match(css,/perspective\(1100px\)/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/@media\(max-width:375px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/:focus-visible/);
  assert.match(html,/id="motion-toggle"/);
  assert.match(js,/motionPaused\s*=\s*reduceQuery\.matches/);
  assert.match(js,/setMotionState\(\)/);
  assert.doesNotMatch(html,/fonts\.googleapis|cdnjs|unpkg|jsdelivr|three\.js/i);
});

test("script is syntactically valid and portfolio boundaries remain isolated",()=>{
  assert.doesNotThrow(()=>new Script(js,{filename:"portfolio/app.js"}));
  assert.doesNotThrow(()=>new Script(worlds,{filename:"portfolio/worlds.js"}));
  assert.doesNotMatch(js,/localStorage|XMLHttpRequest|navigator\.geolocation|new WebSocket/);
  assert.doesNotMatch(html,/https:\/\/portfolio\.anevum\.com|(?:src|href)="\/assets\//);
  assert.match(html,/https:\/\/anevum\.com\/portfolio\//);
});

test("abstract worlds run as a 120-second continuous three-scene morph sequence",()=>{
  assert.match(html,/src="\/portfolio\/worlds\.js"/);
  assert.match(html,/id="scene-name"/);
  assert.match(html,/id="scene-next"/);
  assert.match(html,/id="scene-clock"/);
  assert.match(worlds,/names: \["LUMEN", "FRACTURE", "ABYSS"\]/);
  assert.match(worlds,/duration: 120/);
  assert.match(worlds,/transition: 20/);
  assert.match(worlds,/float lensWorld/);
  assert.match(worlds,/float shardWorld/);
  assert.match(worlds,/float coralWorld/);
  assert.match(worlds,/d=mix\(d,sceneAt\(p,next\),u_blend\)/);
  assert.match(js,/this\.elapsed\+=delta/);
  assert.match(js,/linear\*linear\*\(3-2\*linear\)/);
  assert.match(js,/this\.activeScene=\(this\.activeScene\+1\)/);
  assert.match(js,/\$\("#scene-next"\)\?\.addEventListener/);
  assert.match(css,/\.scene-director\{/);
  assert.doesNotMatch(worlds,/https?:\/\/|fetch\(|WebSocket|localStorage/);
});
