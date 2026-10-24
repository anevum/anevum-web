import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {PREFIX,LIMITS,starter,validate,encode,decode,apply,primitive} from '../world-composer/document.mjs';

const app=readFileSync('creator-v1/web/src/App.tsx','utf8');
const page=readFileSync('creator-v1/web/src/pages/WorldComposerReviewV115.tsx','utf8');
const canvas=readFileSync('creator-v1/web/src/pages/WorldCanvasV115.tsx','utf8');
const gl=readFileSync('creator-v1/web/src/pages/world-webgl2-v115.ts','utf8');
const css=readFileSync('creator-v1/web/src/pages/world-composer-v115.css','utf8');

const deep=value=>JSON.parse(JSON.stringify(value));
const mutated=(doc,fn)=>{const v=deep(doc);fn(v);return v;};

test('starter is a valid finite, bounded, executable-code-free real-world model',()=>{
 const world=starter(),data=encode(world),roundtrip=decode(data);
 assert.equal(world.format,'ANEVUM_WORLD_V1');
 assert.equal(world.units,'meters');
 assert.ok(world.nodes.length>=9&&world.nodes.length<=LIMITS.nodes);
 assert.ok(data.startsWith(PREFIX));
 assert.deepEqual(roundtrip,world);
 assert.equal(encode(roundtrip),data,'Canonical round trip');
 assert.ok(Buffer.byteLength(data)<=LIMITS.bytes);
 assert.ok(world.nodes.some(n=>n.kind==='island'));
 assert.ok(world.nodes.some(n=>n.kind==='bridge'));
 assert.ok(world.nodes.some(n=>n.kind==='waterfall'));
 assert.ok(world.nodes.some(n=>n.kind==='spire'));
});

test('document import rejects executable code, unsupported schemas and oversized raw bytes',()=>{
 assert.equal(decode('ANEVUM_BLOCKS_V1\n{}'),null);
 assert.equal(decode('ANEVUM_UI_V1\n{}'),null);
 assert.equal(decode('const world = eval(1)'),null);
 assert.equal(decode(PREFIX+'{"format":"ANEVUM_WORLD_V1"}'),null);
 assert.equal(decode(encode(starter())+' '.repeat(LIMITS.bytes)),null);
 assert.throws(()=>validate({...starter(),script:'alert(1)'}),/Invalid document fields/);
 const injected=JSON.parse(JSON.stringify(starter()).replace('"format":','"__proto__":{"admin":true},"format":'));
 assert.throws(()=>validate(injected),/Invalid document fields/);
});

test('strict finite bounds and node count reject malformed or adversarial documents',()=>{
 const initial=starter();
 const bad=[
  mutated(initial,v=>{v.nodes[0].position[0]=Infinity;}),
  mutated(initial,v=>{v.nodes[0].position[0]=41;}),
  mutated(initial,v=>{v.nodes[0].scale=[0,1,1];}),
  mutated(initial,v=>{v.nodes[0].rotation=[0,0,100];}),
  mutated(initial,v=>{v.nodes[0].material='javascript:evil';}),
  mutated(initial,v=>{v.environment.sunIntensity=-1;}),
  mutated(initial,v=>{v.camera.distance=0;}),
  mutated(initial,v=>{v.nodes.push(deep(v.nodes[0]));}),
  mutated(initial,v=>{v.nodes[0].parentId='missing-node';}),
  mutated(initial,v=>{v.nodes[0].unknown='hidden';}),
  mutated(initial,v=>{v.nodes=Array.from({length:LIMITS.nodes+1},(_,i)=>primitive('n-'+i));})
 ];
 for(const v of bad)assert.throws(()=>validate(v),'Invalid case was accepted: '+JSON.stringify(v).slice(0,110));
});

test('reject parent cycles and nested hierarchies beyond explicit scene depth',()=>{
 const a=starter();
 a.nodes[0].parentId=a.nodes[1].id;a.nodes[1].parentId=a.nodes[0].id;
 assert.throws(()=>validate(a),/Cycle/);
 const b=starter();
 for(let i=1;i<8;i++)b.nodes[i].parentId=b.nodes[i-1].id;
 assert.throws(()=>validate(b),/too deep/);
});

