// Protect the owner-approved Orbital Underground identity from V136 geometry forks.
// This test is source-only and does not use privileged browser or production flags.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('web/src/components/OrbitalMark.tsx',root),'utf8');
const full=readFileSync(new URL('brand/anevum-mark.svg',root),'utf8');
const compact=readFileSync(new URL('brand/anevum-mark-compact.svg',root),'utf8');
const favicon=readFileSync(new URL('web/public/favicon.svg',root),'utf8');
const header=readFileSync(new URL('web/src/parity/ParityHeaderV136.tsx',root),'utf8');
const shell=readFileSync(new URL('web/src/components/Shell.tsx',root),'utf8');
const stage=readFileSync(new URL('web/src/components/OrbitalStage.tsx',root),'utf8');
const consoleNav=readFileSync(new URL('web/src/parity/ConsoleWayfinderV136.tsx',root),'utf8');
const consoleCss=readFileSync(new URL('web/src/parity/console-wayfinder-v136.css',root),'utf8');
const index=readFileSync(new URL('web/index.html',root),'utf8');
const orbitalPattern=/<(?:ellipse|path|circle)\b[^>]*\/>/g;
const normalize=(markup)=>[...markup.matchAll(orbitalPattern)].map(item=>{
  const tag=item[0].match(/^<([a-z]+)/)?.[1];
  const attrs=Object.fromEntries([...item[0].matchAll(/([\w-]+)="([^"]*)"/g)]
    .map(([,key,value])=>[key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value]));
  return {tag,attrs};
});

test('V136 shared React logo precisely matches original owner-selected geometry and palette',()=>{
  const canonical=normalize(full),rendered=normalize(source);
  assert.equal(canonical.length,6,'The official symbol has exactly six geometric primitives');
  assert.deepEqual(rendered,canonical,'The full shared logo may not be redescribed or recolored');
  assert.match(source,/data-anevum-mark="orbital-underground"/);
  assert.doesNotMatch(source,/VITE_PARITY_V136_FULL|p136-living-mark|linearGradient|<defs>|strokeDasharray/);
  assert.doesNotMatch(source,/rx="211"|rx="180"|rx="117"|M246 236|M256 79/);
});

test('public header, mobile navigation and cinematic orbital stage use one shared React mark',()=>{
  assert.match(header,/<OrbitalMark className="p136-brand-mark"/);
  assert.match(shell,/<OrbitalMark className="brand-mark"/);
  assert.match(shell,/<OrbitalMark className="av79-wayfinder-mark"/);
  assert.match(stage,/<OrbitalMark className="depth-stage-mark"/);
  assert.match(consoleNav,/<OrbitalMark className="p136-console-ident-mark"/);
  assert.match(consoleCss,/\.p136-console-ident-mark\{[^}]*width:24px;height:24px/);
  assert.doesNotMatch(consoleNav,/p136-console-light|A \/ CONTINUANCE/);
  for(const [name,text] of [['V136 header',header],['shared shell',shell],['stage',stage]])
    assert.doesNotMatch(text,/className="p136-living-mark"/,name+' must not recreate the atom mark');
});

test('V136 SVG favicon is byte-identical to approved compact master',()=>{
  assert.deepEqual(normalize(favicon),normalize(compact),
    'Contrast-safe favicon tile must retain every approved compact contour and color');
  assert.match(favicon,/<rect width="512" height="512" rx="110" fill="#0b0b0d"\/>/);
  assert.match(favicon,/ANEVUM Orbital Underground emblem/);
  assert.ok(normalize(favicon).length>=5);
  assert.match(index,/favicon\.svg\?v=20261025-orbital-underground/);
});

test('the owner-approved SVG master remains unaltered',()=>{
  assert.match(full,/rx="188" ry="76" transform="rotate\(-17 256 256\)"/);
  assert.match(full,/M256 56 274 211 326 256 274 301 256 456/);
  assert.match(full,/cx="391" cy="132" r="20"/);
  assert.doesNotMatch(full,/<script|<image\b|foreignObject|onclick=/i);
});
