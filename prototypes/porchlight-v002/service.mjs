/**
 * ANEVUM Porchlight V002 - isolated event participation service.
 * No default production authentication. The exported default Worker deliberately fails closed.
 * createPorchlightHandler() requires an identity adapter that has ALREADY verified every actor
 * using a trusted, cryptographically validated identity provider. Never trust browser headers.
 * Public event listing is explicitly opt-in, consent-scoped, event-scoped and uncached.
 */
const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'private, no-store, max-age=0',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'cross-origin-resource-policy': 'same-origin',
});
const VERSION = 'porchlight-host-consent-v1';
const TAGS = new Set(['candy', 'nonfood', 'decor', 'stepfree']);
const REPORT_REASONS = new Set(['unwanted','incorrect','privacy','accessibility','other']);
const SLUG_RE = /^[a-z0-9]{2,40}(?:-[a-z0-9]{1,40})*$/;
const ID_RE = /^[a-zA-Z0-9:_-]{1,128}$/;
const REQUEST_MAX_BYTES = 4096;

class HttpError extends Error {
  constructor(status, code) {super(code); this.status = status; this.code = code;}
}
const fail = (status, code) => {throw new HttpError(status, code);};
function json(status, data) {
  return new Response(JSON.stringify(data), {status, headers: JSON_HEADERS});
}
const validSlug = value => typeof value === 'string' && SLUG_RE.test(value);
const validId = value => typeof value === 'string' && ID_RE.test(value);
function cleanText(value, max, min = 2) {
  if (typeof value !== 'string' || value.length > max || value.trim().length < min) fail(422, 'invalid_text');
  const result = value.trim();
  // Plain text only. Browser must still render textContent rather than innerHTML.
  if (/[<>\u0000-\u001f\u007f]/u.test(result)) fail(422, 'invalid_text');
  return result;
}
function checkKeys(payload, allowed) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail(422, 'invalid_payload');
  for (const key of Object.keys(payload)) if (!allowed.includes(key)) fail(422, 'unknown_field');
}
function parseTags(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 4) fail(422, 'invalid_tags');
  if (new Set(value).size !== value.length || value.some(tag => !TAGS.has(tag))) fail(422, 'invalid_tags');
  return JSON.stringify(value);
}
async function parseBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) fail(415, 'json_required');
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > REQUEST_MAX_BYTES) fail(413, 'request_too_large');
  if (!request.body) fail(422, 'missing_payload');
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > REQUEST_MAX_BYTES) {await reader.cancel(); fail(413, 'request_too_large');}
      chunks.push(value);
    }
  } finally {reader.releaseLock();}
  const data = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) {data.set(chunk, offset); offset += chunk.byteLength;}
  try {return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(data));}
  catch {fail(422, 'invalid_json');}
}
function assertOrigin(request, env) {
  const origin = new URL(request.url).origin;
  if (!origin.startsWith('https://') || env.PORCHLIGHT_ORIGIN !== origin || request.headers.get('Origin') !== origin) fail(403, 'origin_denied');
}
function readActor(actor) {
  if (!actor || actor.verified !== true || actor.emailVerified !== true || actor.adultEligible !== true || !validId(actor.id)) fail(401, 'sign_in_required');
  return actor.id;
}
function getParam(path, index) {return path[index] || '';}
function publicRecord(row) {
  return {
    id: row.id,
    label: row.public_label,
    mode: row.display_mode,
    place: row.display_mode === 'exact' ? row.public_exact_address : row.public_block,
    coords: row.display_mode === 'exact' ? {lat: row.public_lat, lng: row.public_lng} : null,
    offerings: JSON.parse(row.tags_json),
  };
}
function submissionReceipt(row) {
  return {id: row.id, event: row.event_id, status: row.status, revision: row.revision, mode: row.display_mode, createdAt: row.created_at};
}
function reviewRecord(row) {
  return {
    id: row.id, event: row.event_id, host: row.host_principal_id,
    label: row.public_label, privateAddress: row.private_address, blockLabel: row.public_block,
    mode: row.display_mode, coords: row.display_mode === 'exact' ? {lat: row.public_lat, lng: row.public_lng} : null,
    offerings: JSON.parse(row.tags_json), consentVersion: row.consent_version,
    consentedAt: row.consented_at, status: row.status, revision: row.revision,
  };
}
function validateSubmission(payload) {
  checkKeys(payload, ['label', 'privateAddress', 'blockCode', 'displayMode', 'lat', 'lng', 'tags', 'consentVersion', 'consentConfirmed', 'adultAttested', 'authorizedResidentAttested', 'exactLocationConsent', 'exactAddressConsent']);
  if (payload.consentVersion !== VERSION || payload.consentConfirmed !== true || payload.adultAttested !== true || payload.authorizedResidentAttested !== true) fail(422, 'consent_required');
  const mode = payload.displayMode;
  if (mode !== 'block' && mode !== 'exact') fail(422, 'invalid_display_mode');
  const label = cleanText(payload.label, 60);
  const privateAddress = cleanText(payload.privateAddress, 180, 5);
  const blockCode = payload.blockCode;
  if (!validSlug(blockCode)) fail(422, 'invalid_block');
  const tags = parseTags(payload.tags);
  let lat = null; let lng = null;
  if (mode === 'exact') {
    if (payload.exactLocationConsent !== true || payload.exactAddressConsent !== true || !Number.isFinite(payload.lat) || !Number.isFinite(payload.lng) || Math.abs(payload.lat) > 90 || Math.abs(payload.lng) > 180) fail(422, 'exact_location_consent_required');
    lat = payload.lat; lng = payload.lng;
  } else if (payload.exactLocationConsent === true || payload.exactAddressConsent === true || payload.lat !== undefined || payload.lng !== undefined) fail(422, 'block_mode_location_denied');
  return {label, privateAddress, blockCode, mode, lat, lng, tags};
}
async function dbFirst(db, sql, ...args) {return db.prepare(sql).bind(...args).first();}
async function dbAll(db, sql, ...args) {const out = await db.prepare(sql).bind(...args).all(); return out.results || [];}
async function transaction(db, statements) {return db.batch(statements.map(([sql, args]) => db.prepare(sql).bind(...args)));}
function auditInsert({id, eventId, actor, targetKind, targetId, action, from, to, reason, at, mutation}) {
  return [
    `INSERT INTO porchlight_audit (id, event_id, actor_principal_id, target_kind, target_id, action, from_status, to_status, reason, created_at, mutation_id)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS
     (SELECT 1 FROM porchlight_host_submissions WHERE id = ? AND mutation_id = ?)
        OR (? = 'event' AND EXISTS(SELECT 1 FROM porchlight_events WHERE id = ?))`,
    [id, eventId, actor, targetKind, targetId, action, from, to, reason, at, mutation, targetId, mutation, targetKind, eventId],
  ];
}
async function eventBySlug(db, slug) {return dbFirst(db, 'SELECT * FROM porchlight_events WHERE slug = ?', slug);}
async function requireOrganizer(db, eventId, actor, needsManager = false) {
  const grant = await dbFirst(db, `SELECT role FROM porchlight_organizer_grants
    WHERE event_id = ? AND principal_id = ? AND revoked_at IS NULL`, eventId, actor);
  if (!grant || (needsManager && grant.role !== 'manager')) fail(403, 'organizer_permission_denied');
}
function nowIso(now) {const time = now(); if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(time)) throw new Error('Clock must use UTC millisecond ISO timestamps'); return time;}
function eventMayAccept(event, at) {return event.status === 'open' && at < event.ends_at;}
function eventVisible(event, at) {return event.status === 'open' && event.public_from <= at && at < event.ends_at;}

