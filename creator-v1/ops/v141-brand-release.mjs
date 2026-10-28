/**
 * ANEVUM V141 approved brand-only Worker release. No application compilation,
 * backend, database, identity or old cached-asset path is modified.
 *
 * Source: V140 release source at ac432ded31d3e8b8a1fba523ca38f2132704890f.
 * Published version V69 stays rollbackable. Both candidate packages include
 * the same versioned icon/share assets; only the candidate HTML changes.
 */
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,cpSync,existsSync,mkdirSync,readdirSync,lstatSync} from "node:fs";
import {join,resolve,dirname} from "node:path";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
const BASE="ac432ded31d3e8b8a1fba523ca38f2132704890f";
const APPROVED_V140="fb1f903333187caa3bd7665e93c013f28b9f3366";
const LIVE_SOURCE="9ec37dbc23085e4e71cdf78b3d276eb59eb1a1b6";
const LIVE_HTML_SHA="1cbc17726657086e7b86b8ee16a4067a9abdf6f49ebf40e8eb829fb44";
const GATEWAY_SHA="1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99";
const WORKER="anevum-apex-prelaunch-gateway";
const ACCOUNT="2f7ee83107240152097efd956a4e8335";
const ZONE="8abe27259b5436af5966d3b40d9a3760";
const LIVE_DEPLOY="1d965db3-68f0-431e-bc88-dbb7ef337101";
const LIVE_VERSION="f30caf48-f56f-4209-be51-f029559d1cc0";
const ROUTES_SHA="fa8abbaca3813f9172bbb1677c7a71068f4ab6c093b4f4835e67d7c70db5e67b";
const CONTROLLER_DEPLOY="4c832ec7-ce67-4864-832c-9b0b470af92d";
const ROOT="/accounts/"+ACCOUNT+"/workers/scripts/"+WORKER;
const BRANCH="release/v141-severance-icon-share-20261027-001";
const NAME="ANEVUM.WEB.RELEASE.2026-10-27.002.SEVERANCE-BRAND-ICONS-SHARE";
const FILES=new Set([
 "creator-v1/ops/generate-severance-brand-v141.py",
 "creator-v1/ops/v141-brand-release.mjs",
 "creator-v1/web/index.html",
 "creator-v1/web/public/anevum-severance-v141.webmanifest",
 "creator-v1/test/v141-brand-contract.test.mjs",
 ".github/workflows/v141-brand-release.yml",
 "docs/production/"+NAME+".md"
]);
const ART=["anevum-severance-icon-v141-1024.png","anevum-severance-icon-v141-512.png",
 "anevum-severance-icon-v141-192.png","anevum-severance-apple-touch-v141-180.png",
 "anevum-severance-favicon-v141-64.png","anevum-severance-maskable-v141-512.png",
 "anevum-severance-share-v141-1200x630.png"];
