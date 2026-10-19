import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';

const base = 'https://sites.anevum.com';
function get(path, options = {}) {
  return worker.fetch(new Request(base + path, options));
}

test('public front page is a complete read-only studio page', async () => {
  const response = await get('/');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
  const html = await response.text();
  for (const label of ['ANEVUM / SITES', '$49', '$99', '$199', 'mailto:devon@anevum.com']) {
    assert.ok(html.includes(label), 'expected '+label);
  }
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /id="packages"/);
  assert.match(html, /id="process"/);
});

test('uncommissioned concept cannot be mistaken for an approved business website', async () => {
  const response = await get('/preview/tobacco-vapor-time');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /UNCOMMISSIONED DESIGN CONCEPT/);
  assert.match(html, /NOT THE OFFICIAL BUSINESS WEBSITE/);
  assert.match(html, /Not affiliated with or endorsed/);
  assert.doesNotMatch(html, /<strong>9:00 AM – 9:00 PM<\/strong>/);
  assert.match(html, /Confirm by phone/);
  assert.match(html, /<meta name="robots" content="noindex,nofollow,noarchive"/);
});

test('assets are correct types and include responsive layout and motion limits', async () => {
  const css = await get('/assets/sites.css');
  assert.match(css.headers.get('content-type'), /text\/css/);
  const sheet = await css.text();
  assert.match(sheet, /@media\(max-width:620px\)/);
  assert.match(sheet, /prefers-reduced-motion/);
  const js = await get('/assets/sites.js');
  assert.match(js.headers.get('content-type'), /javascript/);
});

test('health endpoint contains no private data', async () => {
  const response = await get('/health');
  const body = await response.json();
  assert.deepEqual(body, {ok:true, version:'sites-v001-20261019', stage:'review'});
});

test('unknown paths return 404, bad methods return 405, unknown hosts return 421', async () => {
  assert.equal((await get('/absent')).status,404);
  assert.equal((await get('/api/customer-details')).status,404);
  assert.equal((await get('/',{method:'POST'})).status,405);
  assert.equal((await worker.fetch(new Request('https://anevum.com/'))).status,421);
  assert.equal((await worker.fetch(new Request('https://lab.anevum.com/'))).status,421);
});

test('HEAD cannot leak a response body', async () => {
  const response = await get('/',{method:'HEAD'});
  assert.equal(response.status,200);
  assert.equal(await response.text(),'');
});

test('security headers block iframe embedding and unwanted content sources',async()=>{
  const response=await get('/');
  assert.equal(response.headers.get('x-frame-options'),'DENY');
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.match(response.headers.get('content-security-policy'), /form-action 'none'/);
  assert.equal(response.headers.get('cache-control'),'no-store');
});
