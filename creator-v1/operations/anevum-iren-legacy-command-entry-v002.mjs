/**
 * ANEVUM.OPS.INCIDENT.2026-10-21.001.FOUNDER-STAFF-AUTH-SPLIT
 *
 * Canonicalize the two legacy /staff/command URLs without serving a
 * detached staff application. The existing native /staff?view=command
 * route performs Better Auth session and active staff-grant verification
 * before it delegates to Command. The existing separate Cloudflare Access
 * policy on /api/v1/member/staff-ops remains in force.
 *
 * This module does not grant roles, relay cookies, fetch staff APIs or
 * otherwise change security boundaries. Deploy only through reviewed,
 * guarded inactive-version selection with a verified rollback.
 */
const ORIGIN='https://anevum.com';
const EXACT_PATHS=new Set(['/staff/command','/staff/command/']);
const ENTRY='/staff?view=command';
const PRIVATE_HEADERS=Object.freeze({
 'cache-control':'private, no-store',
 'referrer-policy':'no-referrer',
 'x-content-type-options':'nosniff',
 'x-robots-tag':'noindex, nofollow, noarchive',
 'vary':'Cookie',
 'x-anevum-legacy-command':'canonical-entry-v002'
});
const deny=(code)=>new Response(null,{status:code,headers:PRIVATE_HEADERS});

export function legacyCommandEntry(request){
 let url;
 try{url=new URL(request.url);}catch{return deny(404);}
 if(url.origin!==ORIGIN||url.protocol!=='https:'||url.username||url.password||
    !EXACT_PATHS.has(url.pathname))return deny(404);
 if(!['GET','HEAD'].includes(request.method))return deny(405);
 // Never propagate unknown query parameters, arbitrary Location,
 // cookies or credentials in the redirect response.
 return new Response(null,{
  status:302,
  headers:{...PRIVATE_HEADERS,location:ENTRY}
 });
}
export default {async fetch(request){return legacyCommandEntry(request);}};
