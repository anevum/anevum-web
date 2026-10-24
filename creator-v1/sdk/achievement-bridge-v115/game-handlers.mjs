// ANEVUM Achievement Bridge V115 / creator's own web server adapter.
// This never trusts browser-supplied game facts or ANEVUM user identifiers.
// The host game MUST provide its existing auth, CSRF, link store and game DB
// predicates. It deliberately has no public SDK secret-creation API.
const KEY=/^[a-z][a-z0-9_]{2,47}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const json=(value,status=200)=>Response.json(value,{status,headers:{
 'cache-control':'private, no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'}});
const exact=(o,fields)=>o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).sort().join('|')===fields.slice().sort().join('|');
async function boundedJson(req){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 const length=Number(req.headers.get('content-length')||0);
 if(!Number.isSafeInteger(length)||length>700||length<0)return null;
 const reader=req.body?.getReader();if(!reader)return null;
 const buffers=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
   if(size>700){await reader.cancel();return null;}buffers.push(value);}
  const bytes=new Uint8Array(size);let n=0;for(const part of buffers){bytes.set(part,n);n+=part.byteLength;}
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes),value=JSON.parse(raw);
  return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
 }catch{return null;}finally{reader.releaseLock();}
}
function requireCallback(x,label){if(typeof x!=='function')throw new TypeError('Missing mandatory creator backend '+label);}
export function createAnevumGameHandlers({
 publisher,authenticatePlayer,verifyCsrf,readGameLink,saveGameLink,proveGameMilestone
}={}){
 if(!publisher?.exchange||!publisher?.award)throw new TypeError('Confidential ANEVUM publisher required');
 for(const [fn,label] of [[authenticatePlayer,'authentication'],[verifyCsrf,'CSRF control'],
  [readGameLink,'link lookup'],[saveGameLink,'link storage'],[proveGameMilestone,'gameplay proof']])
  requireCallback(fn,label);
 async function initial(request){
  if(request.method!=='POST'||new URL(request.url).search)return {error:json({error:'Method unavailable'},405)};
  const site=request.headers.get('sec-fetch-site');
  if(request.headers.get('origin')!==new URL(request.url).origin||(site!==null&&!['same-origin','none'].includes(site)))
   return {error:json({error:'Same-origin request required'},403)};
  if(await verifyCsrf(request)!==true)return {error:json({error:'Session authenticity required'},403)};
  const player=await authenticatePlayer(request);
  if(typeof player!=='string'||!player.trim()||player.length>160)return {error:json({error:'Authenticated game session required'},401)};
  const b=await boundedJson(request);
  if(!b)return {error:json({error:'Invalid request'},400)};
  return {player,b};
 }
 async function link(request){
  try{
   const input=await initial(request);if(input.error)return input.error;
   const {player,b}=input;
   if(!exact(b,['projectId','code'])||b.projectId!==publisher.projectId||
    typeof b.code!=='string'||!DIGEST.test(b.code))return json({error:'Invalid connection code'},400);
   const result=await publisher.exchange(b.code);
   if(!result||result.projectId!==publisher.projectId||!UUID.test(result.linkId))
    return json({error:'ANEVUM account linking could not be verified'},503);
   await saveGameLink(player,result.linkId);
   return json({linked:true});
  }catch{return json({error:'ANEVUM link unavailable'},503);}
 }
 async function report(request){
  try{
   const input=await initial(request);if(input.error)return input.error;
   const {player,b}=input;
   if(!exact(b,['projectId','stableKey'])||b.projectId!==publisher.projectId||
    typeof b.stableKey!=='string'||!KEY.test(b.stableKey))
    return json({error:'Invalid game milestone'},400);
   const linkId=await readGameLink(player);
   if(typeof linkId!=='string'||!UUID.test(linkId))return json({error:'Connect your ANEVUM account first'},409);
   // Critical: trusted creator backend derives BOTH event ID and digest from
   // gameplay state, not client JSON, request headers or URL query strings.
   const proof=await proveGameMilestone(player,b.stableKey);
   if(!proof||!UUID.test(proof.eventId)||!DIGEST.test(proof.evidenceDigest))
    return json({error:'Milestone not verified by the game server'},403);
   const reply=await publisher.award({linkId,stableKey:b.stableKey,
    eventId:proof.eventId,evidenceDigest:proof.evidenceDigest});
   return json({status:reply.status,trust:'creator_attested',platformXp:0});
  }catch{return json({error:'Milestone report unavailable'},503);}
 }
 return Object.freeze({link,report});
}
