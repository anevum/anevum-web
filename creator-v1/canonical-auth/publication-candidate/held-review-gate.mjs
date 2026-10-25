/**
 * Source-only private canonical Better Auth held-review adapter.
 * Intentionally NOT registered with a Worker router. This prepares held
 * records only; it NEVER approves or publishes a project.
 *
 * A future Worker must inject its trusted Better Auth getSession function.
 * No request field, cookie name, cosmetic role or handle may select an actor.
 */
import {canonicalConfigState,canonicalSchemaReady,canonicalRequestOrigin,
  isCanonicalOrigin,withoutForeignCookies} from '../policy.mjs';
import {boundedText} from '../request-body.mjs';
import {recordHeldStudioPublication} from './held-outbox.mjs';

const PATH='/api/v1/member/studio/review/held-intent';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ID=/^[A-Za-z0-9._:-]{1,128}$/;
const CONTROL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const exact=(x,fields)=>Object.keys(x).sort().join(',')===fields.slice().sort().join(',');

/** The caller's trusted identity engine is a non-HTTP dependency; absent by
 * default so a standalone import cannot create reviewer authority. */
export async function holdReviewForCanonicalSession(request,env,{
  getCanonicalSession,now=Math.floor(Date.now()/1000)
}={}){
  if(env?.CANONICAL_STUDIO_HELD_REVIEW_ENABLED!=='true' ||
      env?.CANONICAL_CREATOR_STUDIO_ENABLED!=='true')
    throw new Error('Private held review not activated');
  if(typeof getCanonicalSession!=='function' || !Number.isSafeInteger(now) || now<=0)
    throw new Error('Trusted canonical reviewer gate unavailable');
  if(!(request instanceof Request) || request.method!=='POST' ||
      !isCanonicalOrigin(request,env) ||
      new URL(request.url).pathname!==PATH ||
      new URL(request.url).search)
    throw new Error('Private held review request denied');
  const origin=request.headers.get('origin');
  const site=request.headers.get('sec-fetch-site');
  if(origin!==canonicalRequestOrigin(env) || (site!==null && site!=='same-origin' && site!=='none') ||
      request.headers.has('authorization'))
    throw new Error('Private held review origin denied');
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    throw new Error('Expected private JSON request');
  if(!canonicalConfigState(env).operational || !await canonicalSchemaReady(env))
    throw new Error('Canonical issuer not independently verified');

  // Better Auth must resolve the current revoked/expired session. The only
  // headers it receives are first-party canonical cookies; legacy cookies and
  // Authorization cannot contribute to this decision.
  const filtered=withoutForeignCookies(request,env);
  const session=await getCanonicalSession({headers:filtered.headers});
  const member=session?.user,token=session?.session;
  if(member?.emailVerified!==true || !ID.test(member?.id||'') ||
      typeof token?.id!=='string' || !token.id ||
      token.userId!==member.id)
    throw new Error('Verified canonical reviewer session required');
  const persisted=await env.MEMBER_DB.prepare(
    'SELECT id,emailVerified FROM "user" WHERE id=? LIMIT 1'
  ).bind(member.id).first();
  if(persisted?.id!==member.id || persisted.emailVerified!==1)
    throw new Error('Verified reviewer is no longer active');

  const raw=await boundedText(request,1600);
  if(raw===null)throw new Error('Private held review body unavailable');
  let input;
  try{input=JSON.parse(raw);}catch{throw new Error('Invalid private review request');}
  if(!input||typeof input!=='object'||Array.isArray(input)||
      !exact(input,['submissionId','reason']) ||
      typeof input.submissionId!=='string'||!UUID.test(input.submissionId)||
      typeof input.reason!=='string'||input.reason.length>1200 ||
      input.reason.trim().length<12 || CONTROL.test(input.reason) ||
      input.reason!==input.reason.trim())
    throw new Error('Invalid private review fields');

  // A retry does not invent a new reviewer timestamp. Preserve the exact
  // original frozen decision only when actor and reason are unchanged; the
  // held-outbox layer performs the definitive immutable fingerprint check.
  const prior=await env.MEMBER_DB.prepare(
    'SELECT reviewer_user_id,reviewer_reason,created_at FROM '+
    'member_studio_publication_reviews WHERE submission_id=? LIMIT 1'
  ).bind(input.submissionId).first();
  const reviewTime=prior?.reviewer_user_id===member.id &&
    prior?.reviewer_reason===input.reason &&
    Number.isSafeInteger(prior.created_at)?prior.created_at:now;
  const result=await recordHeldStudioPublication(env.MEMBER_DB,{
    submissionId:input.submissionId,reviewerId:member.id,
    reason:input.reason,reviewedAt:reviewTime
  });
  return Object.freeze({
    status:result.status,replayed:result.replayed,
    receiptId:result.reviewId,publicationAuthorized:false,projectionEnabled:false
  });
}
