/** Deterministic negative-security tests for read-only hosted perimeter canary.
 * All traffic is synthetic; no account, cookie, publication or production mutation.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {signedOutHostedPerimeter} from '../ops/v100-acceptance-inventory.mjs';

const denied=new Set([
 '/staff','/staff/observatory','/staff/observatory/api/overview',
 '/staff/observatory/app.js','/staff/observatory/styles.css',
 '/__anevum_profile_staff_role_v001'
]);
const secured=new Set(['/api/v1/member/staff-ops','/api/v1/member/forum-review']);
const diagnostics={
 '/staff?diagnose=1':{access:'signed_out',reason:'signed_out',role:null,expiryType:null,expectedCookiePresent:false},
 '/__anevum_iren_staff_session_status_v001':{endpoint:'IREN STAFF SESSION STATUS',
  apexCookiePresent:false,canonicalSession:'not_signed_in',staffGrant:'not_checked',staffApi:'not_checked'}
};
function fixture(override){
 const calls=[];
 const request=async(url,options)=>{
  const u=new URL(url),path=u.pathname+u.search;
  assert.equal(u.origin,'https://anevum.com','Only production first-party anonymous paths');
  assert.equal(options.method,'GET');
  assert.equal(options.credentials,'omit');
  assert.equal(options.redirect,'manual');
  assert.equal(options.cache,'no-store');
  assert.ok(options.signal);
  assert.equal(options.headers.cookie,undefined);
  assert.equal(options.headers.authorization,undefined);
  calls.push(path);
  if(override?.path===path)return override.response;
  if(denied.has(path))return new Response('Denied',{status:401});
  if(secured.has(path))return new Response('',{status:302,headers:{location:'https://anevum.cloudflareaccess.com/cdn-cgi/access/login'}});
  if(Object.hasOwn(diagnostics,path))return Response.json(diagnostics[path],{headers:{'cache-control':'private, no-store'}});
  throw Error('Unexpected path: '+path);
 };
 return {request,calls};
}
test('signed-out staff and API routes deny; diagnostics are redacted',async()=>{
 const f=fixture();
 const result=await signedOutHostedPerimeter(f.request);
 assert.equal(result.status,'PASS_ANONYMOUS_ONLY');
 assert.equal(result.mutations,0);
 assert.equal(result.productionReleaseApproved,false);
 assert.equal(result.authenticatedFounder,false);
 assert.equal(result.authenticatedReviewer,false);
 assert.equal(result.authenticatedOrdinaryMember,false);
 assert.equal(result.creatorPublishingApproved,false);
 assert.equal(result.checks.length,10);
 assert.deepEqual(f.calls,[...denied,...secured,'/staff?diagnose=1',
  '/__anevum_iren_staff_session_status_v001']);
 assert.ok(result.checks.every(x=>x.denied===true||x.redacted===true));
});
test('an anonymously accessible staff page always fails closed',async()=>{
 const f=fixture({path:'/staff/observatory',response:new Response('Internal',{status:200})});
 await assert.rejects(signedOutHostedPerimeter(f.request),/must deny access/);
});
test('staff API must not return HTTP 200 or accept empty redirect location',async()=>{
 const ok=fixture({path:'/api/v1/member/staff-ops',response:Response.json({role:'owner'})});
 await assert.rejects(signedOutHostedPerimeter(ok.request),/must be Access-protected/);
 const bad=fixture({path:'/api/v1/member/staff-ops',response:new Response('',{status:302})});
 await assert.rejects(signedOutHostedPerimeter(bad.request),/redirect without location/);
});
test('redacted endpoint rejects extra fields, unexpected cookie or signed-in status',async()=>{
 const o=fixture({path:'/staff?diagnose=1',response:Response.json({...diagnostics['/staff?diagnose=1'],memberId:'private-id'})});
 await assert.rejects(signedOutHostedPerimeter(o.request),/deep-equal|Expected values to be strictly deep-equal/);
 const p=fixture({path:'/__anevum_iren_staff_session_status_v001',
   response:Response.json({...diagnostics['/__anevum_iren_staff_session_status_v001'],canonicalSession:'verified'})});
 await assert.rejects(signedOutHostedPerimeter(p.request),/not_signed_in/);
});
test('unexpected unauthenticated Observatory asset or status rejects',async()=>{
 const f=fixture({path:'/staff/observatory/app.js',response:new Response('script',{status:200})});
 await assert.rejects(signedOutHostedPerimeter(f.request),/must deny access/);
 const g=fixture({path:'/__anevum_iren_staff_session_status_v001',response:new Response('<html>Access</html>',{headers:{'content-type':'text/html'}})});
 await assert.rejects(signedOutHostedPerimeter(g.request),/Diagnostic JSON required/);
});
