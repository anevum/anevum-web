// REVIEW-ONLY: same-origin member routes grafted onto the retained public V006/V007 reader.
// This file is NOT the a.anevum.com deployed Worker; use only with a separately approved rollout.
// Canonical email sessions never enter the public Worker or legacy V5/Creator service.
import publicStage from "./a-staging-worker.mjs";
import canonicalIdentity from "../canonical-auth/worker.mjs";

const ORIGIN="https://a.anevum.com";
const CANONICAL_PATH=/^\/api\/v1\/member\//;
const PUBLIC_IDENTITY=/^\/api\/v1\/members\/[a-z][a-z0-9_]{2,29}$/;

export default {
 async fetch(request,env,ctx){
   const url=new URL(request.url);
   if(url.origin!==ORIGIN || url.protocol!=="https:"){
     return new Response("Not found",{status:404,headers:{"cache-control":"no-store"}});
   }
   if(CANONICAL_PATH.test(url.pathname)||PUBLIC_IDENTITY.test(url.pathname)){
     // This Worker itself checks exact origin, issuer, dedicated D1, CSRF,
     // route/method allowlists and account opt-in. Never proxy older sessions.
     return canonicalIdentity.fetch(request,env,ctx);
   }
   return publicStage.fetch(request,env,ctx);
 }
};
