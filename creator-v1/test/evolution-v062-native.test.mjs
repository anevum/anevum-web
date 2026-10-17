import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,path),'utf8');
test('V062 runtime is derived from the canonical 30-specimen V059 source',()=>{
 const manifest=JSON.parse(read('../design/evolution-v059/docs/ARTWORK-MANIFEST.json'));
 const runtime=JSON.parse(read('web/public/evolution/mini-runtime.json'));
 assert.equal(runtime.version,'anevum.mini-native.v062');
 assert.equal(runtime.vertex,read('../design/evolution-v059/src/material.vert'));
 assert.equal(runtime.fragment,read('../design/evolution-v059/src/material.frag'));
 assert.equal(runtime.bloomVertex,read('../design/evolution-v059/src/bloom.vert'));
 assert.deepEqual(runtime.accents,manifest.levels.map(x=>x.accent));
 assert.equal(runtime.accents.length,30);
 assert.ok(Object.keys(runtime.materials).length>=20);
 assert.equal(runtime.height,'/evolution/assets/height.png');
 assert.equal(runtime.albedo,'/evolution/assets/albedo.webp');
 assert.ok(statSync(join(root,'web/public/evolution/mini-runtime.json')).size>6000);
 assert.equal(readdirSync(join(root,'web/public/evolution/assets')).length,152);
 for(let level=1;level<=30;level++){
  const name='level-'+String(level).padStart(2,'0');
  assert.ok(statSync(join(root,'web/public/evolution/assets',name+'-scene.gz')).size>500);
 }
});
test('miniature shader uses real native mesh, GGX materials, dust, aura, glow and illumination',()=>{
 const native=read('web/src/lib/evolution-mini-renderer.ts');
 const emblem=read('web/src/components/LevelEmblem.tsx');
 const style=read('web/src/components/member-identity-v061.css');
 assert.match(native,/class MiniStage/);
 assert.match(native,/canvas.getContext\('webgl'/);
 assert.match(native,/this\.config\.materials|config\.materials/);
 assert.match(native,/this\.uniform\('uEmission'/);
 assert.match(native,/this\.uniform\('uMode'/);
 assert.match(native,/this\.uniform\('uTime'/);
 assert.match(native,/DecompressionStream\('gzip'\)/);
 assert.match(native,/texture2D\(uScene/);
 assert.match(native,/float dust=/);
 assert.match(native,/float aura=/);
 assert.match(native,/vec3 luminous=/);
 assert.match(native,/gl\.drawElements\(gl\.TRIANGLES/);
 assert.match(native,/requestAnimationFrame/);
 assert.match(native,/IntersectionObserver/);
 assert.match(native,/devicePixelRatio/);
 assert.match(native,/this\.trimCache/);
 assert.match(native,/this\.reduced\.matches/);
 assert.match(native,/this\.saveData/);
 assert.match(native,/this\.activeLast/);
 assert.match(native,/new Map<number,GPUPart\[\]>/);
 assert.match(emblem,/registerAnimatedSpecimen/);
 assert.match(emblem,/av62-native-host/);
 assert.match(emblem,/av62-native-poster/);
 assert.match(style,/data-live="true"/);
 assert.match(style,/visibility:hidden/);
 assert.match(style,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(emblem,/getContext|canvas.*getContext|new WebGLRenderingContext/);
 assert.doesNotMatch(native,/POST|DELETE|PATCH|member_xp_events|featuredAwards/);
});
test('native animation displays anywhere LevelEmblem is already used without changing earned XP',()=>{
 const files=[
  'web/src/components/CompactMemberIdentity.tsx',
  'web/src/components/MemberSpaceDashboard.tsx',
  'web/src/components/PublicAuthorShowcase.tsx',
  'web/src/components/LevelPanel.tsx',
  'web/src/components/LevelCollection.tsx'
 ];
 for(const file of files)assert.match(read(file),/LevelEmblem/);
 assert.match(read('canonical-auth/progression.mjs'),/Math\.min\(30/);
 assert.match(read('shared/level-artifacts.json'),/Vacuum Whisper/);
});
