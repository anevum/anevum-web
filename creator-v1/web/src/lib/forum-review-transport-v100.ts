/** Canonical forum review transport diagnostics.
 * This module does not grant roles, exchange tokens, follow redirects, or alter
 * Cloudflare Access. It only distinguishes observable HTTP/browser failures.
 */
export type ReviewFailureKind=
 | 'access-verification'
 | 'member-session'
 | 'reviewer-role'
 | 'service'
 | 'network-or-access'
 | 'invalid-response';

export class ReviewTransportError extends Error {
 readonly kind:ReviewFailureKind;
 constructor(kind:ReviewFailureKind,message:string){
  super(message);
  this.name='ReviewTransportError';
  this.kind=kind;
 }
}

const ENDPOINT='/api/v1/member/forum-review';
const isRedirect=(status:number)=>[301,302,303,307,308].includes(status);

/** Browser manual-redirect responses may hide the Location and use status 0.
 * Do not read, log, follow, or rewrite a private service's redirect URL.
 */
export async function requestForumReview<T>(
 method:'GET'|'POST',body?:unknown,signal?:AbortSignal,requester:typeof fetch=fetch
):Promise<T>{
 let response:Response;
 try{
  response=await requester(ENDPOINT,{
   method,mode:'same-origin',credentials:'same-origin',
   redirect:method==='GET'?'manual':'error',
   cache:'no-store',referrerPolicy:'same-origin',signal,
   headers:body!==undefined
    ?{Accept:'application/json','Content-Type':'application/json'}
    :{Accept:'application/json'},
   body:body!==undefined?JSON.stringify(body):undefined
  });
 }catch(error){
  // An aborted React resource request is not a sign-in failure.
  if(signal?.aborted)throw error;
  throw new ReviewTransportError('network-or-access',
   'The review service could not be reached or a protected redirect was blocked.');
 }
 if(response.type==='opaqueredirect'||isRedirect(response.status)){
  throw new ReviewTransportError('access-verification',
   'Additional Cloudflare Access verification is required for this protected review API.');
 }
 if(response.status===401)throw new ReviewTransportError('member-session',
  'A current ANEVUM member session is required.');
 if(response.status===403)throw new ReviewTransportError('reviewer-role',
  'This account was not authorized to read the review queue.');
 if(!response.ok)throw new ReviewTransportError('service',
  'The protected review service returned HTTP '+response.status+'.');
 if(!/application\/json/i.test(response.headers.get('content-type')||'')){
  throw new ReviewTransportError('invalid-response',
   'The review API did not return JSON; an additional sign-in page may have been returned.');
 }
 try{return await response.json() as T;}
 catch{throw new ReviewTransportError('invalid-response',
  'The review API returned an invalid JSON response.');}
}

export function describeForumReviewError(error:unknown){
 const kind=error instanceof ReviewTransportError?error.kind:'network-or-access';
 switch(kind){
  case 'access-verification':
   return {kind,title:'Additional staff verification required.',
    description:'Your ANEVUM member session and the separate Cloudflare Access check are different. Use the approved staff email to complete Access verification, then return and retry. No review actions were submitted.',
    showAccessLink:true};
  case 'member-session':
   return {kind,title:'ANEVUM sign-in required.',
    description:'Your ANEVUM member session is not currently verified. Sign in to your account before opening the private review queue.',
    showAccessLink:false};
  case 'reviewer-role':
   return {kind,title:'Reviewer permission required.',
    description:'The protected API denied this account. A review role must be granted by the existing staff authorization system; retrying will not create one.',
    showAccessLink:false};
  case 'service':
   return {kind,title:'Review service temporarily unavailable.',
    description:'The private review API responded with an error. No review decisions were submitted by this page load. Try again later.',
    showAccessLink:false};
  case 'invalid-response':
   return {kind,title:'Review authorization could not be confirmed.',
    description:'The protected API returned a response the review desk cannot safely interpret. Complete any outstanding Access verification and try again.',
    showAccessLink:false};
  default:
   return {kind,title:'Review connection could not be verified.',
    description:'A network interruption or an outstanding Cloudflare Access challenge may have interrupted this request. Your ANEVUM account status is not changed.',
    showAccessLink:false};
 }
}
