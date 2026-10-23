/**
 * V122: reproducible, provider-free complete controller bundle for an INACTIVE
 * V116-auth-pinned version. No Cloudflare API calls or deployment endpoints.
 * This offline artifact deliberately NEVER contains real controller settings.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,statSync,copyFileSync} from 'node:fs';
import {resolve,relative,dirname,join,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {controllerConfig,BUILD_SOURCE,TARGET_AUTH} from './v121-controller-bundle.mjs';
import {PUBLIC_CTRL,PRIVATE_CTRL,PRIVATE_APEX,PUBLIC_APEX} from './v120-protected-acceptance.mjs';

export const REVIEWED_SOURCE='967f3358c65bf2ad38e862550fe4e71f5c965a4b';
export const WORKER='anevum-package-alpha-v003-control';
export const MAIN=BUILD_SOURCE;
export const BUNDLE_NAME='api.js';
const hash=b=>createHash('sha256').update(b).digest('hex');
const root=resolve('site/alpha/v003');
const localImports=/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(["'])(\.[^"']+)\1/g;
const stable=x=>JSON.stringify(x);
const field=(name,text)=>({name,type:'plain_text',text});

export function syntheticSnapshot(){
 const bindings=[
  {name:'AUTH',type:'service',service:'anevum-apex-prelaunch-gateway'},
  {name:'DB',type:'d1',database_id:'fe6a2c20-ccde-451e-ab5f-3610b38d97ff'},
  {name:'MEDIA',type:'r2_bucket',bucket_name:'synthetic-only-never-upload'},
  field('PACKAGE_CANONICAL_AUTH_VERSION',PRIVATE_APEX),
  field('PACKAGE_CREATOR_GALLERY_ENABLED','true'),
  field('PACKAGE_NATIVE_STUDIO_ENABLED','true'),
  {name:'PACKAGE_PREVIEW_KEY',type:'secret_text'},
  field('PACKAGE_PUBLIC_PUBLISH_ENABLED','false'),
  field('PACKAGE_RESOURCE_PROTECTION_ENABLED','true'),
  field('PILOT_IDS','synthetic-user-never-upload'),
  field('RUNTIME_HOST','synthetic-only.invalid'),
  field('STAFF_IDS','synthetic-user-never-upload'),
  field('STAGING_CONTROL_HOST','synthetic-only.invalid')
 ];
 const version=(id)=>({id,resources:{bindings:structuredClone(bindings)}});
 return {controllerPrivate:version(PRIVATE_CTRL),controllerPublic:version(PUBLIC_CTRL),
  controllerDeployment:{versions:[{version_id:PUBLIC_CTRL,percentage:100},{version_id:PRIVATE_CTRL,percentage:0}]},
  apexDeployment:{versions:[{version_id:PUBLIC_APEX,percentage:100},{version_id:PRIVATE_APEX,percentage:0}]}};
}

/** Walk actual local imports, pin every reachable source byte to reviewed V121. */
export function sourceGraph(){
 const found=new Map(), pending=[resolve(MAIN)];
 while(pending.length){
  const abs=pending.pop(),rel=relative(resolve('.'),abs).split(sep).join('/');
  assert.ok(abs.startsWith(root+sep),'Controller cannot import outside its source directory');
  assert.ok(rel.startsWith('site/alpha/v003/'),'Unexpected source path');
  assert.ok(!found.has(rel)||found.get(rel),'Source graph cycle');
  if(found.has(rel))continue;
  assert.equal(statSync(abs).isFile(),true,'Controller import is not a regular file');
  const contents=readFileSync(abs);
  const reviewed=execFileSync('git',['show',REVIEWED_SOURCE+':'+rel],{maxBuffer:4*1024*1024});
  assert.equal(hash(contents),hash(reviewed),'Unreviewed controller source drift: '+rel);
  const text=contents.toString('utf8');
  found.set(rel,{path:rel,bytes:contents.length,sha256:hash(contents)});
  localImports.lastIndex=0;
  for(const match of text.matchAll(localImports)){
   const spec=match[2];
   assert.ok(spec.startsWith('./'),'Unsupported upward or absolute controller import: '+spec);
   const dependency=resolve(dirname(abs),spec);
   assert.ok(dependency.startsWith(root+sep),'Controller import escapes source root');
   assert.ok(dependency.endsWith('.mjs'),'Unexpected controller dependency type');
   if(!found.has(relative(resolve('.'),dependency).split(sep).join('/')))pending.push(dependency);
  }
 }
 const sources=[...found.values()].sort((a,b)=>a.path.localeCompare(b.path));
 assert.ok(sources.length>=9,'The controller must include its complete dependency tree');
 assert.ok(sources.some(x=>x.path.endsWith('/ui.mjs')));
 assert.ok(sources.some(x=>x.path.endsWith('/resource-cleanup.mjs')));
 assert.ok(sources.some(x=>x.path.endsWith('/continuance-visuals.mjs')));
 return {sourceBaselineSha:REVIEWED_SOURCE,sources,graphSha256:hash(stable(sources))};
}
export function offlineConfig(){
 const cfg=controllerConfig(syntheticSnapshot(),resolve(MAIN));
 assert.equal(cfg.name,WORKER);
 assert.equal(cfg.vars.PACKAGE_CANONICAL_AUTH_VERSION,TARGET_AUTH);
 assert.equal(cfg.vars.PACKAGE_PUBLIC_PUBLISH_ENABLED,'false');
 assert.equal(cfg.services.length,1);assert.equal(cfg.d1_databases.length,1);assert.equal(cfg.r2_buckets.length,1);
 assert.equal(cfg.preview_urls,false);assert.deepEqual(cfg.routes,[]);
 assert.ok(!JSON.stringify(cfg).includes('PACKAGE_PREVIEW_KEY'));
 assert.ok(!JSON.stringify(cfg).includes('CLOUDFLARE_API_TOKEN'));
 return cfg;
}
export function prepare(outDir){
 const out=resolve(outDir);mkdirSync(out,{recursive:true});
 execFileSync('git',['merge-base','--is-ancestor',REVIEWED_SOURCE,'HEAD']);
 const graph=sourceGraph(), cfg=offlineConfig();
 writeFileSync(join(out,'offline.synthetic.json'),JSON.stringify(cfg,null,2)+'\n',{mode:0o600});
 const plan={status:'V122_CONTROLLER_COMPILATION_PREPARED',targetAuthVersion:TARGET_AUTH,
  sourceBaselineSha:REVIEWED_SOURCE,sourceGraphSha256:graph.graphSha256,
  sourceFiles:graph.sources.length,syntheticConfigOnly:true,
  providerCredentialsUsed:false,providerWrites:false,publicTrafficChanged:false};
 writeFileSync(join(out,'plan.json'),JSON.stringify(plan,null,2)+'\n');
 return plan;
}
export function seal(compiledPath,outDir){
 const graph=sourceGraph();
 const abs=resolve(compiledPath),out=resolve(outDir);
 assert.equal(abs.endsWith('/'+BUNDLE_NAME),true,'Unexpected compiled script name');
 const js=readFileSync(abs);
 assert.ok(js.length>80000&&js.length<4*1024*1024,'Missing or oversized controller dependency-complete Worker');
 assert.ok(js.toString('utf8').includes('PACKAGE_CANONICAL_AUTH_VERSION'),'Canonical AUTH pin logic absent');
 assert.ok(js.toString('utf8').includes('PACKAGE_PUBLIC_PUBLISH_ENABLED'),'Publishing gate absent');
 mkdirSync(join(out,'worker-bundle'),{recursive:true});
 copyFileSync(abs,join(out,'worker-bundle',BUNDLE_NAME));
 const manifest={status:'V122_V116_CONTROLLER_COMPILED_OFFLINE',sourceBaselineSha:REVIEWED_SOURCE,
  controllerSource:MAIN,worker:WORKER,authTarget:TARGET_AUTH,
  sourceGraphSha256:graph.graphSha256,sourceFiles:graph.sources.length,sourceManifest:graph.sources,
  bundlePath:'worker-bundle/'+BUNDLE_NAME,bundleBytes:js.length,bundleSha256:hash(js),
  plainTextBindingsFromLive:false,secretValuesIncluded:false,
  completeBuildVerified:true,providerUploaded:false,versionDeployed:false,
  publicTrafficChanged:false,publicPublishingEnabled:false,authenticatedAcceptance:false,
  physicalSafariAcceptance:false,productionReleaseApproved:false};
 writeFileSync(join(out,'package-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return {status:manifest.status,sourceFiles:manifest.sourceFiles,bundleBytes:manifest.bundleBytes,bundleSha256:manifest.bundleSha256};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [command,a,b]=process.argv.slice(2);
 if(command==='prepare'){assert.ok(a&&!b);console.log(JSON.stringify(prepare(a)));}
 else if(command==='seal'){assert.ok(a&&b);console.log(JSON.stringify(seal(a,b)));}
 else throw Error('Usage: node v122-controller-compiled-package.mjs prepare <dir> | seal <compiled-js> <dir>');
}
