import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const source = read('../web/src/experience/continuance-cinematic/CinematicReactReview.tsx');
const css = read('../web/src/experience/continuance-cinematic/cinematic-react-review.css');
const vite = read('../web/vite.continuance-cinematic-react-review.config.ts');
const reviewHtml = read('../web/review/continuance-cinematic-react/index.html');
test('exact isolated review entry and copy-only approved responsive artwork assets', () => {
  assert.match(vite, /continuance-cinematic-react-review/);
  assert.match(vite, /public\/assets\/community-portals/);
  assert.match(vite, /emptyOutDir:\s*true/);
  assert.doesNotMatch(vite, /^\s*import\s+.*(?:cloudflare|wrangler)|\bdeploy\s*\(/mi);
  assert.match(reviewHtml, /noindex,nofollow,noarchive/);
  assert.match(reviewHtml, /continuance-cinematic-react-review/);
  assert.doesNotMatch(read('../web/src/main.tsx'), /continuance-cinematic/);
  assert.doesNotMatch(read('../web/src/App.tsx'), /continuance-cinematic/);
  assert.doesNotMatch(read('../web/vite.config.ts'), /continuance-cinematic/);
});
test('React specimen uses the real OrbitalMark and two native review screens', () => {
  assert.match(source, /components\/OrbitalMark/);
  assert.match(source, /'arrival'\s*\|\s*'discover'/);
  assert.match(source, /<h1/);
  assert.match(source, /aria-current=/);
  assert.match(source, /aria-pressed=/);
  assert.match(source, /Skip to main content/);
  assert.match(source, /NOT DEPLOYED/);
});
test('responsive artwork masters and scalable SVG instrument are used without arbitrary remote imagery', () => {
  assert.match(source, /srcSet=/);
  assert.match(source, /-768\.webp/);
  assert.match(source, /-1536\.webp/);
  assert.match(source, /<picture>/);
  assert.match(source, /fetchPriority/);
  assert.match(source, /<svg/);
  assert.match(source, /viewBox="0 0 900 640"/);
  assert.doesNotMatch(source, /https?:\/\/|data:image\/|cdn\./);
});
test('no fake publishing, network calls, account records, payments, AI or persistent state', () => {
  for (const file of [
    '../web/src/experience/continuance-cinematic/CinematicReactReview.tsx',
    '../web/src/experience/continuance-cinematic/review-main.tsx'
  ]) assert.doesNotMatch(read(file), /\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|sendBeacon|canonicalAuthClient|dangerouslySetInnerHTML|\beval\s*\(|new Function|IrenGuidedContinuance|window\.dispatchEvent|payments\.create/);
  assert.match(source, /not connected in this isolated review/);
  assert.match(source, /No project records in this design review/);
});
test('legible responsive design, pause and OS reduced motion, focus and forced colors', () => {
  for (const item of [':focus-visible', 'max-width:640px', 'max-width:359px', 'prefers-reduced-motion:reduce', 'forced-colors:active', 'data-still="true"', '@keyframes cnr-orbit', 'object-fit:cover']) assert.ok(css.includes(item), item);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /visibilitychange/);
  assert.doesNotMatch(source, /Pause motion|Resume motion|cnr-motion|motionPaused/);
  assert.match(source, /const still = osReduced \|\| !visible/);
  assert.doesNotMatch(css, /@import|url\s*\(\s*['"]?https?:/i);
});
test('production bundle does not contain isolated review (optional post-build guard)', { skip: process.env.CNR_CHECK_PRODUCTION !== '1' }, () => {
  const root = fileURLToPath(new URL('../dist/web/', import.meta.url));
  assert.ok(existsSync(root), 'normal V1 build must already exist');
  const walk = (dir) => { for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const location = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(location);
    else if (/\.(?:html|js|css)$/.test(entry.name)) assert.doesNotMatch(readFileSync(location, 'utf8'), /cnr-root|continuance-cinematic-react-review|CinematicReactReview/);
  }};
  walk(root);
});
