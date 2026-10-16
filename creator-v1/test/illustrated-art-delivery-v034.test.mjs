import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdirSync,mkdtempSync,rmSync,copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here=fileURLToPath(new URL('.',import.meta.url));
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const emblem=read('web/src/components/LevelEmblem.tsx');
const panel=read('web/src/components/LevelPanel.tsx');
const notifications=read('web/src/components/AnevumNotifications.tsx');
const css=read('web/src/progression.css');
const catalogue=JSON.parse(read('shared/level-artifacts.json'));
const installer=fileURLToPath(new URL('../ops/install-series-one-illustrations-v034.py',import.meta.url));

test('canonical Series One identity and no inferred earned state',()=>{
 assert.equal(catalogue.length,60);
 assert.deepEqual(catalogue.map(x=>x.level),Array.from({length:60},(_,i)=>i+1));
 assert.equal(catalogue[0].name,'Foundry Spark');
 assert.equal(catalogue[29].name,'Midnight Atlas');
 assert.equal(catalogue[59].name,'The First Light');
 assert.match(emblem,/VITE_ANEVUM_ILLUSTRATED_LEVELS==='true'/);
 assert.match(emblem,/import artifacts from/);
 assert.doesNotMatch(emblem,/grantLevel|purchaseXP|earnedAt|localStorage/i);
});

test('responsive art opt-in preserves fallback, accessibility and priority loading',()=>{
 for(const token of ['data-art-source="svg-fallback"','data-art-source="illustrated"','srcSet=','128w, ','512w, ','1254w','sizes={size+\'px\'}','onError={()=>setFailed(true)}','level-emblem-beyond'])
   assert.ok(emblem.includes(token),token);
 assert.match(panel,/size=\{64\} priority/);
 assert.match(notifications,/size=\{56\} priority/);
 assert.match(css,/level-emblem-illustrated/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('installer rejects altered assets and requires explicit local-install flag',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'anevum-v034-art-'));
 try{
  const repo=join(tmp,'repository');
  const catalogPath=join(repo,'creator-v1','shared');
  mkdirSync(catalogPath,{recursive:true});
  copyFileSync(fileURLToPath(new URL('../shared/level-artifacts.json',import.meta.url)),join(catalogPath,'level-artifacts.json'));
  const archive=join(tmp,'fixture.zip');
  const generator=String.raw`
import zipfile,json,hashlib,sys
from pathlib import Path
repo,archive=map(Path,sys.argv[1:])
catalog=json.loads((repo/'creator-v1/shared/level-artifacts.json').read_text())
manifest={'levelCount':60,'artifacts':[]}
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_STORED) as pkg:
 for row in catalog:
  entry={'level':row['level'],'name':row['name'],'webp':{}}
  for size in (128,512,1254):
   path=f'web-optimized/{size}/level-{row["level"]:02d}.webp'
   data=b'RIFF'+(116).to_bytes(4,'little')+b'WEBP'+bytes([row['level']%251])*116
   pkg.writestr('ANEVUM-Series-One/'+path,data)
   entry['webp'][str(size)]={'path':path,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
  manifest['artifacts'].append(entry)
 pkg.writestr('ANEVUM-Series-One/manifest.json',json.dumps(manifest))
`;
  const p=spawnSync('python3',['-c',generator,repo,archive],{encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  const command=(args)=>spawnSync('python3',[installer,archive,'--repository',repo,...args],{encoding:'utf8'});
  const dry=command([]);
  assert.equal(dry.status,0,dry.stderr);
  assert.match(dry.stdout,/READ-ONLY/);
  const artDir=join(repo,'creator-v1','web','public','assets','levels','illustrated');
  assert.equal(existsSync(artDir),false);
  const installed=command(['--install-approved-art']);
  assert.equal(installed.status,0,installed.stderr);
  assert.equal(existsSync(join(artDir,'512','level-60.webp')),true);
  // Modify one named ZIP image after the manifest was signed: do not permit it.
  const corrupt=String.raw`
import zipfile,sys
p=sys.argv[1]
with zipfile.ZipFile(p) as z:
 items=[(x,z.read(x)) for x in z.namelist()]
with zipfile.ZipFile(p,'w') as z:
 for name,data in items:
  if name.endswith('web-optimized/128/level-01.webp'): data=data+b'X'
  z.writestr(name,data)
`;
  const b=spawnSync('python3',['-c',corrupt,archive],{encoding:'utf8'});
  assert.equal(b.status,0,b.stderr);
  const rejected=command([]);
  assert.notEqual(rejected.status,0);
  assert.match(rejected.stderr,/length mismatch|SHA-256 mismatch/);
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
