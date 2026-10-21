import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as ts from 'typescript';
const file=new URL('../web/src/lib/forum-review-transport-v100.ts',import.meta.url);
const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {requestForumReview,describeForumReviewError}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const fail=async (response,options={})=>{
 const requests=[];
 const fetcher=async(path,opts)=>{requests.push({path,opts});if(response instanceof Error)throw response;return response;};
 let issue=null;
 try{await requestForumReview('GET',undefined,undefined,fetcher);}catch(e){issue=describeForumReviewError(e);}
 assert.ok(issue,'Unexpected success');
 assert.equal(requests[0].path,'/api/v1/member/forum-review');
 assert.equal(requests[0].opts.method,'GET');
 assert.equal(requests[0].opts.credentials,'same-origin');
 assert.equal(requests[0].opts.redirect,'manual');
 assert.equal(requests[0].opts.cache,'no-store');
 assert.equal(requests[0].opts.body,undefined);
 if(options.kind)assert.equal(issue.kind,options.kind);
 return issue;
};
test('opaque or explicit Access redirect never follows credentials or claims reviewer denial',async()=>{
 for(const response of [new Response(null,{status:302,headers:{location:'https://example.invalid'}}),
   {type:'opaqueredirect',status:0,ok:false,headers:new Headers()}]){
  const result=await fail(response,{kind:'access-verification'});
  assert.equal(result.showAccessLink,true);
 }
});
test('unrecognized 401/403 cannot assert a member role',async()=>{
 for(const status of [401,403]){
  const issue=await fail(new Response('<html>Access</html>',{status,headers:{'content-type':'text/html'}}),{kind:'access-verification'});
  assert.equal(issue.showAccessLink,true);
 }
});
test('only exact application errors identify session and role',async()=>{
 const session=await fail(Response.json({error:'Verified apex session required'},{status:401}),{kind:'member-session'});
 assert.equal(session.showAccessLink,false);
 const role=await fail(Response.json({error:'Reviewer access required'},{status:403}),{kind:'reviewer-role'});
 assert.equal(role.showAccessLink,false);
 const unknown=await fail(Response.json({error:'Other denial'},{status:403}),{kind:'access-verification'});
 assert.equal(unknown.showAccessLink,true);
});
test('5xx and non-JSON 200 safely classify without implying publication',async()=>{
 assert.equal((await fail(Response.json({error:'Unavailable'},{status:503}),{kind:'service'})).showAccessLink,false);
 assert.equal((await fail(new Response('<html>Login</html>',{status:200,headers:{'content-type':'text/html'}}),{kind:'invalid-response'})).showAccessLink,false);
});
test('network failures do not imply lost staff grant',async()=>{
 const issue=await fail(new TypeError('Failed to fetch'),{kind:'network-or-access'});
 assert.equal(issue.showAccessLink,false);
});
test('GET success parses JSON without publishing or exposing cookies',async()=>{
 const calls=[];
 const body={threads:[],replies:[],reports:[]};
 const result=await requestForumReview('GET',undefined,undefined,async(path,init)=>{
  calls.push({path,init});return Response.json(body);
 });
 assert.deepEqual(result,body);
 assert.equal(calls.length,1);
 assert.equal(calls[0].init.method,'GET');
 assert.equal(calls[0].init.headers.Authorization,undefined);
});
test('POST remains fail closed and never follows review redirects',async()=>{
 const calls=[];
 await assert.rejects(requestForumReview('POST',{targetKind:'thread',targetId:'fake',action:'publish'},undefined,async(path,options)=>{
  calls.push(options);throw new TypeError('redirect blocked');
 }),/protected redirect was blocked/);
 assert.equal(calls.length,1);
 assert.equal(calls[0].redirect,'error');
 assert.equal(calls[0].method,'POST');
});
