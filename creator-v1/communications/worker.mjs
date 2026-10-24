// ANEVUM IREN communications: isolated, UNROUTED Worker; no live mail until approved.
const ORIGIN='https://anevum.com',PREFIX='/api/v1/communications/';
const EMAIL=/^[^\s@]{1,64}@[^\s@]{1,190}$/;
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
const UNSUB=/^v1\.([a-f0-9-]{36})\.([A-Za-z0-9_-]{43})$/;
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow','x-frame-options':'DENY'};
const respond=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const fail=status=>respond({error:status===503?'Communications unavailable':'Request unavailable'},status);
const record=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>keys.includes(k));
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const sha=async s=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
const random=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
async function keyFor(env,kind,s){
 const encoder=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',encoder.encode(env.COMMUNICATIONS_RATE_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return kind+':'+hex(await crypto.subtle.sign('HMAC',key,encoder.encode(s)));
}
async function bounded(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return null;
 const len=Number(request.headers.get('content-length')||0);
 if(len>1024||len<0)return null;
 try{
  const reader=request.body?.getReader();if(!reader)return null;
  let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();return null}chunks.push(value)}
  const buffer=new Uint8Array(size);let n=0;for(const chunk of chunks){buffer.set(chunk,n);n+=chunk.length}
  const obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer));
  return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:null;
 }catch{return null}
}
function configured(env){
 return env?.COMMUNICATIONS_EMAIL_ENABLED==='true'&&env.COMMUNICATIONS_PUBLIC_ORIGIN===ORIGIN&&
 typeof env.COMMUNICATIONS_RATE_SECRET==='string'&&env.COMMUNICATIONS_RATE_SECRET.length>=32&&
 typeof env.COMMUNICATIONS_RESEND_API_KEY==='string'&&env.COMMUNICATIONS_RESEND_API_KEY.length>=24&&
 /^ANEVUM Updates <[a-z0-9._+-]+@anevum\.com>$/.test(env.COMMUNICATIONS_FROM||'')&&
 typeof env.COMMUNICATIONS_DB?.prepare==='function';
}
async function ready(db){
 const manifest=await db.prepare('SELECT issuer,version FROM communication_manifest WHERE id=1').first();
 return manifest?.issuer==='anevum-communications-v1'&&manifest.version==='0001_optional_mail_consent';
}
async function rate(db,bucket,now,window,limit){
 const row=await db.prepare("INSERT INTO communication_rate_windows(bucket,hits,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN expires_at<=? THEN 1 ELSE hits+1 END,expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING hits").bind(bucket,now+window,now,now).first();
 return Number(row?.hits||999)<=limit;
}
export async function sendViaResend(env,payload){
 const result=await fetch('https://api.resend.com/emails',{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+env.COMMUNICATIONS_RESEND_API_KEY,'content-type':'application/json'},body:JSON.stringify(payload)});
 if(!result.ok)throw Error('Email delivery failed');
}
const emailMessage=(env,to,subject,body)=>({from:env.COMMUNICATIONS_FROM,to:[to],subject,text:body,html:'<div style="font:16px/1.6 system-ui;background:#101b2b;color:#f5efe8;padding:32px"><h1>ANEVUM / CONTINUANCE</h1><p>'+body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')+'</p></div>'});
export function createCommunicationsWorker({send=sendViaResend,clock=()=>Date.now()}={}){
 return {async fetch(request,env){
  const url=new URL(request.url),action=url.pathname.startsWith(PREFIX)?url.pathname.slice(PREFIX.length):'';
  if(url.origin!==ORIGIN||url.search||!['subscribe','confirm','unsubscribe','manage'].includes(action))return fail(404);
  if(request.method!=='POST')return fail(405);
  if(env?.COMMUNICATIONS_EMAIL_ENABLED!=='true')return fail(404);
  if(request.headers.get('origin')!==ORIGIN||![null,'same-origin','none'].includes(request.headers.get('sec-fetch-site')))return fail(403);
  if(!configured(env))return fail(503);
  const db=env.COMMUNICATIONS_DB;try{if(!await ready(db))return fail(503)}catch{return fail(503)}
  const input=await bounded(request);if(!input)return fail(400);
  const now=Math.floor(clock()/1000);
  if(action==='confirm'){
   if(!record(input,['token'])||typeof input.token!=='string'||!TOKEN.test(input.token))return fail(400);
   try{
    const row=await db.prepare("UPDATE communication_subscribers SET status='confirmed',releases=pending_releases,weekly=pending_weekly,pending_releases=0,pending_weekly=0,confirm_hash=NULL,confirm_expires_at=NULL,confirmed_at=?,updated_at=?,unsub_version=unsub_version+1 WHERE confirm_hash=? AND confirm_expires_at>? AND (pending_releases=1 OR pending_weekly=1) RETURNING id")
     .bind(now,now,await sha(input.token),now).first();
    return row?.id?respond({status:'confirmed'}):fail(410);
   }catch{return fail(503)}
  }
  if(action==='unsubscribe'){
   const match=typeof input.token==='string'?input.token.match(UNSUB):null;
   if(!record(input,['token','topic'])||!match||!['all','releases','weekly',undefined].includes(input.topic))return fail(400);
   const topic=input.topic||'all';
   try{
    const result=await db.prepare("UPDATE communication_subscribers SET releases=CASE WHEN ? IN ('all','releases') THEN 0 ELSE releases END,weekly=CASE WHEN ? IN ('all','weekly') THEN 0 ELSE weekly END,status=CASE WHEN ?='all' OR (?='releases' AND weekly=0) OR (?='weekly' AND releases=0) THEN 'unsubscribed' ELSE status END,pending_releases=0,pending_weekly=0,confirm_hash=NULL,confirm_expires_at=NULL,manage_hash=NULL,manage_expires_at=NULL,unsubscribed_at=?,updated_at=?,unsub_version=unsub_version+1 WHERE id=? AND manage_hash=? AND manage_expires_at>? AND status='confirmed' RETURNING id")
     .bind(topic,topic,topic,topic,topic,now,now,match[1],await sha(match[2]),now).first();
    return result?.id?respond({status:'unsubscribed',topic}):fail(410);
   }catch{return fail(503)}
  }
  if(action==='subscribe'&&(!record(input,['email','topics','consent'])||input.consent!==true||!record(input.topics,['releases','weekly'])||typeof input.topics.releases!=='boolean'||typeof input.topics.weekly!=='boolean'||!(input.topics.releases||input.topics.weekly)))return fail(400);
  if(action==='manage'&&!record(input,['email']))return fail(400);
  const address=typeof input.email==='string'&&input.email===input.email.trim()&&input.email.length<=254&&EMAIL.test(input.email)?input.email.toLowerCase():null;
  if(!address)return fail(400);
  const ip=request.headers.get('cf-connecting-ip');if(!ip||ip.length>64)return fail(503);
  try{
   const ipAllowed=await rate(db,await keyFor(env,'ip',ip),now,3600,6);
   const emailAllowed=await rate(db,await keyFor(env,'address',address),now,86400,3);
   if(!ipAllowed||!emailAllowed)return respond({status:'check_email'},202);
   if(action==='manage'){
    const row=await db.prepare("SELECT id,unsub_version FROM communication_subscribers WHERE email=? AND status='confirmed'").bind(address).first();
    if(row){
     // A fresh random management token is issued and stored only as a digest.
     const token=random();
     // Preference-link requests must not erase a still-valid, separately requested consent confirmation.
     // The management link uses a separate opaque token stored as hash.
     await db.prepare("UPDATE communication_subscribers SET manage_hash=?,manage_expires_at=? WHERE id=?").bind(await sha(token),now+86400,row.id).run();
     const link=ORIGIN+'/updates/preferences?action=unsubscribe&token='+encodeURIComponent('v1.'+row.id+'.'+token);
     try{await send(env,emailMessage(env,address,'Manage ANEVUM email updates','You requested an ANEVUM email preference link.\n\n'+link+'\n\nExpires in 24 hours. Ignore if not requested.'))}catch{}
    }
    return respond({status:'check_email'},202);
   }
   const token=random(),topics=input.topics;
   await db.prepare("INSERT INTO communication_subscribers(id,email,status,releases,weekly,pending_releases,pending_weekly,confirm_hash,confirm_expires_at,consent_version,consent_source,consent_at,created_at,updated_at) VALUES(?,?,'pending',0,0,?,?,?,?,'v1','site-optin-v1',?,?,?) ON CONFLICT(email) DO UPDATE SET pending_releases=excluded.pending_releases,pending_weekly=excluded.pending_weekly,confirm_hash=excluded.confirm_hash,confirm_expires_at=excluded.confirm_expires_at,consent_at=excluded.consent_at,updated_at=excluded.updated_at")
    .bind(crypto.randomUUID(),address,Number(topics.releases),Number(topics.weekly),await sha(token),now+172800,now,now,now).run();
   const link=ORIGIN+'/updates/preferences?action=confirm&token='+token;
   try{await send(env,emailMessage(env,address,'Confirm your ANEVUM email updates','You requested optional ANEVUM updates.\n\nConfirm your email within 48 hours:\n'+link+'\n\nIgnore if not requested.'))}catch{}
   return respond({status:'check_email'},202);
  }catch{return fail(503)}
 }};
}
export default createCommunicationsWorker();
