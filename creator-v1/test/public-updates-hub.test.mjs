// Isolated V131-compatible public updates launch hub contract.
// No live Cloudflare, auth, cookies, media uploads, external services or D1.
import test from 'node:test';
import assert from 'node:assert/strict';
import hub from '../public-updates/worker.mjs';

const run = (path='/updates',method='GET',host='anevum.com')=>
  hub.fetch(new Request('https://'+host+path,{method}));

test('real, public, static updates path is GET/HEAD only',async()=>{
  for(const path of ['/updates','/updates/']){
    const get=await run(path),head=await run(path,'HEAD');
    assert.equal(get.status,200);
    assert.equal(head.status,200);
    assert.equal(await head.text(),'');
    assert.equal(get.headers.get('content-type'),'text/html; charset=utf-8');
    assert.equal(get.headers.get('cache-control'),'public, max-age=300');
    const html=await get.text();
    assert.ok(html.includes('ANEVUM — The Next Signal'));
    assert.ok(html.includes('V131 / Live'));
    assert.ok(html.includes('V136 / Controlled canary'));
    assert.ok(html.includes('01 January 2027'));
    assert.equal(html.includes('already fully deployed'),false);
  }
  assert.equal((await run('/updates','POST')).status,405);
  assert.equal((await run('/updates','POST')).headers.get('allow'),'GET, HEAD');
  assert.equal((await run('/updates','OPTIONS')).status,405);
});

test('route ownership is bounded; unrelated apex URLs are not claimed',async()=>{
  for(const path of ['/','/discover','/updates-other','/updates/embed','/api/v1/member/auth/get-session']){
    assert.equal((await run(path)).status,404,path);
  }
  assert.equal((await run('/updates','GET','portfolio.anevum.com')).status,404);
  assert.equal((await run('/updates','GET','www.anevum.com')).status,404);
});

test('privacy, clickjacking and runtime capabilities are locked down',async()=>{
  const page=await run();
  const csp=page.headers.get('content-security-policy')||'';
  assert.match(csp,/default-src 'none'/);
  assert.match(csp,/base-uri 'none'/);
  assert.match(csp,/form-action 'none'/);
  assert.match(csp,/frame-ancestors 'none'/);
  assert.equal(page.headers.get('x-frame-options'),'DENY');
  assert.equal(page.headers.get('referrer-policy'),'no-referrer');
  assert.match(page.headers.get('permissions-policy')||'',/payment=\(\)/);
  assert.equal(page.headers.has('set-cookie'),false);
  const html=await page.text();
  assert.doesNotMatch(html,/<script\b|<iframe\b|<form\b|<video\b|<audio\b|<img\b/i);
  assert.doesNotMatch(html,/onclick=|onload=|google-analytics|analytics\.|facebook\.com\/tr/i);
  assert.doesNotMatch(html,/<link[^>]*href=["']https?:\/\//i);
  assert.match(html,/prefers-reduced-motion:\s*reduce/);
  assert.match(html,/:focus-visible/);
  assert.match(html,/class="skip" href="#main"/);
  assert.match(html,/<main class="shell" id="main">/);
  assert.match(html,/width=device-width/);
});

test('public links are genuine first-party links; unfinished studio is labeled',async()=>{
  const html=await (await run()).text();
  for(const dest of ['/','/discover','/community','/creators','/studio']){
    assert.ok(html.includes('href="'+dest+'"'),dest);
  }
  assert.match(html,/PRIVATE \/ STUDIO ACCESS/);
  assert.match(html,/public creator-to-catalogue publishing pathway is not yet activated/);
  assert.match(html,/physical Xbox and TV-browser testing is still needed/i);
  assert.match(html,/opening is a target/i);
  assert.equal((html.match(/<details class="progress-item">/g)||[]).length,4);
  assert.equal((html.match(/<a class="tile(?:\s|")/g)||[]).length,4);
});
