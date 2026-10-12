import test from 'node:test';
import assert from 'node:assert/strict';
import runtime from '../site/runtime.mjs';
import {PAGE,STYLES,CLIENT,ASSETS,BRAND_FAVICON} from '../site/generated.mjs';
import {BRAND_MARK,BRAND_CSS} from '../shared/brand.mjs';

test('new public experience uses one accessible Orbit identity and compact navigation',()=>{
  assert.ok(PAGE.includes(BRAND_MARK));
  assert.equal((PAGE.match(/class="anevum-brand-mark"/g)||[]).length,1);
  assert.match(PAGE,/class="site-header"/);
  assert.match(PAGE,/class="side-nav"/);
  assert.match(PAGE,/class="mobile-nav"/);
  assert.match(PAGE,/aria-label="Primary"/);
  assert.match(PAGE,/aria-label="Mobile navigation"/);
  assert.match(PAGE,/class="skip-link"/);
  assert.match(PAGE,/id="searchForm"/);
  assert.match(PAGE,/ANEVUM V1 \/ IN DEVELOPMENT/);
  assert.match(PAGE,/href="\/favicon\.svg"/);
  assert.equal((PAGE.match(/<script/g)||[]).length,1,'only one external module script');
  assert.doesNotMatch(PAGE,/<script[^>]*>[\s\S]+?<\/script>|on(click|error|load)=/);
  assert.ok(STYLES.includes(BRAND_CSS),'shared tokens were dropped');
  assert.match(STYLES,/@media\(max-width:760px\)/);
  assert.match(STYLES, /prefers-reduced-motion/);
  assert.match(BRAND_FAVICON,/viewBox="0 0 512 512"/);
  assert.ok(Object.hasOwn(ASSETS,'hero.webp'));
});
test('public navigation is backed by real endpoints and honest feature states',()=>{
  for(const path of ['/api/v1/status','/api/v1/projects','/api/v1/categories'])assert.ok(CLIENT.includes(path),path);
  for(const feature of ['create','community','library','account','about'])assert.ok(CLIENT.includes(feature),feature);
  for(const safety of ['credentials:\'omit\'','cache:\'no-store\'','escapeHtml','safeExternal','rel="noopener noreferrer external"','controller?.abort()'])
    assert.ok(CLIENT.includes(safety),safety);
  assert.doesNotMatch(CLIENT, /stellarfox|sampleRatings|fakeVotes|Math\.random\(\).*project/);
  assert.match(CLIENT,/The catalogue displays real, approved work only/);
  assert.match(CLIENT,/No fake users, popularity or awards/);
});
test('real, shareable V1 routes retain restrictive CSP and stay read-only',async()=>{
  for(const path of ['/','/discover','/create','/community','/library','/account','/about','/status','/projects/real-project']){
    const r=await runtime.fetch(new Request('https://anevum.com'+path),{});
    assert.equal(r.status,200,path);
    assert.match(r.headers.get('content-security-policy')||'',/script-src 'self'/);
    assert.ok((await r.text()).includes('id="main"'));
  }
  for(const path of ['/command/rhen','/studio','/projects/unsafe<script>','/random','/apps/rhen']){
    const r=await runtime.fetch(new Request('https://anevum.com'+path),{});
    assert.equal(r.status,404,path);
  }
  for(const path of ['/','/discover','/create']){
    const r=await runtime.fetch(new Request('https://anevum.com'+path,{method:'POST'}),{});
    assert.equal(r.status,405,path);
  }
});
test('CSS, JS, favicon and approved illustrative assets are first-party only',async()=>{
  for(const [path,type] of [['/styles.css','text/css'],['/client.mjs','text/javascript'],['/favicon.svg','image/svg+xml'],['/assets/hero.webp','image/webp']]){
    const r=await runtime.fetch(new Request('https://anevum.com'+path),{});
    assert.equal(r.status,200,path);
    assert.ok((r.headers.get('content-type')||'').includes(type),'Unexpected MIME type for '+path);
    assert.ok((await r.arrayBuffer()).byteLength>25,path);
  }
});
