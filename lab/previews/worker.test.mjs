import test from 'node:test';
import assert from 'node:assert/strict';
import lab from './worker.mjs';
const req=(path,options={},host='https://lab.anevum.com')=>lab.fetch(new Request(host+path,options));
test('real host and exact preview routes remain separate from existing Lab and staff',async()=>{
 const page=await req('/previews/');assert.equal(page.status,200);
 const html=await page.text();
 for(const x of ['Wayfinder','Player identity','IREN guide','Staff workspace','Registration','SYNTHETIC','SIMULATE APPROVAL','OPEN SOURCE REVIEW'])assert.match(html,new RegExp(x,'i'));
 assert.equal((await req('/previews')).status,308);
 assert.equal((await req('/projects/rhen/')).status,404);
 assert.equal((await req('/projects/backstage/moderation/')).status,404);
 assert.equal((await req('/api/v1/member/health')).status,404);
 assert.equal((await req('/staff')).status,404);
});
test('no other host including workers.dev may display preview content',async()=>{
 for(const host of ['https://malicious.example','https://anevum.com','https://anevum-lab-previews-v001.devonakins.workers.dev','http://lab.anevum.com']){
  const r=await req('/previews/',{},host);assert.equal(r.status,404,host);
  assert.doesNotMatch(await r.text(),/Wayfinder|Member identity/);
 }
});
test('no writes, cache leaks, script injection or external runtime requests',async()=>{
 const page=await req('/previews/');const csp=page.headers.get('content-security-policy');
 assert.match(csp,/default-src 'none'/);assert.match(csp,/frame-ancestors 'none'/);
 assert.match(csp,/connect-src 'none'/);assert.match(csp,/form-action 'none'/);
 assert.doesNotMatch(csp,/unsafe-inline|unsafe-eval|\*/);
 assert.equal(page.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
 assert.match(page.headers.get('cache-control'),/no-store/);
 assert.equal((await req('/previews/',{method:'POST'})).status,405);
 assert.equal((await req('/previews/api/login')).status,404);
 assert.equal((await req('/previews/ui.js',{method:'PUT'})).status,405);
 const script=await(await req('/previews/ui.js')).text();
 assert.doesNotMatch(script,/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|document\.cookie/);
 assert.match(script,/SIMULATED APPROVAL/);
 assert.match(script,/openScene\('wayfinder',false\)/);
 assert.equal((await req('/previews/mark.svg')).headers.get('content-type'),'image/svg+xml; charset=utf-8');
});
test('manifest is truthful, small and explicitly synthetic',async()=>{
 const r=await req('/previews/manifest.json');assert.equal(r.status,200);
 const j=await r.json();
 assert.deepEqual(j.features,['wayfinder','identity','iren','staff','registration']);
 assert.equal(j.productionWrites,false);assert.equal(j.dataMode,'SYNTHETIC_NO_DATABASE');
 assert.equal(j.authMode,'EXISTING_CLOUDFLARE_ACCESS');
 assert.equal((await req('/previews/health')).status,200);
});
test('HEAD preserves status/header contract without returning content',async()=>{
 for(const path of ['/previews/','/previews/ui.js','/previews/manifest.json']){
  const r=await req(path,{method:'HEAD'});assert.equal(r.status,200,path);
  assert.equal(await r.text(),'');assert.match(r.headers.get('cache-control'),/no-store/);
 }
});
