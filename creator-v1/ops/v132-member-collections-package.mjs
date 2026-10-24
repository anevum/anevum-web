/** V132: preserve the sealed V131 gateway + earned media while overlaying the
 * reviewed UI assets. Offline-only. Never contacts Cloudflare or changes traffic.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {cpSync,copyFileSync,existsSync,mkdirSync,readFileSync,readdirSync,lstatSync,writeFileSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const BASE='ad0d3aef473e12c124b003d2c3bb45b79bff520e';
export const REVIEW='84c634f5677beaf0ef842281285f7ca537f64fba';
export const GATEWAY_HASH='1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99';
export const ORIGINAL_ASSET_COUNT=395, ORIGINAL_EARNED_MEDIA=152;
const hex=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const write=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
export const UI_FILES=[
 'creator-v1/web/src/pages/CanonicalSavedWorksPage.tsx',
 'creator-v1/web/src/pages/canonical-saved-works.css',
 'creator-v1/web/src/pages/LevelsPage.tsx',
 'creator-v1/web/src/pages/RecognitionRegistryPage.tsx',
 'creator-v1/web/src/components/EarnedRewardVault.tsx',
 'creator-v1/web/src/components/MemberSpaceDashboard.tsx',
 'creator-v1/web/src/components/MemberCollectionNav.tsx',
 'creator-v1/web/src/lib/member-collection-map.ts',
 'creator-v1/web/src/lib/saved-works-browse.ts',
 'creator-v1/web/src/member-collection-nav.css'
];
export const REVIEW_FILES=[
 ...UI_FILES,
 'creator-v1/test/member-collections-v011.test.mjs',
 'creator-v1/test/member-collections-v011-browser.mjs',
 'creator-v1/test/saved-works-organization-v010.test.mjs',
 'docs/production/continuance-member-collections-v011.md'
];
export const META_FILES=[
 'creator-v1/ops/v132-member-collections-package.mjs',
 'creator-v1/test/v132-member-collections-release.test.mjs',
 'creator-v1/test/v132-member-collections-browser.mjs',
 'docs/production/v132-member-collections-release.md',
 '.github/workflows/v132-member-collections-release.yml'
];
export function verifySource(){
 const head=git('rev-parse','HEAD');
 assert.match(head,/^[a-f0-9]{40}$/);
 git('merge-base','--is-ancestor',BASE,'HEAD');
 const actual=git('diff','--name-only',BASE,'HEAD').split(/\r?\n/).filter(Boolean);
 for(const path of actual)assert.ok([...REVIEW_FILES,...META_FILES].includes(path),'Unapproved V132 source file: '+path);
 for(const path of REVIEW_FILES){
  const a=git('rev-parse',REVIEW+':'+path);
  const b=git('rev-parse','HEAD:'+path);
  assert.equal(a,b,'Reviewed collection file drift: '+path);
 }
 assert.equal(git('diff','--name-only','--','creator-v1/web/src','creator-v1/canonical-auth','creator-v1/apex-prelaunch'),'',
   'Uncommitted application or Worker files');
 return {head,base:BASE,review:REVIEW,changed:actual.sort()};
}
function walk(dir){
 const out=[];
 function visit(path){
  for(const item of readdirSync(path,{withFileTypes:true})){
   const name=join(path,item.name),stat=lstatSync(name);
   assert.ok(!stat.isSymbolicLink(),'Symlink forbidden in package: '+name);
   if(stat.isDirectory())visit(name);
   else {assert.ok(stat.isFile(),'Non-file in package');out.push(relative(dir,name).replaceAll('\\','/'));}
  }
 }
 visit(dir);return out.sort();
}
function inventory(dir){
 return walk(dir).map(path=>({path,sha256:hex(readFileSync(join(dir,path))),size:readFileSync(join(dir,path)).length}));
}
export function prepare(v131Root,newAssets,outRoot){
 const source=verifySource(),oldRoot=resolve(v131Root),freshRoot=resolve(newAssets),out=resolve(outRoot);
 assert.ok(existsSync(oldRoot)&&existsSync(freshRoot),'V131 source package or built V132 frontend missing');
 assert.ok(!existsSync(out),'Refuse to overwrite an existing candidate');
 const original=json(join(oldRoot,'package-manifest.json'));
 assert.equal(original.packagingHead,BASE);
 assert.equal(original.assetCount,ORIGINAL_ASSET_COUNT);
 assert.equal(original.workerBundleVerified,true);
 assert.equal(original.status,'OFFLINE_WORKER_BUNDLE_VERIFIED');
 assert.equal(original.workerBundleFiles.find(x=>x.path==='gateway.js').sha256,GATEWAY_HASH);
 const workerFile=join(oldRoot,'worker-bundle/gateway.js');
 assert.equal(hex(readFileSync(workerFile)),GATEWAY_HASH,'Original Worker bytes drifted');
 const oldAssets=join(oldRoot,'compiled-web'),oldFiles=inventory(oldAssets);
 assert.equal(oldFiles.length,ORIGINAL_ASSET_COUNT,'Original asset count differs');
 const media=oldFiles.filter(x=>x.path.startsWith('evolution/assets/'));
 assert.equal(media.length,ORIGINAL_EARNED_MEDIA,'Original earned media incomplete');
 mkdirSync(out,{recursive:true});
 const destination=join(out,'compiled-web');
 cpSync(oldAssets,destination,{recursive:true});
 const replacements=[];
 for(const rel of walk(freshRoot)){
  if(rel.startsWith('evolution/assets/'))continue; // Always retain V131 approved artworks.
  const candidate=join(freshRoot,rel),target=join(destination,rel);
  if(existsSync(target)&&rel!=='index.html'&&!rel.startsWith('assets/')){
   assert.equal(hex(readFileSync(candidate)),hex(readFileSync(target)),'Non-UI asset changed: '+rel);
  }
  mkdirSync(dirname(target),{recursive:true});
  copyFileSync(candidate,target);
  replacements.push(rel);
 }
 cpSync(join(oldRoot,'worker-bundle'),join(out,'worker-bundle'),{recursive:true});
 const finalInventory=inventory(destination);
 const finalMedia=finalInventory.filter(x=>x.path.startsWith('evolution/assets/'));
 assert.deepEqual(finalMedia,media,'Earned artwork altered');
 assert.equal(hex(readFileSync(join(out,'worker-bundle/gateway.js'))),GATEWAY_HASH);
 const originalIndex=readFileSync(join(oldAssets,'index.html'),'utf8');
 const newIndex=readFileSync(join(freshRoot,'index.html'),'utf8');
 assert.notEqual(hex(Buffer.from(originalIndex)),hex(Buffer.from(newIndex)),'Reviewed UI not present');
 assert.equal(readFileSync(join(destination,'index.html'),'utf8'),newIndex);
 const html=newIndex, refs=[...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map(x=>x[1]);
 assert.ok(refs.some(x=>x.endsWith('.js'))&&refs.some(x=>x.endsWith('.css')),'V132 app entry files missing');
 for(const asset of refs)assert.ok(existsSync(join(destination,asset.slice(1))),'App entry asset missing: '+asset);
 assert.equal(finalInventory.filter(x=>x.path.endsWith('.map')).length,0,'Source maps may not be shipped');
 const record={
  session:'ANEVUM.WEB.RELEASE.2026-10-23.003.V132-COLLECTIONS-CANDIDATE',
  status:'SEALED_OFFLINE_ONLY',
  source,existingWorkerV131:GATEWAY_HASH,originalAssetCount:ORIGINAL_ASSET_COUNT,
  originalEarnedArtworkCount:ORIGINAL_EARNED_MEDIA,retainedMediaSha256:hex(Buffer.from(JSON.stringify(media))),
  candidateAssetCount:finalInventory.length,indexSha256:hex(Buffer.from(newIndex)),
  candidateAssetsSha256:hex(Buffer.from(JSON.stringify(finalInventory))),
  entryAssets:refs,replacements:replacements.length,
  flags:{VITE_IREN_SPATIAL_GUIDE:true,VITE_NATIVE_CREATOR_STUDIO_V095:true,
    VITE_PACKAGE_CREATOR_GALLERY_V010:true,VITE_MEMBER_COLLECTION_NAV_REVIEW:true},
  uploadAuthorized:false,immutableVersion:null,activated:false,trafficChanged:false,
  controllerChanged:false,memberDbChanged:false, xpChanged:false,activePublicVersion:null,
  authenticatedAcceptance:false,physicalSafariAcceptance:false,reviewEvidence:'pending'
 };
 write(join(out,'v132-offline-manifest.json'),record);
 write(join(out,'v132-asset-inventory.json'),finalInventory);
 return {status:record.status,head:source.head,retainedMedia:media.length,
   files:finalInventory.length,entryAssets:refs,workerSha256:GATEWAY_HASH,providerWrites:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [cmd,...args]=process.argv.slice(2);
 if(cmd==='prepare'&&args.length===3)console.log(JSON.stringify(prepare(...args)));
 else throw Error('Usage: prepare <v131-package-dir> <v132-dist-web-dir> <new-package-dir>');
}