test('typed actions change real model without mutating the input or allowing stale IDs',()=>{
 const start=starter(),before=encode(start);
 const withCube=apply(start,{type:'ADD_NODE',node:primitive('sample-test','cube')});
 assert.equal(withCube.nodes.length,start.nodes.length+1);
 const moved=apply(withCube,{type:'SET_TRANSFORM',id:'sample-test',field:'position',value:[2,4,-3]});
 assert.deepEqual(moved.nodes.find(n=>n.id==='sample-test').position,[2,4,-3]);
 const colored=apply(moved,{type:'SET_MATERIAL',id:'sample-test',material:'violet'});
 assert.equal(colored.nodes.find(n=>n.id==='sample-test').material,'violet');
 assert.equal(encode(start),before,'Source document mutated');
 assert.throws(()=>apply(start,{type:'SET_TRANSFORM',id:'unknown',field:'position',value:[0,0,0]}),/Unknown node/);
 assert.throws(()=>apply(start,{type:'ADD_NODE',node:primitive('spire','cube')}),/Duplicate node/);
 assert.throws(()=>apply(start,{type:'SET_MATERIAL',id:'spire',material:'secret-gold'}),/Invalid material/);
});

test('hierarchy commands validate parent cycles and cascade deletes deterministically',()=>{
 let v=apply(starter(),{type:'ADD_NODE',node:primitive('child','cube')});
 v=apply(v,{type:'SET_PARENT',id:'child',parentId:'spire'});
 const before=v.nodes.length;
 v=apply(v,{type:'DELETE_NODE',id:'spire'});
 assert.equal(v.nodes.length,before-2);
 assert.equal(v.nodes.some(n=>['spire','child'].includes(n.id)),false);
 assert.throws(()=>apply(starter(),{type:'SET_PARENT',id:'spire',parentId:'spire'}),/Cycle/);
});

test('scene preset and camera commands constrain inputs and roundtrip',()=>{
 let v=starter();
 v=apply(v,{type:'SET_ENVIRONMENT',sky:'night',sunIntensity:.5});
 v=apply(v,{type:'SET_CAMERA',camera:{yaw:1,pitch:.4,distance:26,target:[0,1,0]}});
 assert.equal(decode(encode(v)).environment.sky,'night');
 assert.equal(v.camera.distance,26);
 assert.throws(()=>apply(v,{type:'SET_ENVIRONMENT',sky:'night',sunIntensity:900}),/Invalid lighting/);
 assert.throws(()=>apply(v,{type:'SET_CAMERA',camera:{yaw:0,pitch:2,distance:26,target:[0,1,0]}}),/Invalid camera/);
});

test('GPU route is independently compile-time gated from Studio V109 and V115 P0',()=>{
 assert.match(app,/CreatorWorldWebGL2PageV115=import\.meta\.env\.VITE_CREATOR_WORLD_WEBGL2_V115==='true'/);
 assert.match(app,/path="studio\/world-review" element=\{CreatorWorldWebGL2PageV115\?/);
 assert.match(app,/path="studio\/visual-review"/);
 assert.match(app,/path="studio\/workspace"/);
 assert.match(app,/path="studio\/packages"/);
 assert.match(app,/path="studio\/records"/);
 for(const code of [page,canvas,gl]){
  const ast=parse(code,{sourceType:'module',plugins:['typescript','jsx']});
  assert.ok(ast.program.body.length>3);
 }
});

test('GPU renderer has true WebGL2 shader draws, depth, ID picking and lifecycle disposal',()=>{
 assert.match(gl,/getContext\('webgl2'/);
 assert.match(gl,/gl\.drawArrays\(m\.mode,0,m\.count\)/);
 assert.match(gl,/gl\.enable\(gl\.DEPTH_TEST\)/);
 assert.match(gl,/gl\.readPixels\(px,py,1,1/);
 assert.match(gl,/gl\.deleteBuffer\(m\.buffer\)/);
 assert.match(canvas,/webglcontextlost/);
 assert.match(canvas,/webglcontextrestored/);
 assert.match(canvas,/ResizeObserver/);
 assert.match(canvas,/requestAnimationFrame/);
 assert.match(canvas,/pointer/i);
 assert.match(canvas,/documentVisibilityHidden/);
 assert.match(page,/import \{WorldCanvasV115\}/);
});

test('editor honors local-only design: source export, undo/redo, no fake save',()=>{
 assert.match(page,/useReducer\(reducer,initial\)/);
 assert.match(page,/past:\[\.\.\.state\.past,state\.document\]/);
 assert.match(page,/future:\[state\.document,\.\.\.state\.future\]/);
 assert.match(page,/UNSAVED LOCAL EDITS/);
 assert.match(page,/value=\{source\}/);
 assert.match(page,/Save revision/);
 assert.match(page,/disabled className="cvs-primary"/);
 for(const s of [page,canvas,gl])assert.doesNotMatch(s,/\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b|dangerouslySetInnerHTML|\beval\s*\(|new Function/);
});

test('responsive UI has accessible control names, zoom, mobile inspector and reduced-motion',()=>{
 assert.match(canvas,/aria-label="Interactive WebGL2 world/);
 assert.match(page,/aria-label="Mobile world editor panels"/);
 assert.match(page,/aria-label="Scene hierarchy"/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
 assert.match(css,/cvw-explorer\.is-mobile-open/);
});
