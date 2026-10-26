// ANEVUM exact-master identity guard for retained V131 public company shell.
// No network, account, D1, production Worker, privilege or deployment access.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const svgPaths=markup=>[...markup.matchAll(/<(ellipse|path|circle)\b([^>]*)\/>/g)].map(([,tag,body])=>({
  tag,attributes:Object.fromEntries([...body.matchAll(/([\w-]+)="([^"]*)"/g)]
    .map(([,key,value])=>[key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value]).sort(([a],[b])=>a.localeCompare(b)))
}));
const master=read('creator-v1/brand/anevum-mark.svg');
const compact=read('creator-v1/brand/anevum-mark-compact.svg');

test('retained V131 SVG matches every approved Orbital Underground primitive and color',()=>{
  const mark=read('src/components/Mark.tsx');
  assert.deepEqual(svgPaths(mark),svgPaths(master));
  assert.equal(svgPaths(mark).length,6);
  assert.match(mark,/data-anevum-mark="orbital-underground"/);
  assert.match(mark,/viewBox="0 0 512 512"/);
  assert.match(mark,/aria-label="ANEVUM Orbital Underground"/);
  assert.doesNotMatch(mark,/mark-ring|mark-outer|mark-stem|M50 14|linearGradient|VITE_PARITY_V136_FULL/);
  assert.match(read('src/components/Shell.tsx'),/<Mark\s*\/>/);
  assert.match(read('src/pages/HomeCompany.tsx'),/Mark|anevum/);
});

test('legacy global styles cannot re-color or erase the canonical path',()=>{
  const styles=read('src/styles/global.css');
  assert.doesNotMatch(styles,/\.anevum-mark path\{fill:none/);
  assert.doesNotMatch(styles,/\.anevum-mark \.mark-ring|\.anevum-mark \.mark-stem/);
  assert.match(styles,/\.anevum-mark\{display:block;width:32px;height:32px/);
  const workshop=read('src/styles/workshop.css');
  assert.match(workshop,/\.workshop-public-light \.anevum-mark\[data-anevum-mark="orbital-underground"\]/);
  assert.match(workshop,/background:#0b0b0d/);
});

test('retained V131 favicon is the exact compact master on one dark plate',()=>{
  const favicon=read('public/favicon.svg');
  assert.deepEqual(svgPaths(favicon),svgPaths(compact));
  assert.match(favicon,/<rect width="512" height="512" rx="110" fill="#0b0b0d"\/>/);
  assert.match(favicon,/ANEVUM Orbital Underground emblem/);
  assert.doesNotMatch(favicon,/M50 14|#9bc7e5|linearGradient/);
  const html=read('index.html');
  assert.match(html,/favicon\.svg\?v=20261025-orbital-underground/);
  assert.match(html,/apple-touch-icon\.png\?v=20261025-orbital-underground/);
  assert.match(html,/site\.webmanifest\?v=20261025-orbital-underground/);
});

test('three installed-app PNG assets are byte-identical to approved Creator V1 icons',()=>{
  const icons=[
    ['public/icon-192.png','ba4ba51b37b85133b5c62a035747e7145c819b21',192],
    ['public/icon-512.png','04a062f1ff2ab52b1098aa54b1733d8c7b25dd63',512],
    ['public/apple-touch-icon.png','f261bf6a4c8d1b223adad752d191f6e46055beeb',180]
  ];
  for(const [path,expectedHash,size] of icons){
    const bin=readFileSync(new URL(path,root));
    assert.equal(bin.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(bin.readUInt32BE(16),size);
    assert.equal(bin.readUInt32BE(20),size);
    const hash=createHash('sha1').update('blob '+bin.length+'\0').update(bin).digest('hex');
    assert.equal(hash,expectedHash,path+' must be a byte-identical approved asset');
  }
  const manifest=JSON.parse(read('public/site.webmanifest'));
  assert.deepEqual(manifest.icons.map(i=>i.src),[
    '/icon-192.png?v=20261025-orbital-underground',
    '/icon-512.png?v=20261025-orbital-underground'
  ]);
});
