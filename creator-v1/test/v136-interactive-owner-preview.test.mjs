// Isolated, public-link visual review of the actual V136 frontend.
// No Cloudflare secrets, member sessions, D1, upload capability, or live writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import preview from '../web/v136-visual-review.worker.mjs';

const origin='https://anevum-v136-visual-review-001.devonakins.workers.dev';
const make=(path='/',method='GET',headers={})=>
 new Request(origin+path,{method,headers});
const environment={
 ASSETS:{
  async fetch(req){
   const path=new URL(req.url).pathname;
   const html='<!doctype html><html><head><title>ANEVUM — Create Beyond Worlds</title></head><body><div id="root"></div><script src="/creator/assets/index-test.js"></script></body></html>';
   if(path==='/'||path==='/discover'||path==='/studio')
    return new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}});
   if(path==='/assets/index-test.js'||path==='/assets/institute/v136-011/atrium-mobile.glb')
    return new Response('window.__anevumPreviewTest=true;',{
     headers:{'content-type':'text/javascript'}
    });
   return new Response('Not found',{status:404});
  }
 }
};

test('zero-production immutable preview identity and GET/HEAD boundaries',async()=>{
 const cfg=JSON.parse(readFileSync(new URL('../wrangler.v136-interactive-review.jsonc',import.meta.url),'utf8'));
 assert.equal(cfg.name,'anevum-v136-visual-review-001');
 assert.equal(cfg.workers_dev,true);
 assert.equal(cfg.preview_urls,false);
 assert.deepEqual(cfg.routes,[]);
 assert.equal(cfg.main,'./web/v136-visual-review.worker.mjs');
 assert.equal(cfg.assets.directory,'./dist/react-staging');
 assert.equal(cfg.assets.binding,'ASSETS');
 assert.equal(cfg.assets.run_worker_first,true);
 assert.equal(cfg.d1_databases,undefined);
 assert.equal(cfg.vars,undefined);
 assert.equal(cfg.services,undefined);
 assert.equal(cfg.r2_buckets,undefined);
 const redirected=await preview.fetch(make('/'),environment);
 assert.equal(redirected.status,307);
 assert.equal(redirected.headers.get('location'),origin+'/creator/');
 const homeReload=await preview.fetch(make('/creator'),environment);
 assert.equal(homeReload.status,307);
 assert.equal(homeReload.headers.get('location'),origin+'/creator/');
 assert.equal((await preview.fetch(make('/creator/','POST'),environment)).status,405);
 assert.equal((await preview.fetch(make('/creator/','OPTIONS'),environment)).status,405);
 const health=await preview.fetch(make('/__review/health'),environment);
 assert.equal(health.status,200);
 assert.deepEqual(JSON.parse(await health.text()),{
  application:'ANEVUM V136',sourceSha:'unbuilt-local-source',
  kind:'non-production-interactive-preview',access:'public-link',content:'compiled-real-frontend',
  accounts:false,publishing:false,payments:false,privateData:false
 });
});

test('real app shell served with non-production badge, CSP and no cookies',async()=>{
 const result=await preview.fetch(make('/creator/'),environment);
 const html=await result.text();
 assert.equal(result.status,200);
 assert.match(html,/id="root"/);
 assert.match(html,/V136 INTERACTIVE PREVIEW/);
 assert.match(html,/Account, publication &amp; payment actions disabled/);
 assert.match(html,/creator\/assets\/index-test.js/);
 assert.match(result.headers.get('content-security-policy')||'',/form-action 'none'/);
 assert.match(result.headers.get('content-security-policy')||'',/connect-src 'self'/);
 assert.match(result.headers.get('content-security-policy')||'',/frame-ancestors 'none'/);
 assert.equal(result.headers.get('x-frame-options'),'DENY');
 assert.equal(result.headers.get('x-robots-tag'),'noindex, nofollow, noarchive, nosnippet');
 assert.equal(result.headers.get('referrer-policy'),'no-referrer');
 assert.equal(result.headers.has('set-cookie'),false);
 for(const path of ['/creator/discover','/creator/studio']){
  const page=await preview.fetch(make(path),environment);
  assert.equal(page.status,200);
  assert.match(await page.text(),/NON-PRODUCTION/);
 }
 const head=await preview.fetch(make('/creator/','HEAD'),environment);
 assert.equal(head.status,200);
 assert.equal(await head.text(),'');
});

