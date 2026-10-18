import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');

test('published standalone prototype embeds the tested domain module', () => {
  const html = load('./index.html');
  const source = load('./domain.mjs')
    .replaceAll('export const ', 'const ')
    .replaceAll('export function ', 'function ');
  assert.ok(html.includes(source.trim()), 'index.html must inline the same domain logic as the tested module');
});

test('demo is offline and never prompts for GPS or contacts', () => {
  const html = load('./index.html');
  assert.match(html, /FICTIONAL DEMONSTRATION/);
  assert.match(html, /not a live safety service/i);
  assert.doesNotMatch(html, /navigator\.geolocation|navigator\.contacts|localStorage|sessionStorage|XMLHttpRequest|fetch\s*\(/);
  assert.doesNotMatch(html, /<script[^>]*\bsrc\s*=|<iframe|<form\b/i);
  assert.doesNotMatch(html, /<link[^>]*\bhref\s*=\s*["']https?:\/\//i);
  assert.match(html, /type="button"/);
});
