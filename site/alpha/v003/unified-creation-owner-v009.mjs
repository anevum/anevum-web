/**
 * ANEVUM unified creation Worker V009 integration candidate.
 *
 * An intentionally tiny decorator for the EXISTING deployed route owner,
 * not a new website or a replacement for its V002 alpha uploader.
 * Existing caller entrypoint:
 *
 *   import existingOwner from "./existing-unified-creation-v002.mjs";
 *   import {withPackageUplink} from "./unified-creation-owner-v009.mjs";
 *   export default withPackageUplink(existingOwner);
 *
 * The actual deployed unified Worker source is owned outside this PR.
 * This module is source-only and must be bundled into that same Worker
 * under a separately approved, exact-head production integration.
 */
import {interceptPackageNamespace,packageBridgeRoute} from "./unified-creation-bridge-v009.mjs";

export function withPackageUplink(existingOwner,bridge=interceptPackageNamespace){
 if(!existingOwner||typeof existingOwner.fetch!=="function")
  throw new TypeError("Existing unified creation Worker is required");
 if(typeof bridge!=="function")throw new TypeError("Package route bridge must be callable");
 return {
  async fetch(request,env,ctx){
   const path=packageBridgeRoute(new URL(request.url),request.method);
   if(path===null){
     // Byte-for-byte legacy worker responsibility remains outside package code;
     // never consume/read/copy/alter the request or its Authorization/Cookie.
     return existingOwner.fetch(request,env,ctx);
   }
   try{
     const out=await bridge(request,env);
     return out instanceof Response?out:new Response("Creator package service unavailable",{
       status:503,headers:{"cache-control":"no-store","content-type":"text/plain; charset=utf-8"}
     });
   }catch{
     // A package integration failure must never route a POST body into the old
     // alpha uploader or yield a successful but inconsistent private release.
     return new Response("Creator package service unavailable",{
       status:503,headers:{"cache-control":"no-store","content-type":"text/plain; charset=utf-8"}
     });
   }
  }
 };
}
