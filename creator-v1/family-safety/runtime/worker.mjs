/*
 * ANEVUM Family Safety R2 — UNDEPLOYED isolated Workers candidate.
 *
 * Requires an explicit external launch approval, separately bound private D1,
 * independent Cloudflare Access app, and a new Durable Object namespace.
 * Never mount at /api/v1 on the public creator Worker.
 */
import { createPresenceService } from "./presence-service.mjs";
import { resolveTrustedAdult, loadPrivatePolicy, revokePrivateShare } from "./private-authority.mjs";
export { FamilyPresenceRoom } from "./durable-room.mjs";

function configured(env,ctx) {
  // Fail closed until an approved staging environment explicitly enables it.
  return env?.FS_ENABLE_REAL_GPS==="true" &&
    typeof env.FS_ORIGIN==="string" &&
    typeof env.FS_ACCESS_AUD==="string" &&
    env.FS_ACCESS_AUD.length>0 &&
    typeof env.FS_IDENTITY_HMAC_KEY==="string" &&
    env.FS_IDENTITY_HMAC_KEY.length>=32 &&
    !!env.FS_PRIVATE_DB?.prepare &&
    !!env.FS_PRESENCE?.getByName &&
    !!ctx?.access &&
    ctx.access.aud===env.FS_ACCESS_AUD;
}

export default {
  async fetch(request,env,ctx) {
    if(!configured(env,ctx))return new Response(JSON.stringify({error:"service_unavailable"}),{
      status:503,headers:{
        "Cache-Control":"no-store, private",
        "Content-Type":"application/json",
        "X-Content-Type-Options":"nosniff"
      }
    });

    // This privileged lookup is performed against the separate private adult
    // registry after the Access application has verified the incoming request.
    let actor;
    try{
      actor=await resolveTrustedAdult({
        access:ctx.access,audience:env.FS_ACCESS_AUD,
        db:env.FS_PRIVATE_DB,secret:env.FS_IDENTITY_HMAC_KEY
      });
    }catch{return new Response(null,{status:503,headers:{"Cache-Control":"no-store"}});}
    if(!actor)return new Response(null,{status:401,headers:{"Cache-Control":"no-store"}});

    const service=createPresenceService({
      expectedOrigin:env.FS_ORIGIN,
      authenticate:async()=>actor,
      loadPolicy:parameters=>loadPrivatePolicy(env.FS_PRIVATE_DB,parameters),
      presenceForCircle:circleId=>env.FS_PRESENCE.getByName("family-circle:"+circleId),
      revokeShare:parameters=>revokePrivateShare(env.FS_PRIVATE_DB,parameters)
    });
    return service(request);
  }
};
