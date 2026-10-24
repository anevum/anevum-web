import test from 'node:test';
import assert from 'node:assert/strict';
import * as blocks from '../workbench-alpha/document.mjs';
import * as ui from '../interface-builder/document.mjs';
import {diagnoseStudioSource} from './project-doctor-v001.mjs';
import {localRepairGuide,availableLocalRepairCodes} from './project-doctor-guidance-v001.mjs';

const codes=[
  'scene.missing','scene.unnamed','scene.unreachable','choice.unlabeled',
  'choice.unlinked','page.empty','page.unreachable','button.unlabeled',
  'button.inert','input.unlabeled','source.type','source.too_large',
  'source.unsupported','document.invalid'
];

test('all supported deterministic finding codes have explicit educational guides',()=>{
 assert.deepEqual(availableLocalRepairCodes(),[...codes].sort());
 for(const code of codes){
  const guide=localRepairGuide(code);
  assert.ok(guide,code);
  assert.equal(guide.code,code);
  assert.equal(guide.execution,'local-rules');
  assert.equal(guide.providerRequests,0);
  assert.equal(guide.appliesChanges,false);
  assert.ok(guide.title.length>=12);
  assert.ok(guide.impact.length>=30);
  assert.ok(guide.steps.length>=2&&guide.steps.length<=3);
  assert.ok(guide.steps.every(step=>step.length>=20&&step.length<240));
  assert.ok(guide.verify.length>=20);
  assert.ok(guide.note.length>=20);
  assert.ok(Object.isFrozen(guide));
  assert.ok(Object.isFrozen(guide.steps));
  assert.ok(!JSON.stringify(guide).includes('http://'));
  assert.ok(!JSON.stringify(guide).includes('https://'));
 }
});

test('unknown, inherited, untrusted and non-string codes never provide a guide',()=>{
 for(const code of [null,undefined,{},[],NaN,0,'',
  '__proto__','constructor','toString','scene.missing\0',
  'scene.missing/../../','<script>alert(1)</script>']){
  assert.equal(localRepairGuide(code),null,String(code));
 }
});

test('repair guides never mutate input or become executable fixes',()=>{
 const doc=ui.starter();
 doc.pages[0].components.push(ui.component('input','','SECRET_CREATOR_CODE_9001'));
 const source=ui.encode(doc);
 const before=JSON.stringify(doc);
 const result=diagnoseStudioSource(source);
 const matching=result.findings.find(item=>item.code==='input.unlabeled');
 assert.ok(matching);
 const guide=localRepairGuide(matching.code);
 assert.ok(guide);
 assert.ok(!JSON.stringify(guide).includes('SECRET_CREATOR_CODE_9001'));
 assert.ok(!JSON.stringify(guide).includes(doc.pages[0].components.at(-1).id));
 assert.equal(JSON.stringify(doc),before);
 assert.equal(ui.encode(doc),source);
 assert.equal(globalThis.COMPROMISED,undefined);
});

test('guide instructions caution that a disappearing warning is not a tested repair',()=>{
 for(const code of ['choice.unlinked','page.unreachable','button.inert']){
  const guide=localRepairGuide(code);
  assert.match(guide.verify,/Reinspect/i);
  assert.match(guide.note,/not|may|can/i);
 }
});

test('unsupported source errors receive advice without printing rejected source',()=>{
 const secret='private-project-embedded-visitor-token';
 const result=diagnoseStudioSource(secret);
 assert.equal(result.valid,false);
 assert.equal(result.findings[0].code,'source.unsupported');
 const guide=localRepairGuide(result.findings[0].code);
 assert.ok(guide);
 assert.ok(!JSON.stringify(guide).includes(secret));
});

test('story branch diagnosis maps to local manual correction steps',()=>{
 const doc=blocks.starter();
 doc.blocks.push(blocks.block('choice','Unconnected synthetic choice'));
 const result=diagnoseStudioSource(blocks.encode(doc));
 assert.equal(result.valid,true);
 const finding=result.findings.find(item=>item.code==='choice.unlinked');
 assert.ok(finding);
 const guide=localRepairGuide(finding.code);
 assert.match(guide.title,/destination/i);
 assert.match(guide.verify,/Reinspect/i);
});
