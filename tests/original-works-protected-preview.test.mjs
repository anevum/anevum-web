import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parsePreviewOrigin, assertAnonymousAccessDenial,
  probeProtectedPreview, REVIEW_PATHS,
} from '../scripts/verify-original-works-protected-preview.mjs';

const origin = 'https://pr-800-123456-anevum-web-nextgen.devonakins.workers.dev';

function acceptedResponse(status = 302, location = 'https://myteam.cloudflareaccess.com/cdn-cgi/access/login/app') {
  return { status, headers: { get: name => name === 'location' ? location : null }, body: { cancel: async () => {} } };
}

test('accept only a named HTTPS preview of the website Worker', () => {
  assert.equal(parsePreviewOrigin(origin + '/'), origin);
  for (const candidate of [
    '', 'http://pr-800-123456-anevum-web-nextgen.devonakins.workers.dev/',
    'https://anevum.com/',
    'https://devonakins.workers.dev/',
    'https://pr-800-123456-other-worker.devonakins.workers.dev/',
    'https://pr-800-123456-anevum-web-nextgen.other.workers.dev/',
    origin + '/wiki', origin + '/?redirect=/wiki', origin + '/#anything',
    'https://alice:password@pr-800-123456-anevum-web-nextgen.devonakins.workers.dev/',
    'https://-anevum-web-nextgen.devonakins.workers.dev/',
  ]) assert.throws(() => parsePreviewOrigin(candidate), /INVALID_OWNER_PREVIEW_ORIGIN/, candidate);
});

test('only Cloudflare Access login redirects or unauthorized status count as denial', () => {
  for (const status of [401, 403]) {
    assert.doesNotThrow(() => assertAnonymousAccessDenial({status, requestUrl:origin+'/', expectedOrigin:origin}));
  }
  for (const location of [
    'https://team.cloudflareaccess.com/cdn-cgi/access/login/app',
    origin + '/cdn-cgi/access/login',
    '/cdn-cgi/access/login/app?redirect_url=%2Fwiki',
  ]) assert.doesNotThrow(() => assertAnonymousAccessDenial({status:302,location,requestUrl:origin+'/wiki',expectedOrigin:origin}));
  for (const status of [200, 204, 404, 500]) {
    assert.throws(() => assertAnonymousAccessDenial({status,requestUrl:origin+'/',expectedOrigin:origin}), /PREVIEW_ROUTE_NOT_ACCESS_PROTECTED/);
  }
  for (const location of [
    '/', '/wiki',
    'https://anevum.com/cdn-cgi/access/login',
    'http://team.cloudflareaccess.com/cdn-cgi/access/login/app',
    'https://team.cloudflareaccess.com/anything',
    'https://team.cloudflareaccess.com.evil.example/cdn-cgi/access/login',
  ]) assert.throws(() => assertAnonymousAccessDenial({status:302,location,requestUrl:origin+'/',expectedOrigin:origin}), /PREVIEW_ROUTE_NOT_ACCESS_PROTECTED/);
});

test('anonymous smoke probes all preview, book, canon, command and index routes without credentials', async () => {
  const seen = [];
  const fakeFetch = async (url,init) => {
    seen.push({url,init});
    return acceptedResponse();
  };
  const result = await probeProtectedPreview(origin+'/',fakeFetch);
  assert.equal(result.length,REVIEW_PATHS.length);
  assert.equal(seen.length,REVIEW_PATHS.length);
  for (const [i, call] of seen.entries()) {
    assert.equal(call.url,origin+REVIEW_PATHS[i]);
    assert.equal(call.init.redirect,'manual');
    assert.equal(call.init.method,'GET');
    assert.equal(call.init.credentials,'omit');
    assert.ok(!('Authorization' in call.init.headers));
    assert.ok(!('Cookie' in call.init.headers));
  }
});

test('public content, missing worker and unsafe redirects prevent passing even if other routes deny', async () => {
  for (const status of [200,404,500]) {
    let count=0;
    await assert.rejects(() => probeProtectedPreview(origin+'/',async()=>{
      count++;
      return count===3 ? acceptedResponse(status,null) : acceptedResponse();
    }),/PREVIEW_ROUTE_NOT_ACCESS_PROTECTED/);
    assert.equal(count,3);
  }
  await assert.rejects(() => probeProtectedPreview(origin+'/',async()=>acceptedResponse(302,'https://anevum.com/wiki')), /PREVIEW_ROUTE_NOT_ACCESS_PROTECTED/);
  await assert.rejects(() => probeProtectedPreview(origin+'/',async()=>{throw Error('upstream failure')}), /PREVIEW_ACCESS_CHECK_UNAVAILABLE/);
});

test('hosted Access-denial probe follows owner-only preflight and Preview creation in CI', () => {
  const verify = readFileSync(new URL('../.github/workflows/anevum-verify.yml', import.meta.url),'utf8');
  const preflight=verify.indexOf('Verify owner-only Access before hosted Cloudflare Preview');
  const created=verify.indexOf('Create or update Cloudflare Preview');
  const denial=verify.indexOf('Prove owner-only Preview denies anonymous requests');
  const legacy=verify.indexOf('Probe routes, SEO, PDF, and public privacy contract');
  assert.ok(preflight>=0 && preflight<created && created<denial && denial<legacy);
  assert.match(verify, /node scripts\/verify-original-works-protected-preview\.mjs/);
  assert.match(verify, /BASE_URL: \$\{\{ steps\.preview\.outputs\.preview_url \}\}/);
});
