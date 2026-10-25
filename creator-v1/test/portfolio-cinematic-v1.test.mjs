import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';

const root = new URL('../web/public/portfolio/', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const html = read('index.html');
const css = read('cinematic-v1.css');
const js = read('cinematic-v1.js');
const app = read('app.js');
const artwork = read('assets/continuance-horizon.svg');

test('portfolio page remains independently accessible and has accurate metadata', () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /href="https:\/\/anevum\.com\/portfolio\/"/);
  assert.match(html, /<meta name="description" content="Explore real projects/);
  assert.match(html, /href="#main">Skip to content/);
  assert.match(html, /id="motion-toggle"/);
  assert.match(html, /<details class="mobile-nav">/);
  assert.match(html, /href="#contact"/);
  assert.match(html, /id="brief-form"/);
  assert.match(html, /Nothing is sent by this site/);
});

test('original high-resolution scalable Institute artwork is first-party and remains a fallback', () => {
  assert.match(html, /class="hero-art institute-environment"/);
  assert.match(html, /assets\/continuance-horizon\.svg/);
  assert.match(artwork, /<svg[^>]*viewBox="0 0 1920 1080"/);
  assert.match(artwork, /<\/svg>\s*$/);
  assert.doesNotMatch(artwork, /<script|<foreignObject|https?:\/\/|onload=/i);
  assert.match(css, /\.institute-backdrop\{/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test('four real portfolio records and production-honest disclaimers are preserved', () => {
  for (const name of ['anevum', 'fold', 'rhen', 'transcosmic']) {
    assert.match(html, new RegExp('data-project="' + name + '"'));
    assert.match(app, new RegExp('^  ' + name + ': \\{', 'm'));
  }
  assert.match(app, /synthetic/);
  assert.match(app, /not a released multiplayer game/);
  assert.match(app, /no running trading engine or connected brokerage account/);
  assert.match(app, /creative development/);
  assert.match(html, /assets\/anevum-interface\.webp/);
  assert.match(html, /assets\/fold-interface\.webp/);
  assert.match(html, /assets\/rhen-interface\.webp/);
  assert.match(html, /assets\/devon-akins\.jpg/);
  for (const file of ['assets/anevum-interface.webp','assets/fold-interface.webp','assets/rhen-interface.webp','assets/devon-akins.jpg']) {
    assert.ok(existsSync(new URL(file, root)), 'missing real portfolio asset ' + file);
  }
});

test('project stories remain accessible and directly shareable without inventing publishing capabilities', () => {
  assert.match(html, /<dialog id="project-dialog"/);
  assert.match(app, /dialog\.showModal/);
  assert.match(app, /dialog\.addEventListener\('close'/);
  assert.match(app, /new URLSearchParams\(window\.location\.search\)\.get\('project'\)/);
  assert.match(app, /data-case-direction/);
  assert.match(app, /data-copy-case/);
  assert.match(app, /history\.replaceState/);
  assert.match(app, /document\.querySelectorAll\('\[data-filter\]'\)/);
});

test('the old duplicate WebGL sculptures are retired, not stacked under new artwork', () => {
  assert.doesNotMatch(html, /id="sculpture"|id="play-sculpture"/);
  assert.doesNotMatch(app, /getContext\(['"]webgl/);
  assert.doesNotMatch(app, /new Sculpture\(/);
  assert.match(html, /data-process="understand"/);
  assert.match(html, /data-process="make"/);
  assert.match(html, /data-process="verify"/);
  assert.match(app, /function activateProcess/);
  assert.match(app, /aria-pressed/);
});

test('cinematic playback stays off without explicit approval and never fetches third-party sources', () => {
  assert.match(js, /stage\.dataset\.mediaApproved === 'true'/);
  assert.match(js, /portfolio\\\/assets\\\/cinematic/);
  assert.match(js, /navigator\.connection\?\.saveData === true/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /document\.hidden/);
  assert.match(js, /video\.muted = true/);
  assert.match(js, /video\.preload = 'none'/);
  assert.doesNotMatch(html, /data-media-approved="true"|data-approved-video=/);
  assert.doesNotMatch(js, /https?:\/\//);
});

test('all client scripts parse and cinematic CSS blocks are balanced', () => {
  assert.doesNotThrow(() => new Script(js, {filename:'cinematic-v1.js'}));
  assert.doesNotThrow(() => new Script(app, {filename:'app.js'}));
  assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length);
  assert.match(css, /\.mobile-nav-links/);
  assert.match(css, /\.project-anevum/);
  assert.match(css, /\.process-stage/);
  assert.match(css, /\.case-navigation/);
  assert.match(css, /\.motion-paused \.reveal/);
});

test('no broken in-page navigation is introduced', () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), 'missing anchor target: #' + match[1]);
  }
  for (const name of ['work','process','about','contact','main']) assert.ok(ids.has(name));
});
