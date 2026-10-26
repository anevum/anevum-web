/** Frontend-only shared asset packaging for a two-version percentage deployment.
 * Keeps baseline HTML byte-identical while both versions receive the same
 * immutable asset superset. Does not upload or allocate traffic. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,mkdirSync,cpSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const BASELINE='031a221d1bd108ff01dcb74f271675d8ccf2d29a';
const CANARY='4dfaed54fed606713a99b87c3152beddbcbc31f3';
const GATEWAY='1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99';
const hash=b=>createHash('sha256').update(b).digest('hex');
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function walk(root,path=''){
 return readdirSync(join(root,path),{withFileTypes:true}).flatMap(e=>{
  const p=path?path+'/'+e.name:e.name;
  assert.ok(!lstatSync(join(root,p)).isSymbolicLink(),'Symlinks forbidden in release assets');
  return e.isDirectory()?walk(root,p):[{path:p,sha256:hash(readFileSync(join(root,p)))}];
 }).sort((a,b)=>a.path.localeCompare(b.path));
}
/** Exported so real package composition can be tested without provider access. */
export function shareCompiledAssets(roots,out){
 assert.equal(roots.length,3,'Baseline, previous canary and candidate required');
 const inventories=roots.map(p=>walk(p));
 const union=new Map();
 inventories.forEach((items,i)=>items.forEach(item=>{
  if(item.path==='index.html')return;
  const existing=union.get(item.path);
  assert.ok(!existing||existing.sha256===item.sha256,'Conflicting static asset '+item.path);
  union.set(item.path,{...item,root:roots[i]});
 }));
 const destinations=['baseline','candidate'].map(name=>join(out,name,'compiled-web'));
 for(const [i,dest] of destinations.entries()){
  mkdirSync(dest,{recursive:true});
  assert.deepEqual(readdirSync(dest),[],'Refuse to mix a stale paired package');
  const source=roots[i===0?0:2];
  cpSync(join(source,'index.html'),join(dest,'index.html'));
  for(const item of union.values()){
   mkdirSync(join(dest,item.path,'..'),{recursive:true});
   cpSync(join(item.root,item.path),join(dest,item.path));
  }
  assert.equal(hash(readFileSync(join(dest,'index.html'))),hash(readFileSync(join(source,'index.html'))),'Entrypoint bytes preserved');
 }
 const shared=[...union.values()].map(({path,sha256})=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path));
 for(const dest of destinations)assert.deepEqual(walk(dest).filter(x=>x.path!=='index.html'),shared,'Both versions serve identical shared assets');
 return {sharedAssetCount:shared.length,sharedAssetsSha256:hash(JSON.stringify(shared)),inventories:destinations.map(p=>walk(p))};
}
function validatePackage(root,source){
 const manifest=load(join(root,'manifest.json')),inventory=walk(join(root,'compiled-web'));
 assert.equal(manifest.source.head,source,'Pinned verified frontend source');
 assert.equal(manifest.gatewaySha256,GATEWAY);
 assert.equal(hash(readFileSync(join(root,'worker-bundle/gateway.js'))),GATEWAY);
 assert.deepEqual(inventory,load(join(root,'assets.json')),'Immutable package inventory');
 assert.equal(hash(JSON.stringify(inventory)),manifest.assetsSha256,'Sealed package inventory digest');
 assert.equal(inventory.filter(x=>x.path.startsWith('evolution/assets/')).length,152);
 return manifest;
}
export function pairPackages(baseline,oldCanary,candidate,out){
 const current=load(join(candidate,'manifest.json'));
 const manifests=[validatePackage(baseline,BASELINE),validatePackage(oldCanary,CANARY),validatePackage(candidate,current.source.head)];
 const roots=[baseline,oldCanary,candidate];
 const earned=roots.map(root=>walk(join(root,'compiled-web')).filter(x=>x.path.startsWith('evolution/assets/')));
 assert.deepEqual(earned[0],earned[1]);assert.deepEqual(earned[0],earned[2]);
 const result=shareCompiledAssets(roots.map(p=>join(p,'compiled-web')),out);
 for(const [i,variant] of ['baseline','candidate'].entries()){
  const dest=join(out,variant),inventory=result.inventories[i];
  cpSync(join(candidate,'worker-bundle'),join(dest,'worker-bundle'),{recursive:true});
  save(join(dest,'assets.json'),inventory);
  save(join(dest,'manifest.json'),{...current,source:current.source,frontendSourceHead:i===0?BASELINE:current.source.head,
   releaseVariant:i===0?'baseline-assets-only':'candidate',baselineFrontendUnchanged:i===0,
   assetCount:inventory.length,assetsSha256:hash(JSON.stringify(inventory)),
   sharedAssetCount:result.sharedAssetCount,sharedAssetsSha256:result.sharedAssetsSha256,
   baselineEntrypointSha256:hash(readFileSync(join(baseline,'compiled-web/index.html'))),uploaded:false,activated:false});
 }
 const report={source:current.source.head,preservedBaselineSource:manifests[0].source.head,previousCanarySource:manifests[1].source.head,
  sharedAssetCount:result.sharedAssetCount,sharedAssetsSha256:result.sharedAssetsSha256,baselineEntrypointUnchanged:true,
  gatewaySha256:GATEWAY,earnedMediaUnchanged:true,trafficChanged:false,liveAcceptance:false};
 save(join(out,'asset-pair-report.json'),report);return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(pairPackages(...process.argv.slice(2))));
