/** V121 creates a V116-pinned controller's OFFLINE build config.
 * No Cloudflare requests or mutable live controller operations are permitted.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {V116,CONTROLLER,PRIVATE_CTRL,PUBLIC_CTRL,PRIVATE_APEX} from './v120-protected-acceptance.mjs';
const SECRET='PACKAGE_PREVIEW_KEY';
const keys=x=>x.map(b=>b.name+':'+b.type).sort();
const find=(x,n)=>x.filter(b=>b.name===n);
export const BUILD_SOURCE='site/alpha/v003/api.mjs';
export const TARGET_AUTH=V116;
export function controllerConfig(snapshot,source=resolve(BUILD_SOURCE)){
 const {controllerPrivate,controllerPublic,controllerDeployment,apexDeployment}=snapshot;
 assert.equal(controllerPrivate.id,PRIVATE_CTRL);
 assert.equal(controllerPublic.id,PUBLIC_CTRL);
 assert.deepEqual(controllerDeployment.versions,[{version_id:PUBLIC_CTRL,percentage:100},{version_id:PRIVATE_CTRL,percentage:0}]);
 assert.deepEqual(apexDeployment.versions,[{version_id:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',percentage:100},{version_id:PRIVATE_APEX,percentage:0}]);
 const bs=controllerPrivate.resources.bindings;
 assert.equal(bs.length,13);
 assert.deepEqual(keys(bs),keys(controllerPublic.resources.bindings));
 assert.deepEqual(find(bs,SECRET).map(b=>b.type),['secret_text']);
 assert.equal(find(bs,'AUTH')[0]?.service,'anevum-apex-prelaunch-gateway');
 assert.equal(find(bs,'PACKAGE_CANONICAL_AUTH_VERSION')[0]?.text,PRIVATE_APEX);
 assert.equal(find(bs,'PACKAGE_PUBLIC_PUBLISH_ENABLED')[0]?.text,'false');
 assert.equal(find(bs,'PACKAGE_NATIVE_STUDIO_ENABLED')[0]?.text,'true');
 assert.equal(find(bs,'DB')[0]?.database_id,'fe6a2c20-ccde-451e-ab5f-3610b38d97ff');
 const proposed=bs.map(b=>b.name==='PACKAGE_CANONICAL_AUTH_VERSION'?{...b,text:TARGET_AUTH}:({...b}));
 const vars=Object.fromEntries(proposed.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
 const d1=proposed.filter(b=>b.type==='d1').map(b=>({binding:b.name,database_id:b.database_id}));
 const r2=proposed.filter(b=>b.type==='r2_bucket').map(b=>({binding:b.name,bucket_name:b.bucket_name}));
 const services=proposed.filter(b=>b.type==='service').map(b=>({binding:b.name,service:b.service,...(b.environment?{environment:b.environment}:{})}));
 assert.equal(vars.PACKAGE_PUBLIC_PUBLISH_ENABLED,'false');
 assert.equal(vars.PACKAGE_CANONICAL_AUTH_VERSION,TARGET_AUTH);
 assert.equal(d1.length,1);assert.equal(r2.length,1);assert.equal(services.length,1);
 return {name:CONTROLLER,account_id:'2f7ee83107240152097efd956a4e8335',main:source,
  compatibility_date:'2026-10-18',workers_dev:true,preview_urls:false,routes:[],upload_source_maps:false,
  vars,d1_databases:d1,r2_buckets:r2,services};
}
export function prepare(snapshotPath,outputDir){
 const x=JSON.parse(readFileSync(snapshotPath,'utf8'));
 const c=controllerConfig(x);
 const source=readFileSync(c.main);
 assert.ok(source.length>10000,'Missing complete controller source');
 const out=resolve(outputDir);mkdirSync(out,{recursive:true});
 writeFileSync(join(out,'wrangler.offline.json'),JSON.stringify(c,null,2)+'\n');
 const manifest={
  status:'V121_V116_CONTROLLER_OFFLINE_PREPARED',authTarget:V116,
  controllerPublic:PUBLIC_CTRL,controllerOldPrivate:PRIVATE_CTRL,
  sourcePath:BUILD_SOURCE,sourceSha256:createHash('sha256').update(source).digest('hex'),
  publishingEnabled:false,cloudflareReadbackFresh:false,uploaded:false,versionDeployed:false,
  publicTrafficChanged:false,secretValuesIncluded:false,authenticatedAcceptance:false,physicalSafariAcceptance:false
 };
 writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 assert.equal(process.argv.length,4,'Usage: node v121-controller-bundle.mjs <snapshot.json> <outdir>');
 console.log(JSON.stringify(prepare(process.argv[2],process.argv[3])));
}
