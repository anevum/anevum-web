/*
 * ANEVUM Family Field: server-side policy kernel (not an API endpoint).
 * Only pass actorId from a VERIFIED server session, NEVER from client JSON.
 *
 * This module intentionally does not perform network requests, persist positions,
 * create accounts, log coordinates, or turn on production tracking.
 *
 * Remote presence remains ADULT-ONLY until child identity / guardian enrollment,
 * domestic abuse safety review, and COPPA requirements are independently accepted.
 */

export const LIVE_MAX_AGE_MS = 30_000;
export const POSITION_TTL_MS = 120_000;
export const MAX_CLOCK_SKEW_MS = 5_000;
export const MAX_SESSION_MS = 60 * 60 * 1_000;

const validId = value =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 128 &&
  /^[A-Za-z0-9][A-Za-z0-9:_-]*$/.test(value);
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const validTime = value => Number.isSafeInteger(value) && value >= 0;
const validNow = now => validTime(now) && now > 0;
const deny = () => ({ state: "unavailable", position: null, updatedAt: null, accuracyM: null });

function hasActiveMember(memberships, circleId, id) {
  if (!Array.isArray(memberships) || !validId(circleId) || !validId(id)) return false;
  return memberships.some(member =>
    isRecord(member) &&
    member.circleId === circleId &&
    member.subjectId === id &&
    member.state === "active" &&
    member.identityVerified === true &&
    (member.ageBand === "adult") &&
    (member.role === "adult" || member.role === "guardian")
  );
}

/**
 * Validates a deliberately short-lived, opt-in sharing session.
 * A member read grant alone must never override a stopped/revoked session.
 */
export function isActiveShareSession({ circleId, subjectId, session, now } = {}) {
  if (!validNow(now) || !validId(circleId) || !validId(subjectId) || !isRecord(session)) return false;
  if (!validId(session.id) || session.circleId !== circleId || session.subjectId !== subjectId) return false;
  if (session.state !== "active" || session.consent !== "explicit" || session.revokedAt != null) return false;
  if (!validTime(session.startedAt) || !validTime(session.expiresAt)) return false;
  if (session.startedAt > now || now >= session.expiresAt) return false;
  const duration = session.expiresAt - session.startedAt;
  return duration >= 60_000 && duration <= MAX_SESSION_MS;
}

function hasExplicitGrant({ circleId, subjectId, actorId, session, grant, now }) {
  if (!isRecord(grant) || !isActiveShareSession({ circleId, subjectId, session, now })) return false;
  if (grant.circleId !== circleId || grant.subjectId !== subjectId ||
      grant.viewerId !== actorId || grant.sessionId !== session.id) return false;
  if (grant.scope !== "presence:read" || grant.state !== "active" ||
      grant.consent !== "explicit" || grant.revokedAt != null) return false;
  if (!validTime(grant.issuedAt) || !validTime(grant.expiresAt) || grant.issuedAt > now ||
      grant.issuedAt < session.startedAt || grant.expiresAt > session.expiresAt ||
      now >= grant.expiresAt) return false;
  return grant.expiresAt > grant.issuedAt;
}

/**
 * Fail-closed, per-(actor, subject) location read permission.
 * Must be run in the Worker on every request and realtime subscription/event.
 *
 * Even trusted circle administrators CANNOT read another person's presence
 * without that person's explicit current session and viewer-specific grant.
 */
export function mayReadPresence({ actorId, subjectId, circleId, circle, memberships, session, grant, now } = {}) {
  if (!validNow(now) || !validId(actorId) || !validId(subjectId) || !validId(circleId)) return false;
  if (!isRecord(circle) || circle.id !== circleId || circle.state !== "active") return false;
  if (!hasActiveMember(memberships, circleId, actorId) ||
      !hasActiveMember(memberships, circleId, subjectId)) return false;
  if (actorId === subjectId) return true; // own last-known position, if available
  return hasExplicitGrant({ circleId, subjectId, actorId, session, grant, now });
}

/**
 * Ingestion permission: a member can write ONLY their own location,
 * with an explicitly initiated, unexpired sharing session.
 * Consent from a parent/guardian is not assumed by role.
 */
export function mayWritePresence({ actorId, subjectId, circleId, circle, memberships, session, now } = {}) {
  if (!validId(actorId) || actorId !== subjectId || !validNow(now)) return false;
  if (!isRecord(circle) || circle.id !== circleId || circle.state !== "active") return false;
  if (!hasActiveMember(memberships, circleId, actorId)) return false;
  return isActiveShareSession({ circleId, subjectId, session, now });
}

/**
 * The only intended presentation transform for a server-side read.
 * Denied readers get exactly the same response shape as absent data
 * (no presence / account enumeration through error details).
 */
export function visiblePresence(context = {}) {
  const { location, now } = context;
  if (!mayReadPresence(context) || !isRecord(location) || !validNow(now)) return deny();
  const { lat, lng, observedAt, accuracyM } = location;
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lng) || lng < -180 || lng > 180 ||
      !Number.isFinite(accuracyM) || accuracyM < 0 || accuracyM > 2_000 ||
      !validTime(observedAt) || observedAt > now + MAX_CLOCK_SKEW_MS ||
      now - observedAt >= POSITION_TTL_MS) return deny();

  const age = Math.max(0, now - observedAt);
  return {
    state: age <= LIVE_MAX_AGE_MS ? "recent" : "stale",
    position: { lat, lng },
    updatedAt: observedAt,
    accuracyM
  };
}

/**
 * A user's exact position is NEVER eligible for the public neighborhood layer,
 * even when a family sharing grant exists. Public places are distinct entities.
 */
export function mayPublishCommunityLocation({ subjectType, verifiedPlace, moderationStatus, ownerOptedIn } = {}) {
  return subjectType === "community_place" &&
    verifiedPlace === true &&
    moderationStatus === "approved" &&
    ownerOptedIn === true;
}

/**
 * Factory for an adult-only preview grant.
 * Real service must generate unpredictable IDs server-side and persist
 * revocations atomically; this only assembles a validated grant.
 */
export function buildViewerGrant({ actorId, viewerId, circleId, circle, memberships, session,
  now, grantId, expiresAt, explicitConsent } = {}) {
  if (explicitConsent !== true || !validId(grantId) ||
      !validId(actorId) || !validId(viewerId) || actorId === viewerId ||
      !validNow(now) || !validTime(expiresAt) || expiresAt <= now ||
      !isRecord(circle) || circle.id !== circleId || circle.state !== "active" ||
      !hasActiveMember(memberships, circleId, actorId) ||
      !hasActiveMember(memberships, circleId, viewerId) ||
      !isActiveShareSession({ circleId, subjectId: actorId, session, now }) ||
      expiresAt > session.expiresAt) return null;
  return {
    id: grantId,
    circleId,
    subjectId: actorId,
    viewerId,
    sessionId: session.id,
    scope: "presence:read",
    state: "active",
    consent: "explicit",
    issuedAt: now,
    expiresAt,
    revokedAt: null
  };
}
