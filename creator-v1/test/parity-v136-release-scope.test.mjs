import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {REVIEWED_UI_BLOBS,verifySourcePaths,REVIEWED_METADATA,copyReleaseFrontend} from '../ops/parity-v136-release.mjs';

test('newly reviewed UI requires the exact reviewed bytes, including deletions',()=>{
 const paths=Object.keys(REVIEWED_UI_BLOBS);
 assert.ok(paths.length>60,'Full reviewed sitewide delta is enumerated');
 verifySourcePaths(paths,path=>REVIEWED_UI_BLOBS[path]);
 for(const path of paths){
  assert.ok(/^(creator-v1\/(test\/|web\/|graphics\/|source-ide\/)|docs\/production\/)/.test(path)||
   ['site/alpha/v003/archive.d.mts','creator-v1/ops/parity-v136-asset-pair.mjs','package.json',
    '.github/workflows/parity-v136-release.yml','.github/workflows/parity-v136-scene-qa.yml',
    '.github/workflows/parity-v136-cinematic-production.yml','.github/workflows/parity-v136030-studio-preview.yml',
    '.github/workflows/v136-interactive-owner-review.yml','creator-v1/wrangler.v136-interactive-review.jsonc'].includes(path),'Only enumerated UI, test and release-governance paths may be pinned');
  assert.throws(()=>verifySourcePaths([path],()=> '0'.repeat(40)),/Reviewed UI file bytes changed/);
 }
 const deleted=paths.find(path=>REVIEWED_UI_BLOBS[path]===null);
 assert.ok(deleted,'Retired generated art deletions are explicit');
 assert.throws(()=>verifySourcePaths([deleted],()=> 'a'.repeat(40)),/Reviewed UI file bytes changed/);
});
test('unreviewed backend, permissions and workflow edits remain forbidden',()=>{
 for(const path of ['creator-v1/canonical-auth/worker.mjs','creator-v1/api/worker.mjs',
  'creator-v1/apex-prelaunch/worker.mjs','.github/workflows/creator-v1-main-site-release.yml',
  'creator-v1/web/src/pages/UnreviewedPage.tsx']){
  assert.throws(()=>verifySourcePaths([path],()=> 'a'.repeat(40)),/Unreviewed release change/);
 }
});
test('experimental geometry and unapproved native video still fail release',()=>{
 for(const flag of ['VITE_PARITY_V136_HORIZON_QA','VITE_PARITY_V136_SHARED_SCENE_QA','VITE_PARITY_V136_NATIVE_VIDEO']){
  assert.throws(()=>execFileSync(process.execPath,['creator-v1/ops/parity-v136-release.mjs','source'],
   {cwd:new URL('../../',import.meta.url),env:{...process.env,[flag]:'true'},stdio:'pipe'}),
   error=>/must be disabled in release|independently reviewed CSP/.test(error.stderr.toString()));
 }
});
function metadataFixture(t){
 const root=mkdtempSync(join(tmpdir(),'v136-release-metadata-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const fresh=join(root,'fresh'),out=join(root,'out');mkdirSync(fresh);mkdirSync(out);
 for(const path of Object.keys(REVIEWED_METADATA)){
  mkdirSync(join(fresh,path,'..'),{recursive:true});mkdirSync(join(out,path,'..'),{recursive:true});
  writeFileSync(join(fresh,path),readFileSync(new URL('../web/public/'+path,import.meta.url)));
  writeFileSync(join(out,path),'preserved-baseline');
 }
 writeFileSync(join(fresh,'index.html'),'<script src="/assets/main.js"></script>');
 writeFileSync(join(fresh,'assets/main.js'),'export const nativeInterface=true;');
 return {fresh,out};
}
test('versioned audit metadata preserves rollback URLs and all new record bytes',t=>{
 const {fresh,out}=metadataFixture(t),records=copyReleaseFrontend(fresh,out);
 assert.equal(records.length,4);
 for(const item of records){
  assert.equal(readFileSync(join(out,item.path),'utf8'),'preserved-baseline');
  assert.deepEqual(readFileSync(join(out,item.releasePath)),readFileSync(join(fresh,item.path)));
 }
 assert.equal(readFileSync(join(out,'assets/main.js'),'utf8'),'export const nativeInterface=true;');
});
test('metadata changes or a current runtime consumer forbid relocation',t=>{
 const {fresh,out}=metadataFixture(t),path=Object.keys(REVIEWED_METADATA)[0];
 writeFileSync(join(fresh,'assets/main.js'),'fetch("/'+path+'")');
 assert.throws(()=>copyReleaseFrontend(fresh,out),/no current runtime consumer/);
 writeFileSync(join(fresh,path),'unreviewed');
 assert.throws(()=>copyReleaseFrontend(fresh,out),/Unreviewed metadata bytes/);
 assert.equal(readFileSync(join(out,path),'utf8'),'preserved-baseline');
});
test('unapproved owner-review media cannot enter a public release package',t=>{
 const {fresh,out}=metadataFixture(t);
 mkdirSync(join(fresh,'assets/cinematic-v136/arrival/review-001'),{recursive:true});
 writeFileSync(join(fresh,'assets/cinematic-v136/arrival/review-001/candidate.mp4'),'not approved');
 assert.throws(()=>copyReleaseFrontend(fresh,out),/Owner-review artwork/);
});
