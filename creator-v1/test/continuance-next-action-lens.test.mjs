import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectProposal, applyProposal, undoReceipt, editField } from '../web/src/experience/continuance-next/action-lens.ts';
const fixture = () => ({ document: { id: 'local-scene', revision: 3, fields: { title: 'Untitled scene', description: 'A local example' } }, proposal: { id: 'proposal-1', targetId: 'local-scene', expectedRevision: 3, changes: { title: { before: 'Untitled scene', after: 'Opening scene' } } } });
test('inspect, apply, undo retain immutable originals and increasing revisions', () => {
 const { document, proposal } = fixture();
 assert.equal(inspectProposal(document, proposal).status, 'reviewable');
 const result = applyProposal(document, proposal);
 assert.equal(result.status, 'applied'); assert.equal(result.document.revision, 4);
 assert.equal(document.fields.title, 'Untitled scene'); assert.equal(result.document.fields.title, 'Opening scene');
 const undo = undoReceipt(result.document, result.receipt);
 assert.equal(undo.status, 'undone'); assert.equal(undo.document.revision, 5); assert.equal(undo.document.fields.title, document.fields.title);
});
test('stale proposal cannot overwrite human edits', () => {
 const { document, proposal } = fixture(); const changed = editField(document, 'title', 'Human title');
 assert.equal(applyProposal(changed, proposal).status, 'conflict'); assert.equal(changed.fields.title, 'Human title');
});
test('undo refuses any later human revision', () => {
 const { document, proposal } = fixture(); const applied = applyProposal(document, proposal);
 const changed = editField(applied.document, 'description', 'Later work');
 assert.equal(undoReceipt(changed, applied.receipt).status, 'conflict'); assert.equal(changed.fields.description, 'Later work');
});
test('repeated application is stale, never a second change', () => {
 const { document, proposal } = fixture(); const applied = applyProposal(document, proposal);
 assert.equal(applyProposal(applied.document, proposal).status, 'conflict');
});
test('repeated undo is refused', () => {
 const { document, proposal } = fixture(); const applied = applyProposal(document, proposal);
 const undone = undoReceipt(applied.document, applied.receipt);
 assert.equal(undoReceipt(undone.document, applied.receipt).status, 'conflict');
});
test('wrong object identity is refused for both apply and undo', () => {
 const { document, proposal } = fixture(); assert.equal(applyProposal(document, { ...proposal, targetId: 'another-object' }).status, 'conflict');
 const applied = applyProposal(document, proposal);
 assert.equal(undoReceipt({ ...applied.document, id: 'another-object' }, applied.receipt).status, 'conflict');
});
test('matching revision does not permit a different before-value', () => {
 const { document, proposal } = fixture(); document.fields.title = 'Changed without revision';
 assert.equal(applyProposal(document, proposal).status, 'conflict');
});
test('empty, unsupported, overlong, blank and no-op changes fail closed', () => {
 const { document, proposal } = fixture();
 for (const changes of [{}, { script: { before: 'a', after: 'b' } }, { title: { before: 'Untitled scene', after: 'x'.repeat(101) } }, { title: { before: 'Untitled scene', after: ' ' } }, { title: { before: 'Untitled scene', after: 'Untitled scene' } }, []]) assert.equal(applyProposal(document, { ...proposal, changes }).status, 'invalid');
});
test('malformed proposal, object and field shapes fail without throwing', () => {
 const { document, proposal } = fixture();
 for (const value of [null, {}, [], { ...proposal, changes: null }, { ...proposal, changes: { title: null } }, { ...proposal, id: '' }]) assert.equal(applyProposal(document, value).status, 'invalid');
 for (const value of [null, {}, { ...document, fields: null }, { ...document, fields: {} }]) assert.equal(applyProposal(value, proposal).status, 'invalid');
});
test('invalid and exhausted revisions fail closed', () => {
 const { document, proposal } = fixture();
 for (const value of [-1, 1.2, NaN, Infinity, Number.MAX_SAFE_INTEGER, '3']) assert.equal(applyProposal({ ...document, revision: value }, { ...proposal, expectedRevision: value }).status, 'invalid');
});
test('blank human drafts are editable, suggestible and undoable', () => {
 const { document, proposal } = fixture(); const blank = editField(document, 'title', '');
 assert.equal(blank.fields.title, ''); assert.equal(blank.revision, 4);
 const applied = applyProposal(blank, { ...proposal, expectedRevision: 4, changes: { title: { before: '', after: 'Opening scene' } } });
 assert.equal(applied.status, 'applied'); assert.equal(undoReceipt(applied.document, applied.receipt).document.fields.title, '');
});
test('no-op and invalid human edits retain identity', () => {
 const { document } = fixture();
 for (const [field, value] of [['title', document.fields.title], ['script', 'x'], ['description', 'x'.repeat(1201)]]) assert.equal(editField(document, field, value), document);
});
test('receipt snapshots do not follow later proposal mutation', () => {
 const { document, proposal } = fixture(); const applied = applyProposal(document, proposal);
 proposal.changes.title.before = 'Tampered'; proposal.changes.title.after = 'Tampered';
 assert.equal(applied.receipt.changes.title.before, 'Untitled scene'); assert.equal(applied.document.fields.title, 'Opening scene');
 assert.ok(Object.isFrozen(applied.receipt.changes.title)); assert.ok(Object.isFrozen(applied.document.fields));
});
test('forged undo shape, fields and revision relationships are refused', () => {
 const { document, proposal } = fixture(); const applied = applyProposal(document, proposal);
 for (const receipt of [null, {}, { ...applied.receipt, changes: null }, { ...applied.receipt, changes: { constructor: { before: 'a', after: 'b' } } }, { ...applied.receipt, baseRevision: 1 }]) assert.equal(undoReceipt(applied.document, receipt).status, 'invalid');
});
test('multiple approved fields apply together or not at all', () => {
 const { document, proposal } = fixture(); proposal.changes.description = { before: 'A local example', after: 'A new description' };
 const applied = applyProposal(document, proposal); assert.equal(applied.status, 'applied'); assert.equal(applied.document.fields.description, 'A new description');
 proposal.changes.description.before = 'Wrong value'; assert.equal(applyProposal(document, proposal).status, 'conflict');
 assert.equal(document.fields.description, 'A local example');
});
