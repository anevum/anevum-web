/**
 * V116 offline Worker package only. This tool cannot upload, deploy, assign a
 * route, read provider secrets, or touch D1. The baseline is a historical
 * CONFIGURATION REFERENCE, not authority to modify Cloudflare.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,lstatSync,cpSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const SOURCE='a3c94b3ebdc6103347e76f8a5234904978da67e3';
export const RUN=39887377952;
export const ARTIFACT=12472563668;
export const WORKER='anevum-apex-prelaunch-gateway';
const ACCOUNT='2f7ee83107240152097efd956a4e8335';
const PUBLIC='93cc7f07-cf39-457e-af69-c9f6f4c02d25';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,obj)=>writeFileSync(p,JSON.stringify(obj,null,2)+'\n');
const baseline=load(new URL('../operations/apex-bundle-runtime-baseline-20261022.json',import.meta.url));
const requiredFlags=['VITE_IREN_SPATIAL_GUIDE','VITE_NATIVE_CREATOR_STUDIO_V095','VITE_PACKAGE_CREATOR_GALLERY_V010'];
const posix=p=>p.split('\\').join('/');

export function inspectSource(){
  const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  assert.match(head,/^[0-9a-f]{40}$/);
  execFileSync('git',['merge-base','--is-ancestor',SOURCE,'HEAD']);
  const allowed=new Set([
    'creator-v1/ops/v116-offline-worker-package.mjs',
    'creator-v1/test/v116-offline-worker-package.test.mjs',
    '.github/workflows/v116-offline-worker-package.yml',
    'docs/production/v116-offline-worker-package-20261022.md'
  ]);
  const changes=execFileSync('git',['diff','--name-only',SOURCE,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
  assert.ok(changes.every(p=>allowed.has(p)),'Package source includes unreviewed runtime changes');
  assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=all'],{encoding:'utf8'}).trim(),'','Require clean exact-source checkout');
  return head;
}

export function inventory(root){
  const seen=[];
  function visit(dir){
    for(const name of readdirSync(dir)){
      const f=join(dir,name),st=lstatSync(f);
      assert.ok(!st.isSymbolicLink(),'Symlink rejected: '+f);
      if(st.isDirectory())visit(f);
      else{
        assert.ok(st.isFile(),'Non-file asset rejected');
        const path=posix(relative(root,f));
        assert.ok(path&&!path.startsWith('../')&&!path.includes('/../'));
        const bytes=readFileSync(f);
        seen.push({path,bytes:bytes.length,sha256:sha(bytes)});
      }
    }
  }
  visit(root);
  return seen.sort((a,b)=>a.path.localeCompare(b.path));
}

export function verifyFrontend(input){
  const m=load(join(input,'candidate-manifest.json'));
  const root=join(input,'compiled-web');
  assert.equal(m.sourceSha,SOURCE,'Wrong merged source');
  assert.equal(m.status,'EXACT_SOURCE_FRONTEND_DRY_RUN');
  assert.equal(m.assetBase,'/');
  assert.equal(m.runtimePath,'/');
  assert.equal(m.entry,'index.html');
  assert.deepEqual(m.clientFlags,Object.fromEntries(requiredFlags.map(k=>[k,true])));
  for(const key of ['uploadedToCloudflare','publicTrafficChanged','databaseModified','productionReleaseApproved','physicalSafariAcceptance','authenticatedFounderReviewerAndMemberAcceptance'])
    assert.equal(m[key],false,'Unexpected release state: '+key);
  const expected=[...m.files].sort((a,b)=>a.path.localeCompare(b.path));
  const files=inventory(root);
  assert.ok(files.length>200,'Compiled public asset inventory incomplete');
  assert.deepEqual(files,expected,'Compiled frontend bytes differ from reviewed manifest');
  assert.ok(files.some(x=>x.path==='index.html'));
  assert.equal(files.filter(x=>x.path.endsWith('.map')).length,0,'Public source maps prohibited');
  for(let level=1;level<=30;level++){
    const prefix='evolution/assets/level-'+String(level).padStart(2,'0');
    for(const suffix of ['-scene.gz','-1024.webp','-256.webp','-compact-128.png','-field.svg'])
      assert.ok(files.some(x=>x.path===prefix+suffix),'Missing preserved level artwork');
  }
  const browser=load(join(input,'acceptance.json'));
  assert.equal(browser.status,'PASS');
  for(const width of [320,390,1440]){
    const row=browser.results?.find(r=>r.width===width);
    assert.ok(row?.rootMounted&&row.cssLoaded&&row.cssJsHttp200&&row.syntheticOnly,'Missing root browser acceptance '+width);
  }
  return {m,files,browser};
}

export function offlineConfig(assetRoot,repo=resolve('.')){
  // Frozen V112 settings are allowed for a NO-CREDENTIAL compilation only.
  // Live provider settings have drifted since this record and MUST be
  // re-read and fully reconciled before any later upload.
  assert.equal(baseline.accountId,ACCOUNT);
  assert.equal(baseline.worker,WORKER);
  const b=baseline.candidateVersion.resources.bindings;
  assert.equal(b.length,26);
  assert.ok(b.filter(x=>x.type==='secret_text').every(x=>Object.keys(x).sort().join(',')==='name,type'));
  const vars=Object.fromEntries(b.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
  assert.equal(vars.CANONICAL_XP_TEST_ENABLED,'false');
  assert.equal(vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
  assert.equal(vars.CANONICAL_PACKAGE_PROOF_ENABLED,'true');
  const r=baseline.candidateVersion.resources.script_runtime;
  return {
    name:WORKER,account_id:ACCOUNT,main:join(repo,'creator-v1/apex-prelaunch/gateway.mjs'),
    compatibility_date:r.compatibility_date,compatibility_flags:r.compatibility_flags,
    workers_dev:false,preview_urls:false,routes:[],upload_source_maps:false,
    assets:{directory:assetRoot,binding:'ASSETS',run_worker_first:true,not_found_handling:'single-page-application'},
    d1_databases:b.filter(x=>x.type==='d1').map(x=>({binding:x.name,database_id:x.database_id})),
    vars
  };
}

export function prepare(input,output){
  const source=inspectSource();
  const checked=verifyFrontend(resolve(input));
  const out=resolve(output);
  mkdirSync(out,{recursive:true});
  const assets=join(out,'compiled-web');
  cpSync(join(resolve(input),'compiled-web'),assets,{recursive:true,force:false,errorOnExist:true});
  assert.deepEqual(inventory(assets),checked.files);
  const config=offlineConfig(assets);
  write(join(out,'wrangler.offline.json'),config);
  cpSync(join(resolve(input),'acceptance.json'),join(out,'root-acceptance.json'));
  write(join(out,'frontend-manifest.json'),checked.m);
  write(join(out,'package-manifest.json'),{
    status:'V116_OFFLINE_WORKER_PREPARED',session:'ANEVUM.WEB.RELEASE.2026-10-22.001.FIRST-LOAD-IREN-PRODUCTION',
    sourceSha:SOURCE,packagingSha:source,sourceRun:RUN,sourceArtifact:ARTIFACT,assetCount:checked.files.length,
    assetInventorySha256:sha(JSON.stringify(checked.files)),runtimeReference:'HISTORICAL_V112_NOT_LIVE',
    historicalRollbackPublic:PUBLIC,offlineOnly:true,
    cloudflareReadbackFresh:false,workerBundleVerified:false,uploadAuthorized:false,
    uploaded:false,publicTrafficChanged:false,productionReleaseApproved:false,
    secretValuesIncluded:false,memberDataChanged:false,authenticatedAcceptance:false,physicalSafariAcceptance:false
  });
  return {status:'V116_OFFLINE_WORKER_PREPARED',assets:checked.files.length};
}

export function seal(outpath){
  const out=resolve(outpath),m=load(join(out,'package-manifest.json'));
  assert.equal(m.packagingSha,inspectSource());
  assert.equal(m.sourceSha,SOURCE);
  assert.deepEqual(load(join(out,'wrangler.offline.json')),offlineConfig(join(out,'compiled-web')));
  assert.equal(sha(JSON.stringify(inventory(join(out,'compiled-web')))),m.assetInventorySha256);
  const dir=join(out,'worker-bundle');
  const files=inventory(dir);
  assert.ok(files.some(x=>x.bytes>10000&&x.path.endsWith('.js')),'Compiled Worker missing');
  for(const entry of files.filter(x=>x.path.endsWith('.js')))execFileSync(process.execPath,['--check',join(dir,entry.path)]);
  m.status='V116_COMPLETE_OFFLINE_WORKER_PACKAGE';
  m.workerBundleVerified=true;m.bundleFiles=files;m.offlineConfigSha256=sha(readFileSync(join(out,'wrangler.offline.json')));
  write(join(out,'package-manifest.json'),m);
  return {status:m.status,bundleCount:files.length,publicTrafficChanged:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [op,...args]=process.argv.slice(2);
  if(op==='prepare'&&args.length===2)console.log(JSON.stringify(prepare(...args)));
  else if(op==='seal'&&args.length===1)console.log(JSON.stringify(seal(args[0])));
  else throw Error('Usage: prepare <source-artifact-dir> <out-dir> | seal <out-dir>');
}
