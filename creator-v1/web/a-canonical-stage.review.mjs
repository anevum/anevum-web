// Same-origin canonical member composition over the retained public V006/V007 reader.
// The review config remains unrouted; the signup staging config targets only the existing a Worker.
// Canonical email sessions never enter the public Worker or legacy V5/Creator service.
import publicStage from "./a-staging-worker.mjs";
import canonicalIdentity from "../canonical-auth/worker.mjs";
import {reconcileSupporterSubscriptions,reconcileSupporterCheckouts} from "../canonical-auth/supporter.mjs";
import {cleanupCanonicalStudioAssets} from "../canonical-auth/studio-assets.mjs";
import {cleanupCanonicalStudioLargeAssets} from "../canonical-auth/studio-large-assets.mjs";

const ORIGIN="https://a.anevum.com";
const CANONICAL_PATH=/^\/api\/v1\/member\//;
const PUBLIC_METRICS="/api/v1/public/supporter/metrics";
const PUBLIC_IDENTITY=/^\/api\/v1\/members\/[a-z][a-z0-9_]{2,29}(?:\/(?:space|wall|media\/(?:avatar|banner)))?$/;

export default {
 async scheduled(_controller,env,ctx){
   // Strict staging flag and sk_test_ gate in the reconciler. Never run a
   // live account payout, checkout or billing mutation from a cron job.
   // Refresh active subscription periods and recover missed Checkout events.
   // Neither operation creates a payment, Price or customer.
   ctx.waitUntil(Promise.all([
     reconcileSupporterSubscriptions(env),reconcileSupporterCheckouts(env),
     // Inert with either Studio flag OFF or no dedicated private R2 binding.
     cleanupCanonicalStudioAssets(env),
      // Additive large-file cleanup runs even while new uploads are paused.
      cleanupCanonicalStudioLargeAssets(env)
   ]));
 },
 async fetch(request,env,ctx){
   const url=new URL(request.url);
   if(url.origin!==ORIGIN || url.protocol!=="https:"){
     return new Response("Not found",{status:404,headers:{"cache-control":"no-store"}});
   }
   if(url.pathname===PUBLIC_METRICS||CANONICAL_PATH.test(url.pathname)||PUBLIC_IDENTITY.test(url.pathname)||/^\/api\/v1\/community\/(?:members|activity|threads(?:\/[a-f0-9-]{36}(?:\/(?:replies|reaction))?)?|reports)$/.test(url.pathname)){
     // This Worker itself checks exact origin, issuer, dedicated D1, CSRF,
     // route/method allowlists and account opt-in. Never proxy older sessions.
     return canonicalIdentity.fetch(request,env,ctx);
   }
   return publicStage.fetch(request,env,ctx);
 }
};
