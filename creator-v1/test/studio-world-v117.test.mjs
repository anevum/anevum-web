import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {buildCinematicMeshes,geometryBudgets} from '../web/src/pages/world-geometry-v117.ts';
import {starter,validate,primitive,apply,encode,decode} from '../world-composer/document.mjs';

const read=path=>readFileSync(path,'utf8');
const renderer=read('creator-v1/web/src/pages/world-webgl2-v115.ts');
const sky=read('creator-v1/web/src/pages/world-sky-v115.ts');
const canvas=read('creator-v1/web/src/pages/WorldCanvasV115.tsx');
const shelf=read('creator-v1/web/src/pages/StudioAssetShelfV116.tsx');
const geometry=read('creator-v1/web/src/pages/world-geometry-v117.ts');
const pad=read('creator-v1/web/src/pages/StudioTransformPadV117.tsx');
const style=read('creator-v1/web/src/pages/studio-world-v117.css');
const page=read('creator-v1/web/src/pages/WorldComposerReviewV115.tsx');

test('V117 scene meshes are finite, bounded, indexed by stable part names and formed from real triangles',()=>{
 const meshes=buildCinematicMeshes(), budgets=geometryBudgets();
 const expected=['islandRock','islandTop','tower','towerCollar','canopy','bridgeArch','waterRibbon',
  'craftHull','craftFins','gatewayArch'];
 assert.deepEqual(Object.keys(meshes).sort(),[...expected].sort());
 let triangles=0,bytes=0;
 for(const [name,data] of Object.entries(meshes)){
  assert.ok(data.length>=18,name+' must contain triangles');
  assert.equal(data.length%18,0,name+' must have triangles with six floats per vertex');
  assert.ok(data.every(Number.isFinite),'finite position and normal: '+name);
  for(let i=0;i<data.length;i+=6){
   assert.ok(Math.abs(data[i])<=7&&Math.abs(data[i+1])<=8&&Math.abs(data[i+2])<=7,
    name+' vertex lies outside bounded local geometry');
   const len=Math.hypot(data[i+3],data[i+4],data[i+5]);
   assert.ok(len>.95&&len<1.05,name+' normal should be unit length');
  }
  triangles+=data.length/18;bytes+=data.length*4;
 }
 assert.ok(triangles>850&&triangles<7000,'sufficient visual detail with bounded draw complexity');
 assert.ok(bytes<300000,'finite GPU static geometry budget');
 assert.equal(budgets.reduce((n,b)=>n+b.triangles,0),triangles);
 assert.equal(budgets.reduce((n,b)=>n+b.bytes,0),bytes);
});
test('editable Starcraft stays inside canonical world validation and undoable source commands',()=>{
 const ship=primitive('v117-craft','starship');
 assert.equal(ship.kind,'starship');
 assert.equal(ship.name,'Starcraft');
 const start=starter();
 assert.equal(start.nodes.length,10,'Founder's current starter layout stays unchanged');
 const added=apply(start,{type:'ADD_NODE',node:ship});
 assert.equal(added.nodes.length,11);
 const moved=apply(added,{type:'SET_TRANSFORM',id:ship.id,field:'position',value:[4,5,-3]});
 assert.deepEqual(moved.nodes.at(-1).position,[4,5,-3]);
 assert.deepEqual(decode(encode(moved)),validate(moved));
 assert.throws(()=>apply(start,{type:'ADD_NODE',node:{...ship,kind:'javascript'}}),/Invalid node kind/);
 assert.equal(starter().nodes.some(n=>n.kind==='starship'),false,'No unexpected starter changes');
});
test('V117 native renderer integrates authored 3D assets, water and daylight into the pick-safe pipeline',()=>{
 assert.ok(parse(renderer,{sourceType:'module',plugins:['typescript']}).program.body.length>7);
 assert.ok(parse(sky,{sourceType:'module',plugins:['typescript']}).program.body.length>5);
 assert.ok(parse(canvas,{sourceType:'module',plugins:['jsx','typescript']}).program.body.length>6);
 assert.match(renderer,/buildCinematicMeshes\(\)/);
 assert.match(renderer,/gl\.drawArrays\(m\.mode,0,m\.count\)/);
 assert.match(renderer,/sky\.render\(w,h,camera\.yaw/);
 assert.match(renderer,/gl\.readPixels\(px,py,1,1/);
 for(const name of ['islandRock','islandTop','towerCollar','bridgeArch','waterRibbon','craftHull','craftFins','gatewayArch'])
  assert.ok(renderer.includes("'"+name+"'"),name+' must be invoked by real document node geometry');
 assert.match(renderer,/node\.kind==='starship'/);
 assert.match(renderer,/uWater/);
 assert.match(renderer,/mesh:'islandTop',transform:I,material:node.material/);
 assert.match(renderer,/mesh:'waterRibbon',transform:I,material:node.material/);
 assert.match(renderer,/node.kind==='light'.*material:node.material/);

 assert.match(renderer,/uTime/);
 assert.match(renderer,/lastTime/);
 assert.match(renderer,/gl\.isContextLost\(\)/);
 assert.match(renderer,/animatedModel\(n\)/);
 assert.match(renderer,/draw\(scene,camera,null,width,height,true,lastTime\)/);
 assert.match(sky,/uTime/);
 assert.match(sky,/ringR/);
 assert.match(sky,/planetMask/);
 assert.match(sky,/cloudMask/);
});
test('V117 water and atmosphere motion does not invent browser or cloud GPU dependencies',()=>{
 assert.match(canvas,/requestAnimationFrame\(now=>/);
 assert.match(canvas,/motionAllowed\.current/);
 assert.match(canvas,/new IntersectionObserver/);
 assert.match(canvas,/prefers-reduced-motion: reduce/);
 assert.match(canvas,/minFrameTime=rect\.width<=680\?55:42/);
 assert.match(canvas,/cancelAnimationFrame/);
 assert.match(canvas,/Retry graphics on a fresh canvas/);
 assert.match(canvas,/webglcontextlost/);
 assert.match(canvas,/webglcontextrestored/);
 assert.match(shelf,/Starcraft/);
 assert.match(shelf,/kind:'starship'/);
 assert.match(shelf,/Neon Bloom/);
 for(const source of [renderer,sky,geometry,canvas])
  assert.doesNotMatch(source,/\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b|dangerouslySetInnerHTML|\beval\s*\(|new Function/);
});

test('V117 touch translation emits real undoable typed moves and camera focus actions',()=>{
 assert.ok(parse(pad,{sourceType:'module',plugins:['jsx','typescript']}).program.body.length>2);
 assert.match(pad,/onMove\(delta\)/);
 assert.match(pad,/onFrame/);
 assert.match(pad,/Movement step/);
 assert.match(pad,/Move distance/);
 assert.match(page,/StudioTransformPadV117/);
 assert.match(page,/function nudge\(delta:Vec3\)/);
 assert.match(page,/command\(\{type:'SET_TRANSFORM',id:node.id,field:'position',value:position\}\)/);
 assert.match(page,/target:\[\.\.\.node.position\] as Vec3/);
 assert.match(style,/\.csn-transform-pad/);
 assert.match(style,/\.csn-axis-x/);
 assert.match(style,/forced-colors:active/);
 assert.match(style,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(pad,/\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b|dangerouslySetInnerHTML|\beval\s*\(/);
});
