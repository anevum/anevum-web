import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticFixtures,evaluateBenchmark} from './project-doctor-benchmark-v001.mjs';
import {diagnoseStudioSource} from './project-doctor-v001.mjs';
import * as blocks from '../workbench-alpha/document.mjs';
import * as ui from '../interface-builder/document.mjs';

test('synthetic baseline uses canonical and reproducible fixture sources',()=>{
 const a=syntheticFixtures();
 const b=syntheticFixtures();
 assert.equal(a.length,60);
 assert.equal(a.filter(f=>f.expected.length===0).length,10);
 assert.deepEqual(a,b);
 assert.equal(new Set(a.map(f=>f.id)).size,a.length);
 for(const item of a){
  assert.ok((item.format==='anevum.blocks.v1'?blocks.decode(item.source):ui.decode(item.source)));
 }
});

test('the current deterministic baseline detects all seeded defects without spurious codes',()=>{
 const result=evaluateBenchmark();
 assert.equal(result.fixtures,60);
 assert.equal(result.defectCases,50);
 assert.equal(result.clean,10);
 assert.equal(result.exactMatches,60);
 assert.equal(result.truePositives,50);
 assert.equal(result.falsePositives,0);
 assert.equal(result.falseNegatives,0);
 assert.equal(result.precision,1);
 assert.equal(result.recall,1);
 assert.deepEqual(result.mismatches,[]);
});

test('every finding includes human-readable advice without source changes',()=>{
 for(const item of syntheticFixtures()){
  const original=item.source;
  const result=diagnoseStudioSource(item.source);
  assert.equal(item.source,original);
  for(const finding of result.findings){
   assert.equal(typeof finding.nextStep,'string');
   assert.ok(finding.nextStep.length>=20);
   assert.ok(!finding.nextStep.includes('<script'));
   assert.ok(!finding.nextStep.includes('http://'));
   assert.ok(!finding.nextStep.includes('https://'));
  }
 }
});

test('synthetic benchmark itself catches intentionally incorrect expected labels',()=>{
 const fixtures=syntheticFixtures().slice(0,2);
 fixtures[0]={...fixtures[0],expected:['scene.unreachable']};
 const result=evaluateBenchmark(fixtures);
 assert.equal(result.fixtures,2);
 assert.equal(result.exactMatches,1);
 assert.equal(result.falseNegatives,1);
 assert.equal(result.mismatches.length,1);
});
