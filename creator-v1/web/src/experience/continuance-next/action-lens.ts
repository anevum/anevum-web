/** Local, immutable design-review model. Not server authorization or durable undo. */
export type Field = 'title' | 'description';
export type Document = Readonly<{ id: string; revision: number; fields: Readonly<Record<Field, string>> }>;
export type Change = Readonly<{ before: string; after: string }>;
export type Proposal = Readonly<{ id: string; targetId: string; expectedRevision: number; changes: Readonly<Partial<Record<Field, Change>>> }>;
export type Receipt = Readonly<{ proposalId: string; targetId: string; baseRevision: number; appliedRevision: number; changes: Readonly<Partial<Record<Field, Change>>> }>;
type Rejection = Readonly<{ status: 'invalid' | 'conflict'; reason: string }>;
export type Inspection = Readonly<{ status: 'reviewable'; fields: readonly Field[] }> | Rejection;
export type Applied = Readonly<{ status: 'applied'; document: Document; receipt: Receipt }> | Rejection;
export type Undone = Readonly<{ status: 'undone'; document: Document }> | Rejection;
const fields: readonly Field[] = ['title', 'description'];
const limits: Readonly<Record<Field, number>> = { title: 100, description: 1200 };
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const revision = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) < Number.MAX_SAFE_INTEGER;
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const text = (field: Field, value: unknown): value is string => typeof value === 'string' && value.length <= limits[field];
const invalid = (reason: string): Rejection => ({ status: 'invalid', reason });
const conflict = (reason: string): Rejection => ({ status: 'conflict', reason });
function validDocument(value: unknown): value is Document {
  return record(value) && identifier(value.id) && revision(value.revision) && record(value.fields) &&
    fields.every(field => Object.hasOwn(value.fields as object, field) && text(field, (value.fields as Record<string, unknown>)[field]));
}
function changeKeys(value: unknown): Field[] | null {
  if (!record(value)) return null;
  const keys = Object.keys(value);
  if (!keys.length || keys.some(key => !fields.includes(key as Field))) return null;
  for (const key of keys as Field[]) {
    const change = value[key];
    if (!record(change) || !text(key, change.before) || !text(key, change.after) || !change.after.trim() || change.before === change.after) return null;
  }
  return keys as Field[];
}
function snapshot(document: Document): Document {
  return Object.freeze({ id: document.id, revision: document.revision, fields: Object.freeze({ ...document.fields }) });
}
export function inspectProposal(document: Document, proposal: Proposal): Inspection {
  if (!validDocument(document) || !record(proposal) || !identifier(proposal.id) || !identifier(proposal.targetId) || !revision(proposal.expectedRevision)) return invalid('Invalid object or proposal.');
  const keys = changeKeys(proposal.changes);
  if (!keys) return invalid('Only valid changes to approved fields are allowed.');
  if (proposal.targetId !== document.id) return conflict('This proposal targets a different object.');
  if (proposal.expectedRevision !== document.revision) return conflict('This object changed after the proposal was prepared.');
  if (keys.some(field => proposal.changes[field]!.before !== document.fields[field])) return conflict('The current value no longer matches the proposal.');
  return { status: 'reviewable', fields: keys };
}
export function applyProposal(document: Document, proposal: Proposal): Applied {
  const inspection = inspectProposal(document, proposal);
  if (inspection.status !== 'reviewable') return inspection;
  const next = { ...document.fields };
  const changes: Partial<Record<Field, Change>> = {};
  for (const field of inspection.fields) {
    const change = proposal.changes[field]!;
    next[field] = change.after;
    changes[field] = Object.freeze({ before: change.before, after: change.after });
  }
  const updated = snapshot({ id: document.id, revision: document.revision + 1, fields: next });
  const receipt = Object.freeze({ proposalId: proposal.id, targetId: document.id, baseRevision: document.revision, appliedRevision: updated.revision, changes: Object.freeze(changes) });
  return { status: 'applied', document: updated, receipt };
}
export function undoReceipt(document: Document, receipt: Receipt): Undone {
  if (!validDocument(document) || !record(receipt) || !identifier(receipt.proposalId) || !identifier(receipt.targetId) || !revision(receipt.baseRevision) || receipt.appliedRevision !== receipt.baseRevision + 1) return invalid('Invalid undo receipt.');
  const keys = changeKeys(receipt.changes);
  if (!keys) return invalid('Invalid undo fields.');
  if (document.id !== receipt.targetId || document.revision !== receipt.appliedRevision) return conflict('Newer edits exist. Review them before reverting.');
  if (keys.some(field => document.fields[field] !== receipt.changes[field]!.after)) return conflict('The current value no longer matches the applied change.');
  const next = { ...document.fields };
  for (const field of keys) next[field] = receipt.changes[field]!.before;
  return { status: 'undone', document: snapshot({ id: document.id, revision: document.revision + 1, fields: next }) };
}
/** Empty drafts are legitimate human edits; blank proposed final values are not. */
export function editField(document: Document, field: Field, value: string): Document {
  if (!validDocument(document) || !fields.includes(field) || !text(field, value) || document.fields[field] === value) return document;
  return snapshot({ id: document.id, revision: document.revision + 1, fields: { ...document.fields, [field]: value } });
}
