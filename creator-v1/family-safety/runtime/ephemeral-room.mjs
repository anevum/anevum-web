/**
 * Short-lived, in-memory presence room. One instance per private circle.
 * No durable GPS position storage, snapshots, history, analytics, alarms, or
 * account discovery. Eviction/restart intentionally makes positions unavailable.
 *
 * Production deployment will host this inside ONE Durable Object per circle.
 * Server-only callers must bind writes/reads to policy session IDs.
 */
import { POSITION_TTL_MS } from "../presence-policy.mjs";

const ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/;
const MIN_WRITE_INTERVAL_MS = 5_000;
const MAX_PEOPLE = 128;
const MAX_BAN_MS = 60 * 60 * 1_000;
const MAX_REVOCATION_FENCES = 2048;
const valid = value => typeof value === "string" && ID.test(value);
const finiteNow = value => Number.isSafeInteger(value) && value > 0;

export class EphemeralPresenceRoom {
  #points = new Map();
  #revokedSessions = new Map();
  #writeTimes = new Map();
  #failClosed = false;

  prune(now) {
    if (!finiteNow(now)) return;
    for (const [subject, value] of this.#points) {
      if (value.receivedAt > now || value.receivedAt + POSITION_TTL_MS <= now ||
          value.position.observedAt + POSITION_TTL_MS <= now) {
        this.#points.delete(subject);
      }
    }
    for (const [session, until] of this.#revokedSessions)
      if (until <= now) this.#revokedSessions.delete(session);
    for (const [subject, record] of this.#writeTimes)
      if (record.at + MIN_WRITE_INTERVAL_MS <= now) this.#writeTimes.delete(subject);
  }

  read(subjectId, now, sessionId) {
    if (!valid(subjectId) || !valid(sessionId) || !finiteNow(now)) return null;
    this.prune(now);
    const record=this.#points.get(subjectId);
    if (!record || record.sessionId !== sessionId ||
        this.#revokedSessions.has(sessionId)) return null;
    return { ...record.position };
  }

  write(subjectId, position, now, sessionId) {
    if (!valid(subjectId) || !valid(sessionId) || !finiteNow(now) ||
        !position || typeof position!=="object" || Array.isArray(position) ||
        !Number.isFinite(position.lat) || position.lat < -90 || position.lat > 90 ||
        !Number.isFinite(position.lng) || position.lng < -180 || position.lng > 180 ||
        !Number.isFinite(position.accuracyM) || position.accuracyM < 0 ||
        position.accuracyM > 2_000 ||
        !Number.isSafeInteger(position.observedAt) ||
        position.observedAt > now + 5_000 || now - position.observedAt >= POSITION_TTL_MS)
      return "invalid";
    this.prune(now);
    if (this.#failClosed || this.#revokedSessions.has(sessionId)) return "revoked";
    const recent=this.#writeTimes.get(subjectId);
    if (recent && recent.sessionId===sessionId &&
        now - recent.at < MIN_WRITE_INTERVAL_MS) return "throttled";
    const prior=this.#points.get(subjectId);
    if (prior?.sessionId===sessionId &&
        position.observedAt <= prior.position.observedAt) return "invalid";
    if (!this.#points.has(subjectId) && this.#points.size>=MAX_PEOPLE)
      return "capacity";
    this.#points.set(subjectId, {
      sessionId, position: {
        lat: position.lat, lng: position.lng,
        accuracyM: position.accuracyM, observedAt:position.observedAt
      }, receivedAt: now
    });
    this.#writeTimes.set(subjectId,{at:now,sessionId});
    return "ok";
  }

  /**
   * Session-specific ban prevents a delayed in-flight write from restoring a
   * revoked location. It lasts at least as long as a max 1-hour share session.
   * Does not persist across DO restart; every server write must reauthorize.
   */
  purge(subjectId, sessionId, now) {
    if (!valid(subjectId) || !valid(sessionId) || !finiteNow(now)) return false;
    this.prune(now);
    const record=this.#points.get(subjectId);
    if (record?.sessionId===sessionId) this.#points.delete(subjectId);
    if (!this.#revokedSessions.has(sessionId) &&
        this.#revokedSessions.size >= MAX_REVOCATION_FENCES) {
      // Bounded memory under malicious repeated session churn. The room
      // refuses all subsequent writes rather than dropping revocation fences.
      this.#failClosed = true;
      return false;
    }
    this.#revokedSessions.set(sessionId,now+MAX_BAN_MS);
    const last=this.#writeTimes.get(subjectId);
    if(last?.sessionId===sessionId)this.#writeTimes.delete(subjectId);
    return true;
  }

  // For isolated unit testing only; never return internal maps through APIs.
  get size() { return this.#points.size; }
}
export { MIN_WRITE_INTERVAL_MS };
