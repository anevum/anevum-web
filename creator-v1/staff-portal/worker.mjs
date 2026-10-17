/**
 * ANEVUM.IREN.BUILD.2026-10-17.002.APEX-STAFF-ACTIVATION
 * Isolated staff UI and API, sharing *verified* apex Better Auth sessions.
 *
 * This Worker DOES NOT implement sign-in, set auth cookies, manage public
 * app assets or trust client-supplied user identifiers. It delegates only
 * GET /api/v1/member/auth/get-session to the existing apex Worker through
 * a same-account Cloudflare Service Binding.
 *
 * Routes when activated:
 *   https://anevum.com/staff* (SPA and staff-only static assets)
 *   https://anevum.com/api/v1/member/staff-ops*
 *   https://anevum.com/api/v1/member/forum-review*
 */
import {canonicalStaffOps,STAFF_OPS_PATH} from '../canonical-auth/staff-ops.mjs';
import {canonicalForums} from '../canonical-auth/forums.mjs';

const ORIGIN='https://anevum.com';
const AUTH_PATH='/api/v1/member/auth/get-session';
const REVIEW='/api/v1/member/forum-review';
const HEADERS={
 'cache-control':'private, no-store',
 'x-content-type-options':'nosniff',
 'referrer-policy':'no-referrer',
 'x-robots-tag':'noindex, nofollow, noarchive',
 'x-frame-options':'DENY',
 'vary':'Cookie'
};
const CSP="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";

const fail=(status,message)=>Response.json({error:message},{status,headers:{...HEADERS,'content-type':'application/json'}});
const denied=(req)=> {
 const origin=req.headers.get('origin'),site=req.headers.get('sec-fetch-site');
 return origin!==ORIGIN || ![null,'same-origin','none'].includes(site);
};
const safeResponse=(original)=> {
 const headers=new Headers(original.headers);
 for(const [k,v] of Object.entries(HEADERS))headers.set(k,v);
 headers.delete('access-control-allow-origin');
 headers.delete('access-control-allow-credentials');
 headers.delete('set-cookie');
 return new Response(original.body,{status:original.status,statusText:original.statusText,headers});
};
async function getVerifiedUser(request,env){
 if(!env?.APEX_AUTH||typeof env.APEX_AUTH.fetch!=='function')return null;
 const cookie=request.headers.get('cookie');
 if(!cookie||cookie.length>8192)return null;
 try{
  const identityRequest=new Request(ORIGIN+AUTH_PATH,{
   method:'GET',
   headers:{cookie,accept:'application/json'},
   redirect:'error',cache:'no-store'
  });
  const response=await env.APEX_AUTH.fetch(identityRequest);
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))return null;
  const data=await response.json();
  if(!data||typeof data!=='object'||Array.isArray(data))return null;
  if(!data.session||typeof data.session!=='object')return null;
  const user=data.user;
  if(!user||typeof user.id!=='string'||user.id.length<1||user.id.length>128||
     user.emailVerified!==true||data.session.userId!==user.id)return null;
  // Identities come ONLY from the internal Worker session verifier response.
  return {id:user.id,emailVerified:true};
 }catch{return null}
}
async function apiRequest(request,env,path){
 if(env?.CANONICAL_STAFF_OPS_ENABLED!=='true')return fail(404,'Not found');
 if(!['GET','POST'].includes(request.method))return fail(405,'Method not allowed');
 if(request.method==='POST'&&denied(request))return fail(403,'Same-origin request required');
 const user=await getVerifiedUser(request,env);
 if(!user)return fail(401,'Verified apex session required');
 try{
  if(path===STAFF_OPS_PATH)return safeResponse(await canonicalStaffOps(request,env,user));
  if(path===REVIEW&&env.CANONICAL_FORUM_ENABLED==='true')return safeResponse(await canonicalForums(request,env,user));
  return fail(404,'Not found');
 }catch{return fail(503,'Staff operation unavailable')}
}
async function staticRequest(request,env,url){
 if(!['GET','HEAD'].includes(request.method))return fail(405,'Method not allowed');
 if(env?.CANONICAL_STAFF_OPS_ENABLED!=='true')return fail(404,'Not found');
 if(!env?.ASSETS?.fetch)return fail(503,'Staff assets unavailable');
 const path=url.pathname;
 // A private, distinct asset namespace means no overwrite of the public
 // ANEVUM V063/V064 JS bundles or /assets/index-* Cloudflare proxy route.
 let internal='/index.html';
 if(path.startsWith('/staff/assets/')){
  internal=path.slice('/staff'.length);
  if(!/^\/assets\/[a-zA-Z0-9_.-]+$/.test(internal))return fail(404,'Not found');
 }else if(path!=='/staff'&&path!=='/staff/')return fail(404,'Not found');
 const assetURL=new URL(request.url);
 assetURL.pathname=internal;
 assetURL.search='';
 const response=await env.ASSETS.fetch(new Request(assetURL,{
  method:request.method,
  headers:{accept:request.headers.get('accept')||'*/*'}
 }));
 if(!response.ok)return fail(404,'Not found');
 const headers=new Headers(response.headers);
 headers.set('x-content-type-options','nosniff');
 headers.set('referrer-policy','no-referrer');
 headers.set('x-robots-tag','noindex, nofollow, noarchive');
 headers.set('x-frame-options','DENY');
 if(internal==='/index.html'){
  headers.set('content-security-policy',CSP);
  headers.set('permissions-policy','camera=(self), microphone=(self), geolocation=(), payment=()');
  headers.set('cache-control','private, no-store');
  headers.set('vary','Cookie');
 }else headers.set('cache-control','public, max-age=86400, immutable');
 return new Response(request.method==='HEAD'?null:response.body,{
  status:response.status,statusText:response.statusText,headers
 });
}
export function createIrenApexStaffWorker(){
 return {async fetch(request,env){
  let url;
  try{url=new URL(request.url)}catch{return fail(404,'Not found')}
  if(url.origin!==ORIGIN||url.protocol!=='https:'||url.username||url.password)
   return fail(404,'Not found');
  if(url.pathname===STAFF_OPS_PATH||url.pathname===REVIEW)return apiRequest(request,env,url.pathname);
  return staticRequest(request,env,url);
 }};
}
export default createIrenApexStaffWorker();
