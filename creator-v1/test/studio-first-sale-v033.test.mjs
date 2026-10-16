import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../../studio-offers/creator-portal/demo/'+path,import.meta.url),'utf8');
const page=read('index.html'),css=read('styles.css');

test('static sample is clearly labeled as fictitious work and has no active sales claim',()=>{
 assert.match(page,/ANEVUM STUDIO DEMONSTRATION/);
 assert.match(page,/NOT A REAL CLIENT/);
 assert.match(page,/sample entries|sample content only/i);
 assert.match(page,/not actual customer works/i);
 assert.match(page,/does not collect inquiries/);
 assert.match(page,/name="robots" content="noindex,nofollow"/);
 assert.doesNotMatch(page,/<script\b|<form\b|checkout\.stripe\.com|buy\.stripe\.com|customer payment/i);
 assert.doesNotMatch(page,/\btestimonial\b|\b5-star\b|\bguaranteed earnings\b/i);
});
test('sample works without network, external fonts or privacy-invasive scripts',()=>{
 assert.match(page,/href="\.\/styles\.css"/);
 assert.doesNotMatch(page,/src="https?:|href="https?:|href="mailto:|<iframe\b/i);
 assert.doesNotMatch(css,/@import|url\(\s*['"]?https?:|@font-face|@keyframes\s+\w+\s*{[^}]*fetch\(/i);
 assert.equal((page.match(/<article class="project">/g)||[]).length,3);
});
test('anchors and viewport are structurally coherent',()=>{
 const ids=new Set([...page.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
 assert.equal(ids.size,[...page.matchAll(/\bid="([^"]+)"/g)].length,'no duplicate IDs');
 for(const [ref] of [...page.matchAll(/href="#([^"]+)"/g)].map(x=>[x[1]]))
  assert.ok(ids.has(ref),'missing anchor '+ref);
 assert.match(page,/name="viewport"/);
 assert.match(page,/class="skip" href="#main"/);
 assert.match(page,/<main id="main">/);
 assert.match(page,/aria-label="Main navigation"/);
 assert.match(page,/id="work"/);
 assert.match(page,/id="about"/);
 assert.match(page,/id="contact"/);
});
test('responsive and reduced-motion contracts are implemented in CSS',()=>{
 assert.match(css,/@media\(max-width:1100px\)/);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(css,/focus-visible/);
 assert.ok(Buffer.byteLength(page)+Buffer.byteLength(css)<50000,'starter remains lightweight');
});
