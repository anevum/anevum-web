import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyOriginalWorksBundle } from '../scripts/verify-original-works-preview-bundle.mjs';

const wiki='Public-source cleared';
const reading='Three signals.';
const missing='Guessing a URL never reveals private or unpublished canon.';
function withBundle({ html='<html><body>Public website</body></html>', javascript='', sourcemap='' }, fn) {
  const root=mkdtempSync(join(tmpdir(),'anevum-review-bundle-'));
  try {
    mkdirSync(join(root,'assets'));
    writeFileSync(join(root,'index.html'),html);
    writeFileSync(join(root,'assets','site.js'),javascript);
    if (sourcemap) writeFileSync(join(root,'assets','site.js.map'),sourcemap);
    return fn(root);
  } finally { rmSync(root,{recursive:true,force:true}); }
}

test('default production build must exclude all preview strings, even in source maps',()=>{
  withBundle({},root=>assert.equal(verifyOriginalWorksBundle('disabled',root).markers,3));
  withBundle({javascript:'const text='+JSON.stringify(wiki)},root=>
    assert.throws(()=>verifyOriginalWorksBundle('disabled',root),/UNPUBLISHED_CONTENT_IN_DEFAULT_BUNDLE/));
  withBundle({sourcemap:'{"sourcesContent":['+JSON.stringify(reading)+']}'},root=>
    assert.throws(()=>verifyOriginalWorksBundle('disabled',root),/UNPUBLISHED_CONTENT_IN_DEFAULT_BUNDLE/));
});

test('enabled review must include both wiki and REPLY, not only source maps',()=>{
  withBundle({javascript:[wiki,reading,missing].map(JSON.stringify).join(';')},root=>
    assert.equal(verifyOriginalWorksBundle('enabled',root).markers,3));
  withBundle({javascript:[wiki,reading].map(JSON.stringify).join(';')},root=>
    assert.throws(()=>verifyOriginalWorksBundle('enabled',root),/REVIEW_CONTENT_MISSING_FROM_ENABLED_BUNDLE/));
  withBundle({sourcemap:[wiki,reading,missing].join(';')},root=>
    assert.throws(()=>verifyOriginalWorksBundle('enabled',root),/REVIEW_CONTENT_MISSING_FROM_ENABLED_BUNDLE/));
});

test('bundle verifier fails closed on bad modes and missing runtime files',()=>{
  assert.throws(()=>verifyOriginalWorksBundle('release'),/INVALID_PREVIEW_BUNDLE_MODE/);
  assert.throws(()=>verifyOriginalWorksBundle('enabled','/definitely/missing/anevum-preview'),/PREVIEW_BUNDLE_MISSING/);
  const root=mkdtempSync(join(tmpdir(),'anevum-no-assets-'));
  try {assert.throws(()=>verifyOriginalWorksBundle('enabled',root),/PREVIEW_BUNDLE_NO_RUNTIME_ASSETS/);} finally {rmSync(root,{recursive:true,force:true});}
});

// CI's default build MUST be checked before the remote preflight. The enabled
// second build MUST run only after the exact owner-only Access gate succeeds.
test('preview build is gated after Access preflight and before Wrangler upload',()=>{
  const yaml=readFileSync(new URL('../.github/workflows/anevum-verify.yml',import.meta.url),'utf8');
  const defaultGate=yaml.indexOf('Prove default build has no Original Works editorial bytes');
  const preflight=yaml.indexOf('Verify owner-only Access before hosted Cloudflare Preview');
  const reviewBuild=yaml.indexOf('Build Original Works client only after owner Access is verified');
  const previewUpload=yaml.indexOf('Create or update Cloudflare Preview');
  assert.ok(defaultGate>0 && defaultGate<preflight && preflight<reviewBuild && reviewBuild<previewUpload);
  const reviewBlock=yaml.slice(reviewBuild,previewUpload);
  assert.match(reviewBlock,/VITE_ORIGINAL_WORKS_PREVIEW:\s*['"]true['"]/);
  assert.match(reviewBlock,/npx vite build/);
  assert.match(reviewBlock,/verify-original-works-preview-bundle\.mjs --enabled/);
  assert.match(yaml.slice(defaultGate,preflight),/verify-original-works-preview-bundle\.mjs --disabled/);
  assert.doesNotMatch(yaml.slice(0,defaultGate),/VITE_ORIGINAL_WORKS_PREVIEW:\s*['"]true['"]/);
  assert.match(reviewBlock,/steps\.scope\.outputs\.app_preview_required == 'true'/);
});
