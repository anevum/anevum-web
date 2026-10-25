import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {Script} from 'node:vm';
const root=new URL('../web/public/portfolio/',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const html=read('index.html');
const css=read('cinematic-v1.css');
const reelCSS=read('hero-reel-v2.css');
const reelJS=read('hero-reel-v2.js');
const app=read('app.js');

test('portfolio retains canonical routing, honest biography, contact, skip link and metadata',()=>{
  assert.match(html,/<html lang="en">/);
  assert.match(html,/href="https:\/\/anevum\.com\/portfolio\/"/);
  assert.match(html,/href="#main">Skip to content/);
  assert.match(html,/id="motion-toggle"/);
  assert.match(html,/class="mobile-nav"/);
  assert.match(html,/id="brief-form"/);
  assert.match(html,/Nothing is sent by this site/);
});

test('owner-rejected skyline and old video candidate are removed from render pipeline',()=>{
  assert.match(html,/class="hero hero-v2"/);
  assert.doesNotMatch(html,/continuance-horizon|institute-backdrop|cinematic-v1\.js/);
  assert.match(html,/hero-reel-v2\.css/);
  assert.match(html,/hero-reel-v2\.js/);
  assert.doesNotMatch(html,/id="sculpture"|id="play-sculpture"/);
  assert.doesNotMatch(app,/getContext\(['"]webgl/);
  assert.doesNotMatch(reelJS,/fetch\(|WebGL|createElement\(['"]canvas/);
});

test('hero foreground showcases real project interfaces, not fake usage or invented UI',()=>{
  assert.match(html,/class="reel-main-screen"/);
  assert.match(html,/src="\/portfolio\/assets\/anevum-interface\.webp"/);
  assert.match(html,/data-hero-project="anevum"/);
  assert.match(html,/id="reel-open" data-project="anevum"/);
  for(const id of ['anevum','fold','rhen','transcosmic']) {
    assert.match(html,new RegExp('data-hero-select="'+id+'"'));
    assert.match(reelJS,new RegExp('^    '+id+': \\{','m'));
  }
  assert.match(reelJS,/review catalogue includes synthetic content/);
  assert.match(reelJS,/not live GPS/);
  assert.match(reelJS,/no live trading engine/);
  for(const p of ['anevum-interface.webp','fold-interface.webp','rhen-interface.webp']) {
    assert.ok(existsSync(new URL('assets/'+p,root)),'missing real asset: '+p);
  }
});

test('hero is keyboard-operable, stateful, low power and respects motion preferences',()=>{
  assert.match(html,/aria-pressed="true"/);
  assert.match(reelJS,/event\.key==='?Home|event\.key === 'Home'/);
  assert.match(reelJS,/ArrowLeft/);
  assert.match(reelJS,/ArrowRight/);
  assert.match(reelJS,/setAttribute\('aria-pressed'/);
  assert.match(reelJS,/requestAnimationFrame\(paint\)/);
  assert.match(reelJS,/navigator\.connection\?\.saveData === true/);
  assert.match(reelJS,/prefers-reduced-motion: reduce/);
  assert.match(reelJS,/document\.hidden/);
  assert.match(reelJS,/IntersectionObserver/);
  assert.match(reelCSS,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(reelCSS,/\.motion-paused/);
});

test('case study stories, filter and direct query links still work',()=>{
  assert.match(html,/<dialog id="project-dialog"/);
  assert.match(app,/dialog\.showModal/);
  assert.match(app,/data-case-direction/);
  assert.match(app,/data-copy-case/);
  assert.match(app,/new URLSearchParams\(window\.location\.search\)\.get\('project'\)/);
  assert.match(app,/history\.replaceState/);
  for(const id of ['anevum','fold','rhen','transcosmic']) {
    assert.match(html,new RegExp('data-project="'+id+'"'));
    assert.match(app,new RegExp('^  '+id+': \\{','m'));
  }
});

test('explicit prototype disclaimers remain and project materials do not overclaim',()=>{
  assert.match(app,/synthetic/);
  assert.match(app,/not a released multiplayer game/);
  assert.match(app,/no running trading engine or connected brokerage account/);
  assert.match(app,/creative development/);
  assert.match(html,/assets\/fold-interface\.webp/);
  assert.match(html,/assets\/rhen-interface\.webp/);
  assert.match(html,/assets\/devon-akins\.jpg/);
});

test('scripts parse, CSS braces balance, and real process states remain',()=>{
  assert.doesNotThrow(()=>new Script(reelJS,{filename:'hero-reel-v2.js'}));
  assert.doesNotThrow(()=>new Script(app,{filename:'app.js'}));
  for(const style of [css,reelCSS])assert.equal((style.match(/\{/g)||[]).length,(style.match(/\}/g)||[]).length);
  assert.match(html,/data-process="understand"/);
  assert.match(html,/data-process="make"/);
  assert.match(html,/data-process="verify"/);
  assert.match(app,/function activateProcess/);
  assert.match(reelCSS,/\.reel-controls/);
  assert.match(reelCSS,/\.reel-main/);
});

test('links point to real anchors, not non-existent site sections',()=>{
  const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]));
  for(const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(match[1]),'#'+match[1]+' missing');
  for(const id of ['main','top','work','process','about','contact'])assert.ok(ids.has(id));
});
