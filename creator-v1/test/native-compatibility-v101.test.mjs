import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {crc32,inspectZip} from '../../site/alpha/v003/archive.mjs';
import {detectCompatibility} from '../../site/alpha/v003/compatibility-v005.mjs';
import {inspectLocalBrowserBuild} from '../web/src/lib/native-compatibility-v101.ts';
import {sniffGodotZipEntries} from '../web/src/lib/godot-local-sniff-v136.ts';
import {parse} from '@babel/parser';

const encoder=new TextEncoder();
const bytes=s=>encoder.encode(s);
const blobFile=(name,data)=>Object.assign(new Blob([data]),{name});
function storedZip(files){
 let offset=0,local=[],central=[],count=0;
 const put16=(view,at,value)=>view.setUint16(at,value,true);
 const put32=(view,at,value)=>view.setUint32(at,value>>>0,true);
 for(const [path,body] of files){
  const n=bytes(path),content=bytes(body),crc=crc32(content);
  const l=new Uint8Array(30+n.length+content.length),v=new DataView(l.buffer);
  put32(v,0,0x04034b50);put16(v,4,20);put16(v,6,0x800);put16(v,8,0);
  put32(v,14,crc);put32(v,18,content.length);put32(v,22,content.length);put16(v,26,n.length);
  l.set(n,30);l.set(content,30+n.length);local.push(l);
  const c=new Uint8Array(46+n.length),w=new DataView(c.buffer);
  put32(w,0,0x02014b50);put16(w,4,20);put16(w,6,20);put16(w,8,0x800);
  put32(w,16,crc);put32(w,20,content.length);put32(w,24,content.length);put16(w,28,n.length);
  put32(w,42,offset);c.set(n,46);central.push(c);
  offset+=l.length;count++;
 }
 const size=central.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);
 put32(v,0,0x06054b50);put16(v,8,count);put16(v,10,count);put32(v,12,size);put32(v,16,offset);
 const result=new Uint8Array(offset+size+22);let at=0;
 for(const p of [...local,...central,end]){result.set(p,at);at+=p.length;}
 return result;
}
test('V005 detector is reused without licensing or safety certification',()=>{
 const r=detectCompatibility([{path:'index.html'},{path:'game.wasm'}]);
 assert.equal(r.runtime,'web-wasm');
 assert.equal(r.playableCandidate,true);
 assert.equal(r.securityReviewed,false);
 assert.equal(r.mobileVerified,false);
 assert.equal(r.publicationApproved,false);
 assert.ok(r.issues.some(i=>i.code==='AEP_WASM_MOBILE'));
});
test('browser-ready ZIP gets local-only advisory, never a publication verdict',async()=>{
 const f=blobFile('orbit.zip',storedZip([
  ['index.html','<!doctype html><html><body>hello</body></html>'],
  ['assets/main.js','console.log(1);']
 ]));
 const r=await inspectLocalBrowserBuild(f);
 assert.equal(r.playableCandidate,true);assert.equal(r.runtime,'web-static');
 assert.equal(r.entrypoint,'index.html');assert.equal(r.localOnly,true);
 assert.equal(r.securityReviewed,false);assert.equal(r.mobileVerified,false);
});
test('standalone HTML is a candidate but not guaranteed self-contained',async()=>{
 const r=await inspectLocalBrowserBuild(blobFile('game.html',bytes('<!doctype html><html><body>hi</body></html>')));
 assert.equal(r.playableCandidate,true);
 assert.ok(r.issues.some(i=>i.code==='AEP_HTML_DEPENDENCIES_UNVERIFIED'));
});
test('invalid ZIP, source-only ZIP and unsupported Python cannot upload',async()=>{
 for(const f of [
  blobFile('broken.zip',bytes('not a zip')),
  blobFile('source.zip',storedZip([['src/app.js','export default 1']])),
  blobFile('program.py',bytes('print(1)')),
  blobFile('not-html.html',bytes('this is not HTML'))
 ]){
  const r=await inspectLocalBrowserBuild(f);
  assert.equal(r.playableCandidate,false,f.name);
  assert.ok(r.issues.some(i=>i.severity==='blocker'));
 }
});
test('reserved metadata and credentials in a valid ZIP fail closed',async()=>{
 const html='<!doctype html><html><body>x</body></html>';
 const reserved=await inspectLocalBrowserBuild(blobFile('reserved.zip',storedZip([
  ['index.html',html],['_anevum/policy.txt','bad']
 ])));
 assert.equal(reserved.playableCandidate,false);
 assert.ok(reserved.issues.some(i=>i.code==='AEP_RESERVED_METADATA'));
 const credentials=await inspectLocalBrowserBuild(blobFile('secrets.zip',storedZip([
  ['index.html',html],['credentials.json','{}']
 ])));
 assert.equal(credentials.playableCandidate,false);
 assert.ok(credentials.issues.some(i=>i.code==='AEP_POSSIBLE_SECRET'));
});
test('oversized file is refused before reading its bytes',async()=>{
 const f={name:'huge.zip',size:21*1048576,arrayBuffer(){throw Error('Must not read oversized bytes');}};
 const r=await inspectLocalBrowserBuild(f);
 assert.equal(r.playableCandidate,false);
 assert.match(r.issues[0].message,/20 MiB/);
});
test('local Godot sniff is diagnostic-only and leaves pinned strict ZIP validator untouched',()=>{
 const godot=storedZip([
  ['index.html','<!doctype html><html><body>test</body></html>'],['game.pck','pack']
 ]);
 const names=sniffGodotZipEntries(godot);
 assert.deepEqual(names?.map(e=>e.path),['index.html','game.pck']);
 assert.throws(()=>inspectZip(godot),/Unsupported project asset/);
 const source=storedZip([['project.godot','[application]']]);
 assert.deepEqual(sniffGodotZipEntries(source)?.map(e=>e.path),['project.godot']);
 assert.throws(()=>inspectZip(source),/Unsupported project asset|ZIP must include index.html/);
 const clean=storedZip([['index.html','<!doctype html><html><body>ok</body></html>']]);
 assert.equal(sniffGodotZipEntries(clean),null);
 assert.equal(inspectZip(clean).entrypoint,'index.html');
 assert.equal(sniffGodotZipEntries(bytes('not a ZIP containing game.pck')),null);
});
test('Godot Web export receives specific guidance but cannot enter the current small-build uploader',async()=>{
 const r=await inspectLocalBrowserBuild(blobFile('absence-protocol.zip',storedZip([
  ['index.html','<!doctype html><html><body>Absence Protocol</body></html>'],
  ['absence.pck','godot pack'],['absence.wasm','engine'],['absence.js','loader']
 ])));
 assert.equal(r.runtime,'godot-web');
 assert.equal(r.localOnly,true);
 assert.equal(r.playableCandidate,false);
 assert.equal(r.securityReviewed,false);
 assert.equal(r.publicationApproved,false);
 assert.ok(r.issues.some(i=>i.code==='AEP_GODOT_SMALL_PILOT_UNSUPPORTED'&&i.severity==='blocker'));
});
test('incomplete Godot Web export identifies the missing loader and WASM',async()=>{
 const r=await inspectLocalBrowserBuild(blobFile('partial-godot.zip',storedZip([
  ['index.html','<!doctype html><html><body>incomplete</body></html>'],
  ['game.pck','pack']
 ])));
 assert.equal(r.playableCandidate,false);
 assert.ok(r.issues.some(i=>i.code==='AEP_GODOT_WASM_FILES'));
 assert.ok(r.issues.some(i=>i.code==='AEP_GODOT_LOADER_FILES'));
});
test('Godot project source alone is never mistaken for a playable web export',async()=>{
 const r=await inspectLocalBrowserBuild(blobFile('godot-source.zip',storedZip([
  ['project.godot','[application]'],['scenes/main.tscn','[gd_scene]']
 ])));
 assert.equal(r.runtime,'godot-source');
 assert.equal(r.playableCandidate,false);
 assert.ok(r.issues.some(i=>i.code==='AEP_ENTRY_MISSING'));
});
test('native browser player preserves opaque sandbox and adds explicit keyboard focus without new privileges',()=>{
 const src=readFileSync(new URL('../web/src/components/IsolatedProjectViewport.tsx',import.meta.url),'utf8');
 assert.match(src,/sandbox="allow-scripts allow-pointer-lock"/);
 assert.doesNotMatch(src,/sandbox="[^"]*allow-same-origin/);
 assert.match(src,/gameFrame\.current\?\.focus\(\)/);
 assert.match(src,/Touch, Safari and Xbox compatibility are not certified/);
});

test('native upload UI waits for compatibility results and never authorizes publication',()=>{
 const s=readFileSync(new URL('../web/src/pages/NativeCreatorStudio.tsx',import.meta.url),'utf8');
 assert.doesNotThrow(()=>parse(s,{sourceType:'module',plugins:['typescript','jsx']}));
 assert.match(s,/inspectLocalBrowserBuild\(file\)/);
 assert.match(s,/version===compatibilityVersion\.current/);
 assert.match(s,/disabled=\{!file\|\|!rights\|\|busy\|\|checkingCompatibility\|\|!compatibility\?\.playableCandidate\}/);
 assert.match(s,/Local inspection only\. No data is uploaded until you submit/);
 assert.match(s,/No data is uploaded until you submit/);
 assert.match(s,/nativeBuildAction\(/);
 assert.doesNotMatch(s,/CANONICAL_CREATOR_UPLOADS_ENABLED\s*[:=]\s*['"]true['"]/);
});
