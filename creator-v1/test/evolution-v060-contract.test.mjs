import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import ARTIFACTS from '../shared/level-artifacts.json' with {type:'json'};
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(join(root,p),'utf8');
test('retired icon set is not selected anywhere in the active level UI',()=>{
 const emulator=read('web/src/components/LevelEmblem.tsx');
 const cabinet=read('web/src/components/LevelCollection.tsx');
 const page=read('web/src/pages/LevelsPage.tsx');
 const panel=read('web/src/components/LevelPanel.tsx');
 for(const code of [emulator,cabinet,page,panel]){
  assert.doesNotMatch(code,/series-one-v037|THE FIRST 60|NO LEVEL CAP|FIRST 60 ARTIFACTS/);
 }
 assert.match(emulator,/v073-preserved-optical-icon/);
 assert.match(emulator,/av73-static-level-icon/);
 assert.doesNotMatch(emulator,/registerAnimatedSpecimen/);
 assert.match(cabinet,/ENTER THE LIVING 3D ARCHIVE/);
 assert.match(page,/30 LIVING SPECIMENS/);
 assert.match(panel,/FINAL LEVEL/);
});
test('all thirty exact V059 specimen names and thresholds remain unchanged',()=>{
 const original=JSON.parse(readFileSync(new URL('../../design/evolution-v059/docs/ARTWORK-MANIFEST.json',import.meta.url),'utf8'));
 assert.equal(original.levels.length,30);
 for(const item of original.levels){
  const installed=ARTIFACTS[item.level-1];
  assert.equal(installed.level,item.level);
  assert.equal(installed.xp,item.xp);
  assert.equal(installed.name,item.name);
  assert.equal(installed.chapterName,item.chapterName);
 }
});
test('production gallery publishes 152 assets with external CSP-compatible scripts',()=>{
 const folder=join(root,'web/public/evolution');
 const html=read('web/public/evolution/index.html');
 assert.equal(readdirSync(join(folder,'assets')).length,152);
 assert.match(html,/src="\/evolution\/app.js"/);
 assert.match(html,/href="\/evolution\/app.css"/);
 assert.doesNotMatch(html,/<script>(?!\s*<\/script>)/);
 assert.match(html,/id="workshop-data"/);
 for(let i=1;i<=30;i++){
  const n=String(i).padStart(2,'0');
  for(const suffix of ['-scene.gz','-1024.webp','-256.webp','-compact-128.png','-field.svg']){
   const p=join(folder,'assets','level-'+n+suffix);
   assert.ok(existsSync(p)&&statSync(p).size>300,p);
  }
 }
});
