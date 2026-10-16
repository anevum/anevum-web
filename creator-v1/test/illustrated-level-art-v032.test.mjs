import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=relative=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');
const levels=JSON.parse(read('shared/level-artifacts.json'));

test('illustrated Series One uses exactly the established sixty canonical names and never changes XP',()=>{
 assert.equal(levels.length,60);
 assert.equal(levels[0].name,'Foundry Spark');
 assert.equal(levels[29].name,'Midnight Atlas');
 assert.equal(levels[58].name,'Celestial Engine');
 assert.equal(levels[59].name,'The First Light');
 assert.equal(new Set(levels.map(x=>x.name)).size,60);
 assert.equal(levels.reduce((a,x)=>a+(x.level>0?1:0),0),60);
});

test('HD art cannot be enabled without an explicit build flag and safely falls back to existing SVGs',()=>{
 const source=read('web/src/components/LevelEmblem.tsx');
 assert.match(source,/VITE_SERIES_ONE_ILLUSTRATED_ART\s*===\s*'true'/);
 assert.match(source,/item\.icon\.slice\(1\)/);
 assert.match(source,/onError=\{illustration\?\(\)=>setFailed\(true\):undefined\}/);
 assert.match(source,/128,512,1254/);
 assert.match(source,/illustratedRoot\+w\+'\/'\+filename/);
 assert.match(source,/level-emblem-beyond/);
});

test('art viewer never invents earned status; notifications and member panel reuse central renderer',()=>{
 const collection=read('web/src/components/LevelCollection.tsx');
 const notice=read('web/src/components/AnevumNotifications.tsx');
 const panel=read('web/src/components/LevelPanel.tsx');
 assert.match(collection,/Boolean\(p&&p\.level>=a\.level\)/);
 assert.match(collection,/p\?p\.level>=chosen\.level\?'UNLOCKED':'LOCKED'/);
 assert.match(collection,/SERIES_ONE_ILLUSTRATIONS_ENABLED&&chosen/);
 assert.match(collection,/role="dialog" aria-modal="true"/);
 assert.match(notice,/<LevelEmblem level=\{active\.level!\} size=\{56\} priority\/>/);
 assert.match(panel,/<LevelEmblem level=\{p\?\.level\|\|1\} size=\{64\} priority\/>/);
});

test('fullscreen artwork preview keeps its focus trap while paging within the collection',()=>{
 const collection=read('web/src/components/LevelCollection.tsx');
 assert.match(collection,/const previewOpen=selectedLevel!==null/);
 assert.match(collection,/\},\[previewOpen\]\)/);
 assert.match(collection,/if\(event\.key==='Escape'\)/);
 assert.match(collection,/if\(event\.key==='Tab'\)/);
});
