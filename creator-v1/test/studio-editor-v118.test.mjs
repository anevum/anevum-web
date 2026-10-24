import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {starter,primitive,apply,encode,decode} from '../world-composer/document.mjs';
import {getWorldSpawnPosition,getWorldSpawnTarget} from '../world-composer/placement-v118.mjs';
const read=path=>readFileSync(path,'utf8');
const page=read('creator-v1/web/src/pages/WorldComposerReviewV115.tsx');
const css=read('creator-v1/web/src/pages/studio-editor-v118.css');
const helper=read('creator-v1/world-composer/placement-v118.mjs');
const KINDS=['cube','sphere','island','spire','bridge','waterfall','light','starship'];
test('V118 smart asset placement remains deterministic, bounded and document-compatible',()=>{
 const initial=starter(),frozen=encode(initial);
 for(const kind of KINDS){
  const p=getWorldSpawnPosition(initial,kind);
  assert.deepEqual(p,getWorldSpawnPosition(initial,kind),'Stable location '+kind);
  assert.equal(p.length,3);
  assert.ok(p.every(x=>Number.isFinite(x)&&Math.abs(x)<=40),'Bounded location '+kind);
  assert.notDeepEqual(p,[0,0,0],'Catalog assets should not spawn over the main tower');
  const base=primitive('spawn-'+kind,kind==='bridge'||kind==='waterfall'?'cube':kind);
  const result=apply(initial,{type:'ADD_NODE',node:{...base,kind,position:p}});
  assert.deepEqual(result.nodes.at(-1).position,p);
  assert.deepEqual(decode(encode(result)),result);
  assert.deepEqual(getWorldSpawnTarget(kind,p),p);
  assert.equal(encode(initial),frozen,'Pure placement must not modify source document');
 }
});
test('V118 placement rejects unsupported kinds, prototype injection and full worlds',()=>{
 const doc=starter();
 for(const value of ['__proto__','constructor','toString','exploit','','javascript:gpu']){
  assert.throws(()=>getWorldSpawnPosition(doc,value),/Unsupported kind/);
  assert.throws(()=>getWorldSpawnTarget(value,[0,0,0]),/Unsupported kind/);
 }
 assert.throws(()=>getWorldSpawnPosition({},'cube'),/Invalid scene/);
 assert.throws(()=>getWorldSpawnTarget('cube',[Infinity,0,0]),/Invalid world framing/);
 assert.throws(()=>getWorldSpawnTarget('cube',[0,41,0]),/Invalid world framing/);
 const full=starter();
 for(let i=0;i<54;i++)full.nodes.push(primitive('extra-'+i));
 assert.equal(full.nodes.length,64);
 assert.throws(()=>getWorldSpawnPosition(full,'starship'),/64-object limit/);
});
test('V118 shelf places a real WorldNode but keeps legacy primitive-at-origin behavior',()=>{
 assert.ok(parse(page,{sourceType:'module',plugins:['jsx','typescript']}).program.body.length>12);
 assert.match(page,/function add\(kind:WorldKind\)/);
 assert.match(page,/command\(\{type:'ADD_NODE',node:primitive\(id,kind\)\}\)/);
 assert.match(page,/function addAsset\(asset:StudioAsset\)/);
 assert.match(page,/getWorldSpawnPosition\(scene,asset.kind\)/);
 assert.match(page,/getWorldSpawnTarget\(asset.kind!,position\)/);
 assert.match(page,/position\};/);
 assert.match(page,/setMode\('Scene'\)/);
 assert.match(page,/setFileNotice\(error instanceof Error/);
 assert.match(helper,/Object\.prototype\.hasOwnProperty\.call\(PROFILES,kind\)/);
});
test('V118 browser authoring gains keyboard history, bounded export and real mobile toolbar',()=>{
 assert.match(page,/function exportWorldDocument\(\)/);
 assert.match(page,/encode\(scene\)/);
 assert.match(page,/new Blob\(\[contents\]/);
 assert.match(page,/anchor\.download='sky-archipelago.world.anevum'/);
 assert.match(page,/URL\.revokeObjectURL/);
 assert.match(page,/No cloud revision was saved/);
 assert.match(page,/window\.addEventListener\('keydown',shortcut\)/);
 assert.match(page,/event\.preventDefault\(\)/);
 assert.match(page,/dispatch\(\{type:event.shiftKey\?'REDO':'UNDO'\}\)/);
 assert.match(page,/closest\('input, textarea, select, \[contenteditable="true"\]'\)/);
 assert.match(page,/csn-export-heading/);
 assert.match(page,/cvw-action-short/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/\.cvw-root \.cvs-mode-header\{display:none\}/);
 assert.match(css,/\.cvw-root \.csn-site-nav\{display:none\}/);
 assert.match(css,/\.cvs-project-actions \.cvs-primary:disabled/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
 assert.doesNotMatch(page,/\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b|dangerouslySetInnerHTML|\beval\s*\(|new Function/);
});
