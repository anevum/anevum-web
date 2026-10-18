/**
 * Canonical ANEVUM platform on its permanent apex origin.
 *
 * The prelaunch gateway MUST authorize first; this composition contains no
 * preview bypass. Both origin and Worker-only activation flag are required.
 *
 * Keep the existing a.anevum.com Worker and its D1/sessions untouched.
 */
import {createPublicStageWorker} from "../web/a-staging-worker.mjs";
import canonicalIdentity from "../canonical-auth/worker.mjs";

const ORIGIN="https://anevum.com";
const publicStage=createPublicStageWorker({hostname:"anevum.com"});
const MEMBER=/^\/api\/v1\/member\//;
const PUBLIC_METRICS="/api/v1/public/supporter/metrics";
const PUBLIC_RECOGNITION_CATALOG="/api/v1/public/recognition/catalog";
const PUBLIC_IDENTITY=/^\/api\/v1\/members\/[a-z][a-z0-9_]{2,29}(?:\/(?:space|wall|media\/(?:avatar|banner)))?$/;
const COMMUNITY=/^\/api\/v1\/community\/(?:members|activity|threads(?:\/[a-f0-9-]{36}(?:\/(?:replies|reaction))?)?|reports)$/;

export async function apexPlatformFetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.origin!==ORIGIN||url.protocol!=="https:"||
    env?.ANEVUM_CANONICAL_APEX_ENABLED!=="true")
    return new Response("Not found",{status:404,headers:{"cache-control":"no-store"}});
  if(url.pathname===PUBLIC_METRICS||url.pathname===PUBLIC_RECOGNITION_CATALOG||MEMBER.test(url.pathname)||
    PUBLIC_IDENTITY.test(url.pathname)||COMMUNITY.test(url.pathname))
    return canonicalIdentity.fetch(request,env,ctx);
  return publicStage.fetch(request,env,ctx);
}
