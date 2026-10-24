// @anevum/achievements server adapter V115. NEVER bundle into client builds.
// Publisher credentials only belong in confidential environment bindings.
const UUID4=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const KEY=/^[a-z][a-z0-9_]{2,47}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const HOSTS=new Set(['https://anevum.com','https://a.anevum.com','https://next.anevum.com']);
const valid=(value,rule)=>typeof value==='string'&&rule.test(value);
export class AnevumPublisher {
 constructor({projectId,keyId,secret,anevumOrigin='https://anevum.com',fetchImpl=globalThis.fetch}={}){
  if(!valid(projectId,UUID4)||!valid(keyId,UUID4)||!valid(secret,DIGEST))
   throw new TypeError('Invalid server publisher credentials');
  if(!HOSTS.has(anevumOrigin)||typeof fetchImpl!=='function')
   throw new TypeError('Invalid ANEVUM publisher configuration');
  this.projectId=projectId;this.origin=anevumOrigin;this.fetchImpl=fetchImpl;
  this.authorization='Bearer '+keyId+'.'+secret;
 }
 async request(action,payload){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await this.fetchImpl(this.origin+'/api/v1/marks/publisher/'+action,{
    method:'POST',redirect:'error',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',
    signal:controller.signal,
    headers:{'authorization':this.authorization,'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify({projectId:this.projectId,...payload})
   });
   if(!response.ok||!response.headers?.get('content-type')?.includes('application/json'))
    throw new Error('ANEVUM publisher request rejected: HTTP '+response.status);
   return response.json();
  }finally{clearTimeout(timeout);}
 }
 async exchange(code){
  if(!valid(code,DIGEST))throw new TypeError('Invalid ANEVUM one-time code');
  return this.request('exchange',{code});
 }
 async award({linkId,stableKey,eventId,evidenceDigest}={}){
  if(!valid(linkId,UUID4)||!valid(eventId,UUID4)||!valid(stableKey,KEY)||!valid(evidenceDigest,DIGEST))
   throw new TypeError('Invalid creator-verified event');
  return this.request('events',{linkId,stableKey,eventId,evidenceDigest});
 }
}
export const createAnevumPublisher=options=>new AnevumPublisher(options);
