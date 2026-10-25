/**
 * PARITY V136.007 — deterministic scene grammar / GPU budget / shader contract.
 * No browser, network, member session, database, or synthetic publication data.
 * Run: node --experimental-strip-types --test creator-v1/test/parity-v136-scene-director.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  SCENE_PROFILES,sceneProfile,frameFor,advanceSceneFrame,sceneRenderSize
} from '../web/src/parity/SceneDirectorV136.ts';
import {fragmentSource,vertexSource} from '../web/src/parity/living-world-shaders.ts';

const sectors=[
 'hero','portal','games','tools','creative','libraries','automation',
 'research','learning','other','community','creators','studio'
];
test('every actual public scene has a distinct, finite director profile',()=>{
 assert.deepEqual(Object.keys(SCENE_PROFILES).sort(),sectors.slice().sort());
 const signatures=new Set();
 for(const sector of sectors){
   const profile=sceneProfile(sector);
   assert.equal(profile.sector,sector);
   assert.ok(['atrium','archive','forge','relay'].includes(profile.geometry));
   assert.equal(profile.camera.length,3);
   assert.equal(profile.tone.length,3);
   assert.equal(profile.silhouette.length,4);
   assert.equal(profile.silhouette.reduce((a,b)=>a+b,0),1);
   assert.ok(profile.camera.every(Number.isFinite));
   assert.ok(profile.tone.every(x=>Number.isFinite(x)&&x>=0&&x<=1));
   assert.ok(Number.isFinite(profile.signature));
   signatures.add(profile.signature);
 }
 assert.equal(signatures.size,sectors.length,'Each place keeps a unique visual signature');
 assert.notDeepEqual(sceneProfile('hero').silhouette,sceneProfile('portal').silhouette);
 assert.notDeepEqual(sceneProfile('portal').silhouette,sceneProfile('studio').silhouette);
});
test('scene motion interpolates instead of teleporting, and static mode settles instantly',()=>{
 const from=frameFor(sceneProfile('hero'),.15);
 const to=frameFor(sceneProfile('studio'),.90);
 assert.deepEqual(advanceSceneFrame(from,to,16,false),to);
 const middle=advanceSceneFrame(from,to,32,true);
 assert.ok(middle.signature>from.signature&&middle.signature<to.signature);
 assert.ok(middle.silhouette[0]<1&&middle.silhouette[0]>0);
 assert.ok(middle.silhouette[2]>0&&middle.silhouette[2]<1);
 assert.ok(middle.density>.15&&middle.density<.90);
 let result=from;
 for(let i=0;i<160;i++)result=advanceSceneFrame(result,to,33,true);
 assert.ok(Math.abs(result.signature-to.signature)<.001);
 assert.ok(Math.abs(result.camera[2]-to.camera[2])<.001);
});
test('invalid elapsed times and catalogue density cannot corrupt GPU parameters',()=>{
 const source=frameFor(sceneProfile('hero'),-500);
 const destination=frameFor(sceneProfile('portal'),Number.POSITIVE_INFINITY);
 assert.equal(source.density,0);
 assert.equal(destination.density,0);
 assert.equal(frameFor(sceneProfile('games'),120).density,1);
 const same=advanceSceneFrame(source,destination,NaN,true);
 assert.ok(same.camera.every(Number.isFinite));
 assert.ok(same.silhouette.every(Number.isFinite));
});
test('all responsive viewports remain within strict physical GPU pixel budgets',()=>{
 for(const width of [320,390,768,1024,1440,1920,2560,3840]){
   for(const dpr of [1,2,3]){
     const size=sceneRenderSize(width,960,dpr);
     assert.ok(size.width>0&&size.height>0);
     assert.ok(size.width*size.height<=size.limit);
     assert.equal(size.frameIntervalMs,width<=600?1000/24:1000/30);
     assert.ok(size.ratio<=dpr);
   }
 }
 assert.ok(sceneRenderSize(320,844,3).width<=640);
 assert.ok(sceneRenderSize(3840,2160,3).width*sceneRenderSize(3840,2160,3).height<=3_100_000);
});
test('shader exposes four analytic architecture families and requires no external textures',()=>{
 assert.ok(vertexSource.startsWith('#version 300 es'));
 assert.ok(fragmentSource.startsWith('#version 300 es'));
 for(const token of ['uniform vec4 u_shape;','uniform float u_signature;',
   'boxHit(', 'boxNormal(', 'u_shape.x','u_shape.y','u_shape.z','u_shape.w',
   'u_density','u_verified','u_center'])assert.ok(fragmentSource.includes(token),token);
 assert.ok(!/sampler2D|texture\s*\(|fetch\s*\(/.test(fragmentSource));
 assert.ok(!fragmentSource.includes('undefined'));
});
test('material layer is scoped and preserves motion/high contrast alternatives',()=>{
 const css=readFileSync(new URL('../web/src/parity/scene-materials-v136.css',import.meta.url),'utf8');
 assert.ok(css.includes('html[data-av-parity="v136-full"]'));
 for(const family of ['atrium','archive','forge','relay']){
   assert.ok(css.includes('[data-geometry="'+family+'"]'));
 }
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('forced-colors:active'));
 assert.ok(css.includes('pointer-events:none'));
});

// Geometry remains an isolated, bounded candidate rather than new live telemetry.
test('qa-only procedural horizon uses one existing renderer with bounded local meshes',()=>{
 const planet=readFileSync(new URL('../web/src/parity/InstituteHorizonV136017.ts',import.meta.url),'utf8');
 const render=readFileSync(new URL('../web/src/parity/InstituteRendererV136.ts',import.meta.url),'utf8');
 const workflow=readFileSync(new URL('../../.github/workflows/parity-v136-scene-qa.yml',import.meta.url),'utf8');
 const release=readFileSync(new URL('../ops/parity-v136-release.mjs',import.meta.url),'utf8');
 assert.match(planet,/export function createInstituteHorizon\(tier:AssetTier\)/);
 assert.match(planet,/HORIZON_QA_BUDGET/);
 assert.match(planet,/new T\.ShaderMaterial/);
 assert.match(planet,/root\.traverse\(object=>/);
 assert.ok(!/fetch\(|localStorage|document\.|navigator\.|new T\.WebGLRenderer/.test(planet),
  'Horizon must remain deterministic authored geometry with no network, identity or new canvas');
 assert.match(render,/VITE_PARITY_V136_HORIZON_QA==='true'/);
 assert.match(render,/createInstituteHorizon\(budget\.tier\)/);
 assert.match(render,/horizon\.root\.visible=input\.sector==='hero'&&!input\.saveData/);
 assert.match(render,/scene\.remove\(horizon\.root\);horizon\.dispose\(\)/);
 assert.match(workflow,/VITE_PARITY_V136_HORIZON_QA: 'true'/);
 assert.match(release,/Unapproved planetary art QA must be disabled in release/);
 assert.equal((render.match(/new T\.WebGLRenderer\(/g)||[]).length,1);
});
