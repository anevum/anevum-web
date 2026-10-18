/*
 * ANEVUM private family-circle coordination object.
 * Cloudflare Durable Objects RPC; one object instance per private circle.
 *
 * No ctx.storage usage, no SQLite/GPS persistence, no alarms, no websocket.
 * Object restarts intentionally drop every location as "unavailable".
 * Production must use an isolated namespace and test revocation races.
 */
import { DurableObject } from "cloudflare:workers";
import { EphemeralPresenceRoom } from "./ephemeral-room.mjs";

export class FamilyPresenceRoom extends DurableObject {
  constructor(state, env) {
    super(state, env);
    this.memory = new EphemeralPresenceRoom();
  }
  read(subjectId, now, sessionId) {
    return this.memory.read(subjectId, now, sessionId);
  }
  write(subjectId, position, now, sessionId) {
    return this.memory.write(subjectId, position, now, sessionId);
  }
  purge(subjectId, sessionId, now) {
    return this.memory.purge(subjectId, sessionId, now);
  }
}
