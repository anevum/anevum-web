import test from 'node:test';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {sourceArchive,safeSourcePath} from '../web/src/parity/source-archive-v136.ts';
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

test('local file moves preserve bytes and safety, removal never removes entrypoint',async()=>{
 const {renameLocalSource,removeLocalSource}=await import('../web/src/parity/workbench-file-ops-v136.ts');
 const files={'index.html':'<!doctype html><title>Local</title>',
  'styles.css':'body{color:white}', 'assets/notes.md':'# My author notes'};
 const renamed=renameLocalSource(files,'assets/notes.md','docs/reference.md',safeSourcePath);
 assert.equal(renamed['docs/reference.md'],files['assets/notes.md']);
 assert.ok(!('assets/notes.md' in renamed));
 assert.deepEqual(Object.keys(renamed),['index.html','styles.css','docs/reference.md']);
 assert.equal(files['assets/notes.md'],'# My author notes','Local move never mutates source state');
 assert.equal(renameLocalSource(renamed,'docs/reference.md','docs/reference.md',safeSourcePath),renamed);
 for(const path of ['../notes.md','docs/private.env','index.html','Styles.css']){
  assert.throws(()=>renameLocalSource(renamed,'docs/reference.md',path,safeSourcePath));
 }
 assert.throws(()=>renameLocalSource(files,'index.html','main.html',safeSourcePath));
 assert.throws(()=>removeLocalSource(files,'index.html'));
 const removed=removeLocalSource(renamed,'docs/reference.md');
 assert.deepEqual(Object.keys(removed),['index.html','styles.css']);
 assert.ok(Object.hasOwn(renamed,'docs/reference.md'));
 const zipped=unzipSync(new Uint8Array(await sourceArchive(removed).arrayBuffer()));
 assert.deepEqual(Object.keys(zipped),['index.html','styles.css']);
});

test('local source reference review is read-only and never rewrites creator code',async()=>{
 const {sourceReferencesToReview}=await import('../web/src/parity/workbench-file-ops-v136.ts');
 const files={'index.html':'<link href="styles.css"><script src="scripts/app.js"></script>',
  'styles.css':'body{color:white}', 'scripts/app.js':'import "../styles.css";'};
 const before=JSON.stringify(files);
 assert.deepEqual(sourceReferencesToReview(files,'styles.css'),['index.html','scripts/app.js']);
 assert.deepEqual(sourceReferencesToReview(files,'scripts/app.js'),['index.html']);
 assert.equal(JSON.stringify(files),before);
});

test('source link audit resolves relative paths, rejects external URLs, keeps authored contents untouched',async()=>{
 const {sourceReferencesToReview}=await import('../web/src/parity/workbench-file-ops-v136.ts');
 const files={
  'index.html':'<link href="./styles.css"><script src="/scripts/main.js"></script>',
  'styles.css':'@import "assets/theme.css";',
  'assets/theme.css':'body{color:#fff}',
  'scripts/main.js':"import '../assets/theme.css'; const remote='https://example.org/styles.css';",
  'notes.txt':'url(styles.css) and a dynamic src assembled by JavaScript are not executed'
 };
 const snapshot=JSON.stringify(files);
 assert.deepEqual(sourceReferencesToReview(files,'styles.css'),['index.html']);
 assert.deepEqual(sourceReferencesToReview(files,'assets/theme.css'),['styles.css','scripts/main.js']);
 assert.deepEqual(sourceReferencesToReview(files,'scripts/main.js'),['index.html']);
 assert.deepEqual(sourceReferencesToReview(files,'missing.css'),[]);
 assert.ok(!sourceReferencesToReview(files,'styles.css').includes('notes.txt'),
  'Documentation containing CSS-like examples cannot masquerade as a live code dependency');
 assert.equal(JSON.stringify(files),snapshot,'Audit cannot mutate local source files');
});


test('advisory source-link diagnostics identify missing local dependencies without mutating source',async()=>{
 const {unresolvedLocalSourceLinks}=await import('../web/src/parity/workbench-file-ops-v136.ts');
 const files={
  'index.html':'<link href="./styles.css"><script src="/scripts/main.js"></script><a href="docs/readme.html">Read</a>',
  'styles.css':'@import "assets/theme.css"; .a{background:url(assets/texture.png)}',
  'assets/theme.css':'body {color: white}',
  'scripts/main.js':"import './helper.js'; import './helper.js'; export * from '../assets/theme.css'; const string='ghost.js';",
  'docs/notes.md':'<script src="missing.js"></script>',
  'scratch.txt':'import "ghost.js"'
 };
 const original=JSON.stringify(files);
 assert.deepEqual(unresolvedLocalSourceLinks(files,safeSourcePath),[
  {source:'index.html',target:'docs/readme.html'},
  {source:'scripts/main.js',target:'scripts/helper.js'}
 ]);
 assert.equal(JSON.stringify(files),original,'Diagnostics may not rewrite creator source');
 const moved={...files};delete moved['styles.css'];
 assert.ok(unresolvedLocalSourceLinks(moved,safeSourcePath).some(link=>
  link.source==='index.html'&&link.target==='styles.css'),
  'After renaming a linked file the existing inspector detects the dangling HTML link');
 assert.deepEqual(unresolvedLocalSourceLinks({'index.html':'<a href="/discover">Go</a>'},safeSourcePath),[],
  'Browser routes are not local source files');
});
