import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
const read=name=>readFileSync(name,'utf8');
const world=read('creator-v1/web/src/pages/WorldComposerReviewV115.tsx');
const assistant=read('creator-v1/web/src/pages/StudioIrenAssistantV122.tsx');
const rail=read('creator-v1/web/src/pages/StudioNavigationV116.tsx');
const shelf=read('creator-v1/web/src/pages/StudioAssetShelfV116.tsx');
const css=read('creator-v1/web/src/pages/studio-concept-v122.css');

test('V122 real Studio and IREN JSX parse as components, not a baked screenshot',()=>{
 for(const src of [world,assistant,rail,shelf])
  assert.ok(parse(src,{sourceType:'module',plugins:['typescript','jsx']}).program.body.length>=4);
 assert.match(world,/WorldCanvasV115 document=\{scene\}/);
 assert.match(world,/StudioIrenAssistantV122 projectName=\{scene.name\}/);
 assert.match(world,/selectedObject=\{node\?\.name\|\|null\}/);
 assert.match(world,/onMode=\{next=>\{setMode\(next\)/);
 assert.match(world,/onFrame=\{\(\)=>\{setMode\('Scene'\);frameSelected\(\)/);
 assert.match(world,/onLighting=\{\(\)=>\{setMode\('Scene'\);setLightingOpen\(true\)/);
 assert.match(world,/StudioFileTreeV116 onOpen=\{openSampleFile\}/);
 assert.match(world,/StudioAssetShelfV116 onAdd=\{addAsset\}/);
 assert.match(world,/scene\.nodes\.length/);
 assert.match(world,/studio-concept-v122\.css/);
 assert.match(world,/OrbitalMark/);
});
test('V122 IREN actions call real existing UI tools and existing companion, never a counterfeit AI',()=>{
 assert.match(assistant,/data-studio-iren-v122="local-controls"/);
 assert.match(assistant,/import \{OrbitalMark\}/);
 assert.match(assistant,/onOpenIren/);
 assert.match(world,/new Event\('anevum:iren-open'\)/);
 for(const marker of ["onMode('Scene')","onMode('Interface')","onMode('Assets')","onMode('Scripts')","run:onLighting"]){
  assert.ok(assistant.includes(marker),marker);
 }
 for(const marker of ['ACTIVE WORKSPACE','STUDIO ACTIONS','Local editor actions ready','not connected to this review scene'])
  assert.ok(assistant.includes(marker),marker);
 for(const file of [assistant,world])
  assert.doesNotMatch(file,/\bdangerouslySetInnerHTML\b|\beval\s*\(|new Function|api\.openai\.com|api\.anthropic\.com/);
 assert.doesNotMatch(assistant,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
});
test('V122 icon hierarchy and asset badges are semantic, with preview-only assets marked honestly',()=>{
 for(const name of ['mountain','building-2','route','waves','rocket','circle-dot','sun','box'])
  assert.ok(world.includes(name),name);
 assert.match(world,/cvw-node-glyph is-/);
 assert.match(rail,/className="csn-rail-iren"/);
 assert.match(rail,/new Event\('anevum:iren-open'\)/);
 assert.match(shelf,/csn-asset-availability/);
 assert.match(shelf,/a\.kind\?'3D':'CONCEPT'/);
 assert.match(shelf,/if\(a\.kind\)onAdd\(a\);else setPreviewId\(a.id\)/);
});
test('V122 visuals stay scoped, mobile-aware and honest about production',()=>{
 for(const marker of [
  '.cvw-root.cvs-root','.cvw-root .cvw-stage','.cvw-root .cvw-grid',
  '.cvs-iren-v122','.cvs-iren-orb','.cvs-iren-action',
  '.cvs-iren-action.is-blue','.cvs-iren-action.is-gold','.cvs-iren-action.is-cyan',
  '.cvw-root .csn-asset-thumbnail','.cvw-root .cvw-node-glyph',
  '.cvw-root .csn-scene-light','.cvw-root .csn-mode-rail .csn-rail-iren',
  '@media(max-width:680px)','prefers-reduced-motion:reduce','forced-colors:active'
 ])assert.ok(css.includes(marker),marker);
 assert.match(assistant,/aria-label="IREN Studio assistant"/);
 assert.match(assistant,/aria-label="Open existing IREN companion"/);
 assert.match(assistant,/aria-label=\{action.title\}/);
 assert.match(world,/aria-label="World object inspector"/);
 assert.match(world,/data-world-composer-v115="source-only"/);
 assert.match(world,/disabled className="cvs-primary"/);
 assert.doesNotMatch(css,/\burl\s*\(\s*['"]?https?:/);
});
