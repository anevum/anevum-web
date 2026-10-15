// Same-origin canonical member composition over the retained public V006/V007 reader.
// The review config remains unrouted; the signup staging config targets only the existing a Worker.
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
