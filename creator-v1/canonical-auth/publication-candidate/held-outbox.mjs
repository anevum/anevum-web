/**
 * ANEVUM Creator V1: isolated HELD review-outbox prototype.
 * NOT imported by any Worker, route, migration runner, or public projector.
 * This module cannot approve, publish, grant roles, sign owner identity, or
 * interact with COMMUNITY_DB. It deliberately never yields a publishable event.
 */
import {prepareStudioPublicationIntent} from '../studio-publication-contract.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SUBMISSION_FIELDS = [
  'id','project_id','user_id','project_revision','slug','title','summary',
  'description','category','free_to_use','license_name','source_url',
  'demo_url','ai_disclosure','human_contribution','status','submitted_at'
].join(',');

async function query(db, sql, args=[]) {
  const result = await db.prepare(sql).bind(...args).all();
  if (!result || result.success === false || !Array.isArray(result.results))
    throw new Error('Private review database unavailable');
  return result.results;
}

function validateDb(db) {
  if (!db || typeof db.prepare !== 'function')
    throw new Error('Private D1 binding required');
}

/**
 * PRECONDITIONS FOR A FUTURE PRIVATE CALLER (not yet implemented):
 * Independently verify an authenticated canonical staff session, staff role,
 * right to inspect this submission, rights/license, and external destination.
 * This held-only prototype checks actual canonical rows and a different
 * reviewer identity; it is NOT itself a staff authorization mechanism.
 *
 * Same frozen payload + same review time => idempotent replay.
 * Same submission/revision + different payload => explicit conflict.
 * Any withdrawal, revocation, or stale revision => reject.
 */
export async function recordHeldStudioPublication(db, {submissionId, reviewerId, reason, reviewedAt}) {
  validateDb(db);
  if (typeof submissionId !== 'string' || !UUID.test(submissionId))
    throw new Error('Invalid frozen submission ID');
  const submission = (await query(db,
    'SELECT ' + SUBMISSION_FIELDS + ' FROM member_studio_submissions WHERE id=? LIMIT 1',
    [submissionId]))[0];
  if (!submission) throw new Error('Frozen submission not found');
  const project = (await query(db,
    'SELECT id,user_id,revision,status FROM member_studio_projects WHERE id=? LIMIT 1',
    [submission.project_id]))[0];
  if (!project) throw new Error('Source project unavailable');
  const intent = await prepareStudioPublicationIntent({
    submission,project,reviewerId,reason,reviewedAt
  });
  const prior = (await query(db,
    'SELECT r.id,r.idempotency_key,r.fingerprint,r.status,' +
    'o.status AS outbox_status,o.fingerprint AS outbox_fingerprint ' +
    'FROM member_studio_publication_reviews r ' +
    'LEFT JOIN member_studio_publication_outbox o ON o.review_id=r.id ' +
    'WHERE r.submission_id=? LIMIT 1',
    [submissionId]))[0];
  if (prior) {
    if (prior.status !== 'held' || prior.outbox_status !== 'held')
      throw new Error('Held publication review was cancelled and cannot be rearmed');
    if (prior.idempotency_key !== intent.idempotencyKey ||
        prior.fingerprint !== intent.fingerprint ||
        prior.outbox_fingerprint !== intent.fingerprint)
      throw new Error('Publication intent idempotency conflict');
    return Object.freeze({
      reviewId:prior.id, idempotencyKey:intent.idempotencyKey,
      fingerprint:intent.fingerprint, replayed:true, status:'held',
      publicationAuthorized:false, projectionEnabled:false
    });
  }
  // Store only the validated frozen metadata and reviewer rationale; no
  // quarantined storage keys, owner handles, private asset bytes, or cookies.
  const safeSnapshot = JSON.stringify({
    contract:intent.contract,source:intent.source,review:intent.review,
    metadata:intent.metadata
  });
  if (safeSnapshot.length > 20000)
    throw new Error('Publication review snapshot exceeds private bound');
  const reviewId = crypto.randomUUID();
  // One SQLite INSERT + AFTER INSERT trigger atomically writes its held
  // outbox companion. The D1/SQLite row-state checks are repeated to catch
  // withdrawal and revision races after the initial application-level read.
  const inserted = await query(db,
    'INSERT INTO member_studio_publication_reviews ' +
    '(id,submission_id,project_id,owner_user_id,reviewer_user_id,' +
    'project_revision,idempotency_key,fingerprint,snapshot_json,' +
    'reviewer_reason,created_at,status) ' +
    'SELECT ?,s.id,s.project_id,s.user_id,?,s.project_revision,?,?,?,?,?,\'held\' ' +
    'FROM member_studio_submissions s ' +
    'JOIN member_studio_projects p ON p.id=s.project_id AND p.user_id=s.user_id ' +
    'JOIN "user" reviewer ON reviewer.id=? ' +
    'WHERE s.id=? AND s.status=\'pending_review\' ' +
    'AND p.status=\'pending_review\' AND p.revision=? ' +
    'AND s.project_revision=? AND s.user_id<>? RETURNING id',
    [reviewId, reviewerId, intent.idempotencyKey, intent.fingerprint,
      safeSnapshot, intent.review.reason, intent.review.reviewedAt,
      reviewerId, submissionId, intent.source.revision, intent.source.revision, reviewerId]);
  if (inserted.length !== 1 || inserted[0].id !== reviewId)
    throw new Error('Source submission changed during held-review preparation');
  return Object.freeze({
    reviewId, idempotencyKey:intent.idempotencyKey,
    fingerprint:intent.fingerprint, replayed:false, status:'held',
    publicationAuthorized:false, projectionEnabled:false
  });
}