const git=(...args)=>execFileSync("git",args,{encoding:"utf8"}).trim();
const sha=b=>createHash("sha256").update(b).digest("hex");
const file=p=>readFileSync(p);
const json=p=>JSON.parse(file(p).toString("utf8"));
function stable(x){return JSON.stringify(x,(_,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v)}
function save(p,x){mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(x,null,2)+"\n")}
function walk(dir,prefix=""){
 return readdirSync(join(dir,prefix),{withFileTypes:true}).flatMap(entry=>{
  const name=prefix?prefix+"/"+entry.name:entry.name,p=join(dir,name);
  assert.ok(!lstatSync(p).isSymbolicLink(),"Refuse symlink "+name);
  return entry.isDirectory()?walk(dir,name):[{path:name,sha256:sha(file(p)),bytes:lstatSync(p).size}];
 }).sort((a,b)=>a.path.localeCompare(b.path));
}
function source(){
 assert.equal(git("rev-parse","--abbrev-ref","HEAD"),BRANCH,"Release branch drift");
 assert.equal(git("cat-file","-t",BASE),"commit");
 git("merge-base","--is-ancestor",BASE,"HEAD");
 assert.equal(git("diff","--name-only"),"","Uncommitted tracked source changes");
 const changed=git("diff","--name-only",BASE,"HEAD").split("\n").filter(Boolean);
 assert.deepEqual(changed.filter(x=>!FILES.has(x)),[],"Unexpected application or backend edits");
 assert.ok(changed.includes("creator-v1/web/index.html"),"Missing public share metadata change");
 assert.ok(changed.includes("creator-v1/ops/generate-severance-brand-v141.py"),"Missing versioned artwork generator");
 assert.equal(git("log","-1","--format=%s"),"release(v141): upload verified branding candidate","Source release trigger was not explicitly reviewed");
 return {approvedBase:BASE,releaseSha:git("rev-parse","HEAD"),changed};
}
function patchedHTML(legacy){
 const old=git("show",BASE+":creator-v1/web/index.html").split("\n");
 const latest=file("creator-v1/web/index.html").toString("utf8").trimEnd().split("\n");
 assert.equal(old.length,latest.length,"Only same-line metadata edits are allowed");
 let output=legacy;
 const changed=[];
 for(let i=0;i<old.length;i++){
  if(old[i]===latest[i])continue;
  const before=old[i].replaceAll("%BASE_URL%","/");
  const after=latest[i].replaceAll("%BASE_URL%","/");
  assert.ok(/^    <(?:meta |link )/.test(before)&&/^    <(?:meta |link )/.test(after),"Only HTML head metadata may change");
  assert.ok(/(?:og:|twitter:|rel="(?:icon|apple-touch-icon|apple-touch-icon-precomposed|manifest)")/.test(before),"Not approved head tag: "+before);
  assert.ok(!/<script\b|robots|canonical|og:url|viewport/i.test(before),"Restricted metadata tag");
  const at=output.indexOf(before);
  assert.ok(at>=0&&output.indexOf(before,at+before.length)<0,"Compiled HTML lacks unique old tag: "+before);
  output=output.slice(0,at)+after+output.slice(at+before.length);
  changed.push({before,after});
 }
 assert.equal(changed.length,12,"Exact twelve source metadata edits required, got "+changed.length);
 assert.ok(output.includes('https://anevum.com/anevum-severance-share-v141-1200x630.png'));
 assert.ok(output.includes('href="/anevum-severance-v141.webmanifest"'));
 assert.ok(output.includes('href="/anevum-severance-apple-touch-v141-180.png"'));
 assert.ok(output.includes('content="TRANSCOSMIC: SEVERANCE — ANEVUM"'));
 assert.ok(!output.includes("anevum-social-share-v2.png?v=20261017b"));
 assert.notEqual(sha(output),sha(legacy));
 return {output,changed};
}
function packageArt(v69Root,artRoot,out){
 const src=source();
 const old=json(join(v69Root,"manifest.json"));
 assert.equal(old.approvedSource,APPROVED_V140,"Not the approved V140 deployed candidate");
 assert.equal(old.variant,"candidate","Expected current cinematic candidate package");
 assert.equal(old.gatewaySha256,GATEWAY_SHA);
 assert.equal(sha(file(join(v69Root,"worker-bundle/gateway.js"))),GATEWAY_SHA);
 const oldFiles=walk(join(v69Root,"compiled-web"));
 const previous=json(join(v69Root,"assets.json"));
 assert.deepEqual(oldFiles,previous,"Retained V69 inventory no longer matches sealed artifact");
 const oldIndex=file(join(v69Root,"compiled-web/index.html"));
 assert.equal(sha(oldIndex),LIVE_HTML_SHA,"Retained source HTML is not the exact live V69 bytes");
 assert.ok(oldFiles.length>563,"V69 package missing retained V67 assets");
 const {output,changed}=patchedHTML(oldIndex.toString("utf8"));
 const iconManifest=file("creator-v1/web/public/anevum-severance-v141.webmanifest");
 const obj=JSON.parse(iconManifest);
 assert.equal(obj.name,"ANEVUM");
 const generated=walk(artRoot);
 assert.deepEqual(generated.map(x=>x.path),[...ART].sort(),"Unexpected or missing generated asset");
 const oldPaths=new Set(oldFiles.map(x=>x.path));
 for(const art of generated){
  assert.ok(!oldPaths.has(art.path),"Versioned art conflicts with public URL "+art.path);
  assert.ok(art.bytes>1000&&art.bytes<4000000,"Image size invalid "+art.path);
 }
 assert.ok(!oldPaths.has("anevum-severance-v141.webmanifest"),"Manifest path not versioned");
 const receipt={session:NAME,approvedSource:APPROVED_V140,releaseSource:src.releaseSha,
  originalVersion:LIVE_VERSION,originalDeployment:LIVE_DEPLOY,
  originalGatewaySha256:GATEWAY_SHA,originalHtmlSha256:LIVE_HTML_SHA,
  assetCountBefore:oldFiles.length,newArt:generated,metadataChangedTags:changed.map(x=>x.after),newManifestSha256:sha(iconManifest),
  ownerReviewedOriginalOrbit:true,backendChanged:false,trafficChanged:false};
 for(const variant of ["baseline","candidate"]){
  const folder=join(out,variant),dest=join(folder,"compiled-web");
  assert.ok(!existsSync(folder),"Output must be new, refusing overwrite "+folder);
  mkdirSync(folder,{recursive:true});
  cpSync(join(v69Root,"worker-bundle"),join(folder,"worker-bundle"),{recursive:true});
  cpSync(join(v69Root,"compiled-web"),dest,{recursive:true});
  for(const a of generated)cpSync(join(artRoot,a.path),join(dest,a.path));
  cpSync("creator-v1/web/public/anevum-severance-v141.webmanifest",join(dest,"anevum-severance-v141.webmanifest"));
  if(variant==="candidate")writeFileSync(join(dest,"index.html"),output);
  assert.equal(sha(file(join(folder,"worker-bundle/gateway.js"))),GATEWAY_SHA);
  const inventory=walk(dest);
  for(const oldFile of oldFiles.filter(x=>x.path!=="index.html")){
   const found=inventory.find(x=>x.path===oldFile.path);
   assert.ok(found&&found.sha256===oldFile.sha256,"Published V69 cached URL overwritten "+oldFile.path);
  }
  assert.equal(sha(file(join(dest,"index.html"))),variant==="baseline"?LIVE_HTML_SHA:sha(Buffer.from(output)),"Incorrect variant entrypoint");
  const manifest={...receipt,variant,inventorySha256:sha(stable(inventory)),
    assetCount:inventory.length,frontendSha256:sha(file(join(dest,"index.html"))),oldAssetsPreserved:true};
  save(join(folder,"assets.json"),inventory);
  save(join(folder,"manifest.json"),manifest);
 }
 const a=walk(join(out,"baseline/compiled-web")),b=walk(join(out,"candidate/compiled-web"));
 assert.deepEqual(a.filter(x=>x.path!=="index.html"),b.filter(x=>x.path!=="index.html"),"Both versions must share identical new image assets");
 save(join(out,"release-receipt.json"),{...receipt,baselineHtmlSha256:LIVE_HTML_SHA,
  candidateHtmlSha256:sha(Buffer.from(output)),sharedAssetsHash:sha(stable(a.filter(x=>x.path!=="index.html"))),newTotalAssetCount:a.length});
 return {...receipt,baselineHtmlSha256:LIVE_HTML_SHA,candidateHtmlSha256:sha(Buffer.from(output)),newTotalAssetCount:a.length};
}
async function apiGet(path){
 assert.ok(process.env.CLOUDFLARE_API_TOKEN?.length>16,"Missing scoped Cloudflare release token");
 const r=await fetch("https://api.cloudflare.com/client/v4"+path,{
  headers:{Authorization:"Bearer "+process.env.CLOUDFLARE_API_TOKEN},
  signal:AbortSignal.timeout(30000),redirect:"error"});
 const j=await r.json();assert.ok(r.ok&&j.success,"Provider readback failed: "+r.status+" "+path);
 return j.result;
}
const sig=bindings=>(bindings||[]).map(x=>({name:x.name,type:x.type,...(x.type==="plain_text"?{text:x.text}:{}),...(x.type==="d1"?{database_id:x.database_id}:{})})).sort((a,b)=>a.name.localeCompare(b.name));
async function provider(){
 const [d,settings,live,controller,routes,versions]=await Promise.all([
  apiGet(ROOT+"/deployments"),apiGet(ROOT+"/settings"),apiGet(ROOT+"/versions/"+LIVE_VERSION),
  apiGet("/accounts/"+ACCOUNT+"/workers/scripts/anevum-package-alpha-v003-control/deployments"),
  apiGet("/zones/"+ZONE+"/workers/routes"),apiGet(ROOT+"/versions?per_page=100")
 ]);
 return {deployment:d.deployments[0],settings,live,controller:controller.deployments[0],routes,versions:versions.items};
}
function precheck(s){
 assert.equal(s.deployment.id,LIVE_DEPLOY,"Unexpected currently deployed Worker: refuse upload");
 assert.deepEqual(s.deployment.versions,[{version_id:LIVE_VERSION,percentage:100}],"V69 production traffic no longer 100%");
 assert.equal(s.controller.id,CONTROLLER_DEPLOY,"Other controller Worker was modified");
 assert.equal(s.routes.length,45,"Worker routes changed");
 assert.equal(sha(stable([...s.routes].sort((a,b)=>a.id.localeCompare(b.id)))),ROUTES_SHA,"Worker route hashes changed");
 assert.equal(s.settings.bindings.length,26,"Worker binding count drift");
 assert.deepEqual(sig(s.settings.bindings),sig(s.live.resources.bindings),"Live version and settings binding drift");
 const flags=Object.fromEntries(s.settings.bindings.filter(x=>x.type==="plain_text").map(x=>[x.name,x.text]));
 assert.equal(flags.CANONICAL_XP_TEST_ENABLED,"false");
 assert.equal(flags.CANONICAL_CREATOR_UPLOADS_ENABLED,"false");
 assert.equal(flags.ANEVUM_PRELAUNCH_MODE,"public");
 assert.equal(flags.CANONICAL_PUBLIC_SIGNUP_ENABLED,"true");
}
function inspect(root){
 const m=json(join(root,"manifest.json"));
 assert.equal(m.originalVersion,LIVE_VERSION);
 assert.equal(m.originalGatewaySha256,GATEWAY_SHA);
 assert.equal(m.releaseSource,source().releaseSha);
 assert.equal(sha(file(join(root,"worker-bundle/gateway.js"))),GATEWAY_SHA);
 assert.equal(sha(stable(walk(join(root,"compiled-web")))),m.inventorySha256);
 return m;
}
async function before(root){
 const m=inspect(root),s=await provider();precheck(s);
 const runtime=s.live.resources.script_runtime;
 assert.ok(runtime.compatibility_date&&runtime.compatibility_flags,"Missing approved runtime");
 const config={name:WORKER,account_id:ACCOUNT,main:resolve(root,"worker-bundle/gateway.js"),no_bundle:true,
  compatibility_date:runtime.compatibility_date,compatibility_flags:runtime.compatibility_flags,
  workers_dev:false,preview_urls:false,routes:[],upload_source_maps:false,
  assets:{directory:resolve(root,"compiled-web"),binding:"ASSETS",run_worker_first:true,not_found_handling:"single-page-application"},
  vars:Object.fromEntries(s.settings.bindings.filter(x=>x.type==="plain_text").map(x=>[x.name,x.text])),
  d1_databases:s.settings.bindings.filter(x=>x.type==="d1").map(x=>({binding:x.name,database_id:x.database_id}))};
 save(join(root,"upload.json"),config);
 save(join(root,"provider-before.json"),{deploymentId:s.deployment.id,versionIds:s.versions.map(x=>x.id),
  bindingsSha256:sha(stable(sig(s.settings.bindings))),runtime,controllerId:s.controller.id,
  routesHash:ROUTES_SHA,variant:m.variant});
 return {ready:true,variant:m.variant,liveVersion:LIVE_VERSION,livePercentage:100,newAssets:ART.length+1};
}
async function after(root){
 const m=inspect(root),prior=json(join(root,"provider-before.json")),s=await provider();precheck(s);
 assert.equal(s.deployment.id,prior.deploymentId,"Production changed during inactive upload");
 const added=s.versions.filter(x=>!prior.versionIds.includes(x.id));
 assert.equal(added.length,1,"Exactly one new inactive version expected");
 const v=await apiGet(ROOT+"/versions/"+added[0].id);
 const expectedMessage="ANEVUM V141 "+m.variant+" "+m.releaseSource+"; V69 gateway unchanged; INACTIVE";
 assert.equal(v.annotations?.["workers/message"],expectedMessage,"Wrong source or version annotations");
 assert.deepEqual(sig(v.resources.bindings),sig(s.live.resources.bindings),"New upload lost original secret/DB bindings");
 assert.deepEqual(v.resources.script_runtime,s.live.resources.script_runtime,"Worker runtime drift");
 assert.equal(sha(stable(sig(s.settings.bindings))),prior.bindingsSha256,"Bindings changed during upload");
 const receipt={verified:true,source:m.releaseSource,variant:m.variant,version:v.id,versionNumber:v.number,
  originalLiveVersion:LIVE_VERSION,originalDeployment:LIVE_DEPLOY,unchangedBindings:26,unchangedRoutes:45,
  preservedGatewaySha256:GATEWAY_SHA,assetCount:m.assetCount,trafficChanged:false};
 save(join(root,"inactive-receipt.json"),receipt);return receipt;
}
const [command,...args]=process.argv.slice(2);
if(command==="source")console.log(JSON.stringify(source()));
else if(command==="package")console.log(JSON.stringify(packageArt(...args)));
else if(command==="before")console.log(JSON.stringify(await before(args[0])));
else if(command==="after")console.log(JSON.stringify(await after(args[0])));
else throw Error("Valid commands: source, package, before, after");
