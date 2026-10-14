// ANEVUM Private Lab — safe offline tests of routes, metadata and domain isolation.
import test from 'node:test';
import assert from 'node:assert/strict';
import lab from './worker.mjs';
import {FOLD_ASSETS,FOLD_SOURCE_SHA} from './fold-snapshot.mjs';
import {RHEN_REVIEW,RHEN_SOURCE} from './rhen-snapshot.mjs';
const request=(path='/',opts={})=>lab.fetch(new Request('https://lab.anevum.com'+path,opts));
test('Lab home lists protected Fold, RHEN research, Transcosmic and Backstage',async()=>{
 const r=await request('/');const page=await r.text();
 assert.equal(r.status,200);
 assert.match(page,/THE FOLD/);assert.match(page,/RHEN/);assert.match(page,/TRANSCOSMIC/);
 assert.match(page,/PLAYABLE/);assert.match(page,/RHEN/);assert.match(page,/BACKSTAGE/);
 assert.equal((page.match(/data-path="\/projects\/the-fold\/"/g)||[]).length,1);
 assert.match(page,/OPEN TERMINAL/);
 assert.match(page,/LOCAL STUDIO/);assert.match(page,/LOCAL DESK/);
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
test('RHEN terminal is available without simulated accounts; original research is preserved',async()=>{
 const redirect=await request('/projects/rhen');assert.equal(redirect.status,308);
 const r=await request('/projects/rhen/'),html=await r.text();
 assert.equal(r.status,200);assert.match(html,/RHEN · Terminal/);assert.match(html,/id="metricEquity"/);assert.match(html,/id="historySvg"/);
 assert.match(html,/ENGINE OFFLINE/);assert.match(html,/NOT CONNECTED/);
 assert.match(html,/OPEN RESEARCH CONSOLE/);assert.doesNotMatch(html,/APCA-API-SECRET-KEY|APCA-API-KEY-ID|<form[^>]*order/i);
 assert.equal((await request('/projects/rhen/terminal.css')).status,200);
 assert.equal((await request('/projects/rhen/terminal.js')).status,200);
 assert.match(await (await request('/projects/rhen/terminal.css')).text(),/height:100dvh/);
 assert.match(await (await request('/projects/rhen/terminal.js')).text(),/api\/overview/);
 const research=await request('/projects/rhen/research/');assert.equal(research.status,200);
 const rhtml=await research.text();assert.match(rhtml,/Research Console/);assert.match(rhtml,/id="costForm"/);
 assert.equal((await request('/projects/rhen/app.css')).status,200);
});
test('broker observer fails closed and exposes no order or credential management routes',async()=>{
 const res=await request('/projects/rhen/api/overview');assert.equal(res.status,200);
 const data=await res.json();
 assert.equal(data.schema,'anevum.lab.rhen-observer.v1');
 assert.equal(data.provider.state,'NOT_CONNECTED');assert.equal(data.account,null);
 assert.equal(data.orders,null);assert.equal(data.positions,null);
 assert.equal(data.scanner.state,'OFFLINE');assert.equal(data.engine.execution,'DISABLED');
 assert.equal((await request('/projects/rhen/api/overview',{method:'HEAD'})).status,405);
 assert.equal((await request('/projects/rhen/api/overview',{method:'POST'})).status,405);
 assert.equal((await request('/projects/rhen/api/order',{method:'GET'})).status,404);
 assert.equal(res.headers.get('Cache-Control'),'private, no-store, max-age=0');
});
test('RHEN actual source is pinned to the unmerged F1-F3f candidate and served safely as text',async()=>{
 assert.equal(RHEN_REVIEW.source_commit,'d68ac5ec4df6378364dfd1b893ee4d5862a834e4');
 assert.equal(RHEN_REVIEW.production,'NOT_DEPLOYED');
 assert.equal(RHEN_REVIEW.mode,'PAPER_RESEARCH_ONLY');
 assert.equal(RHEN_REVIEW.modules.length,5);
 const names=['evidence_journal.py','source_attestation.py','paper_market_feed.py','research/outcomes.py','replay/scorecard.py'];
 for(const file of names){
  const path='/projects/rhen/source/'+file;
  assert.ok(RHEN_SOURCE[path]?.length>200);
  const r=await request(path);
  assert.equal(r.status,200,file);
  assert.equal(r.headers.get('Content-Type'),'text/plain; charset=utf-8');
  assert.equal(await r.text(),RHEN_SOURCE[path]);
 }
 assert.match(RHEN_SOURCE['/projects/rhen/source/replay/scorecard.py'],/gross\)\) - roundtrip|net = Decimal\(str\(gross\)\) - roundtrip/);
 assert.equal((await request('/projects/rhen/source/private.py')).status,404);
});
test('Transcosmic has functional local private authoring tools with no network write API',async()=>{
 const redirect=await request('/projects/transcosmic');assert.equal(redirect.status,308);assert.equal(redirect.headers.get('Location'),'/projects/transcosmic/');
 const r=await request('/projects/transcosmic/'),html=await r.text();
 assert.equal(r.status,200);assert.match(html,/Transcosmic · Private Writing Studio/);
 for(const id of ['createDoc','docTitle','docBody','docList','exportAll','importDoc','exportDoc'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/LOCAL WORKSPACE/);assert.doesNotMatch(html,/<iframe|DATABASE_URL|alpaca\.markets/i);
 const css=await (await request('/projects/transcosmic/workspace.css')).text();assert.match(css,/100dvh/);assert.match(css,/overflow:hidden/);
 const js=await (await request('/projects/transcosmic/workspace.js')).text();assert.match(js,/transcosmic-local-v1/);assert.match(js,/localStorage/);
 assert.equal((await request('/projects/transcosmic/api/save')).status,404);
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
 assert.equal((await request('/projects/rhen/source/private.json')).status,404);
});
test('health and robots disclose only nonsensitive build state',async()=>{
 const r=await request('/health');
 assert.equal(r.status,200);
 const info=await r.json();
 assert.equal(info.status,'ok');
 assert.equal(info.projects,4);
 assert.equal(info.rhen,RHEN_REVIEW.source_commit.slice(0,12));
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

test('Lab home uses a true no-scroll CRT layout with four commands and no dummy moderation controls',async()=>{
 const page=await (await request('/')).text();
 assert.match(page,/ANEVUM <em>LAB<\/em>/);
 assert.match(page,/terminal\.css/);assert.match(page,/terminal\.js/);
 assert.match(page,/id="terminalForm"/);assert.match(page,/id="terminalInput"/);
 assert.equal((page.match(/class="project-entry/g)||[]).length,4);
 for(const name of ['THE FOLD','RHEN','TRANSCOSMIC','BACKSTAGE'])assert.ok(page.includes(name),name);
 const css=await (await request('/terminal.css')).text();
 assert.match(css,/100dvh/);assert.match(css,/overflow:hidden/);assert.match(css,/prefers-reduced-motion/);
 const js=await (await request('/terminal.js')).text();
 assert.match(js,/runCommand/);assert.match(js,/Cloudflare Access/);
 assert.doesNotMatch(page,/<iframe/i);
});
test('Backstage provides working local case planning, not live moderation',async()=>{
 assert.equal((await request('/projects/backstage')).status,308);
 const res=await request('/projects/backstage/'),html=await res.text();
 assert.equal(res.status,200);assert.match(html,/ANEVUM BACKSTAGE/);
 for(const id of ['newCase','caseQueue','caseDetail','caseSaveState','exportCases','importCases'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/NO PRODUCTION WRITES/);assert.match(html,/NOT CONNECTED TO COMMUNITY DATA/);
 assert.equal((await request('/projects/backstage/workspace.css')).status,200);
 const js=await (await request('/projects/backstage/workspace.js')).text();
 assert.match(js,/backstage-local-v1/);assert.match(js,/localStorage/);
 assert.equal((await request('/projects/backstage/api/ban',{method:'POST'})).status,405);
 assert.equal((await request('/projects/backstage/api/member')).status,404);
});
