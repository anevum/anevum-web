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
import { admitLocationWrite, mayReadPresence, visiblePresence } from "../presence-policy.mjs";

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

function matchesPolicy(ctx, actorId, subjectId, circleId, at) {
  return ctx && typeof ctx==="object" && !Array.isArray(ctx) &&
    ctx.actorId===actorId && ctx.subjectId===subjectId &&
    ctx.circleId===circleId && ctx.now===at;
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
        const ids={circleId:route.circleId,actorId,subjectId:route.subjectId};
        const ctx=await loadPolicy({...ids,now:at});
        if(!matchesPolicy(ctx,actorId,route.subjectId,route.circleId,at) ||
            !mayReadPresence(ctx))return body(noPosition());
        const room=presenceForCircle(route.circleId);
        const location=await room.read(route.subjectId,at,ctx.session?.id);
        // Repeat authoritative policy lookup after any async room read.
        const checkAt=now();
        const fresh=await loadPolicy({...ids,now:checkAt});
        if(!matchesPolicy(fresh,actorId,route.subjectId,route.circleId,checkAt) ||
            fresh.session?.id!==ctx.session?.id)
          return body(noPosition());
        return body(visiblePresence({...fresh,location,now:checkAt}));
      }

      if(request.method==="PUT" && route.type==="self") {
        if(!mutationAllowed(request,expectedOrigin,true))return body({error:"forbidden"},403);
        const input=await readSmallJson(request);
        if(!input || Object.keys(input).sort().join(",")!=="accuracyM,lat,lng,observedAt")
          return body({error:"invalid_position"},422);
        const subjectId=actorId; // never accept subject/actor ID in the body
        const ids={circleId:route.circleId,actorId,subjectId};
        const ctx=await loadPolicy({...ids,now:at});
        const location=matchesPolicy(ctx,actorId,subjectId,route.circleId,at)?
          admitLocationWrite({...ctx,location:input}):null;
        if(!location)return body({error:"forbidden"},403);
        const checkedAt=now();
        const checked=await loadPolicy({...ids,now:checkedAt});
        if(!matchesPolicy(checked,actorId,subjectId,route.circleId,checkedAt) ||
            checked.session?.id!==ctx.session?.id ||
            !admitLocationWrite({...checked,location:input,now:checkedAt}))
          return body({error:"forbidden"},403);
        const room=presenceForCircle(route.circleId);
        const status=await room.write(subjectId,location,now(),checked.session.id);
        if(status==="throttled")return body({error:"slow_down"},429);
        if(status==="revoked")return body({error:"forbidden"},403);
        if(status!=="ok")return body({error:"temporarily_unavailable"},503);
        // A concurrent stop must purge an in-flight position. The room also
        // bans the revoked session id to prevent late writes reintroducing it.
        // Full linearizable revocation still requires final staging concurrency QA.
        const afterAt=now();
        const after=await loadPolicy({...ids,now:afterAt});
        if(!matchesPolicy(after,actorId,subjectId,route.circleId,afterAt) ||
            after.session?.id!==checked.session.id ||
            !admitLocationWrite({...after,location:input,now:afterAt})) {
          await room.purge(subjectId,checked.session.id,now());
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
        const purged=await presenceForCircle(route.circleId).purge(actorId,route.sessionId,now());
        if(purged!==true)return body({error:"temporarily_unavailable"},503);
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
