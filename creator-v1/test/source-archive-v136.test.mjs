import test from 'node:test';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {sourceArchive} from '../web/src/parity/source-archive-v136.ts';
import {inspectLocalBrowserBuild} from '../web/src/lib/native-compatibility-v101.ts';
test('source archive preserves file paths and passes the existing native compatibility inspector',async()=>{
 const files={'index.html':'<!doctype html><html><head><link rel="stylesheet" href="styles.css"></head><body><h1>LOCAL TEST ONLY</h1><script src="scripts/main.js"></script></body></html>','styles.css':'body { color: #e9f7ff; }','scripts/main.js':'document.body.dataset.ready="yes";'};
 const file=sourceArchive(files);assert.equal(file.type,'application/zip');
 const unpacked=unzipSync(new Uint8Array(await file.arrayBuffer()));
 assert.deepEqual(Object.keys(unpacked),Object.keys(files));for(const [name,bytes] of Object.entries(unpacked))assert.equal(strFromU8(bytes),files[name]);
 const report=await inspectLocalBrowserBuild(file);assert.equal(report.playableCandidate,true,JSON.stringify(report));
 assert.equal(report.entrypoint,'index.html');
});
test('local source composition cannot smuggle traversal, unsupported files or unbounded payloads',()=>{
 const html={'index.html':'<!doctype html><title>Test</title>'};
 for(const path of ['../private.json','/root.js','a/../../escape.js','secret.env','run.exe','a\\b.js'])assert.throws(()=>sourceArchive({...html,[path]:'x'}));
 assert.throws(()=>sourceArchive({'nested/index.html':'x'}));
 assert.throws(()=>sourceArchive({...html,'large.txt':'x'.repeat(131073)}));
 assert.throws(()=>sourceArchive({...html,...Object.fromEntries(Array.from({length:25},(_,i)=>['file'+i+'.txt','x']))}));
});

test('Markdown notes are backed up but excluded from the canonical playable ZIP',async()=>{
 const {playableSourceArchive}=await import('../web/src/parity/source-archive-v136.ts');
 const files={
  'index.html':'<!doctype html><html><body>Local example</body></html>',
  'styles.css':'body { color: cyan; }',
  'assets/notes.md':'# Local author notes'
 };
 const full=unzipSync(new Uint8Array(await sourceArchive(files).arrayBuffer()));
 assert.equal(strFromU8(full['assets/notes.md']),files['assets/notes.md']);
 const {archive,skipped}=playableSourceArchive(files);
 assert.deepEqual(skipped,['assets/notes.md']);
 const playable=unzipSync(new Uint8Array(await archive.arrayBuffer()));
 assert.deepEqual(Object.keys(playable),['index.html','styles.css']);
 const report=await inspectLocalBrowserBuild(archive);
 assert.equal(report.playableCandidate,true,JSON.stringify(report));
});
