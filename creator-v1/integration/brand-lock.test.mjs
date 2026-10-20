import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BRAND_VERSION,BRAND_MARK,BRAND_MARK_FULL,BRAND_FAVICON,BRAND_MARK_MONO_DARK,BRAND_MARK_MONO_LIGHT,BRAND_CSS} from '../shared/brand.mjs';
import {PAGE as JOIN_PAGE,STYLE as JOIN_STYLE} from '../auth/join.mjs';
import {COMMUNITY_PAGE,COMMUNITY_STYLE} from '../auth/community-ui.mjs';
import {PROFILE_PAGE,LIBRARY_PAGE,SOCIAL_STYLE} from '../auth/social-ui.mjs';
import {PROJECT_PAGE,PROJECT_STYLE} from '../auth/projects-ui.mjs';
import {PRIVACY_PAGE,PRIVACY_STYLE} from '../auth/privacy-ui.mjs';
import {STUDIO_PAGE,STUDIO_STYLE} from '../authoring/worker.mjs';

const screens=[
  ['join',JOIN_PAGE,JOIN_STYLE],
  ['community',COMMUNITY_PAGE,COMMUNITY_STYLE],
  ['creator profile',PROFILE_PAGE,SOCIAL_STYLE],
  ['saved library',LIBRARY_PAGE,SOCIAL_STYLE],
  ['projects manager',PROJECT_PAGE,PROJECT_STYLE],
  ['account privacy',PRIVACY_PAGE,PRIVACY_STYLE],
  ['staff studio',STUDIO_PAGE,STUDIO_STYLE]
];

test('03 ORBITAL UNDERGROUND is the canonical brand direction',()=>{
  assert.equal(BRAND_VERSION,'orbital-underground-2026-10-12-v1');
  for(const mark of [BRAND_MARK,BRAND_MARK_FULL,BRAND_FAVICON,BRAND_MARK_MONO_DARK,BRAND_MARK_MONO_LIGHT]){
    assert.match(mark,/viewBox="0 0 512 512"/);
    assert.match(mark,/<ellipse cx="256" cy="256"/);
    assert.match(mark,/<circle cx="256" cy="256"/);
    assert.match(mark,/<circle cx="391" cy="132"/);
    assert.match(mark,/M256 56|M256 62/);
    assert.doesNotMatch(mark,/<script|<image\b|onclick=|onerror=|foreignObject/i);
    assert.doesNotMatch(mark,/M352 82|M354 84|M12\.5 52|M5 49 30 8/);
  }
  assert.ok(BRAND_MARK.includes('class="anevum-brand-mark"'));
  assert.equal(readFileSync(new URL('../brand/anevum-mark.svg',import.meta.url),'utf8').trim(),BRAND_MARK_FULL);
  assert.equal(readFileSync(new URL('../brand/anevum-mark-compact.svg',import.meta.url),'utf8').trim(),BRAND_FAVICON);
  assert.equal(readFileSync(new URL('../brand/anevum-mark-mono-dark.svg',import.meta.url),'utf8').trim(),BRAND_MARK_MONO_DARK);
  assert.equal(readFileSync(new URL('../brand/anevum-mark-mono-light.svg',import.meta.url),'utf8').trim(),BRAND_MARK_MONO_LIGHT);
});

test('every member/staff page shares exactly one brand mark and readable wordmark',()=>{
  for(const [name,page] of screens){
    assert.ok(page.includes(BRAND_MARK),name+' identity drift');
    assert.equal((page.match(/class="anevum-brand-mark"/g)||[]).length,1,name+' duplicate mark');
    assert.ok(page.includes('ANEVUM'),name+' missing wordmark');
  }
});

const luminance=hex=>{
  const v=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const lin=v.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return .2126*lin[0]+.7152*lin[1]+.0722*lin[2];
};
test('shared UI uses underground palette and actionable contrast',()=>{
  for(const required of [
    '--anevum-bg:#0b0b0d',
    '--anevum-panel:#121214',
    '--anevum-bone:#e8e1d6',
    '--anevum-coral:#ff6857',
    '--anevum-violet:#a855ff',
    '--anevum-copper:#b87333',
    '--anevum-on-coral:#0b0b0d'
  ]) assert.ok(BRAND_CSS.includes(required),required);
  assert.ok((luminance('#ff6857')+.05)/(luminance('#0b0b0d')+.05)>=4.5);
  assert.match(BRAND_CSS,/\.btn\.primary,button\.primary/);
  assert.match(BRAND_CSS,/focus-visible/);
  for(const [name,,style] of screens){
    assert.ok(style.includes(BRAND_CSS),name+' color drift');
    assert.ok(style.includes('.anevum-brand-mark'),name+' icon size missing');
  }
});

test('public V1 read-only build has the same mark and real favicon',async()=>{
  const {PAGE,STYLES,BRAND_FAVICON:BUILT_FAVICON}=await import('../site/generated.mjs');
  assert.ok(PAGE.includes(BRAND_MARK));
  assert.equal((PAGE.match(/class="anevum-brand-mark"/g)||[]).length,1);
  assert.ok(PAGE.includes('<link rel="icon" href="/favicon.svg" type="image/svg+xml" />'));
  assert.ok(STYLES.includes(BRAND_CSS));
  assert.equal(BUILT_FAVICON,BRAND_FAVICON);
  assert.doesNotMatch(PAGE,/M5 49 30 8l25 41h-8L30 22 13 49z/);
});
