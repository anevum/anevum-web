import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import {BRAND_MARK,BRAND_CSS,BRAND_VERSION} from '../shared/brand.mjs';
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

test('brand reference uses the exact approved preview symbol geometry and stops',()=>{
  const original=readFileSync(new URL('../../community-preview/worker.js',import.meta.url),'utf8');
  assert.equal(BRAND_VERSION,'cinematic-2026-10-11-v1');
  for(const term of [
    'M5 49 30 8l25 41h-8L30 22 13 49z',
    'm23 44 7-11 7 11',
    'M45 15h8M49 11v8',
    '#ffe1a2','#ffb043','#ff6c24'
  ]){
    assert.ok(original.includes(term),'approved preview has '+term);
    assert.ok(BRAND_MARK.includes(term),'shared mark has '+term);
  }
});

test('every page uses the exact same canonical ANEVUM SVG, not a replacement glyph',()=>{
  for(const [name,page] of screens){
    assert.ok(page.includes(BRAND_MARK),name+' must render the common mark');
    assert.equal((page.match(/class="anevum-brand-mark"/g)||[]).length,1,name+' renders exactly one mark');
    assert.doesNotMatch(page,/<span[^>]*class="(?:mark|logo|brandmark)"[^>]*>(?:A|◬|&#9651;)<\/span>/u,name+' contains a temporary marker');
    assert.ok(page.includes('ANEVUM'),name+' retains brand text');
  }
});

test('all member and staff styles use the identical approved color tokens',()=>{
  const required=['--anevum-bg:#080b13','--anevum-panel:#101522',
    '--anevum-line:#292e40','--anevum-text:#f7f7fc',
    '--anevum-orange:#ff9d50','--anevum-gold:#ffb043',
    '--anevum-violet:#9582e3'];
  for(const term of required)assert.ok(BRAND_CSS.includes(term),'locked palette missing '+term);
  for(const [name,,style] of screens){
    assert.ok(style.includes(BRAND_CSS),name+' must inherit shared theme');
    assert.ok(style.includes('.anevum-brand-mark'),name+' must size shared mark');
  }
});

test('public homepage still contains approved identity rather than staging placeholders',()=>{
  const preview=readFileSync(new URL('../../community-preview/worker.js',import.meta.url),'utf8');
  assert.ok(preview.includes('ANEVUM CINEMATIC CREATOR PREVIEW'));
  assert.ok(preview.includes('class=\\\"logo\\\"'));
  assert.ok(preview.includes('M5 49 30 8l25 41h-8L30 22 13 49z'));
  assert.doesNotMatch(BRAND_MARK,/<script|onerror=|onclick=|<image\b/i);
});
