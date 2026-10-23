import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const directory = '../web/src/experience/continuance-next/';
test('review has its own entry, output and no public-directory copy', () => {
 const config = read('../web/vite.continuance-next-review.config.ts');
 assert.match(config, /publicDir:\s*false/);
 assert.match(config, /dist\/continuance-next-review/);
 assert.match(config, /review\/continuance-next\/index\.html/);
 assert.doesNotMatch(config, /wrangler|cloudflare|deploy\(/i);
 assert.match(read('../web/review/continuance-next/index.html'), /noindex,nofollow,noarchive/);
});
test('review components do not initiate network, account or durable writes', () => {
 for (const file of ['ContinuanceReview.tsx', 'ActionLens.tsx', 'action-lens.ts', 'review-main.tsx']) {
   const source = read(directory + file);
   assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|sendBeacon|canonicalAuthClient|dangerouslySetInnerHTML|\beval\s*\(|new Function/);
 }
});
test('review reuses the actual mark and never mounts a duplicate IREN', () => {
 const source = read(directory + 'ContinuanceReview.tsx');
 assert.match(source, /components\/OrbitalMark/);
 assert.doesNotMatch(source, /IrenGuidedContinuance|iren-open|createRoot/);
 assert.match(source, /LOCAL EXAMPLES \/ NOT LIVE/);
});
test('scoped styling retains focus, manual pause, reduced-motion and forced-color paths', () => {
 const css = read(directory + 'tokens.css');
 for (const token of ['[data-av-design="continuance-next"]', ':focus-visible', 'data-still=true', 'prefers-reduced-motion:reduce', 'forced-colors:active']) assert.ok(css.includes(token), token);
 assert.doesNotMatch(css, /@import|url\s*\(/);
 assert.match(read(directory + 'ContinuanceReview.tsx'), /visibilitychange/);
});
test('normal production bundles exclude review implementation', { skip: process.env.AVNEXT_CHECK_PRODUCTION !== '1' }, () => {
 const root = fileURLToPath(new URL('../dist/web/', import.meta.url));
 const inspect = directory => {
   for (const entry of readdirSync(directory, { withFileTypes: true })) {
     const path = join(directory, entry.name);
     if (entry.isDirectory()) inspect(path);
     else if (/\.(?:html|js|css)$/.test(entry.name)) assert.doesNotMatch(readFileSync(path, 'utf8'), /avnext-root|continuance-next-review|local-scene/);
   }
 };
 inspect(root);
 for (const file of ['../web/src/main.tsx', '../web/src/App.tsx']) assert.doesNotMatch(read(file), /continuance-next/);
});
