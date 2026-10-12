import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BRAND_MARK,BRAND_CSS,BRAND_VERSION,BRAND_ARCH_PATH,BRAND_FAVICON,BRAND_MARK_MONO_DARK,BRAND_MARK_MONO_LIGHT} from '../shared/brand.mjs';
import {PAGE as JOIN_PAGE,STYLE as JOIN_STYLE} from '../auth/join.mjs';
import {COMMUNITY_PAGE,COMMUNITY_STYLE} from '../auth/community-ui.mjs';
import {PROFILE_PAGE,LIBRARY_PAGE,SOCIAL_STYLE} from '../auth/social-ui.mjs';
import {PROJECT_PAGE,PROJECT_STYLE} from '../auth/projects-ui.mjs';
import {PRIVACY_PAGE,PRIVACY_STYLE} from '../auth/privacy-ui.mjs';
import {STUDIO_PAGE,STUDIO_STYLE} from '../authoring/worker.mjs';

const screens=[
  ['member join',JOIN_PAGE,JOIN_STYLE],
  ['community',COMMUNITY_PAGE,COMMUNITY_STYLE],
  ['creator profile',PROFILE_PAGE,SOCIAL_STYLE],
  ['saved library',LIBRARY_PAGE,SOCIAL_STYLE],
  ['member projects',PROJECT_PAGE,PROJECT_STYLE],
  ['account privacy',PRIVACY_PAGE,PRIVACY_STYLE],
  ['staff studio',STUDIO_PAGE,STUDIO_STYLE]
];
test('orbital portal has consistent vector geometry, safe output and standalone masters',()=>{
  assert.equal(BRAND_VERSION,'orbital-portal-2026-10-12-v1');
  for(const svg of [BRAND_MARK,BRAND_FAVICON,BRAND_MARK_MONO_DARK,BRAND_MARK_MONO_LIGHT]){
    assert.ok(svg.includes(BRAND_ARCH_PATH),'A/portal arch missing');
    assert.match(svg,/viewBox="0 0 64 64"/);
    assert.match(svg,/rotate\(-18 32 34\)/);
    assert.match(svg,/<circle cx="32" cy="33"/);
    assert.doesNotMatch(svg,/<script|<image\b|onerror=|onclick=|foreignObject/i);
  }
  assert.equal(readFileSync(new URL('../brand/anevum-mark.svg',import.meta.url),'utf8').trim(),BRAND_FAVICON);
  assert.equal(readFileSync(new URL('../brand/anevum-mark-mono-dark.svg',import.meta.url),'utf8').trim(),BRAND_MARK_MONO_DARK);
  assert.equal(readFileSync(new URL('../brand/anevum-mark-mono-light.svg',import.meta.url),'utf8').trim(),BRAND_MARK_MONO_LIGHT);
});
test('public and private screens have one consistent ANEVUM header mark',()=>{
  for(const [name,page] of screens){
    assert.ok(page.includes(BRAND_MARK),name+' must render the canonical mark');
    assert.equal((page.match(/class="anevum-brand-mark"/g)||[]).length,1,name+' must render exactly one brand mark');
    assert.ok(page.includes('ANEVUM'),name+' must retain the wordmark');
    assert.doesNotMatch(page,/<span[^>]*class="(?:mark|logo|brandmark)"[^>]*>(?:A|◬|&#9651;)<\/span>/u);
  }
});
test('all member/staff screens inherit the copper/gold/black identity tokens',()=>{
  for(const part of ['--anevum-bg:#100d11','--anevum-panel:#19151b',
    '--anevum-line:#3a303a','--anevum-text:#f8f1e7','--anevum-copper:#d9945e',
    '--anevum-gold:#f3ca86','--anevum-violet:#8e83a9']){
    assert.ok(BRAND_CSS.includes(part),part);
  }
  for(const [name,,style] of screens){
    assert.ok(style.includes(BRAND_CSS),name+' must inherit the identical brand rules');
    assert.ok(style.includes('.anevum-brand-mark'),name+' must size the common mark');
  }
});
test('read-only public homepage builds the identical mark, stylesheet and favicon',async()=>{
  const {PAGE,STYLES,BRAND_FAVICON:LIVE_ICON}=await import('../site/generated.mjs');
  assert.ok(PAGE.includes(BRAND_MARK),'home logo differs from member and Studio');
  assert.equal((PAGE.match(/class="anevum-brand-mark"/g)||[]).length,1);
  assert.ok(PAGE.includes('<link rel="icon" href="/favicon.svg" type="image/svg+xml" />'));
  assert.doesNotMatch(PAGE,/M5 49 30 8l25 41h-8L30 22 13 49z/);
  assert.ok(STYLES.includes(BRAND_CSS),'public stylesheet must load canonical identity');
  assert.equal(LIVE_ICON,BRAND_FAVICON);
});
