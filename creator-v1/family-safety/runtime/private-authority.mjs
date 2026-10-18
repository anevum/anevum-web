/*
 * ANEVUM Family Field — private authority adapter.
 *
 * Consumes ONLY an independently verified Cloudflare Access runtime identity
 * plus a separately pre-enrolled ADULT in a dedicated private family D1.
 * Never accepts actorId, verifiedAdult, memberships or grants from a request.
 */
const ID=/^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/;
const validId=x=>typeof x==="string"&&ID.test(x);

const decodeMember=r=>r ? ({
  circleId:r.circle_id,subjectId:r.subject_id,role:r.role,
  ageBand:r.age_band,identityVerified:r.identity_verified===1,
  state:r.state
}) : null;

function decodeSession(r) {
  if(!r)return null;
  return {
    id:r.session_id,circleId:r.circle_id,subjectId:r.subject_id,
    consent:r.consent,state:r.state,
    startedAt:r.started_at_ms,expiresAt:r.expires_at_ms,revokedAt:r.revoked_at_ms
  };
}
function decodeGrant(r) {
  if(!r)return null;
  return {
    id:r.grant_id,circleId:r.circle_id,subjectId:r.subject_id,
    viewerId:r.viewer_id,sessionId:r.session_id,consent:r.consent,
    scope:r.scope,state:r.state,
    issuedAt:r.issued_at_ms,expiresAt:r.expires_at_ms,revokedAt:r.revoked_at_ms
  };
}

/**
 * Using a keyed HMAC prevents a stolen private DB from containing plaintext
 * identity emails or easily-computable unsalted SHA256 hashes. The raw secret
 * is a per-environment secret and must NEVER be committed to the repository.
 */
export async function identityHmac(email,secret) {
  if(typeof email!=="string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
     email.length>320 || typeof secret!=="string" || secret.length<32) return null;
  const normalized=email.trim().toLowerCase();
  const key=await crypto.subtle.importKey(
    "raw",new TextEncoder().encode(secret),
    {name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const digest=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,"0")).join("");
}

/**
 * Access verifies the JWT before populating ctx.access. Strictly verify the
 * Access application audience to prevent another Access app being reused.
 * Access login proves email control, NOT adulthood: private row also needs
 * out-of-band age verification and active status.
 */
export async function resolveTrustedAdult({access,audience,db,secret}={}) {
  if(!access || typeof access.getIdentity!=="function" ||
     typeof audience!=="string" || !audience.trim() ||
     access.aud!==audience || !db?.prepare) return null;
  let identity;
  try{identity=await access.getIdentity();}
  catch{return null;}
  if(!identity || typeof identity.email!=="string")return null;
  const digest=await identityHmac(identity.email,secret);
  if(!digest)return null;
  const row=await db.prepare(
    "SELECT subject_id FROM fs_verified_adults "+
    "WHERE identity_hmac=? AND age_verified=1 AND state='active' LIMIT 1"
  ).bind(digest).first();
  return validId(row?.subject_id)?row.subject_id:null;
}

/**
 * Each call independently loads source-of-truth D1 state with no policy cache.
 * Membership verification checks BOTH the membership and the adult registry.
 */
export async function loadPrivatePolicy(db,{circleId,actorId,subjectId,now}={}) {
  if(!db?.prepare || !validId(circleId)||!validId(actorId)||!validId(subjectId)||
     !Number.isSafeInteger(now)||now<=0) return null;

  const circleRow=await db.prepare(
    "SELECT circle_id,state FROM fs_private_circles WHERE circle_id=? LIMIT 1"
  ).bind(circleId).first();

  const membershipRows=await db.prepare(
    "SELECT m.circle_id,m.subject_id,m.role,m.age_band,m.state,"+
    " CASE WHEN m.identity_verified=1 AND v.age_verified=1 AND v.state='active' "+
    " THEN 1 ELSE 0 END AS identity_verified "+
    "FROM fs_memberships m LEFT JOIN fs_verified_adults v "+
    " ON v.subject_id=m.subject_id "+
    "WHERE m.circle_id=? AND (m.subject_id=? OR m.subject_id=?)"
  ).bind(circleId,actorId,subjectId).all();

  const sessionRow=await db.prepare(
    "SELECT session_id,circle_id,subject_id,consent,state,started_at_ms,expires_at_ms,revoked_at_ms "+
    "FROM fs_share_sessions WHERE circle_id=? AND subject_id=? AND state='active' "+
    "AND started_at_ms<=? AND expires_at_ms>? AND revoked_at_ms IS NULL "+
    "ORDER BY started_at_ms DESC LIMIT 1"
  ).bind(circleId,subjectId,now,now).first();

  const session=decodeSession(sessionRow);
  const grantRow=session && actorId!==subjectId ? await db.prepare(
    "SELECT grant_id,circle_id,subject_id,viewer_id,session_id,consent,scope,state,"+
    "issued_at_ms,expires_at_ms,revoked_at_ms "+
    "FROM fs_viewer_grants WHERE circle_id=? AND subject_id=? AND viewer_id=? "+
    "AND session_id=? AND state='active' AND revoked_at_ms IS NULL "+
    "AND issued_at_ms<=? AND expires_at_ms>? ORDER BY issued_at_ms DESC LIMIT 1"
  ).bind(circleId,subjectId,actorId,session.id,now,now).first() : null;

  return {
    circleId,actorId,subjectId,now,
    circle:circleRow?{id:circleRow.circle_id,state:circleRow.state}:null,
    memberships:(membershipRows?.results||[]).map(decodeMember).filter(Boolean),
    session,grant:decodeGrant(grantRow)
  };
}

/**
 * A stop is owned by the current verified actor, never by an administrator.
 * First revoke session in D1; policy immediately denies reads/writes.
 * Viewer grants are then marked revoked and the ephemeral room is purged.
 * Reconcile/purge on failure before enabling real tracking.
 */
export async function revokePrivateShare(db,{circleId,actorId,sessionId,now}={}) {
  if(!db?.prepare || !validId(circleId)||!validId(actorId)||!validId(sessionId)||
     !Number.isSafeInteger(now)||now<=0)return false;

  const registry=await db.prepare(
    "SELECT v.subject_id FROM fs_verified_adults v "+
    "JOIN fs_memberships m ON m.subject_id=v.subject_id "+
    "WHERE m.circle_id=? AND m.subject_id=? AND m.state='active' "+
    "AND m.age_band='adult' AND m.identity_verified=1 "+
    "AND v.age_verified=1 AND v.state='active' LIMIT 1"
  ).bind(circleId,actorId).first();
  if(!registry)return false;

  // This update is the permission revocation fence. A second request with
  // the same ID or an unowned session will not change any rows.
  const result=await db.prepare(
    "UPDATE fs_share_sessions SET state='revoked',revoked_at_ms=? "+
    "WHERE circle_id=? AND session_id=? AND subject_id=? "+
    "AND state='active' AND revoked_at_ms IS NULL"
  ).bind(now,circleId,sessionId,actorId).run();
  if(result?.meta?.changes!==1)return false;

  await db.prepare(
    "UPDATE fs_viewer_grants SET state='revoked',revoked_at_ms=? "+
    "WHERE circle_id=? AND session_id=? AND subject_id=? "+
    "AND state='active'"
  ).bind(now,circleId,sessionId,actorId).run();
  return true;
}
