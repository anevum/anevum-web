/**
 * Verify unpublished Original Works content is absent from default deployable
 * assets and present only in a deliberately enabled, owner-protected review.
 * Static verification only; this neither uploads nor serves the bundle.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKERS = Object.freeze([
  'Public-source cleared',
  'Three signals.',
  'Guessing a URL never reveals private or unpublished canon.',
]);
const ASSET = /\.(?:js|css|html|map)$/;
const RUNTIME = /\.(?:js|css|html)$/;

export function verifyOriginalWorksBundle(mode, root = 'dist/client') {
  if (mode !== 'disabled' && mode !== 'enabled') throw Error('INVALID_PREVIEW_BUNDLE_MODE');
  const directory = resolve(root);
  if (!existsSync(directory)) throw Error('PREVIEW_BUNDLE_MISSING');
  const assets = [];
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && ASSET.test(entry.name)) assets.push(path);
    }
  }
  visit(directory);
  if (!assets.some(path => RUNTIME.test(path))) throw Error('PREVIEW_BUNDLE_NO_RUNTIME_ASSETS');
  const runtime = new Set(assets.filter(path => RUNTIME.test(path)));
  const seen = new Map(MARKERS.map(marker => [marker, { runtime: false, any: false }]));
  for (const path of assets) {
    const content = readFileSync(path, 'utf8');
    for (const marker of MARKERS) {
      if (!content.includes(marker)) continue;
      const found = seen.get(marker);
      found.any = true;
      if (runtime.has(path)) found.runtime = true;
    }
  }
  if (mode === 'disabled' && [...seen.values()].some(v => v.any)) {
    throw Error('UNPUBLISHED_CONTENT_IN_DEFAULT_BUNDLE');
  }
  if (mode === 'enabled' && [...seen.values()].some(v => !v.runtime)) {
    throw Error('REVIEW_CONTENT_MISSING_FROM_ENABLED_BUNDLE');
  }
  return { mode, assetsChecked: assets.length, markers: MARKERS.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv[2] === '--disabled' ? 'disabled' :
      process.argv[2] === '--enabled' ? 'enabled' : null;
    const result = verifyOriginalWorksBundle(mode);
    console.log('ORIGINAL_WORKS_BUNDLE_GATE_PASS ' + result.mode +
      ': ' + result.assetsChecked + ' assets checked, ' + result.markers + ' markers.');
  } catch (err) {
    const allowed = new Set([
      'INVALID_PREVIEW_BUNDLE_MODE','PREVIEW_BUNDLE_MISSING',
      'PREVIEW_BUNDLE_NO_RUNTIME_ASSETS','UNPUBLISHED_CONTENT_IN_DEFAULT_BUNDLE',
      'REVIEW_CONTENT_MISSING_FROM_ENABLED_BUNDLE',
    ]);
    console.error('ORIGINAL_WORKS_BUNDLE_GATE_BLOCKED: ' +
      (allowed.has(err?.message) ? err.message : 'PREVIEW_BUNDLE_CHECK_FAILED'));
    process.exitCode = 1;
  }
}
