import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {renderEvolutionCardArt} from '../canonical-auth/evolution-card-art.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const catalog=JSON.parse(read('shared/level-artifacts.json'));
const plates=JSON.parse(read('canonical-auth/evolution-card-plates.json'));
const parseTsx=source=>parse(source,{sourceType:'module',plugins:['typescript','jsx']});

test('V077 creates 30 unique, scalable front-facing earned Evolution artwork plates',()=>{
 assert.equal(catalog.length,30);
 assert.equal(plates.length,30);
 const seen=new Set();
 for(const item of catalog){
  const {level,name}=item;
  const art=renderEvolutionCardArt(level);
  assert.ok(art,'Missing Level '+level);
  assert.ok(art.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.match(art,/viewBox="0 0 256 256"/);
  assert.match(art,new RegExp('<title>Evolution level '+level+' - '));
  assert.match(art,/<radialGradient id="core"/);
  assert.match(art,/<filter id="depth"/);
  assert.match(art,/<\/svg>$/);
  assert.ok(!/\<(?:script|foreignObject|image|iframe|a)(?:[\s>])/i.test(art),'External or script content in Level '+level);
  assert.equal(plates[level-1].name,name,'Wrong canonical name at '+level);
  assert.ok(!seen.has(plates[level-1].art),'Duplicate visual design at '+level);
  seen.add(plates[level-1].art);
 }
 assert.equal(renderEvolutionCardArt(0),null);
 assert.equal(renderEvolutionCardArt(31),null);
 assert.equal(renderEvolutionCardArt(1.5),null);
});
test('V077 Level 4 is a balanced frontal specimen, not an oblique model thumbnail',()=>{
 const l4=renderEvolutionCardArt(4);
 assert.match(l4,/Symmetry Field/);
 assert.match(l4,/M128 20 165 78 128 128 91 78Z/);
 assert.match(l4,/M25 128 87 83 128 128 87 173Z/);
 assert.match(l4,/M231 128 169 83 128 128 169 173Z/);
 assert.match(l4,/M128 35V221/);
 assert.doesNotMatch(l4,/camera|yaw|pitch|canvas|webgl/i);
});
test('V077 front-facing card art is an explicitly opted-in mode on the shared player-card component',()=>{
 const identity=read('web/src/components/CompactMemberIdentity.tsx');
 const icon=read('web/src/components/LevelEmblem.tsx');
 const css=read('web/src/components/player-card-v065.css');
 assert.doesNotThrow(()=>parseTsx(identity));
 assert.doesNotThrow(()=>parseTsx(icon));
 assert.match(identity,/<LevelEmblem level=\{level!\} artwork="card"/);
 assert.match(icon,/artwork='original'/);
 assert.match(icon,/const kinds=artwork==='card'\?\['card'\]/);
 assert.match(icon,/data-presentation/);
 assert.match(css,/v077-front-facing-illustration/);
 assert.doesNotMatch(icon,/evolution-mini-renderer|registerAnimatedSpecimen|canvas\.getContext/);
});
test('V077 original earn-only high-detail collectible 3D inspector remains intact',()=>{
 const media=read('canonical-auth/reward-media.mjs');
 const vault=read('web/src/components/EarnedRewardVault.tsx');
 const inspector=read('web/src/components/RewardInspector.tsx');
 const model=read('web/src/lib/reward-model-renderer.ts');
 assert.ok(media.includes('renderEvolutionCardArt(match.level)'));
 const publicGateway=read('apex-prelaunch/platform.mjs');
 assert.ok(publicGateway.includes('PUBLIC_IDENTITY='));
 assert.ok(publicGateway.includes('card|icon|preview|poster|scene|runtime|height|albedo'));
 assert.match(media,/match\.kind==='card'/);
 assert.match(media,/const state=await readProgression/);
 assert.match(media,/match\.handle\?state\.level!==match\.level:state\.level<match\.level/);
 assert.match(vault,/<RewardInspector reward=\{selected\}/);
 assert.match(inspector,/<canvas ref=\{canvas\}/);
 assert.match(inspector,/new RewardModelRenderer\(element\)/);
 assert.match(inspector,/native\.current\?\.rotate/);
 assert.match(inspector,/setZoom/);
 assert.match(model,/DecompressionStream\('gzip'\)/);
 assert.doesNotMatch(inspector,/renderEvolutionCardArt/);
});
