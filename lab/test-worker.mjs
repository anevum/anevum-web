// ANEVUM Private Lab — safe offline tests of routes, metadata and domain isolation.
import test from 'node:test';
import assert from 'node:assert/strict';
import lab from './worker.mjs';
import {FOLD_ASSETS,FOLD_SOURCE_SHA} from './fold-snapshot.mjs';
const request=(path='/',opts={})=>lab.fetch(new Request('https://lab.anevum.com'+path,opts));
test('Lab landing includes exactly the connected playable Fold and honest other entries',async()=>{
 const r=await request('/');const page=await r.text();
 assert.equal(r.status,200);
 assert.match(page,/The Fold/);assert.match(page,/RHEN/);assert.match(page,/Transcosmic/);
 assert.match(page,/1 playable/);assert.match(page,/2 waiting for connection/);
 assert.equal((page.match(/PLAY NOW/g)||[]).length,1);
 assert.equal((page.match(/NOT CONNECTED/g)||[]).length,2);
 assert.equal(r.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');
 assert.match(r.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
 assert.equal(r.headers.get('Cache-Control'),'private, no-store, max-age=0');
});
test('Fold has private direct-play route, proper game assets and owner navigation',async()=>{
 const redirect=await request('/projects/the-fold');
 assert.equal(redirect.status,308);
 assert.equal(redirect.headers.get('location'),'/projects/the-fold/');
 const response=await request('/projects/the-fold/');
 const html=await response.text();
 assert.equal(response.status,200);
 assert.match(html,/THE FOLD/);
 assert.match(html,/id="introPlay"/);
 assert.match(html,/src="\.\/fold\.js"/);
 assert.match(html,/href="\/" class="lab-return"/);
 assert.match(html,/lab\.anevum\.com|ANEVUM Lab/);
 assert.match(html,/id="privacyButton"/);
});
test('Fold asset snapshot is coherent with exact source revision',async()=>{
 assert.match(FOLD_SOURCE_SHA,/^[0-9a-f]{40}$/);
 for(const name of ['fold.css','fold-v2.css','fold.js','core.mjs','atlas.mjs','icons.svg']){
  const path='/projects/the-fold/'+name;
  assert.ok(FOLD_ASSETS[path]?.length>20,'missing '+name);
  const r=await request(path);
  assert.equal(r.status,200,'asset '+name);
  assert.equal(await r.text(),FOLD_ASSETS[path]);
  assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 }
 assert.equal((await request('/projects/the-fold/icons.svg')).headers.get('Content-Type'),'image/svg+xml; charset=utf-8');
 assert.match(FOLD_ASSETS['/projects/the-fold/index.html'],/fold-v2\.css/);
});
test('RHEN and Transcosmic do not disclose privileged destinations or simulate actual previews',async()=>{
 for(const slug of ['rhen','transcosmic']){
  const r=await request('/projects/'+slug);const t=await r.text();
  assert.equal(r.status,200);assert.match(t,/Preview not connected/);
  assert.doesNotMatch(t,/<iframe/i);
  assert.doesNotMatch(t,/alpaca\.markets|DATABASE_URL|api_secret/i);
 }
});
test('non-Lab hosts cannot reach game, even if direct Worker preview host is requested',async()=>{
 const r=await lab.fetch(new Request('https://any-user.workers.dev/projects/the-fold/'));
 assert.equal(r.status,404);
 assert.doesNotMatch(await r.text(),/THE FOLD/);
});
test('HEAD, restricted methods and unknown paths are handled safely',async()=>{
 assert.equal((await request('/projects/the-fold/',{method:'HEAD'})).status,200);
 assert.equal(await (await request('/projects/the-fold/',{method:'HEAD'})).text(),'');
 assert.equal((await request('/',{method:'POST'})).status,405);
 assert.equal((await request('/projects/not-known')).status,404);
 assert.equal((await request('/lab/secrets')).status,404);
});
test('health and robots disclose only nonsensitive build state',async()=>{
 const r=await request('/health');
 assert.equal(r.status,200);
 const info=await r.json();
 assert.equal(info.status,'ok');
 assert.equal(info.projects,3);
 assert.equal(info.fold,FOLD_SOURCE_SHA.slice(0,12));
 assert.equal((await request('/robots.txt')).status,200);
 assert.match(await (await request('/robots.txt')).text(),/Disallow: \//);
});
test('security headers permit optional live map but restrict origin and location features',async()=>{
 const r=await request('/projects/the-fold/');
 const csp=r.headers.get('Content-Security-Policy');
 assert.match(csp,/script-src 'self' https:\/\/unpkg\.com/);
 assert.match(csp,/connect-src 'self' https:\/\/unpkg\.com https:\/\/\*\.openfreemap\.org/);
 assert.match(csp,/worker-src 'self' blob:/);
 assert.equal(r.headers.get('Permissions-Policy'),'camera=(), microphone=(), geolocation=(self)');
 assert.equal(r.headers.get('Referrer-Policy'),'no-referrer');
});