/**
 * Private, read-only held-ledger audit. This detects orphaned/mismatched rows
 * and revoked/stale held submissions before a future projection design is
 * reviewed. No source metadata, user identity or sensitive URLs are emitted.
 */
export async function auditHeldStudioPublicationOutbox(db, {limit=100}={}) {
  validateDb(db);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 250)
    throw new Error('Invalid private outbox audit limit');
  const entries = await query(db,
    'SELECT o.id,o.status AS outbox_status,o.fingerprint AS outbox_fingerprint,'+
    'o.idempotency_key AS outbox_key,o.project_id AS outbox_project,'+
    'r.status AS review_status,r.fingerprint AS review_fingerprint,'+
    'r.idempotency_key AS review_key,r.project_id AS review_project,'+
    'r.owner_user_id AS review_owner,r.reviewer_user_id,r.project_revision AS review_revision,'+
    's.project_id AS submission_project,s.user_id AS submission_owner,'+
    's.project_revision AS submission_revision,s.status AS submission_status,'+
    'p.user_id AS project_owner,p.revision AS project_revision,p.status AS project_status,'+
    'reviewer.emailVerified AS reviewer_verified '+
    'FROM member_studio_publication_outbox o '+
    'LEFT JOIN member_studio_publication_reviews r ON r.id=o.review_id '+
    'LEFT JOIN member_studio_submissions s ON s.id=r.submission_id '+
    'LEFT JOIN member_studio_projects p ON p.id=r.project_id '+
    'LEFT JOIN "user" reviewer ON reviewer.id=r.reviewer_user_id '+
    'ORDER BY o.created_at DESC,o.id DESC LIMIT ?', [limit]);
  const findings=[];
  let held=0,cancelled=0;
  for (const row of entries) {
    if (row.outbox_status==='held') held++;
    else if (row.outbox_status==='cancelled') cancelled++;
    const errors=[];
    if (!row.review_status) errors.push('review_missing');
    if (row.outbox_status!==row.review_status) errors.push('status_mismatch');
    if (row.outbox_fingerprint!==row.review_fingerprint ||
        row.outbox_key!==row.review_key ||
        row.outbox_project!==row.review_project) errors.push('outbox_receipt_mismatch');
    if (row.outbox_status==='held') {
      if (row.project_status!=='pending_review'||row.submission_status!=='pending_review')
        errors.push('source_not_pending');
      if (row.review_revision!==row.project_revision ||
          row.review_revision!==row.submission_revision) errors.push('revision_mismatch');
      if (row.review_owner!==row.project_owner||
          row.review_owner!==row.submission_owner||
          row.review_project!==row.submission_project)
        errors.push('source_owner_mismatch');
      if (!row.reviewer_user_id || row.reviewer_verified!==1 ||
          row.reviewer_user_id===row.review_owner)
        errors.push('reviewer_not_verified');
    }
    if (errors.length) findings.push(Object.freeze({receiptId:row.id,errors:Object.freeze(errors)}));
  }
  return Object.freeze({
    checked:entries.length,held,cancelled,healthy:findings.length===0,
    findings:Object.freeze(findings),
    projectionEnabled:false,publicationAuthorized:false
  });
}