export function createPorchlightHandler({resolveActor, authorizeWriteQuota, now = () => new Date().toISOString(), createId = () => crypto.randomUUID()} = {}) {
  // A runtime must explicitly inject an audited auth verifier; no identity comes from a header or cookie by itself.
  return async function fetch(request, env = {}) {
    if (env.PORCHLIGHT_DATA_ENABLED !== 'true' || !env.PORCHLIGHT_DB || typeof resolveActor !== 'function') return json(503, {error: 'not_configured'});
    const db = env.PORCHLIGHT_DB;
    const segments = new URL(request.url).pathname.split('/').filter(Boolean);
    const method = request.method.toUpperCase();
    if (segments[0] !== 'v1') return json(404, {error: 'not_found'});
    try {
      const at = nowIso(now);
      if (method !== 'GET') assertOrigin(request, env);
      // No authentication required to read event-approved, time-bounded public fields.
      if (method === 'GET' && segments.length === 4 && segments[1] === 'events' && segments[3] === 'pins') {
        const slug = getParam(segments, 2); if (!validSlug(slug)) fail(404, 'not_found');
        const event = await eventBySlug(db, slug);
        if (!event || !eventVisible(event, at)) return json(200, {status: 'inactive', pins: []});
        const rows = await dbAll(db, `SELECT id, public_label, public_exact_address, public_block, display_mode, public_lat, public_lng, tags_json
          FROM porchlight_host_submissions WHERE event_id = ? AND status = 'approved' ORDER BY created_at ASC LIMIT 200`, event.id);
        return json(200, {status: 'active', event: {title: event.title, startsAt: event.starts_at, endsAt: event.ends_at}, pins: rows.map(publicRecord)});
      }
      // Public organizer-controlled area choices. Never accept household-created public blocks.
      if (method === 'GET' && segments.length === 4 && segments[1] === 'events' && segments[3] === 'blocks') {
        const slug = getParam(segments, 2); if (!validSlug(slug)) fail(404, 'not_found');
        const event = await eventBySlug(db, slug);
        if (!event || !eventMayAccept(event, at)) return json(200, {status:'inactive', blocks:[]});
        const rows = await dbAll(db, 'SELECT code, public_label AS label FROM porchlight_event_blocks WHERE event_id = ? ORDER BY public_label ASC LIMIT 30', event.id);
        return json(200, {status:'active', consentVersion:VERSION, event:{title:event.title, endsAt:event.ends_at}, blocks:rows});
      }
      // Anonymous report intake: default OFF, requires server-side quota, no resident identity.
      if (method === 'POST' && segments.length === 4 && segments[1] === 'events' && segments[3] === 'reports') {
        if (env.PORCHLIGHT_REPORTS_ENABLED !== 'true') fail(503, 'reports_not_configured');
        const slug = segments[2]; if (!validSlug(slug)) fail(404, 'not_found');
        const event = await eventBySlug(db, slug);
        if (!event || !eventVisible(event, at)) fail(404, 'event_unavailable');
        const payload = await parseBody(request);
        checkKeys(payload, ['submissionId', 'reason', 'details']);
        if (!validId(payload.submissionId) || !REPORT_REASONS.has(payload.reason)) fail(422, 'invalid_report');
        const details = cleanText(payload.details, 240, 12);
        if (typeof authorizeWriteQuota !== 'function') fail(503, 'abuse_prevention_unavailable');
        const accepted = await authorizeWriteQuota({actor:null, eventId:event.id, operation:'report', request, env});
        if (accepted !== true) fail(429, 'try_later');
        const result = await db.prepare(
          "INSERT INTO porchlight_reports (id,event_id,submission_id,reason,details,status,revision,created_at) " +
          "SELECT ?, e.id, h.id, ?, ?, 'open', 1, ? " +
          "FROM porchlight_events e JOIN porchlight_host_submissions h ON h.event_id=e.id " +
          "WHERE e.id=? AND e.status='open' AND e.public_from<=? AND e.ends_at>? " +
          "AND h.id=? AND h.status='approved'"
        ).bind(createId(),payload.reason,details,at,event.id,at,at,payload.submissionId).run();
        if (result.meta?.changes !== 1) fail(404, 'listing_unavailable');
        return json(201, {status:'received',notice:'A private report was accepted for organizer review. This is not emergency dispatch.'});
      }
      // All non-public routes require identity provided by a previously verified, approved adapter.
      let actor;
      try {actor = readActor(await resolveActor(request, env));}
      catch (error) {if (error instanceof HttpError) throw error; fail(503, 'identity_unavailable');}
      // Event-scoped private report queue: never exposed on public or participant APIs.
      if (method === 'GET' && segments.length === 5 && segments[1] === 'organizer' &&
          segments[2] === 'events' && segments[4] === 'reports') {
        if (env.PORCHLIGHT_REPORTS_ENABLED !== 'true') fail(503, 'reports_not_configured');
        const slug=segments[3]; if (!validSlug(slug)) fail(404, 'not_found');
        const event=await eventBySlug(db,slug); if (!event) fail(404, 'not_found');
        await requireOrganizer(db,event.id,actor);
        const reports=await dbAll(db,
          "SELECT id, submission_id AS submissionId, reason, details, status, revision, created_at AS createdAt " +
          "FROM porchlight_reports WHERE event_id=? AND status='open' " +
          "ORDER BY created_at ASC LIMIT 100",event.id);
        return json(200,{event:slug,reports});
      }
      if (method === 'POST' && segments.length === 5 && segments[1] === 'organizer' &&
          segments[2] === 'reports' && segments[4] === 'resolve') {
        if (env.PORCHLIGHT_REPORTS_ENABLED !== 'true') fail(503, 'reports_not_configured');
        const id=segments[3]; if(!validId(id))fail(404,'not_found');
        const row=await dbFirst(db,'SELECT id,event_id,status,revision FROM porchlight_reports WHERE id=?',id);
        if(!row)fail(404,'not_found');
        await requireOrganizer(db,row.event_id,actor);
        const payload=await parseBody(request);
        checkKeys(payload,['expectedRevision','reason']);
        if(!Number.isSafeInteger(payload.expectedRevision)||payload.expectedRevision<1)fail(422,'revision_required');
        const reason=cleanText(payload.reason,250,12), mutation=createId();
        const results=await transaction(db,[
          ["UPDATE porchlight_reports SET status='resolved',revision=revision+1, " +
           "resolved_by=?,resolved_at=?,resolution_reason=?,mutation_id=? " +
           "WHERE id=? AND status='open' AND revision=? " +
           "AND EXISTS (SELECT 1 FROM porchlight_organizer_grants g " +
           "WHERE g.event_id=porchlight_reports.event_id AND g.principal_id=? AND g.revoked_at IS NULL)",
           [actor,at,reason,mutation,id,payload.expectedRevision,actor]],
          ["INSERT INTO porchlight_report_audit " +
           "(id,report_id,event_id,organizer_principal_id,action,created_at,reason,mutation_id) " +
           "SELECT ?,r.id,r.event_id,?,'resolve',?,?,? " +
           "FROM porchlight_reports r WHERE r.id=? AND r.mutation_id=? AND r.status='resolved'",
           [createId(),actor,at,reason,mutation,id,mutation]],
        ]);
        if(results[0]?.meta?.changes!==1 || results[1]?.meta?.changes!==1)fail(409,'stale_or_unavailable');
        return json(200,{id,status:'resolved',revision:payload.expectedRevision+1});
      }
      // Verified provider principal and server-granted event role; never accept self-selected roles.
      if (method === 'GET' && segments.length === 2 && segments[1] === 'session') {
        const eventSlug = new URL(request.url).searchParams.get('event');
        if (!validSlug(eventSlug)) fail(404, 'not_found');
        const event = await eventBySlug(db, eventSlug);
        if (!event) fail(404, 'not_found');
        const grant = await dbFirst(db, 'SELECT role FROM porchlight_organizer_grants WHERE event_id=? AND principal_id=? AND revoked_at IS NULL', event.id, actor);
        return json(200, {authenticated:true, event:eventSlug, role:grant?.role || null, canSubmit:eventMayAccept(event, at)});
      }
      if (method === 'POST' && segments.length === 4 && segments[1] === 'events' && segments[3] === 'submissions') {
        const slug = getParam(segments, 2); if (!validSlug(slug)) fail(404, 'not_found');
        const event = await eventBySlug(db, slug);
        if (!event || !eventMayAccept(event, at)) fail(404, 'event_unavailable');
        if (typeof authorizeWriteQuota !== 'function') fail(503, 'abuse_prevention_unavailable');
        const accepted = await authorizeWriteQuota({actor, eventId: event.id, operation: 'submission', request, env});
        if (accepted !== true) fail(429, 'try_later');
        const payload = validateSubmission(await parseBody(request));
        const block = await dbFirst(db, 'SELECT public_label FROM porchlight_event_blocks WHERE event_id=? AND code=?', event.id, payload.blockCode);
        if (!block) fail(422, 'block_not_available');
        const id = createId(), mutation = createId();
        try {
          await transaction(db, [
            [`INSERT INTO porchlight_host_submissions (id, event_id, host_principal_id, public_label, private_address, public_exact_address, public_block,
              display_mode, public_lat, public_lng, tags_json, consent_version, consented_at, adult_attested, property_authority_attested,
              status, revision, mutation_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'pending', 1, ?, ?, ?)`,
             [id, event.id, actor, payload.label, payload.privateAddress, payload.mode === 'exact' ? payload.privateAddress : null, block.public_label, payload.mode, payload.lat, payload.lng,
              payload.tags, VERSION, at, mutation, at, at]],
            auditInsert({id: createId(), eventId:event.id, actor, targetKind:'submission', targetId:id,
              action:'host_submit', from:null, to:'pending', reason:'Affirmative adult and property authority attestation', at, mutation}),
          ]);
        } catch (e) {if (/UNIQUE|constraint/i.test(String(e))) fail(409, 'active_submission_exists'); throw e;}
        return json(201, {submission: {id, status:'pending', revision:1}, notice: 'Not published. An authorized organizer must verify the property and approve.'});
      }
      if (method === 'GET' && segments.length === 3 && segments[1] === 'host' && segments[2] === 'submissions') {
        const rows = await dbAll(db, `SELECT id, event_id, status, revision, display_mode, created_at
          FROM porchlight_host_submissions WHERE host_principal_id = ? ORDER BY created_at DESC LIMIT 100`, actor);
        return json(200, {submissions:rows.map(submissionReceipt)});
      }
      if (method === 'POST' && segments.length === 5 && segments[1] === 'host' && segments[2] === 'submissions' && segments[4] === 'withdraw') {
        const id = segments[3]; if (!validId(id)) fail(404, 'not_found');
        const row = await dbFirst(db, `SELECT * FROM porchlight_host_submissions WHERE id = ? AND host_principal_id = ?`, id, actor);
        if (!row) fail(404, 'not_found');
        if (row.status === 'withdrawn') return json(200, {status:'withdrawn'});
        const mutation = createId();
        const [updated] = await transaction(db, [
          [`UPDATE porchlight_host_submissions SET status='withdrawn', revision=revision+1, mutation_id=?, updated_at=?,
            private_address='[deleted]', public_exact_address=NULL, public_lat=NULL, public_lng=NULL,
            public_label='Withdrawn household', public_block='Withheld', display_mode='block', tags_json='[]',
            review_reason=NULL, review_method=NULL
            WHERE id=? AND host_principal_id=? AND status != 'withdrawn'`, [mutation, at, id, actor]],
          ...(env.PORCHLIGHT_REPORTS_ENABLED === 'true' ?
            [['DELETE FROM porchlight_reports WHERE submission_id=?', [id]]] : []),
          auditInsert({id:createId(), eventId:row.event_id, actor, targetKind:'submission', targetId:id,
            action:'host_withdraw', from:row.status, to:'withdrawn', reason:'Host revoked participation consent', at, mutation}),
        ]);
        if (updated.meta?.changes !== 1) fail(409, 'already_modified');
        return json(200, {status:'withdrawn'});
      }
      if (method === 'GET' && segments.length === 5 && segments[1] === 'organizer' && segments[2] === 'events' && segments[4] === 'submissions') {
        const slug = segments[3]; if (!validSlug(slug)) fail(404, 'not_found');
        const event = await eventBySlug(db, slug); if (!event) fail(404, 'not_found');
        await requireOrganizer(db, event.id, actor);
        const rows = await dbAll(db, `SELECT * FROM porchlight_host_submissions WHERE event_id=? ORDER BY created_at DESC LIMIT 200`, event.id);
        return json(200, {event:slug, submissions:rows.map(reviewRecord)});
      }
      if (method === 'POST' && segments.length === 5 && segments[1] === 'organizer' && segments[2] === 'events' && segments[4] === 'pause') {
        const slug = segments[3]; if (!validSlug(slug)) fail(404, 'not_found');
        const event = await eventBySlug(db, slug); if (!event) fail(404, 'not_found');
        await requireOrganizer(db, event.id, actor, true);
        const payload = await parseBody(request); checkKeys(payload, ['reason']);
        const reason = cleanText(payload.reason, 250, 12);
        const mutation = createId();
        const [updated] = await transaction(db, [
          [`UPDATE porchlight_events SET status='paused', mutation_id=? WHERE id=? AND status='open'
            AND EXISTS (SELECT 1 FROM porchlight_organizer_grants g WHERE g.event_id=porchlight_events.id AND g.principal_id=? AND g.role='manager' AND g.revoked_at IS NULL)`, [mutation, event.id, actor]],
          [`INSERT INTO porchlight_audit (id, event_id, actor_principal_id, target_kind, target_id, action, from_status, to_status, reason, created_at, mutation_id)
            SELECT ?, ?, ?, 'event', ?, 'organizer_pause', 'open', 'paused', ?, ?, ? WHERE EXISTS
            (SELECT 1 FROM porchlight_events WHERE id = ? AND mutation_id = ? AND status = 'paused')`,
            [createId(), event.id, actor, event.id, reason, at, mutation, event.id, mutation]],
        ]);
        if (updated.meta?.changes !== 1) fail(409, 'event_not_open');
        return json(200, {status:'paused', message:'All public event pins are now unavailable.'});
      }
      if (method === 'POST' && segments.length === 5 && segments[1] === 'organizer' && segments[2] === 'submissions') {
        const id = segments[3], action = segments[4];
        if (!validId(id) || !['approve','reject','remove'].includes(action)) fail(404, 'not_found');
        const row = await dbFirst(db, 'SELECT * FROM porchlight_host_submissions WHERE id = ?', id);
        if (!row) fail(404, 'not_found');
        await requireOrganizer(db, row.event_id, actor);
        if (row.host_principal_id === actor && action === 'approve') fail(403, 'self_approval_denied');
        const event = await dbFirst(db, 'SELECT * FROM porchlight_events WHERE id=?', row.event_id);
        if (!event || at >= event.ends_at || (action === 'approve' && event.status !== 'open')) fail(409, 'event_unavailable');
        const payload = await parseBody(request);
        checkKeys(payload, action === 'approve' ? ['expectedRevision','reason','verifiedPropertyAuthority','verificationMethod'] : ['expectedRevision','reason']);
        if (!Number.isSafeInteger(payload.expectedRevision) || payload.expectedRevision < 1) fail(422, 'revision_required');
        const reason = cleanText(payload.reason, 250, 12);
        let method = null;
        if (action === 'approve') {
          if (payload.verifiedPropertyAuthority !== true || !['direct-confirmation','in-person'].includes(payload.verificationMethod)) fail(422, 'property_verification_required');
          method = payload.verificationMethod;
        }
        const from = action === 'remove' ? 'approved' : 'pending';
        const to = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'removed';
        const mutation = createId();
        const eventGuard = action === 'approve' ? " AND EXISTS (SELECT 1 FROM porchlight_events e WHERE e.id=porchlight_host_submissions.event_id AND e.status='open' AND e.ends_at>?)" : '';
        const [updated] = await transaction(db, [
          [`UPDATE porchlight_host_submissions SET status=?, revision=revision+1, reviewed_by=?, reviewed_at=?,
            review_method=?, review_reason=?, mutation_id=?, updated_at=?,
            private_address=CASE WHEN ? IN ('rejected','removed') THEN '[deleted]' ELSE private_address END,
            public_exact_address=CASE WHEN ? IN ('rejected','removed') THEN NULL ELSE public_exact_address END,
            public_lat=CASE WHEN ? IN ('rejected','removed') THEN NULL ELSE public_lat END,
            public_lng=CASE WHEN ? IN ('rejected','removed') THEN NULL ELSE public_lng END,
            display_mode=CASE WHEN ? IN ('rejected','removed') THEN 'block' ELSE display_mode END,
            public_label=CASE WHEN ? IN ('rejected','removed') THEN 'Rejected household' ELSE public_label END,
            public_block=CASE WHEN ? IN ('rejected','removed') THEN 'Withheld' ELSE public_block END,
            tags_json=CASE WHEN ? IN ('rejected','removed') THEN '[]' ELSE tags_json END
            WHERE id=? AND status=? AND revision=?
              AND EXISTS (SELECT 1 FROM porchlight_organizer_grants g WHERE g.event_id=porchlight_host_submissions.event_id AND g.principal_id=? AND g.revoked_at IS NULL)${eventGuard}`,
            [to, actor, at, method, reason, mutation, at, ...Array(8).fill(to), id, from, payload.expectedRevision, actor, ...(action === 'approve' ? [at] : [])]],
          ...(env.PORCHLIGHT_REPORTS_ENABLED === 'true' && action !== 'approve' ?
            [['DELETE FROM porchlight_reports WHERE submission_id=?', [id]]] : []),
          auditInsert({id:createId(), eventId:row.event_id, actor, targetKind:'submission', targetId:id,
            action:`organizer_${action}`, from, to, reason, at, mutation}),
        ]);
        if (updated.meta?.changes !== 1) fail(409, 'stale_or_unavailable');
        return json(200, {id, status:to, revision:payload.expectedRevision + 1});
      }
      return json(404, {error:'not_found'});
    } catch(error) {
      if (error instanceof HttpError) return json(error.status, {error:error.code});
      // Do not reveal SQL, identities or any sensitive operational state.
      return json(503, {error:'service_unavailable'});
    }
  };
}

// Intentionally disabled entrypoint: no production identity verifier, storage binding, or service activation.
export default {async fetch() {return json(503, {error:'not_configured'});}};
