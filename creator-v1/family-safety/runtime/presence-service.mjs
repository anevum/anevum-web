/**
 * ANEVUM Family Field — R2 isolated HTTP presence service (candidate only).
 *
 * Construct with trusted identity, private circle SQL adapter and short-lived
 * per-circle presence store. This does NOT mount an anevum.com route or deploy.
 *
 * IMPORTANT:
 *  - authenticate MUST derive a verified actor from the server runtime (never
 *    request headers, JSON, query parameters, or a client-supplied actorId).
 *  - loadPolicy MUST read independently verified adult membership and active
 *    session/grant from PRIVATE authoritative storage on EVERY protected call.
 *  - presence memory MUST be scoped to the circle and contain NO history.
 *  - no public location, minors, CORS, WebSockets, native background tracking.
 */
import { admitLocationWrite, mayReadPresence, visiblePresence, POSITION_TTL_MS } from "../presence-policy.mjs";

const ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/;
const noPosition = () => ({ state: "unavailable", position: null, updatedAt: null, accuracyM: null });
const HEADERS = Object.freeze({
  "Cache-Control": "no-store, no-cache, max-age=0, private",
  "Pragma": "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Vary": "Cookie",
});
const body = (value, status=200) => new Response(JSON.stringify(value), {
  status, headers: { ...HEADERS, "Content-Type": "application/json; charset=utf-8" }
});
const noContent = () => new Response(null, { status: 204, headers: HEADERS });

async function readSmallJson(request, maxBytes=1024) {
  if (request.headers.has("Content-Length")) {
    const len = Number(request.headers.get("Content-Length"));
    if (!Number.isInteger(len) || len < 0 || len > maxBytes) return null;
  }
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value?.byteLength || 0;
      if (size > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes=new Uint8Array(size);
    let offset=0;
    for(const chunk of chunks){ bytes.set(chunk,offset);offset+=chunk.byteLength; }
    const decoded=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
    const parsed=JSON.parse(decoded);
    return parsed && typeof parsed==="object" && !Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
  finally {try {reader.releaseLock();} catch {}}
}

function validId(id){return typeof id==="string" && ID.test(id);}
function mutationAllowed(request, origin, requireJson=false) {
  // One explicit origin. No wildcard CORS and no cookies-only POST.
  if(request.headers.get("Origin")!==origin) return false;
  if(request.headers.get("X-Family-Safety-Action")!=="1") return false;
  if(requireJson) {
    const contentType = request.headers.get("Content-Type")||"";
    if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(contentType)) return false;
  }
  return true;
}

function pathname(path) {
  const root=path.match(/^\/v1\/circles\/([A-Za-z0-9][A-Za-z0-9:_-]{0,127})\/(.*)$/);
  if(!root) return null;
  const [,circleId,rest]=root;
  if(rest==="presence/me")return {type:"self",circleId};
  const person=rest.match(/^presence\/([A-Za-z0-9][A-Za-z0-9:_-]{0,127})$/);
  if(person)return {type:"read",circleId,subjectId:person[1]};
  const stop=rest.match(/^shares\/([A-Za-z0-9][A-Za-z0-9:_-]{0,127})$/);
  if(stop)return {type:"stop",circleId,sessionId:stop[1]};
  return null;
}

/**
 * HTTP only; no SSE/WS yet, so every observation re-fetches database policy.
 * An authorized but absent location and a denied read have identical responses.
 */
export function createPresenceService({
  expectedOrigin, authenticate, loadPolicy, presenceForCircle, revokeShare,
  now=()=>Date.now()
}={}) {
  if(typeof expectedOrigin!=="string" ||
     !/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(expectedOrigin) ||
     typeof authenticate!=="function" || typeof loadPolicy!=="function" ||
     typeof presenceForCircle!=="function" || typeof revokeShare!=="function" ||
     typeof now!=="function") throw new Error("Incomplete isolated family-presence configuration");

  return async function fetch(request) {
    try {
      const url=new URL(request.url);
      if(url.origin!==expectedOrigin || url.search || url.hash) return body({error:"not_found"},404);
      const route=pathname(url.pathname);
      if(!route || !["GET","PUT","DELETE"].includes(request.method)) return body({error:"not_found"},404);
      // The identity provider function is only built using a verified server
      // context. An omitted or malformed identity always fails closed.
      const actorId=await authenticate(request);
      if(!validId(actorId))return body({error:"not_authenticated"},401);
      const at=now();
      if(!Number.isSafeInteger(at) || at<=0)return body({error:"temporarily_unavailable"},503);

      if(request.method==="GET" && route.type==="read") {
        const ctx=await loadPolicy({circleId:route.circleId,actorId,subjectId:route.subjectId,now:at});
        if(!mayReadPresence(ctx))return body(noPosition());
        const room=presenceForCircle(route.circleId);
        const location=await room.read(route.subjectId,at);
        // Read authority again immediately before delivering, since revocation
        // may have happened during the room request. No caching of authorizations.
        const fresh=await loadPolicy({circleId:route.circleId,actorId,subjectId:route.subjectId,now:now()});
        return body(visiblePresence({...fresh,location,now:now()}));
      }

      if(request.method==="PUT" && route.type==="self") {
        if(!mutationAllowed(request,expectedOrigin,true))return body({error:"forbidden"},403);
        const input=await readSmallJson(request);
        if(!input || Object.keys(input).sort().join(",")!=="accuracyM,lat,lng,observedAt")
          return body({error:"invalid_position"},422);
        const subjectId=actorId; // never accept subject/actor ID in the body
        const ctx=await loadPolicy({circleId:route.circleId,actorId,subjectId,now:at});
        const location=admitLocationWrite({...ctx,location:input});
        if(!location)return body({error:"forbidden"},403);
        // Recheck at the point of write; if subject revoked in the meantime,
        // reject rather than publishing an old, once-valid authorization.
        const checked=await loadPolicy({circleId:route.circleId,actorId,subjectId,now:now()});
        if(!admitLocationWrite({...checked,location:input,now:now()}))
          return body({error:"forbidden"},403);
        const room=presenceForCircle(route.circleId);
        const status=await room.write(subjectId,location,now());
        if(status==="throttled")return body({error:"slow_down"},429);
        if(status!=="ok")return body({error:"temporarily_unavailable"},503);
        // A concurrent stop must purge a write that slipped in. This second
        // verification is not an atomic revocation fence; room orchestration
        // will be needed before accepting real tracking.
        const after=await loadPolicy({circleId:route.circleId,actorId,subjectId,now:now()});
        if(!admitLocationWrite({...after,location:input,now:now()})) {
          await room.purge(subjectId);
          return body({error:"forbidden"},403);
        }
        return noContent();
      }

      if(request.method==="DELETE" && route.type==="stop") {
        if(!mutationAllowed(request,expectedOrigin))return body({error:"forbidden"},403);
        const revoked=await revokeShare({
          circleId:route.circleId,actorId,sessionId:route.sessionId,now:at
        });
        if(revoked!==true)return body({error:"not_found"},404);
        // A successful stop only returns after the room has been purged.
        // If room errors, DB consent is already revoked; subsequent reads deny.
        await presenceForCircle(route.circleId).purge(actorId);
        return noContent();
      }

      return body({error:"not_found"},404);
    }catch {
      // Do not serialize exceptions, raw GPS inputs, IDs, or DB error details.
      return body({error:"temporarily_unavailable"},503);
    }
  };
}

export { noPosition, mutationAllowed, readSmallJson };
