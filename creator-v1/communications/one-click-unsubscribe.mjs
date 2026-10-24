/**
 * ANEVUM / IREN: RFC 8058 one-click unsubscribe contract.
 *
 * Source-only. Not routed/deployed. No cron, subscriber listing, or mail send.
 * HMAC tokens are purpose-bound, versioned, expiring through subscriber version
 * invalidation, and never persisted as plaintext or printed in logs.
 */
const ORIGIN='https://anevum.com';
const PREFIX='/api/v1/communications/one-click/';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PATH=/^v1\.([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([1-9]\d{0,9})\.([A-Za-z0-9_-]{43})$/;
const encoder=new TextEncoder();
const securityHeaders={
 'content-type':'application/json; charset=utf-8',
 'cache-control':'no-store, private',
 'referrer-policy':'no-referrer',
 'x-content-type-options':'nosniff',
 'x-robots-tag':'noindex, nofollow, noarchive',
 'x-frame-options':'DENY'
};
const respond=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:securityHeaders});
function safeInt(value){return Number.isSafeInteger(value)&&value>=1&&value<=2147483647}
function secretFrom(env){
 const s=env?.COMMUNICATIONS_UNSUB_SECRET;
 if(typeof s!=='string'||s.length<32||s.length>512)throw Error('One-click unsubscribe not configured');
 return s;
}
async function hmac(env,id,version){
 const key=await crypto.subtle.importKey('raw',encoder.encode(secretFrom(env)),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bits=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode('anevum:unsubscribe:rfc8058:v1:'+id+':'+version)));
 return btoa(String.fromCharCode(...bits)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
function equalToken(a,b){
 if(a.length!==43||b.length!==43)return false;
 let diff=0;
 for(let i=0;i<43;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}
/**
 * Called ONLY when an actual outbound campaign is later explicitly approved.
 * A caller must have independently fetched a CURRENT subscriber row from the
 * dedicated database, and must re-check the topic/status at dispatch time.
 */
export async function buildOptionalEmailListHeaders({id,unsub_version,status,releases,weekly},topic,env){
 if(!UUID.test(id)||!safeInt(unsub_version)||status!=='confirmed'||
  !['releases','weekly'].includes(topic)||Number(topic==='releases'?releases:weekly)!==1)throw Error('Subscriber is not eligible for this topic');
 const token=await hmac(env,id,unsub_version);
 const link=ORIGIN+PREFIX+'v1.'+id+'.'+unsub_version+'.'+token;
 return Object.freeze({
  'List-Unsubscribe':'<'+link+'>',
  'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'
 });
}
async function boundedForm(request){
 if(!/^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return false;
 if(Number(request.headers.get('content-length')||0)>160)return false;
 try{
  // Independent of Content-Length, protect against streaming >160 bytes.
  const reader=request.body?.getReader();
  if(!reader)return false;
  const parts=[];let size=0;
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>160){await reader.cancel();return false}
   parts.push(value);
  }
  const bytes=new Uint8Array(size);let offset=0;
  for(const part of parts){bytes.set(part,offset);offset+=part.length}
  const params=new URLSearchParams(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  return params.size===1&&params.get('List-Unsubscribe')==='One-Click';
 }catch{return false}
}
/**
 * RFC 8058 mail-provider initiated POST; no Origin requirement because mail
 * providers, unlike browser forms, initiate the request server-to-server.
 * The signed opaque URL is the authorization credential. This is NOT the
 * human account/preferences endpoint and never exposes subscriber identity.
 */
export async function handleOneClickUnsubscribe(request,env,{clock=()=>Date.now()}={}){
 const url=new URL(request.url);
 const code=url.pathname.startsWith(PREFIX)?url.pathname.slice(PREFIX.length):'';
 const match=code.match(PATH);
 if(url.origin!==ORIGIN||url.search||!match)return respond({error:'Not found'},404);
 if(request.method!=='POST')return respond({error:'Method not allowed'},405);
 if(env?.COMMUNICATIONS_EMAIL_ENABLED!=='true')return respond({error:'Not found'},404);
 const db=env.COMMUNICATIONS_DB;
 if(!db?.prepare||env.COMMUNICATIONS_PUBLIC_ORIGIN!==ORIGIN)return respond({error:'Communications unavailable'},503);
 try{secretFrom(env)}catch{return respond({error:'Communications unavailable'},503)}
 if(!await boundedForm(request))return respond({error:'Invalid one-click request'},400);
 const [,id,versionText,provided]=match;
 const version=Number(versionText);
 if(!safeInt(version))return respond({error:'Invalid one-click request'},400);
 const acknowledged=()=>respond({status:'processed'});
 try{
  const row=await db.prepare('SELECT id,status,unsub_version FROM communication_subscribers WHERE id=?').bind(id).first();
  if(!row||row.status!=='confirmed'||Number(row.unsub_version)!==version)return acknowledged();
  const expected=await hmac(env,id,version);
  if(!equalToken(expected,provided))return acknowledged();
  const now=Math.floor(clock()/1000);
  const result=await db.prepare("UPDATE communication_subscribers SET releases=0,weekly=0,status='unsubscribed',pending_releases=0,pending_weekly=0,confirm_hash=NULL,confirm_expires_at=NULL,manage_hash=NULL,manage_expires_at=NULL,unsubscribed_at=?,updated_at=?,unsub_version=unsub_version+1 WHERE id=? AND unsub_version=? AND status='confirmed' RETURNING id").bind(now,now,id,version).first();
  // The database trigger records the suppression atomically.
  if(!result?.id)return acknowledged();
  return acknowledged();
 }catch{return respond({error:'Communications unavailable'},503)}
}
