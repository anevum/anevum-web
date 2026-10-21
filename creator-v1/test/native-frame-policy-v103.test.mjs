import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{policy} from '../operations/anevum-native-frame-policy-v002.mjs';
const runtime='https://anevum-package-alpha-v003-runtime.devonakins.workers.dev';
test('default-OFF policy preserves existing directives and self-only legacy framing',()=>{
 assert.equal(policy(''), '');
 const original="default-src 'none'; script-src 'self'; frame-ancestors 'none'";
 assert.equal(policy(original),original+"; frame-src 'self'");
 assert.equal(policy(original+"; frame-src 'none'"),original+"; frame-src 'none'");
});
test('native opt-in permits only the fixed isolated runtime alongside existing self media',()=>{
 for(const original of ["default-src 'none'","default-src 'none'; frame-src 'self'"]){
  const result=policy(original,true);
  assert.ok(result.endsWith("frame-src 'self' "+runtime));
  assert.match(result,/default-src 'none'/);
  assert.doesNotMatch(result,/allow-same-origin|https:;|frame-src \*/);
  assert.equal(policy(result,true),result);
 }
 const locked="default-src 'none'; frame-src 'none'";
 assert.equal(policy(locked,true),locked,'An explicit stricter upstream frame directive is preserved');
});
test('HTML adapter preserves identity headers, permissions and non-frame CSP',async()=>{
 const request=new Request('https://anevum.com/projects/package/test',{headers:{cookie:'synthetic'}});
 let forwarded;
 const env={PACKAGE_NATIVE_STUDIO_ENABLED:'true',UPSTREAM:{fetch:async req=>{
  forwarded=req;
  return new Response('<main>Trusted app</main>',{headers:{'content-type':'text/html',
   'content-security-policy':"default-src 'none'; script-src 'self'; frame-ancestors 'none'; object-src 'none'",
   'permissions-policy':'payment=(),camera=()','cache-control':'private,no-store'}});
 }}};
 const result=await worker.fetch(request,env);
 assert.equal(forwarded,request);
 assert.equal(result.headers.get('permissions-policy'),'payment=(),camera=()');
 assert.equal(result.headers.get('cache-control'),'private,no-store');
 for(const part of ["frame-ancestors 'none'","object-src 'none'","script-src 'self'",runtime])assert.ok(result.headers.get('content-security-policy').includes(part));
 assert.equal(await result.text(),'<main>Trusted app</main>');
});
test('API and denied HTML pass through unchanged without reads, redirects or authority changes',async()=>{
 for(const [status,type] of [[401,'text/html'],[200,'application/json'],[302,'text/html']]){
  const original=new Response('opaque',{status,headers:{'content-type':type,'content-security-policy':"default-src 'none'"}});
  const result=await worker.fetch(new Request('https://anevum.com/api/v1/member/space'),{PACKAGE_NATIVE_STUDIO_ENABLED:'true',UPSTREAM:{fetch:async()=>original}});
  assert.equal(result,original);
 }
});
