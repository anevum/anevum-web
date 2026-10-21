/** Access handoff cannot grant permissions. These tests use local fetch stubs. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {ReviewTransportError,requestForumReview,describeForumReviewError}
 from '../web/src/lib/forum-review-transport-v100.ts';

const make=(response)=>{
 let called=0,received;
 const fetcher=async (path,init)=>{
  called++;received={path,init};
  return typeof response==='function'?response():response;
 };
 return {fetcher,count:()=>called,last:()=>received};
};
const kind=async(operation,want)=>{
 await assert.rejects(operation,error=>{
  assert.ok(error instanceof ReviewTransportError);
  assert.equal(error.kind,want);
  return true;
 });
};
test('GET uses same-origin cookies but never follows redirects or sends account tokens',async()=>{
 const fixture=make(Response.json({threads:[],replies:[],reports:[]}));
 const value=await requestForumReview('GET',undefined,undefined,fixture.fetcher);
 assert.deepEqual(value,{threads:[],replies:[],reports:[]});
 const {path,init}=fixture.last();
 assert.equal(fixture.count(),1);
 assert.equal(path,'/api/v1/member/forum-review');
 assert.equal(init.credentials,'same-origin');
 assert.equal(init.mode,'same-origin');
 assert.equal(init.redirect,'manual');
 assert.equal(init.method,'GET');
 assert.equal(init.cache,'no-store');
 assert.equal(init.referrerPolicy,'same-origin');
 assert.equal(init.body,undefined);
 assert.equal(init.headers.Accept,'application/json');
 assert.equal(init.headers.Authorization,undefined);
});
test('HTTP Access challenge 302 is detected without following or reading its Location',async()=>{
 const req=make(new Response(null,{status:302,headers:{Location:'https://anevum.cloudflareaccess.com/cdn-cgi/access/login'}}));
 await kind(()=>requestForumReview('GET',undefined,undefined,req.fetcher),'access-verification');
 assert.equal(req.count(),1);
 assert.equal(describeForumReviewError(new ReviewTransportError('access-verification','challenge')).showAccessLink,true);
});
test('Safari opaque manual redirect is treated as Access challenge',async()=>{
 const opaque={type:'opaqueredirect',status:0};
 await kind(()=>requestForumReview('GET',undefined,undefined,async()=>opaque),'access-verification');
});
test('only exact app-auth JSON distinguishes member 401 and reviewer 403 from Access',async()=>{
 await kind(()=>requestForumReview('GET',undefined,undefined,
   make(Response.json({error:'Verified apex session required'},{status:401})).fetcher),'member-session');
 await kind(()=>requestForumReview('GET',undefined,undefined,
   make(Response.json({error:'Reviewer access required'},{status:403})).fetcher),'reviewer-role');
 for(const status of [401,403]){
  await kind(()=>requestForumReview('GET',undefined,undefined,
   make(new Response('<html>Cloudflare Access</html>',{status,headers:{'content-type':'text/html'}})).fetcher),'access-verification');
 }
 assert.equal(describeForumReviewError(new ReviewTransportError('reviewer-role','denied')).showAccessLink,false);
 assert.equal(describeForumReviewError(new ReviewTransportError('member-session','expired')).showAccessLink,false);
});
test('HTTP 503, bad JSON and a 200 HTML login page all fail closed',async()=>{
 await kind(()=>requestForumReview('GET',undefined,undefined,make(new Response(null,{status:503})).fetcher),'service');
 await kind(()=>requestForumReview('GET',undefined,undefined,make(new Response('<html>sign in</html>',{
  status:200,headers:{'content-type':'text/html'}})).fetcher),'invalid-response');
 await kind(()=>requestForumReview('GET',undefined,undefined,make(new Response('{invalid',{
  status:200,headers:{'content-type':'application/json'}})).fetcher),'invalid-response');
});
test('network failures remain ambiguous, never impersonate a denied staff role',async()=>{
 const down=async()=>{throw new TypeError('Failed to fetch');};
 await kind(()=>requestForumReview('GET',undefined,undefined,down),'network-or-access');
 const error=describeForumReviewError(new TypeError('Failed to fetch'));
 assert.equal(error.kind,'network-or-access');
 assert.match(error.description,/network|Cloudflare Access/i);
 assert.equal(error.showAccessLink,false);
});
test('aborted request is preserved to avoid ghost login prompts',async()=>{
 const controller=new AbortController();controller.abort();
 const error=new DOMException('This request was aborted','AbortError');
 await assert.rejects(requestForumReview('GET',undefined,controller.signal,async()=>{throw error}),x=>x===error);
});
test('POST never automatically follows redirects and retains same-origin safeguards',async()=>{
 const f=make(Response.json({ok:true}));
 const x=await requestForumReview('POST',{action:'publish'},undefined,f.fetcher);
 assert.deepEqual(x,{ok:true});
 const {init}=f.last();
 assert.equal(init.redirect,'error');
 assert.equal(init.credentials,'same-origin');
 assert.equal(init.body,'{"action":"publish"}');
 assert.equal(init.headers['Content-Type'],'application/json');
});
test('unexpected manual POST redirect still fails closed',async()=>{
 const req=make(new Response(null,{status:302,headers:{location:'/other'}}));
 await kind(()=>requestForumReview('POST',{action:'reject'},undefined,req.fetcher),'access-verification');
 assert.equal(req.count(),1);
});
