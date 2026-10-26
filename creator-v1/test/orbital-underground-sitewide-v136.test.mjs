// ANEVUM / approved brand parity guard for the unified V136 site.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');
const canonical = read('brand/anevum-mark.svg');
const compact = read('brand/anevum-mark-compact.svg');
const component = read('web/src/components/OrbitalMark.tsx');

test('V136 has exactly one approved, non-atomic shared logo geometry',()=>{
  assert.match(canonical,/ANEVUM Orbital Underground emblem/);
  for(const shape of [
    /cx="256" cy="256" rx="188" ry="76" transform="rotate\(-17 256 256\)"/,
    /d="M256 56 274 211 326 256 274 301 256 456 238 301 186 256 238 211Z"/,
    /cx="256" cy="256" r="72"/,
    /cx="269" cy="251" r="34"/,
    /cx="239" cy="230" r="8"/,
    /cx="391" cy="132" r="20"/
  ]){
    assert.match(canonical,shape);
    assert.match(component,shape,'shared component must exactly retain original contour');
  }
  assert.match(component,/data-anevum-mark="orbital-underground"/);
  assert.doesNotMatch(component,/VITE_PARITY_V136_FULL|p136-living-mark|linearGradient|rx="211"|rotate\(-32/);
  assert.doesNotMatch(component,/m256 79 28 133|m256 79|M256 79/);
  assert.equal((component.match(/<svg\b/g)||[]).length,1,'No conditional replacement SVG');
});

test('all original sitewide brand surfaces reuse that shared component',()=>{
  for(const [path,needle] of [
    ['web/src/parity/ParityHeaderV136.tsx',/OrbitalMark className="p136-brand-mark"/],
    ['web/src/components/Shell.tsx',/OrbitalMark className="brand-mark"/],
    ['web/src/components/Shell.tsx',/OrbitalMark className="av79-wayfinder-mark"/],
    ['web/src/components/OrbitalStage.tsx',/OrbitalMark className="depth-stage-mark"/],
    ['web/src/parity/ConsoleWayfinderV136.tsx',/OrbitalMark className="p136-console-ident-mark"/]
  ]){
    const src=read(path);
    assert.match(src,/import\s*\{\s*OrbitalMark\s*\}/,'Must import shared ANEVUM identity: '+path);
    assert.match(src,needle,'Missing approved logo placement: '+path);
  }
  const console=read('web/src/parity/ConsoleWayfinderV136.tsx');
  assert.doesNotMatch(console,/p136-console-light|A \/ CONTINUANCE/);
});

test('V136 favicon and installed-app icons preserve compact approved silhouette',()=>{
  const favicon=read('web/public/favicon.svg');
  assert.match(compact,/Orbital Underground emblem/);
  const shape = compact.match(/<\/title>([\s\S]*?)<\/svg>/)?.[1];
  assert.ok(shape,'Canonical compact SVG missing contour');
  assert.equal(favicon.replace('<rect width="512" height="512" rx="110" fill="#0b0b0d"/>',''),compact,
    'Favicon may add only its contrast-safe dark plate; official compact contour and palette must remain byte-identical');
  assert.ok(favicon.includes(shape),'Favicon must include unmodified compact mark geometry');
  assert.doesNotMatch(favicon,/stroke="#f1d39b"|fill="#f1d39b"/);
  const index=read('web/index.html');
  assert.match(index,/favicon\.svg\?v=20261025-orbital-underground/);
  const manifest=JSON.parse(read('web/public/site.webmanifest'));
  for(const icon of manifest.icons){
    const filename=icon.src.split('/').pop();
    const bin=readFileSync(new URL('../web/public/'+filename,import.meta.url));
    assert.equal(bin.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(bin.readUInt32BE(16),Number(icon.sizes.split('x')[0]));
    assert.equal(bin.readUInt32BE(20),Number(icon.sizes.split('x')[1]));
  }
});

test('brand stays a legible symbol rather than inheriting motion from decorative stage',()=>{
  const style=read('web/src/parity/console-wayfinder-v136.css');
  assert.match(style,/\.p136-console-ident-mark\{[^}]*width:24px;height:24px/);
  assert.match(style,/\.p136-console-ident\{display:flex;align-items:center/);
  const header=read('web/src/parity/ParityHeaderV136.tsx');
  assert.match(header,/className="p136-brand"/);
  assert.match(header,/aria-label="ANEVUM homepage"/);
  assert.doesNotMatch(header,/A \/ CONTINUANCE|<svg /);
  // The V136 visual environment can have orbits; they are not identity assets.
  assert.ok(read('web/src/parity/visual-foundation-v136.css').includes('.p136-brand-mark'));
});
