import {PAGE,STYLE,CLIENT} from './join.mjs';
import {creatorProjects} from './projects.mjs';
import {communityRoutes} from './community.mjs';
import {communityPostRoutes} from './community-posts.mjs';
import {socialRoutes} from './social.mjs';
import {privacyRoutes} from './privacy.mjs';
import {PRIVACY_PAGE,PRIVACY_STYLE,PRIVACY_CLIENT} from './privacy-ui.mjs';
import {PROFILE_PAGE,LIBRARY_PAGE,SOCIAL_STYLE,SOCIAL_CLIENT} from './social-ui.mjs';
import {COMMUNITY_PAGE,COMMUNITY_STYLE,COMMUNITY_CLIENT} from './community-ui.mjs';
import {PROJECT_PAGE,PROJECT_STYLE,PROJECT_CLIENT} from './projects-ui.mjs';
// ANEVUM V1 — isolated, gated STAGING member-identity prototype.
// Uses WebCrypto primitives and D1 conditional writes; requires independent security
// review before public registration. No Better Auth/V5 session or broker integration.
const ORIGIN = 'https://next.anevum.com';
const CSP_UI="default-src 'none'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' data: https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; font-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'; frame-ancestors 'none'";
const PATH = '/api/v1/member';
const JOIN_PATH = PATH + '/join';
const COOKIE = '__Host-anevum_stage_sid';
const BASE = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-robots-tag': 'noindex, nofollow',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'vary': 'Origin'
});
const text = value => new TextEncoder().encode(value);
const encode = bytes => Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
const random = n => crypto.getRandomValues(new Uint8Array(n));
const hex = n => encode(random(n));
const uuid = () => crypto.randomUUID();
const unix = () => Math.floor(Date.now() / 1000);
const json = (req, value, status=200, headers={}) => new Response(req.method==='HEAD'?null:JSON.stringify(value),{status,headers:{...BASE,...headers}});
const SAME = new Set(['same-origin', 'none']);
const fail = (req, msg, status) => json(req,{error:msg},status);
const normalizedEmail = v => typeof v==='string' ? v.trim().toLowerCase() : '';
const validEmail = v => /^[^\s@]{1,64}@[^\s@]{1,190}$/.test(v) && v.length <= 254 && !/[\u0000-\u001f\u007f]/.test(v);
const validCode = v => typeof v==='string' && /^\d{8}$/.test(v);
const HANDLE = /^[a-z][a-z0-9_]{2,29}$/;
const RESERVED = new Set(['admin','root','moderator','staff','anevum','support','api','account','owner','system','signin','login','security','official','help']);
const sessionCookie = (token,maxAge) => `${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
const cookieToken = req => {
  const all = req.headers.get('cookie') || '';
  const match = all.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='));
  return match ? match.slice(COOKIE.length+1) : '';
};
function joinEnabled(env) {
  return env?.STAGING_JOIN_ENABLED === 'true' && typeof env?.RESEND_API_KEY === 'string' && typeof env?.TURNSTILE_SECRET === 'string' &&
    typeof env?.STAGING_INVITE_EMAILS === 'string' && env.STAGING_INVITE_EMAILS.trim().length > 0;
}
// Capabilities are only advertised for this identity backend. Separate
// Better Auth provider configuration never implies Creator V1 access.
export function memberSignInCapabilities(env) {
  const canEmail = ready(env) && typeof env.COMMUNITY_DB.prepare === 'function' && joinEnabled(env);
  return {
    version: 1,
    registration: canEmail ? "invite-only" : "closed",
    methods: {
      email: { available: canEmail, path: canEmail ? JOIN_PATH : null },
      google: { available: false },
      github: { available: false },
      passkey: { available: false },
      microsoft: { available: false },
      apple: { available: false }
    },
    linking: "disabled"
  };
}
function invited(env,email) {
  return String(env?.STAGING_INVITE_EMAILS || '').split(',').map(normalizedEmail).filter(Boolean).includes(email);
}
function ready(env) {
  return !!(env?.COMMUNITY_DB && typeof env.AUTH_PEPPER==='string' && /^[a-f0-9]{64}$/.test(env.AUTH_PEPPER));
}
async function digest(env, label, value) {
  const k=await crypto.subtle.importKey('raw', Uint8Array.from(env.AUTH_PEPPER.match(/../g).map(s=>parseInt(s,16))),
    {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  return encode(new Uint8Array(await crypto.subtle.sign('HMAC',k,text(label+'\x00'+value))));
}
function stmt(db,sql,values=[]) {const p=db.prepare(sql);return values.length?p.bind(...values):p;}
async function all(db,sql,values=[]) {const r=await stmt(db,sql,values).all();if(r?.success===false||!Array.isArray(r?.results))throw Error('Database unavailable');return r.results;}
async function run(db,sql,values=[]) {const r=await stmt(db,sql,values).run();if(r?.success===false)throw Error('Database unavailable');return r;}
async function one(db,sql,values=[]) {return (await all(db,sql,values))[0] || null;}
async function body(req) {
  if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))throw Error('JSON required');
  const declared=Number(req.headers.get('content-length'));
  if(declared>4096)throw Error('Payload too large');
  const reader=req.body?.getReader();if(!reader)throw Error('Body required');
  let length=0;const chunks=[];
  try {for(;;){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>4096){await reader.cancel();throw Error('Payload too large');}chunks.push(value)}}finally{reader.releaseLock();}
  let bytes=new Uint8Array(length),offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(!data || typeof data!=='object' || Array.isArray(data))throw Error('Object required');
  return data;
}
function checkWrite(req){
  return req.headers.get('origin')===ORIGIN && SAME.has(req.headers.get('sec-fetch-site')||'same-origin');
}
async function limit(db,key,now,max,windowSeconds) {
  const rows=await all(db,`INSERT INTO member_request_limits(key,window_start,requests) VALUES(?,?,1)
    ON CONFLICT(key) DO UPDATE SET window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END,
      requests=CASE WHEN window_start<=? THEN 1 ELSE requests+1 END
    WHERE window_start<=? OR requests<? RETURNING requests`,
    [key,now,now-windowSeconds,now-windowSeconds,now-windowSeconds,max]);
  return rows.length===1;
}
export async function authenticated(req,env,now=unix()) {
  const t=cookieToken(req);
  if(!/^[0-9a-f]{64}$/.test(t))return null;
  const hash=await digest(env,'session',t);
  const u=await one(env.COMMUNITY_DB,`SELECT a.id,a.email,a.status,s.created_at AS sessionCreatedAt,c.handle,c.display_name AS displayName,c.bio
     FROM member_sessions s JOIN member_accounts a ON a.id=s.member_id
     LEFT JOIN creator_profiles c ON c.member_id=a.id AND c.status='active'
     WHERE s.token_hash=? AND s.expires_at>? AND s.revoked_at IS NULL AND a.status='active'`,[hash,now]);
  return u ? {id:u.id,email:u.email,handle:u.handle||null,displayName:u.displayName||null,bio:u.bio||'',tokenHash:hash,sessionCreatedAt:u.sessionCreatedAt}:null;
}
async function turnstile(env,token,ip,fetcher) {
  if(!env.TURNSTILE_SECRET || typeof token!=='string'||token.length<10||token.length>4096)return false;
  const params=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});
  if(ip)params.set('remoteip',ip);
  const res=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {method:'POST',body:params,signal:AbortSignal.timeout(5500)});
  if(!res.ok)return false;
  const result=await res.json();
  return result?.success===true && result.hostname==='next.anevum.com';
}
async function emailCode(env,email,code,challengeId,fetcher) {
  if(!env.RESEND_API_KEY)throw Error('Email disabled');
  const payload={from:'ANEVUM <access@auth.anevum.com>',to:[email],
    template:{id:'anevum-v1-sign-in-otp',variables:{CODE:code,EXPIRES_MINUTES:10}}};
  const res=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{
    authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json',
    'idempotency-key':'anevum-otp/'+challengeId},body:JSON.stringify(payload),signal:AbortSignal.timeout(5500)});
  if(!res.ok)throw Error('Email unavailable');
}
export function createMemberWorker({fetcher=fetch,clock=unix}={}) {
return {async fetch(req,env) {
  const url=new URL(req.url);
  if(url.origin!==ORIGIN)return fail(req,'Not found',404);
  if([JOIN_PATH,JOIN_PATH+'.css',JOIN_PATH+'.js'].includes(url.pathname)&&['GET','HEAD'].includes(req.method)) {
    const kind=url.pathname===JOIN_PATH?'text/html; charset=utf-8':url.pathname===JOIN_PATH+'.css'?'text/css; charset=utf-8':'text/javascript; charset=utf-8';
    const body=url.pathname===JOIN_PATH?PAGE:url.pathname===JOIN_PATH+'.css'?STYLE:CLIENT;
    return new Response(req.method==='HEAD'?null:body,{headers:{...BASE,'content-type':kind,'content-security-policy':CSP_UI}});
  }
  const communityPage=PATH+'/community';
  if([communityPage,communityPage+'.css',communityPage+'.js'].includes(url.pathname)&&['GET','HEAD'].includes(req.method)){
    const kind=url.pathname===communityPage?'text/html; charset=utf-8':url.pathname===communityPage+'.css'?'text/css; charset=utf-8':'text/javascript; charset=utf-8';
    const content=url.pathname===communityPage?COMMUNITY_PAGE:url.pathname===communityPage+'.css'?COMMUNITY_STYLE:COMMUNITY_CLIENT;
    return new Response(req.method==='HEAD'?null:content,{headers:{...BASE,'content-type':kind,'content-security-policy':CSP_UI}});
  }
  const profileView=/^\/api\/v1\/member\/creators\/([a-z][a-z0-9_]{2,29})\/view$/.exec(url.pathname);
  const libManage=PATH+'/library/manage';
  const sharedAsset=url.pathname===PATH+'/social.css'||url.pathname===PATH+'/social.js';
  if((profileView||sharedAsset||url.pathname===libManage)&&['GET','HEAD'].includes(req.method)){
    if(!ready(env))return fail(req,'Member identity unavailable',503);
    if(url.pathname===libManage){
      const person=await authenticated(req,env,clock());
      if(!person)return new Response(null,{status:303,headers:{location:JOIN_PATH,'cache-control':'no-store'}});
    }
    const kind=profileView||url.pathname===libManage?'text/html; charset=utf-8':url.pathname.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8';
    const content=profileView?PROFILE_PAGE:url.pathname===libManage?LIBRARY_PAGE:url.pathname.endsWith('.css')?SOCIAL_STYLE:SOCIAL_CLIENT;
    return new Response(req.method==='HEAD'?null:content,{headers:{...BASE,'content-type':kind,'content-security-policy':CSP_UI}});
  }
  const privacyPage=PATH+'/privacy/manage';
  if([privacyPage,PATH+'/privacy.css',PATH+'/privacy.js'].includes(url.pathname)&&['GET','HEAD'].includes(req.method)){
    if(!ready(env))return fail(req,'Member identity unavailable',503);
    if(url.pathname===privacyPage){
      const member=await authenticated(req,env,clock());
      if(!member)return new Response(null,{status:303,headers:{location:JOIN_PATH,'cache-control':'no-store'}});
    }
    const kind=url.pathname===privacyPage?'text/html; charset=utf-8':url.pathname.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8';
    const content=url.pathname===privacyPage?PRIVACY_PAGE:url.pathname.endsWith('.css')?PRIVACY_STYLE:PRIVACY_CLIENT;
    return new Response(req.method==='HEAD'?null:content,{headers:{...BASE,'content-type':kind,'content-security-policy':CSP_UI}});
  }
  const projectsManage=PATH+'/projects/manage';
  if([projectsManage,projectsManage+'.css',projectsManage+'.js'].includes(url.pathname)&&['GET','HEAD'].includes(req.method)){
    if(!ready(env))return fail(req,'Member identity unavailable',503);
    const m=await authenticated(req,env,clock());
    if(!m)return new Response(null,{status:303,headers:{location:JOIN_PATH,'cache-control':'no-store'}});
    const type=url.pathname===projectsManage?'text/html; charset=utf-8':url.pathname===projectsManage+'.css'?'text/css; charset=utf-8':'text/javascript; charset=utf-8';
    const data=url.pathname===projectsManage?PROJECT_PAGE:url.pathname===projectsManage+'.css'?PROJECT_STYLE:PROJECT_CLIENT;
    return new Response(req.method==='HEAD'?null:data,{headers:{...BASE,'content-type':type,'content-security-policy':CSP_UI}});
  }
  if(!url.pathname.startsWith(PATH+'/'))return fail(req,'Not found',404);
  const path=url.pathname.slice(PATH.length);
  if(req.method==='OPTIONS')return fail(req,'Not found',404); // same-origin only
  if(!['GET','HEAD','POST','PATCH'].includes(req.method))return json(req,{error:'Method not allowed'},405,{'allow':'GET, HEAD, POST, PATCH'});
  if(!ready(env))return fail(req,'Member identity unavailable',503);
  const db=env.COMMUNITY_DB;
  try {
    if(path==='/privacy'||path.startsWith('/privacy/')){
      if(req.method==='POST'&&!checkWrite(req))return fail(req,'Request origin rejected',403);
      const member=await authenticated(req,env,clock());
      return privacyRoutes(req,db,member,limit,clock());
    }
    if(path==='/library'||path.startsWith('/library/')||path.startsWith('/creators/')){
      if(req.method==='POST'&&!checkWrite(req))return fail(req,'Request origin rejected',403);
      const member=await authenticated(req,env,clock());
      return socialRoutes(req,db,member,limit,clock());
    }
    if(path==='/community/posts'||path.startsWith('/community/posts/')){
      if(req.method==='POST'&&!checkWrite(req))return fail(req,'Request origin rejected',403);
      const member=await authenticated(req,env,clock());
      return communityPostRoutes(req,db,member,limit,clock());
    }
    if(path==='/community/me'||path==='/community/projects'||path.startsWith('/community/projects/')){
      if(req.method==='POST'&&!checkWrite(req))return fail(req,'Request origin rejected',403);
      const member=await authenticated(req,env,clock());
      return communityRoutes(req,db,member,limit,clock());
    }
    if(path==='/projects'||path.startsWith('/projects/')){
      if(['POST','PATCH'].includes(req.method)&&!checkWrite(req))return fail(req,'Request origin rejected',403);
      const member=await authenticated(req,env,clock());
      return creatorProjects(req,db,member,limit,clock());
    }
    if(path==='/health'&&['GET','HEAD'].includes(req.method))return json(req,{service:'anevum-v1-member-staging',status:'ok',signupEnabled:memberSignInCapabilities(env).methods.email.available},200);
    if(path==='/auth-methods')
      return ['GET','HEAD'].includes(req.method)
        ? json(req,memberSignInCapabilities(env),200)
        : fail(req,'Method not allowed',405);
    if(path==='/me'&&['GET','HEAD'].includes(req.method)) {
      const member=await authenticated(req,env,clock());
      return member?json(req,{member:{id:member.id,email:member.email,handle:member.handle,displayName:member.displayName,bio:member.bio}}):fail(req,'Sign-in required',401);
    }
    if(req.method!=='POST')return fail(req,'Not found',404);
    if(!checkWrite(req))return fail(req,'Request origin rejected',403);
    if(path==='/start') {
      if(!joinEnabled(env))return fail(req,'Registration not open',503);
      const input=await body(req),email=normalizedEmail(input.email);
      if(!validEmail(email))return fail(req,'Invalid email',400);
      const now=clock(),ip=req.headers.get('cf-connecting-ip')||'';
      if(!await turnstile(env,input.turnstileToken,ip,fetcher))return fail(req,'Challenge required',403);
      if(!invited(env,email))return json(req,{message:'If eligible, an email has been sent.'},202);
      const emailKey=await digest(env,'email',email);
      const ipKey=await digest(env,'ip',ip||'unknown');
      const emailAllowed=await limit(db,'issue:e:'+emailKey,now,3,3600);
      const ipAllowed=await limit(db,'issue:i:'+ipKey,now,15,3600);
      if(!emailAllowed||!ipAllowed)return json(req,{message:'If eligible, an email has been sent.'},202);
      const code=(Number(BigInt('0x'+hex(8))%100000000n)).toString().padStart(8,'0');
      const challengeId=hex(16);
      const codeHash=await digest(env,'otp',challengeId+'\x00'+emailKey+'\x00'+code);
      await run(db,`INSERT INTO member_email_challenges(email_key,code_hash,challenge_id,expires_at,created_at,consumed_at,attempts)
        VALUES(?,?,?,?,?,NULL,0) ON CONFLICT(email_key) DO UPDATE SET code_hash=excluded.code_hash,challenge_id=excluded.challenge_id,
        expires_at=excluded.expires_at,created_at=excluded.created_at,consumed_at=NULL,attempts=0`,
        [emailKey,codeHash,challengeId,now+600,now]);
      try{await emailCode(env,email,code,challengeId,fetcher)}catch{
        await run(db,'DELETE FROM member_email_challenges WHERE email_key=? AND challenge_id=?',[emailKey,challengeId]);
        return fail(req,'Email temporarily unavailable',503);
      }
      return json(req,{message:'If eligible, an email has been sent.'},202);
    }
    if(path==='/verify') {
      const input=await body(req),email=normalizedEmail(input.email),code=input.code;
      if(!validEmail(email)||!validCode(code))return fail(req,'Invalid verification request',400);
      if(!joinEnabled(env))return fail(req,'Registration not open',503);
      if(!invited(env,email))return fail(req,'Invalid or expired code',401);
      const now=clock(),emailKey=await digest(env,'email',email);
      const ipKey=await digest(env,'ip',req.headers.get('cf-connecting-ip')||'unknown');
      const ipAllowed=await limit(db,'verify:i:'+ipKey,now,30,3600);
      const emailAllowed=await limit(db,'verify:e:'+emailKey,now,12,3600);
      if(!ipAllowed||!emailAllowed)return fail(req,'Too many verification attempts',429);
      const entry=await one(db,'SELECT challenge_id,expires_at,attempts,consumed_at FROM member_email_challenges WHERE email_key=?',[emailKey]);
      if(!entry||entry.expires_at<=now||entry.consumed_at!==null||entry.attempts>=5)return fail(req,'Invalid or expired code',401);
      const expected=await digest(env,'otp',entry.challenge_id+'\x00'+emailKey+'\x00'+code);
      const accepted=await all(db,`UPDATE member_email_challenges SET consumed_at=?, attempts=attempts+1
        WHERE email_key=? AND challenge_id=? AND code_hash=? AND consumed_at IS NULL AND expires_at>? AND attempts<5 RETURNING email_key`,
        [now,emailKey,entry.challenge_id,expected,now]);
      if(accepted.length!==1){await run(db,`UPDATE member_email_challenges SET attempts=attempts+1 WHERE email_key=? AND challenge_id=? AND consumed_at IS NULL AND expires_at>? AND attempts<5`,[emailKey,entry.challenge_id,now]);return fail(req,'Invalid or expired code',401)}
      const id=uuid();
      await run(db,`INSERT INTO member_accounts(id,email,verified_at,created_at,status) VALUES(?,?,?,?,'active') ON CONFLICT(email) DO NOTHING`,[id,email,now,now]);
      const account=await one(db,"SELECT id FROM member_accounts WHERE email=? AND status='active'",[email]);
      if(!account)return fail(req,'Account unavailable',403);
      const token=hex(32),hash=await digest(env,'session',token);
      await run(db,'INSERT INTO member_sessions(token_hash,member_id,expires_at,created_at) VALUES(?,?,?,?)',[hash,account.id,now+604800,now]);
      return json(req,{member:{id:account.id},next:'profile'},200,{'set-cookie':sessionCookie(token,604800)});
    }
    if(path==='/sign-out') {
      const t=cookieToken(req);
      if(/^[a-f0-9]{64}$/.test(t))await run(db,'UPDATE member_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL',[clock(),await digest(env,'session',t)]);
      return json(req,{signedOut:true},200,{'set-cookie':sessionCookie('',0)});
    }
    if(path==='/profile') {
      const member=await authenticated(req,env,clock());
      if(!member)return fail(req,'Sign-in required',401);
      const editKey=await digest(env,'profile',member.id);
      if(!await limit(db,'profile:'+editKey,clock(),15,3600))return fail(req,'Too many profile changes',429);
      const input=await body(req);const handle=typeof input.handle==='string'?input.handle.toLowerCase().trim():'';
      const displayName=typeof input.displayName==='string'?input.displayName.trim():'';
      const bio=typeof input.bio==='string'?input.bio.trim():'';
      if(!HANDLE.test(handle)||RESERVED.has(handle)||displayName.length<1||displayName.length>80||bio.length>1200||/[\u0000-\u001f\u007f]/.test(displayName+bio))return fail(req,'Invalid profile',400);
      if(member.handle && member.handle!==handle)return fail(req,'Handle changes are not yet available',409);
      try {
        await run(db,`INSERT INTO creator_profiles(member_id,handle,display_name,bio,is_staff,status)
          VALUES(?,?,?,?,0,'active') ON CONFLICT(member_id) DO UPDATE SET display_name=excluded.display_name,bio=excluded.bio,updated_at=CURRENT_TIMESTAMP WHERE creator_profiles.handle=excluded.handle`,
          [member.id,handle,displayName,bio]);
      } catch {return fail(req,'Handle unavailable or profile could not be saved',409)}
      const row=await one(db,'SELECT handle,display_name,bio FROM creator_profiles WHERE member_id=? AND status=?',[member.id,'active']);
      if(!row||row.handle!==handle)return fail(req,'Handle unavailable',409);
      return json(req,{profile:{handle:row.handle,displayName:row.display_name,bio:row.bio}},200);
    }
    return fail(req,'Not found',404);
  } catch (error) {
    if(error instanceof SyntaxError || /^(JSON|Body|Payload)/.test(error.message))return fail(req,'Invalid request body',400);
    return fail(req,'Member service unavailable',503); // Do not disclose auth secrets or SQL internals.
  }
}};
}
export async function cleanupStaging(db,now=unix()) {
  const a=await run(db,'DELETE FROM member_email_challenges WHERE expires_at<?',[now-86400]);
  const b=await run(db,'DELETE FROM member_sessions WHERE expires_at<? OR (revoked_at IS NOT NULL AND revoked_at<?)',[now-86400,now-86400]);
  const c=await run(db,'DELETE FROM member_request_limits WHERE window_start<?',[now-86400]);
  return {cleaned:true};
}
const defaultWorker=createMemberWorker();
export default {
  fetch:defaultWorker.fetch,
  async scheduled(event,env,ctx) {
    if(ready(env))ctx.waitUntil(cleanupStaging(env.COMMUNITY_DB));
  }
};