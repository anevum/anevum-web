/** Temporary opt-in routing only. This Worker has no database, service or
 * member-session bindings and grants no account capabilities. The existing
 * /__enter* Access application protects its only route. */
import {verifiedPreviewIdentity} from '../apex-prelaunch/preview-access.mjs';
export const QA_SOURCE='d5af32fd8f04b05e0381f7ac12c59d06c0e836a2';
export const QA_CANDIDATE='904b3b6c-7a7a-401a-9a35-4b5d822dec67';
export const QA_COOKIE='__Host-anevum-v095-v096-qa';
const ROOT='/__enter/v095-v096';
const headers={'cache-control':'private, no-store','x-robots-tag':'noindex, nofollow, noarchive',
 'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
 'referrer-policy':'no-referrer','x-content-type-options':'nosniff','x-frame-options':'DENY'};
const response=(body,status=200,extra={})=>new Response(body,{status,headers:{...headers,...extra}});
export function createAcceptanceEntry({identity=verifiedPreviewIdentity,now=()=>Math.floor(Date.now()/1000)}={}){
 return {async fetch(request,env){
  const url=new URL(request.url);
  if(url.origin!=='https://anevum.com'||url.search||![ROOT,ROOT+'/enable',ROOT+'/leave'].includes(url.pathname))
   return response('Not found',404);
  if(!['GET','POST'].includes(request.method))return response('Method not allowed',405,{allow:'GET, POST'});
  if(request.method==='POST'){
   if(request.headers.get('origin')!=='https://anevum.com'||
    !['same-origin',null].includes(request.headers.get('sec-fetch-site')))
    return response('Same-origin form required',403);
   if(url.pathname===ROOT+'/leave')return response(null,303,{location:'/studio/alpha',
    'set-cookie':QA_COOKIE+'=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0'});
   if(url.pathname!==ROOT+'/enable')return response('Not found',404);
  }else if(url.pathname!==ROOT)return response('Not found',404);
  let actor=null;try{actor=await identity(request,env);}catch{}
  if(!actor)return response('Authorized release tester sign-in required',403);
  const expires=Number(env.QA_EXPIRES_AT),remaining=expires-now();
  if(!/^[a-f0-9]{64}$/.test(env.QA_ROUTING_TOKEN||'')||!Number.isSafeInteger(expires)||remaining<=0||remaining>86400||
    env.QA_CANDIDATE!==QA_CANDIDATE)return response('Candidate testing is unavailable',503);
  if(request.method==='POST')return response(null,303,{location:'/studio/alpha',
   'set-cookie':QA_COOKIE+'='+env.QA_ROUTING_TOKEN+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+Math.min(remaining,28800)});
  return response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ANEVUM release acceptance</title><style>body{background:#050b16;color:#e8f0ff;font:18px system-ui;max-width:44rem;margin:8vh auto;padding:24px;line-height:1.6}button{font:inherit;padding:14px 22px;border:1px solid #a0c5cc;background:#152536;color:inherit;border-radius:9px}code{overflow-wrap:anywhere}</style><main><p>CONTINUANCE INSTITUTE · RELEASE ACCEPTANCE</p><h1>Test V095/V096 on this device</h1><p>This opts this browser into the reviewed candidate for up to eight hours. Ordinary visitors continue to receive the existing release. Your normal sign-in and permissions still apply. This is a live-data test: use only designated test projects.</p><p>Application source: <code>${QA_SOURCE}</code><br>Candidate: <code>${QA_CANDIDATE}</code></p><p>On iPhone, open this page in Safari. Check IREN movement and fallback, onboarding and dismissal, identity cards, menus, guest editing, responsive preview and HTML export. Guest mode must offer no server upload or publish.</p><form method="post" action="${ROOT}/enable"><button>Enter candidate testing</button></form><form method="post" action="${ROOT}/leave"><p><button>Return to current release</button></p></form><p>Report the device, iOS version, candidate ID and any failures. Opening this page does not mark acceptance complete.</p></main></html>`,200,{'content-type':'text/html; charset=utf-8'});
 }};
}
export default createAcceptanceEntry();
