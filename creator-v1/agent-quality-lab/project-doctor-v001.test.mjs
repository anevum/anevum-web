import test from 'node:test';
import assert from 'node:assert/strict';
import * as blocks from '../workbench-alpha/document.mjs';
import * as ui from '../interface-builder/document.mjs';
import {diagnoseStudioSource} from './project-doctor-v001.mjs';

const codes = result => result.findings.map(item => item.code);
const snapshot = value => JSON.stringify(value);

test('canonical interactive-story starter is accepted without warnings', () => {
  const source = blocks.encode(blocks.starter());
  const result = diagnoseStudioSource(source);
  assert.equal(result.valid, true);
  assert.equal(result.format, blocks.SCHEMA);
  assert.equal(result.mode, 'read-only');
  assert.deepEqual(result.findings, []);
  assert.equal(result.truncated, false);
});

test('story inspector finds unreachable scenes and unlinked choices without editing them', () => {
  const doc = blocks.starter();
  doc.blocks.push(blocks.block('scene','Unused scene'));
  doc.blocks.push(blocks.block('choice','A dead end'));
  const source = blocks.encode(doc);
  const original = snapshot(doc);
  const result = diagnoseStudioSource(source);
  assert.equal(result.valid, true);
  assert.ok(codes(result).includes('scene.unreachable'));
  assert.ok(codes(result).includes('choice.unlinked'));
  assert.equal(snapshot(doc),original);
  assert.equal(blocks.encode(doc),source);
});

test('canonical visual-interface starter is accepted without warnings', () => {
  const source = ui.encode(ui.starter());
  const result = diagnoseStudioSource(source);
  assert.equal(result.valid,true);
  assert.equal(result.format,ui.SCHEMA);
  assert.deepEqual(result.findings, []);
});

test('interface inspector flags unreachable pages, inaccessible labels and inert buttons', () => {
  const doc = ui.starter();
  const disconnected = ui.page('Unreachable room');
  disconnected.components.push(ui.component('button','',''));
  disconnected.components.push(ui.component('input','',''));
  doc.pages.push(disconnected);
  const source = ui.encode(doc);
  const result = diagnoseStudioSource(source);
  assert.equal(result.valid,true);
  assert.ok(codes(result).includes('page.unreachable'));
  assert.ok(codes(result).includes('button.unlabeled'));
  assert.ok(codes(result).includes('button.inert'));
  assert.ok(codes(result).includes('input.unlabeled'));
  assert.ok(result.findings.every(x => x.path.startsWith('pages/')));
});

test('malformed source is rejected by canonical codecs rather than repaired silently', () => {
  const doc = blocks.starter();
  const choice = doc.blocks.find(b => b.type === 'choice');
  choice.target='ffffffff-ffff-4fff-8fff-ffffffffffff';
  const source = blocks.PREFIX+JSON.stringify(doc);
  const result = diagnoseStudioSource(source);
  assert.equal(result.valid,false);
  assert.equal(result.findings[0].code,'document.invalid');
});

test('unknown, non-string and overlarge sources fail closed', () => {
  assert.equal(diagnoseStudioSource('some arbitrary JavaScript').findings[0].code,'source.unsupported');
  assert.equal(diagnoseStudioSource(null).findings[0].code,'source.type');
  assert.equal(diagnoseStudioSource('x'.repeat(33000)).findings[0].code,'source.too_large');
});

test('text content is treated as inert data and never evaluated', () => {
  const doc = ui.starter();
  const attempted = '<script>globalThis.COMPROMISED = true</script>';
  doc.pages[0].components[0].text=attempted;
  const result = diagnoseStudioSource(ui.encode(doc));
  assert.equal(result.valid,true);
  assert.equal(globalThis.COMPROMISED,undefined);
  assert.equal(doc.pages[0].components[0].text,attempted);
});
