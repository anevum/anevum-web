import test from 'node:test';
import assert from 'node:assert/strict';
import * as blocks from '../workbench-alpha/document.mjs';
import * as ui from '../interface-builder/document.mjs';
import {compareProjectDoctorSources} from './project-doctor-diff-v001.mjs';

test('identical canonical documents produce no introduced/resolved findings',()=>{
  const source=blocks.encode(blocks.starter());
  const diff=compareProjectDoctorSources(source,source);
  assert.equal(diff.comparable,true);
  assert.deepEqual(diff.counts,{introduced:0,noLongerReported:0,stillReported:0});
});

test('fixed label disappears from source diagnostics, without claiming a verified repair',()=>{
  const doc=ui.starter();
  const item=ui.component('input','','');
  doc.pages[0].components.push(item);
  const saved=ui.encode(doc);
  const revised=structuredClone(doc);
  revised.pages[0].components.at(-1).title='Email address';
  const draft=ui.encode(revised);
  const diff=compareProjectDoctorSources(saved,draft);
  assert.equal(diff.comparable,true);
  assert.deepEqual(diff.counts,{introduced:0,noLongerReported:1,stillReported:0});
  assert.equal(diff.noLongerReported[0].code,'input.unlabeled');
  assert.match(diff.disclaimer,/not necessarily verified repairs/);
  assert.equal(diff.format,ui.SCHEMA);
});

test('moving and inserting blocks does not misidentify persistent problems',()=>{
  const doc=blocks.starter();
  const choice=blocks.block('choice','Optional action');
  doc.blocks.push(choice);
  const saved=blocks.encode(doc);
  const revised=structuredClone(doc);
  revised.blocks.splice(0,0,blocks.block('paragraph','A harmless introduction'));
  const result=compareProjectDoctorSources(saved,blocks.encode(revised));
  assert.deepEqual(result.counts,{introduced:0,noLongerReported:0,stillReported:1});
  assert.equal(result.stillReported[0].code,'choice.unlinked');
  assert.notEqual(result.stillReported[0].path,'blocks/6');
});

test('reordering UI components preserves node-level defect identity',()=>{
  const doc=ui.starter();
  doc.pages[0].components.push(ui.component('input','',''));
  const saved=ui.encode(doc);
  const revised=structuredClone(doc);
  revised.pages[0].components.unshift(ui.component('paragraph','','New intro'));
  const result=compareProjectDoctorSources(saved,ui.encode(revised));
  assert.deepEqual(result.counts,{introduced:0,noLongerReported:0,stillReported:1});
  assert.equal(result.stillReported[0].code,'input.unlabeled');
});

test('new problem is introduced without losing persistent problems',()=>{
  const doc=blocks.starter();
  doc.blocks.push(blocks.block('choice','First open choice'));
  const saved=blocks.encode(doc);
  doc.blocks.push(blocks.block('choice','Second open choice'));
  const result=compareProjectDoctorSources(saved,blocks.encode(doc));
  assert.deepEqual(result.counts,{introduced:1,noLongerReported:0,stillReported:1});
});

test('invalid or incompatible sources do not report bogus fixes',()=>{
  const story=blocks.encode(blocks.starter());
  const interfaceDoc=ui.encode(ui.starter());
  for(const [a,b] of [[story,'not canonical'],['not canonical',story],[story,interfaceDoc]]) {
    const result=compareProjectDoctorSources(a,b);
    assert.equal(result.comparable,false);
    assert.deepEqual(result.counts,{introduced:0,noLongerReported:0,stillReported:0});
    assert.equal(result.introduced.length,0);
  }
});

test('comparison refuses truncated findings rather than implying completeness',()=>{
  const doc={schema:ui.SCHEMA,name:'Large test',theme:'continuance',
    pages:[ui.page('Main')]};
  for(let i=0;i<24;i++)doc.pages[0].components.push(ui.component('button','',''));
  const source=ui.encode(doc);
  const result=compareProjectDoctorSources(source,source);
  assert.equal(result.comparable,false);
  assert.match(result.reason,/exceed the comparison limit/);
});

test('change output never contains raw creator source text',()=>{
  const doc=ui.starter();
  doc.pages[0].components.push(ui.component('input','','SUPERSECRET-NOT-TO-ECHO-987'));
  const saved=ui.encode(doc);
  const revised=structuredClone(doc);
  revised.pages[0].components.at(-1).title='Input label';
  const result=compareProjectDoctorSources(saved,ui.encode(revised));
  assert.ok(!JSON.stringify(result).includes('SUPERSECRET-NOT-TO-ECHO-987'));
  assert.ok(!JSON.stringify(result).includes(saved));
});
