import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNativePack,openNativePack,ANEVUM_PACK_SCHEMA,PACK_KINDS,
 MAX_PACK_BYTES} from '../web/src/lib/anevum-native-pack.ts';
const bytes=(s)=>new TextEncoder().encode(s);
const game={schema:'anevum.game.v1',startScene:'start',scenes:[
 {id:'start',title:'Awakening',text:'You find a strange observatory.',choices:[{label:'Enter',to:'inside'}]},
 {id:'inside',title:'Inside',text:'A new universe opens.',choices:[]}
]};
const opts={kind:'game',title:'The Fold',creator:'ANEVUM',version:'0.1.0',document:game};
const album={schema:'anevum.album.v1',tracks:[{id:'signal-one',title:'First Signal',file:'assets/signal.mp3'}]};
const series={schema:'anevum.series.v1',episodes:[{id:'pilot',title:'Pilot',file:'assets/pilot.webm'}]};
const visual={schema:'anevum.visual.v1',pages:[{image:'assets/image.webp',caption:'A beautiful void'}]};
const project={schema:'anevum.blocks.v1',blocks:[]};
const source=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('ANVG game round-trip yields a real ZIP and declarative, inert document',async()=>{
 const pkg=await createNativePack(opts);
 assert.equal(pkg.filename,'the-fold.anvg');
 assert.equal(new DataView(pkg.bytes.buffer).getUint32(0,true),0x04034b50);
 assert.equal(pkg.manifest.schema,ANEVUM_PACK_SCHEMA);
 const opened=await openNativePack(pkg.filename,pkg.bytes);
 assert.deepEqual(opened.document,game);
 assert.equal(opened.manifest.files[0].mime,'application/json');
 assert.equal(opened.assets.size,0);
});
test('album, episode series, visual gallery and strict Studio document round-trip',async()=>{
 for(const [kind,document,assets] of [
  ['album',album,{'assets/signal.mp3':bytes('local test audio bytes')}],
  ['series',series,{'assets/pilot.webm':bytes('local test video bytes')}],
  ['visual',visual,{'assets/image.webp':bytes('local test picture bytes')}],
  ['project',project,{}]
 ]){
  const pkg=await createNativePack({kind,title:'A sample',creator:'ANEVUM',version:'1.2.0',document,assets});
  assert.equal(pkg.filename.split('.').at(-1),PACK_KINDS[kind].extension);
  const opened=await openNativePack(pkg.filename,pkg.bytes);
  assert.deepEqual(opened.document,document);
  assert.equal(opened.assets.size,Object.keys(assets).length);
 }
});
test('reject arbitrary extension, traversal, scripts and SVG packages',async()=>{
 await assert.rejects(createNativePack({...opts,kind:'unknown'}),/unknown kind/);
 await assert.rejects(createNativePack({...opts,assets:{'assets\/..\/private.mp3':bytes('x')}}),/unsafe path/);
 await assert.rejects(createNativePack({...opts,assets:{'assets/script.js':bytes('alert(1)')}}),/unsupported asset extension/);
 await assert.rejects(createNativePack({...opts,assets:{'assets/page.svg':bytes('<svg/>')}}),/unsupported asset extension/);
 const pkg=await createNativePack(opts);
 await assert.rejects(openNativePack('the-fold.zip',pkg.bytes),/extension mismatch/);
});
test('reject invalid destinations, unknown game controls and bad asset references',async()=>{
 await assert.rejects(createNativePack({...opts,document:{...game,startScene:'none'}}),/starting scene/);
 await assert.rejects(createNativePack({...opts,document:{...game,scenes:[
  {...game.scenes[0],choices:[{label:'Exit',to:'missing'}]}]}}),/destination/);
 await assert.rejects(createNativePack({...opts,document:{...game,script:'alert(1)'}}),/field/);
 await assert.rejects(createNativePack({...opts,document:{...game,scenes:[
  {...game.scenes[0],background:'assets/missing.png'},game.scenes[1]]}}),/asset/);
});
test('reject CRC corruption, truncation, oversize files and noncanonical archive',async()=>{
 const pkg=await createNativePack(opts);
 const corrupted=pkg.bytes.slice();
 const idx=new TextDecoder().decode(corrupted).indexOf('The Fold');
 assert.ok(idx>0);corrupted[idx]=0;
 await assert.rejects(openNativePack(pkg.filename,corrupted),/ZIP checksum mismatch/);
 await assert.rejects(openNativePack(pkg.filename,pkg.bytes.subarray(0,10)),/archive size/);
 await assert.rejects(openNativePack(pkg.filename,new Uint8Array(MAX_PACK_BYTES+1)),/archive size/);
 const tailed=new Uint8Array(pkg.bytes.length+1);tailed.set(pkg.bytes);
 await assert.rejects(openNativePack(pkg.filename,tailed),/ZIP directory/);
});
test('reject absent media, external media URLs and invalid Studio schemas',async()=>{
 await assert.rejects(createNativePack({...opts,kind:'album',document:album}),/missing or wrongly typed asset/);
 await assert.rejects(createNativePack({...opts,kind:'album',document:{
  ...album,tracks:[{id:'signal-one',title:'X',file:'https://unsafe.test/file.mp3'}]}}),/unsafe path/);
 await assert.rejects(createNativePack({...opts,kind:'project',document:{
  schema:'anevum.blocks.v1',blocks:[],script:'alert(1)'}}),/Unsupported Workbench document/);
});
test('private Studio UI renders imported creative data without running HTML or exposing public uploads',()=>{
 const lab=source('web/src/pages/NativePackLab.tsx');
 const workbench=source('web/src/pages/StudioWorkbench.tsx');
 assert.match(lab,/openNativePack\(file.name/);
 assert.match(lab,/createNativePack\(/);
 assert.match(lab,/NativePackExperience/);
 assert.match(lab,/window\.confirm\('Replace your current UNSAVED canvas/);
 assert.match(lab,/Nothing here uploads media, runs user scripts, awards XP or publishes projects/);
 assert.doesNotMatch(lab,/dangerouslySetInnerHTML|eval\(|new Function\(|iframe|fetch\(/i);
 assert.match(workbench,/<NativePackLab/);
});
