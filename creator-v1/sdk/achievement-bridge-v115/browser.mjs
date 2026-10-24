// @anevum/achievements browser adapter V115 (source candidate).
// Never contains an issuer secret. Client events go to the CREATOR'S own
// authenticated backend, which must validate real gameplay/server facts.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const KEY=/^[a-z][a-z0-9_]{2,47}$/;
const ORIGINS=new Set(['https://anevum.com','https://a.anevum.com','https://next.anevum.com']);
const stateKey=id=>'anevum:marks:state:'+id;
const randomHex=(n=24)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>x.toString(16).padStart(2,'0')).join('');
function urlPath(value){
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||value.includes('\\')||value.includes('#')||value.includes('?'))
  throw new TypeError('Endpoint must be a same-origin path without a query');
 return value;
}
export class AnevumAchievementBrowser {
 constructor({projectId,anevumOrigin='https://anevum.com',reportEndpoint='/api/anevum/achievements/report',
   linkEndpoint='/api/anevum/achievements/link',storage=globalThis.sessionStorage,
   navigation=globalThis.location,fetchImpl=globalThis.fetch}={}){
  if(typeof projectId!=='string'||!UUID.test(projectId))throw new TypeError('Invalid projectId');
  if(!ORIGINS.has(anevumOrigin))throw new TypeError('Use a registered ANEVUM host');
  if(!storage?.setItem||!storage?.getItem||!storage?.removeItem||!navigation?.assign||typeof fetchImpl!=='function')
   throw new TypeError('Browser session APIs required');
  this.projectId=projectId;this.anevumOrigin=anevumOrigin;
  this.reportEndpoint=urlPath(reportEndpoint);this.linkEndpoint=urlPath(linkEndpoint);
  this.storage=storage;this.navigation=navigation;this.fetchImpl=fetchImpl;
  this.achievements=Object.freeze({unlock:(key)=>this.unlock(key)});
 }
 connect(){
  const state=randomHex();
  this.storage.setItem(stateKey(this.projectId),state);
  const url=new URL('/connect/marks',this.anevumOrigin);
  url.searchParams.set('project',this.projectId);
  url.searchParams.set('state',state);
  this.navigation.assign(url.href);
 }
 async finishConnection({callbackUrl=globalThis.location?.href}={}){
  if(typeof callbackUrl!=='string')throw new TypeError('Missing callback');
  const url=new URL(callbackUrl);
  if(url.origin!==globalThis.location?.origin && globalThis.location?.origin)
   throw new Error('Callback origin mismatch');
  const state=url.searchParams.get('state'),code=url.searchParams.get('code');
  const expected=this.storage.getItem(stateKey(this.projectId));
  if(!expected||state!==expected||!code||!/^[a-f0-9]{64}$/.test(code)){
   throw new Error('Unrecognized or expired ANEVUM connection callback');
  }
  // Consume before contacting the game's own backend, preventing local replay.
  this.storage.removeItem(stateKey(this.projectId));
  return this.post(this.linkEndpoint,{projectId:this.projectId,code});
 }
 async unlock(stableKey){
  if(typeof stableKey!=='string'||!KEY.test(stableKey))throw new TypeError('Invalid achievement key');
  // Not an issuer: creator's backend must check its own authoritative state.
  return this.post(this.reportEndpoint,{projectId:this.projectId,stableKey,eventId:crypto.randomUUID()});
 }
 async post(path,payload){
  const response=await this.fetchImpl(path,{method:'POST',mode:'same-origin',credentials:'same-origin',
   redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',
   headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(payload)});
  if(!response.ok||!response.headers?.get('content-type')?.includes('application/json'))
   throw new Error('Creator achievement service unavailable');
  return response.json();
 }
}
export const createAnevumAchievements=options=>new AnevumAchievementBrowser(options);
