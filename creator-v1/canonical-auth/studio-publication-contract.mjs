/**
 * ANEVUM Creator V1: unactivated, read-only review-to-publication contract.
 * This module has no database, route, signing key, storage or public-write access.
 * A candidate is NOT an approval, identity binding or publication grant.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,88}[a-z0-9])$/;
const SAFE_CATEGORY = new Set(['games', 'tools', 'creative', 'learning', 'research', 'other']);
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const SECRET_QUERY = /^(?:token|api[_-]?key|secret|password|access[_-]?token|session|auth|code)$/i;

function nonempty(value, min, max, field) {
  if (typeof value !== 'string' || value.length > max || CONTROL.test(value) || value.trim().length < min)
    throw new Error('Invalid ' + field);
  return value.trim();
}
function canonicalHttps(value) {
  if (value == null || value === '') return null;
  const s = nonempty(value, 1, 1500, 'external destination');
  let url;
  try { url = new URL(s); } catch { throw new Error('Invalid external destination'); }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password ||
      (url.port && url.port !== '443') || !hostname.includes('.') ||
      hostname.includes(':') || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(hostname) ||
      [...url.searchParams.keys()].some(key => SECRET_QUERY.test(key)))
    throw new Error('External destination is not eligible for a public catalogue');
  return url.href;
}
function integer(value, min, field) {
  if (!Number.isSafeInteger(value) || value < min) throw new Error('Invalid ' + field);
  return value;
}
function matchUUID(value, field) {
  if (typeof value !== 'string' || !UUID.test(value)) throw new Error('Invalid ' + field);
  return value;
}
function safeId(value, field) {
  // Better Auth canonical IDs are opaque. Never reinterpret them as handles.
  return nonempty(value, 1, 128, field);
}
function compare(a, b, field) {
  if (a !== b) throw new Error('Review receipt mismatch: ' + field);
}
function normalizedSnapshot(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Missing frozen submission');
  const slug = nonempty(row.slug, 3, 90, 'slug');
  if (!SLUG.test(slug)) throw new Error('Invalid slug');
  const category = nonempty(row.category, 3, 30, 'category');
  // Other Studio categories require explicit public-taxonomy mapping later.
  if (!SAFE_CATEGORY.has(category)) throw new Error('Unsupported public category');
  if (row.free_to_use !== 0 && row.free_to_use !== 1) throw new Error('Invalid free-access flag');
  const metadata = {
    slug,
    title: nonempty(row.title, 3, 100, 'title'),
    summary: nonempty(row.summary, 10, 280, 'summary'),
    description: nonempty(row.description, 0, 8000, 'description'),
    category,
    freeToUse: row.free_to_use === 1,
    license: nonempty(row.license_name, 2, 80, 'license'),
    sourceUrl: canonicalHttps(row.source_url),
    demoUrl: canonicalHttps(row.demo_url),
    aiDisclosure: nonempty(row.ai_disclosure, 6, 1200, 'AI disclosure'),
    humanContribution: nonempty(row.human_contribution, 10, 1200, 'human contribution')
  };
  // Quarantined private files never become public without a separate scanned,
  // isolated player release. This contract only allows creator-hosted HTTPS.
  if (!metadata.sourceUrl && !metadata.demoUrl)
    throw new Error('A validated external demo or source is required');
  return metadata;
}

/**
 * Prepare an immutable intent from a frozen D1 submission, not the editable
 * draft. Callers must independently authenticate staff, validate verified-role
 * membership, verify rights, bind canonical-to-public identity, commit an audited
 * approval+outbox transaction, project safely, and test takedown/rollback.
 * No public-ready flag or creator identity mapping is returned here.
 */
export async function prepareStudioPublicationIntent({submission, project, reviewerId, reason, reviewedAt}) {
  if (!submission || !project || typeof project !== 'object') throw new Error('Review project missing');
  const submissionId = matchUUID(submission.id, 'submission ID');
  const projectId = matchUUID(submission.project_id, 'project ID');
  const ownerUserId = safeId(submission.user_id, 'canonical owner');
  const actor = safeId(reviewerId, 'reviewer');
  if (ownerUserId === actor) throw new Error('Authors cannot approve their own submissions');
  compare(project.id, projectId, 'project ID');
  compare(project.user_id, ownerUserId, 'project owner');
  compare(project.status, 'pending_review', 'project status');
  compare(submission.status, 'pending_review', 'submission status');
  const revision = integer(submission.project_revision, 2, 'submission revision');
  compare(project.revision, revision, 'project revision');
  const submittedAt = integer(submission.submitted_at, 1, 'submission time');
  const at = integer(reviewedAt, submittedAt, 'review time');
  const reviewerReason = nonempty(reason, 12, 1200, 'review reason');
  const metadata = normalizedSnapshot(submission);
  const source = {submissionId, projectId, revision, ownerUserId, submittedAt};
  const review = {reviewerId: actor, reason: reviewerReason, reviewedAt: at};
  // Stable input order. Same source key with a different fingerprint must be
  // a conflict during the independently designed outbox insertion, not an overwrite.
  const payload = JSON.stringify({contract: 'anevum.studio.publication-intent.v1', source, review, metadata});
  const hashed = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload)));
  const fingerprint = [...hashed].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return Object.freeze({
    contract: 'anevum.studio.publication-intent.v1',
    idempotencyKey: 'canonical-studio:' + submissionId + ':' + revision,
    fingerprint,
    source: Object.freeze(source),
    review: Object.freeze(review),
    metadata: Object.freeze(metadata),
    publicationAuthorized: false,
    projectionEnabled: false,
    requires: Object.freeze(['verified_staff_role', 'authoritative_identity_binding',
      'rights_and_live_destination_review', 'audited_approval_and_outbox',
      'separate_public_projection', 'takedown_and_replay_acceptance'])
  });
}
