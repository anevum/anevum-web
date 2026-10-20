import test from 'node:test';
import assert from 'node:assert/strict';
import runtime from '../site/runtime.mjs';
import {PAGE,STYLES,CLIENT,ASSETS,BRAND_FAVICON} from '../site/generated.mjs';
import {BRAND_MARK,BRAND_CSS,BRAND_VERSION} from '../shared/brand.mjs';

test('recovered cinematic public layout is retained, not replaced with minimalist shell',()=>{
 assert.match(PAGE,/class="header"/);
 for(const m of ['id="topNav"','id="bottomNav"','id="mobileDrawer"','id="searchInput"','id="main"','class="fakebar"'])assert.ok(PAGE.includes(m),m);
 for(const m of ['.hero{','.hero-content','.hero-side-note','.project-grid','.content-columns','.bottomnav','.mobile-drawer'])assert.ok(STYLES.includes(m),m);
 assert.ok(STYLES.includes(BRAND_CSS));
 assert.ok(PAGE.includes(BRAND_MARK));
 assert.equal((PAGE.match(/class="anevum-brand-mark"/g)||[]).length,1);
 assert.match(BRAND_FAVICON,/viewBox="0 0 512 512"/);
 assert.equal(BRAND_VERSION,'orbital-underground-2026-10-12-v1');
 assert.ok(Object.keys(ASSETS).length>=14);
 assert.ok(Object.hasOwn(ASSETS,'hero.webp'));
 assert.ok(Object.hasOwn(ASSETS,'jam.webp'));
});
test('old navigation and cinematic sections are again reachable as honest projections',()=>{
 for(const text of ['function discover','function categoryCards','function listing','function project','function featurePreview','function navigationUi','Creator jams are coming','hero-side-note','hero-metrics','v1-category-grid'])assert.ok(CLIENT.includes(text),text);
 for(const label of ['Library','Community','Rankings','Jams','Profile','Create'])assert.ok(CLIENT.includes(label),label);
 for(const route of ['/discover','/projects/real-project','/create','/community','/library','/account'])assert.ok(CLIENT.includes(route.split('/')[1])||route.startsWith('/projects/'));
 assert.ok(CLIENT.includes("credentials:'omit'"));
 assert.ok(CLIENT.includes("cache:'no-store'"));
 assert.doesNotMatch(CLIENT,/stellarfox|const p=\[|fakeVotes|sampleRatings/);
 assert.match(CLIENT,/No demo accounts, synthetic ratings, XP or activity/);
});
test('existing public URLs continue working and unsafe routes remain closed',async()=>{
 for(const path of ['/','/discover','/create','/community','/library','/account','/status','/projects/real-project']){
   const r=await runtime.fetch(new Request('https://anevum.com'+path),{});
   assert.equal(r.status,200,path);
   assert.match(r.headers.get('content-security-policy')||'',/script-src 'self'/);
 }
 for(const path of ['/command/rhen','/studio','/random'])assert.equal((await runtime.fetch(new Request('https://anevum.com'+path),{})).status,404,path);
 for(const path of ['/','/discover'])assert.equal((await runtime.fetch(new Request('https://anevum.com'+path,{method:'POST'}),{})).status,405,path);
});
test('the public production site serves same-origin CSS, JS, favicon and artwork',async()=>{
 for(const path of ['/styles.css','/client.mjs','/favicon.svg','/assets/hero.webp','/assets/jam.webp']){
   const r=await runtime.fetch(new Request('https://anevum.com'+path),{});
   assert.equal(r.status,200,path);
   assert.ok((await r.arrayBuffer()).byteLength>100,path);
 }
});

test('creator directory and public portfolios extend the restored cinematic shell',async()=>{
 for(const phrase of ['function creatorCards','function creatorDirectory','function creatorProfile','function creatorLink','Meet the creators'])
   assert.ok(CLIENT.includes(phrase),phrase);
 for(const api of ['/api/v1/creators','/api/v1/projects?'])assert.ok(CLIENT.includes(api),api);
 assert.match(STYLES,/\.v1-creator-grid/);
 assert.match(STYLES,/\.v1-creator-profile/);
 for(const path of ['/creators','/creators/fixture']){
   const r=await runtime.fetch(new Request('https://anevum.com'+path),{});
   assert.equal(r.status,200,path);
   assert.match(r.headers.get('content-security-policy')||'',/script-src 'self'/);
 }
 for(const path of ['/creators/unsafe<script>','/creators/aa','/creators/'+ 'z'.repeat(75)])
   assert.equal((await runtime.fetch(new Request('https://anevum.com'+path),{})).status,404,path);
 assert.equal((await runtime.fetch(new Request('https://anevum.com/creators',{method:'POST'}),{})).status,405);
});