test('all writes, member/account paths and unrelated root routes fail closed',async()=>{
 for(const method of ['POST','PUT','DELETE','PATCH']){
  assert.equal((await preview.fetch(make('/creator/api/v1/projects',method),environment)).status,405);
  assert.equal((await preview.fetch(make('/creator/api/v1/member/creator-profile',method),environment)).status,405);
 }
 for(const path of [
  '/creator/api/v1/member/creator-profile',
  '/creator/api/v1/member/auth/get-session',
  '/creator/api/v1/member/auth/sign-in',
  '/creator/api/v1/auth/login',
  '/creator/api/v1/member/payments'
 ])assert.equal((await preview.fetch(make(path),environment)).status,403,path);
 for(const path of [
  '/api/v1/status','/admin','/portfolio','/creator/api/v1/payments',
  '/creator/api/v1/upload','/creator/api/v1/publish','/creator/api/v1/private',
  '/creator/api/v1/invite'
 ])assert.equal((await preview.fetch(make(path),environment)).status,404,path);
 const other=await preview.fetch(new Request('https://anevum.com/creator/'),environment);
 assert.equal(other.status,404);
});

test('review static media and script paths never need production network',async()=>{
 for(const path of ['/creator/assets/index-test.js','/assets/institute/v136-011/atrium-mobile.glb']){
  const response=await preview.fetch(make(path),environment);
  assert.equal(response.status,200);
  assert.equal(await response.text(),'window.__anevumPreviewTest=true;');
 }
 assert.equal((await preview.fetch(make('/assets/private/secrets'),environment)).status,404);
 assert.equal((await preview.fetch(make('/.well-known/security.txt'),environment)).status,404);
});

test('public catalogue proxy is anonymous and read-only',async()=>{
 const real=globalThis.fetch;
 let called=[];
 globalThis.fetch=async(input,options={})=>{
  called.push({url:String(input),method:options.method,credentials:options.credentials,
   headers:options.headers});
  return new Response('{"items":[],"count":0,"nextCursor":null}',{
   status:200,headers:{'content-type':'application/json','set-cookie':'nope=1'}
  });
 };
 try{
  const input=make('/creator/api/v1/projects?limit=2','GET',{
   Cookie:'private-session=fake',Authorization:'Bearer fake','X-Whatever':'should-not-cross'
  });
  const res=await preview.fetch(input,environment);
  assert.equal(res.status,200);
  assert.equal(res.headers.get('x-anevum-review-data'),'anonymous-approved-public-catalogue');
  assert.equal(res.headers.has('set-cookie'),false);
  assert.equal(called.length,1);
  assert.equal(called[0].url,'https://anevum.com/api/v1/projects?limit=2');
  assert.equal(called[0].method,'GET');
  assert.equal(called[0].credentials,'omit');
  assert.deepEqual(called[0].headers,{Accept:'application/json'});
  assert.equal((await preview.fetch(make('/creator/api/v1/unsafe'),environment)).status,404);
 }finally{globalThis.fetch=real;}
});

test('isolated preview pins exact live V67 100% gateway without weakening postflight',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/v136-interactive-owner-review.yml',import.meta.url),'utf8');
 assert.match(workflow,/2c6b4ebf-cfc6-4ddf-aa58-e61a1c8eb6a7/);
 assert.match(workflow,/a195834f-a0ec-4a0b-be78-1c6e905961f7/);
 assert.match(workflow,/\["a195834f-a0ec-4a0b-be78-1c6e905961f7",100\]/);
 assert.match(workflow,/\.result\.deployments\[0\]\.id==\$prev\[0\]\.result\.deployments\[0\]\.id/);
 assert.match(workflow,/\.result\.deployments\[0\]\.versions==\$prev\[0\]\.result\.deployments\[0\]\.versions/);
 assert.match(workflow,/cmp "\$RUNNER_TEMP\/anevum-review\/routes-canonical-before\.json"/);
 assert.doesNotMatch(workflow,/EXISTING_ASSETS_ONLY_PREVIEW_ROLLBACK_CAPTURED_99_1/);
 assert.match(workflow,/EXISTING_ASSETS_ONLY_PREVIEW_ROLLBACK_CAPTURED_V67_100_GATEWAY_UNCHANGED/);
 assert.doesNotMatch(workflow,/cd6fa4f2-4382-49e2-a02b-b3d73cc41398|77c8a9a6-f1ee-44fb-87d6-3271b3115c37/);
});

test('preview deploy authorization follows the merged development PR, not closed #779',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/v136-interactive-owner-review.yml',import.meta.url),'utf8');
 assert.match(workflow,/github\.event\.pull_request\.number == 763/);
 assert.match(workflow,/github\.event\.pull_request\.head\.repo\.full_name == 'anevum\/anevum-web'/);
 assert.doesNotMatch(workflow,/review\/v136-interactive-public-owner-20261025-001/);
});
