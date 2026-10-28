/**
 * ANEVUM V140: immutable public-frontend-only release.
 * CI packages a retained V67 Worker with reviewed V140 frontend assets.
 * Provider operations: read-only preflight and read-only postflight; Wrangler
 * independently uploads versions INACTIVE. Traffic is never switched here.
 */
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,readdirSync,mkdirSync,cpSync,lstatSync,existsSync} from "node:fs";
import {join,resolve,dirname} from "node:path";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
const APPROVED="fb1f903333187caa3bd7665e93c013f28b9f3366";
const LIVE_SOURCE="2ef20ff31b6f116189918f4a7edc5aa93e3f4fea";
const WORKER="anevum-apex-prelaunch-gateway";
const ACCOUNT="2f7ee83107240152097efd956a4e8335";
const ZONE="8abe27259b5436af5966d3b40d9a3760";
const LIVE_DEPLOY="2c6b4ebf-cfc6-4ddf-aa58-e61a1c8eb6a7";
const LIVE_VERSION="a195834f-a0ec-4a0b-be78-1c6e905961f7";
const GATEWAY_SHA="1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99";
const ROUTES_SHA="fa8abbaca3813f9172bbb1677c7a71068f4ab6c093b4f4835e67d7c70db5e67b";
const CONTROLLER_DEPLOY="4c832ec7-ce67-4864-832c-9b0b470af92d";
const ROOT="/accounts/"+ACCOUNT+"/workers/scripts/"+WORKER;
const RELEASE_FILES=new Set([
  ".github/workflows/v140-cinematic-release.yml",
  "creator-v1/test/v140-production-compat-browser.mjs",
  "creator-v1/ops/v140-cinematic-release.mjs",
  "docs/production/ANEVUM.WEB.RELEASE.2026-10-27.001.V140-SEVERANCE.md"
]);
const METADATA_ONLY=new Set([
 "assets/parity-v136/manifest.json",
 "assets/cinematic/manifest.json",
 "assets/community-portals/manifest.json",
 "assets/cinematic-v2/atmosphere/manifest.json"
]);
// Exact currently published V67 public URL contracts. The reviewed V140
// build's differently generated copies must not overwrite cached V67 bytes.
const RETAINED_PUBLIC_URLS=new Set([
 "assets/default-thumbnails/automation.svg",
 "assets/default-thumbnails/creative.svg",
 "assets/default-thumbnails/games.svg",
 "assets/default-thumbnails/learning.svg",
 "assets/default-thumbnails/libraries.svg",
 "assets/default-thumbnails/other.svg",
 "assets/default-thumbnails/research.svg",
 "assets/default-thumbnails/simulation.svg",
 "assets/default-thumbnails/story.svg",
 "assets/default-thumbnails/tools.svg",
 "favicon.svg",
 "site.webmanifest"
]);
const git=(...args)=>execFileSync("git",args,{encoding:"utf8"}).trim();
const hash=value=>createHash("sha256").update(value).digest("hex");
const load=path=>JSON.parse(readFileSync(path,"utf8"));
const save=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+"\n")};
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
function walk(root,part=""){
 const directory=join(root,part);
 return readdirSync(directory,{withFileTypes:true}).flatMap(e=>{
  const name=part?part+"/"+e.name:e.name,full=join(root,name);
  assert.ok(!lstatSync(full).isSymbolicLink(),"Symlink forbidden: "+name);
  return e.isDirectory()?walk(root,name):[{path:name,sha256:hash(readFileSync(full)),bytes:lstatSync(full).size}];
 }).sort((a,b)=>a.path.localeCompare(b.path));
}
function source(){
 assert.equal(git("rev-parse","--abbrev-ref","HEAD"),"release/v140-severance-20261027-001","Wrong release branch");
 assert.equal(git("cat-file","-t",APPROVED),"commit");
 git("merge-base","--is-ancestor",APPROVED,"HEAD");
 const changed=git("diff","--name-only",APPROVED,"HEAD").split("\n").filter(Boolean);
 assert.deepEqual(changed.filter(path=>!RELEASE_FILES.has(path)),[],"Unreviewed source changes after V140 QA");
 assert.equal(git("diff","--name-only"),"","Tracked source must be unchanged by build");
 assert.equal(git("log","-1","--format=%s"),"release(v140): upload verified candidate","Only explicitly triggered release commits can upload");
 for(const key of ["VITE_PARITY_V136_FULL","VITE_PARITY_V136_CINEMATIC","VITE_IREN_SPATIAL_GUIDE","VITE_NATIVE_CREATOR_STUDIO_V095","VITE_PACKAGE_CREATOR_GALLERY_V010","VITE_MEMBER_COLLECTION_NAV_REVIEW"])
  assert.equal(process.env[key],"true","Production feature-flag parity missing: "+key);
 for(const key of ["VITE_PARITY_V136_HORIZON_QA","VITE_PARITY_V136_SHARED_SCENE_QA","VITE_PARITY_V136_NATIVE_VIDEO","VITE_ANEVUM_OWNER_REVIEW"])
  assert.notEqual(process.env[key],"true","Review-only flag forbidden: "+key);
 return {approved:APPROVED,release:git("rev-parse","HEAD"),changed};
}
function packaging(oldRoot,newRoot,out){
 const id=source();
 const old=load(join(oldRoot,"manifest.json"));
 assert.equal(old.source?.head,LIVE_SOURCE,"Incorrect retained V67 source");
 assert.equal(old.gatewaySha256,GATEWAY_SHA);
 assert.equal(hash(readFileSync(join(oldRoot,"worker-bundle/gateway.js"))),GATEWAY_SHA);
 const oldFiles=walk(join(oldRoot,"compiled-web"));
 const oldInventory=load(join(oldRoot,"assets.json"));
 assert.deepEqual(oldFiles.map(({path,sha256})=>({path,sha256})),oldInventory.map(({path,sha256})=>({path,sha256})));
 assert.equal(oldFiles.length,563,"Retained V67 static-file count changed");
 assert.equal(oldFiles.filter(x=>x.path.startsWith("evolution/assets/")).length,152);
 const fresh=walk(newRoot);
 assert.ok(fresh.length>250,"Compiled V140 site missing");
 const required=[
  "assets/severance/hero-motion-v139-1080p.mp4",
  "assets/severance/hero-motion-v139-720p.mp4",
  "assets/severance/hero-poster-v139.webp"
 ];
 for(const name of required)assert.ok(fresh.some(x=>x.path===name&&x.bytes>50000),"Reviewed V140 media missing: "+name);
 assert.equal(fresh.filter(x=>/^assets\/severance\/frames-(desktop|mobile)\/frame-\d{4}\.webp$/.test(x.path)).length,96,"96 scroll frames required");
 assert.ok(!fresh.some(x=>x.path.startsWith("portfolio/")||x.path.endsWith(".map")),"Retired media or sourcemaps included");
 const oldPaths=new Map(oldFiles.map(f=>[f.path,f.sha256]));
 const collisions=fresh.filter(f=>f.path!=="index.html"&&oldPaths.has(f.path)&&oldPaths.get(f.path)!==f.sha256);
 const reviewedRetained=collisions.filter(f=>!METADATA_ONLY.has(f.path)).map(f=>f.path).sort();
 assert.deepEqual(reviewedRetained,[...RETAINED_PUBLIC_URLS].sort(),
  "Only twelve approved V67 public URL collisions may be retained");
 for(const file of reviewedRetained){
  const bytes=readFileSync(join(oldRoot,"compiled-web",file));
  assert.ok(bytes.length>40,"Published V67 public URL empty "+file);
  assert.equal(hash(bytes),oldPaths.get(file),"Published V67 cached asset hash changed");
 }
 const jsText=fresh.filter(f=>/\.(js|css|html)$/.test(f.path)).map(f=>readFileSync(join(newRoot,f.path),"utf8")).join("\n");
 for(const file of collisions.filter(f=>METADATA_ONLY.has(f.path)))
  assert.ok(!jsText.includes(file.path)&&!jsText.includes(file.path.replace(/^assets\//,"")),
   "Retired metadata unexpectedly referenced in client bundle: "+file.path);
 for(const variant of ["baseline","candidate"]){
  const outRoot=join(out,variant),dest=join(outRoot,"compiled-web");
  assert.ok(!existsSync(dest),"Stale package destination refused");
  mkdirSync(outRoot,{recursive:true});
  cpSync(join(oldRoot,"compiled-web"),dest,{recursive:true});
  for(const f of fresh){
   if(f.path==="index.html")continue;
   if(oldPaths.has(f.path))continue;
   const target=join(dest,f.path);mkdirSync(dirname(target),{recursive:true});cpSync(join(newRoot,f.path),target);
  }
  if(variant==="candidate")cpSync(join(newRoot,"index.html"),join(dest,"index.html"));
  cpSync(join(oldRoot,"worker-bundle"),join(outRoot,"worker-bundle"),{recursive:true});
  const inventory=walk(dest);
  for(const oldFile of oldFiles.filter(f=>f.path!=="index.html"))
   assert.equal(inventory.find(f=>f.path===oldFile.path)?.sha256,oldFile.sha256,"Lost V67 cached asset "+oldFile.path);
  assert.equal(hash(readFileSync(join(outRoot,"worker-bundle/gateway.js"))),GATEWAY_SHA);
  save(join(outRoot,"assets.json"),inventory);
  save(join(outRoot,"manifest.json"),{session:"ANEVUM.WEB.RELEASE.2026-10-27.001.V140-SEVERANCE",approvedSource:APPROVED,releaseSource:id.release,worker:WORKER,
   variant,liveSource:LIVE_SOURCE,liveVersion:LIVE_VERSION,liveDeployment:LIVE_DEPLOY,gatewaySha256:GATEWAY_SHA,
   assetsSha256:hash(stable(inventory)),assetCount:inventory.length,retainedV67Assets:oldFiles.length-1,oldCachedClientBytesPreserved:true,retainedPublicUrlContracts:[...RETAINED_PUBLIC_URLS].sort(),earnedMediaCount:152,
   frontendSha256:hash(readFileSync(join(dest,"index.html"))),uploadsInactiveOnly:true,trafficChanged:false});
 }
 const a=walk(join(out,"baseline","compiled-web")),b=walk(join(out,"candidate","compiled-web"));
 assert.deepEqual(a.filter(x=>x.path!=="index.html"),b.filter(x=>x.path!=="index.html"),"Baseline/candidate assets must match");
 assert.equal(hash(readFileSync(join(oldRoot,"compiled-web/index.html"))),hash(readFileSync(join(out,"baseline","compiled-web/index.html"))),"Baseline HTML changed");
 assert.notEqual(hash(readFileSync(join(out,"baseline","compiled-web/index.html"))),hash(readFileSync(join(out,"candidate","compiled-web/index.html"))),"New entrypoint not built");
 const result={source:APPROVED,releaseSource:id.release,variantFiles:a.length,sharedAssetCount:a.length-1,oldAssetsRetained:oldFiles.length-1,
  newMediaFiles:fresh.filter(x=>x.path.startsWith("assets/severance/")).length,retainedOriginalStableUrls:[...RETAINED_PUBLIC_URLS].sort(),sharedAssetDigest:hash(stable(a.filter(x=>x.path!=="index.html"))),
  originalGatewaySha256:GATEWAY_SHA,rollbacks:[LIVE_VERSION],verified:true,publicTrafficChanged:false};
 save(join(out,"packaging-receipt.json"),result);return result;
}
async function get(path){
 assert.ok(process.env.CLOUDFLARE_API_TOKEN?.length>15,"Provider token missing");
 const response=await fetch("https://api.cloudflare.com/client/v4"+path,{headers:{Authorization:"Bearer "+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(30000),redirect:"error"});
 const j=await response.json();assert.ok(response.ok&&j.success,"Provider GET "+response.status+" "+path);return j.result;
}
const signatures=bindings=>bindings.map(x=>({name:x.name,type:x.type,...(x.type==="plain_text"?{text:x.text}:{}),...(x.type==="d1"?{database_id:x.database_id}:{})})).sort((a,b)=>a.name.localeCompare(b.name));
async function snapshot(){
 const [deploy,settings,live,controller,routes,versions]=await Promise.all([
  get(ROOT+"/deployments"),get(ROOT+"/settings"),get(ROOT+"/versions/"+LIVE_VERSION),
  get("/accounts/"+ACCOUNT+"/workers/scripts/anevum-package-alpha-v003-control/deployments"),
  get("/zones/"+ZONE+"/workers/routes"),get(ROOT+"/versions?per_page=100")]);
 return {deploy:deploy.deployments[0],settings,live,controller:controller.deployments[0],routes,versions:versions.items};
}
function verifyProvider(s){
 assert.equal(s.deploy.id,LIVE_DEPLOY,"Production deployment moved: do not upload/promote");
 assert.deepEqual(s.deploy.versions,[{version_id:LIVE_VERSION,percentage:100}],"Traffic no longer pinned V67");
 assert.equal(s.controller.id,CONTROLLER_DEPLOY,"Other owner Worker changed");
 assert.equal(s.routes.length,45,"Worker routes changed");
 assert.equal(hash(stable([...s.routes].sort((a,b)=>a.id.localeCompare(b.id)))),ROUTES_SHA,"Worker routes digest changed");
 assert.equal(s.settings.bindings.length,26,"Worker bindings changed");
 assert.deepEqual(signatures(s.settings.bindings),signatures(s.live.resources.bindings),"V67 bindings no longer identical");
 const vars=Object.fromEntries(s.settings.bindings.filter(x=>x.type==="plain_text").map(x=>[x.name,x.text]));
 assert.equal(vars.CANONICAL_XP_TEST_ENABLED,"false");
 assert.equal(vars.CANONICAL_CREATOR_UPLOADS_ENABLED,"false");
 assert.equal(vars.ANEVUM_PRELAUNCH_MODE,"public");
 assert.equal(vars.CANONICAL_PUBLIC_SIGNUP_ENABLED,"true");
}
function inspect(root){
 const m=load(join(root,"manifest.json"));assert.equal(m.approvedSource,APPROVED);
 assert.equal(m.releaseSource,source().release);
 assert.equal(m.gatewaySha256,GATEWAY_SHA);
 assert.equal(hash(readFileSync(join(root,"worker-bundle/gateway.js"))),GATEWAY_SHA);
 assert.equal(hash(stable(walk(join(root,"compiled-web")))),m.assetsSha256);
 return m;
}
async function before(root){
 const m=inspect(root),s=await snapshot();verifyProvider(s);
 const runtime=s.live.resources.script_runtime;
 assert.ok(runtime.compatibility_date,"No live compatibility date");
 const config={name:WORKER,account_id:ACCOUNT,main:resolve(root,"worker-bundle/gateway.js"),no_bundle:true,
  compatibility_date:runtime.compatibility_date,compatibility_flags:runtime.compatibility_flags,
  workers_dev:false,preview_urls:false,routes:[],upload_source_maps:false,
  assets:{directory:resolve(root,"compiled-web"),binding:"ASSETS",run_worker_first:true,not_found_handling:"single-page-application"},
  vars:Object.fromEntries(s.settings.bindings.filter(x=>x.type==="plain_text").map(x=>[x.name,x.text])),
  d1_databases:s.settings.bindings.filter(x=>x.type==="d1").map(x=>({binding:x.name,database_id:x.database_id}))};
 save(join(root,"upload.json"),config);
 save(join(root,"provider-before.json"),{deploymentId:s.deploy.id,versionIds:s.versions.map(x=>x.id),
  bindingSignatureHash:hash(stable(signatures(s.settings.bindings))),runtime:runtime,controllerId:s.controller.id,
  routesHash:ROUTES_SHA,variant:m.variant});
 return {ready:true,variant:m.variant,liveVersion:LIVE_VERSION,bindCount:26,assetCount:m.assetCount,trafficChanged:false};
}
async function after(root){
 const m=inspect(root),prior=load(join(root,"provider-before.json")),s=await snapshot();verifyProvider(s);
 const added=s.versions.filter(x=>!prior.versionIds.includes(x.id));
 assert.equal(added.length,1,"Expected exactly one new inactive Worker version");
 const v=await get(ROOT+"/versions/"+added[0].id);
 const message="ANEVUM V140 "+m.variant+" "+APPROVED+"; V67 gateway unchanged; INACTIVE";
 assert.equal(v.annotations?.["workers/message"],message);
 assert.deepEqual(signatures(v.resources.bindings),signatures(s.live.resources.bindings),"New version binding drift");
 assert.deepEqual(v.resources.script_runtime,s.live.resources.script_runtime,"New version runtime drift");
 assert.equal(hash(stable(signatures(s.settings.bindings))),prior.bindingSignatureHash);
 assert.equal(s.deploy.id,prior.deploymentId,"Production changed during inactive upload");
 const receipt={verified:true,source:APPROVED,releaseSource:m.releaseSource,variant:m.variant,version:v.id,
  number:v.number,liveVersion:LIVE_VERSION,liveDeployment:LIVE_DEPLOY,assetCount:m.assetCount,
  gatewaySha256:GATEWAY_SHA,unchangedBindings:26,unchangedRoutes:45,trafficChanged:false};
 save(join(root,"inactive-receipt.json"),receipt);return receipt;
}
const [cmd,...args]=process.argv.slice(2);
if(cmd==="source")console.log(JSON.stringify(source()));
else if(cmd==="package")console.log(JSON.stringify(packaging(...args)));
else if(cmd==="before")console.log(JSON.stringify(await before(args[0])));
else if(cmd==="after")console.log(JSON.stringify(await after(args[0])));
else throw Error("Known commands: source, package, before, after");
