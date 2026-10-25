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
