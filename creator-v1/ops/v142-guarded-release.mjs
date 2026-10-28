/**
 * V142: exact-source, frontend-only, asset-superset deployment.
 * Combines approved V141 original orbital art/share metadata with merged
 * V142 visual/link cleanup; keeps exact V69 gateway/auth/DB/Worker routes.
 * Package and upload are INACTIVE. Traffic changes require separate readback.
 */
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,cpSync,mkdirSync,existsSync,readdirSync,lstatSync} from "node:fs";
import {join,resolve,dirname} from "node:path";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
const BASE="732f170552ea1089ead4766c3d34fdcccdc336f7";
const REVIEWED="08b826cbb6a5c9b3a29971f7bf9cf18c012f0307";
const LIVE_VERSION="f30caf48-f56f-4209-be51-f029559d1cc0";
const LIVE_DEPLOY="1d965db3-68f0-431e-bc88-dbb7ef337101";
const LIVE_HTML_SHA="1cbc17726657086e7b86b8ee8a1ddee16a4067a9abdf6f49ebf40e8eb829fb44";
const GATEWAY_SHA="1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99";
const ROUTES_SHA="fa8abbaca3813f9172bbb1677c7a71068f4ab6c093b4f4835e67d7c70db5e67b";
const CONTROLLER_DEPLOY="4c832ec7-ce67-4864-832c-9b0b470af92d";
const ACCOUNT="2f7ee83107240152097efd956a4e8335";
const ZONE="8abe27259b5436af5966d3b40d9a3760";
const WORKER="anevum-apex-prelaunch-gateway";
const ROOT="/accounts/"+ACCOUNT+"/workers/scripts/"+WORKER;
const BRANCH="release/v142-sitewide-visual-links-20261028-001";
const RELEASE_FILES=new Set([
 ".github/workflows/v142-guarded-release.yml",
 "creator-v1/ops/v142-guarded-release.mjs",
 "docs/production/ANEVUM.WEB.RELEASE.2026-10-28.001.V142-BRAND-NAVIGATION.md"
]);
const RETAIN_PUBLIC_URLS=new Set([
 "assets/default-thumbnails/automation.svg","assets/default-thumbnails/creative.svg",
 "assets/default-thumbnails/games.svg","assets/default-thumbnails/learning.svg",
 "assets/default-thumbnails/libraries.svg","assets/default-thumbnails/other.svg",
 "assets/default-thumbnails/research.svg","assets/default-thumbnails/simulation.svg",
 "assets/default-thumbnails/story.svg","assets/default-thumbnails/tools.svg",
 "favicon.svg","site.webmanifest"
]);
const RETAIN_METADATA=new Set([
 "assets/parity-v136/manifest.json","assets/cinematic/manifest.json",
 "assets/community-portals/manifest.json","assets/cinematic-v2/atmosphere/manifest.json"
]);
const BRAND=[
 "anevum-severance-icon-v141-1024.png","anevum-severance-icon-v141-512.png",
 "anevum-severance-icon-v141-192.png","anevum-severance-apple-touch-v141-180.png",
 "anevum-severance-favicon-v141-64.png","anevum-severance-maskable-v141-512.png",
 "anevum-severance-share-v141-1200x630.png"
];
const sha=b=>createHash("sha256").update(b).digest("hex");
const git=(...args)=>execFileSync("git",args,{encoding:"utf8"}).trim();
const file=p=>readFileSync(p);
const json=p=>JSON.parse(file(p).toString("utf8"));
const save=(p,x)=>{mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(x,null,2)+"\n")};
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
function walk(root,part=""){
 return readdirSync(join(root,part),{withFileTypes:true}).flatMap(entry=>{
  const name=part?part+"/"+entry.name:entry.name,p=join(root,name);
  assert.ok(!lstatSync(p).isSymbolicLink(),"Symlink not permitted: "+name);
  return entry.isDirectory()?walk(root,name):[{path:name,sha256:sha(file(p)),bytes:lstatSync(p).size}];
 }).sort((a,b)=>a.path.localeCompare(b.path));
}
function source(){
 assert.equal(git("rev-parse","--abbrev-ref","HEAD"),BRANCH,"Release checkout drift");
 assert.equal(git("cat-file","-t",BASE),"commit");
 assert.equal(git("cat-file","-t",REVIEWED),"commit");
 git("merge-base","--is-ancestor",BASE,"HEAD");
 assert.equal(git("log","-1","--format=%s"),"release(v142): upload verified combined candidate","Release must be explicitly triggered");
 const changed=git("diff","--name-only",BASE,"HEAD").split("\n").filter(Boolean);
 assert.deepEqual(changed.filter(x=>!RELEASE_FILES.has(x)),[],"Unapproved application/backend source edit in release lane");
 assert.equal(git("diff","--name-only"),"","Tracked working files changed");
 for(const name of ["web/src/pages/SupporterPage.tsx","web/src/parity/continuance-design-system.css",
  "web/src/lib/portal-destinations.ts","web/src/components/MemberSpaceDashboard.tsx",
  "web/src/parity/ParityHeaderV136.tsx","web/src/parity/ParityDiscoverV136.tsx",
  "web/src/parity/ConsoleWayfinderV136.tsx"]){
   const path="creator-v1/"+name;
   assert.equal(git("rev-parse",REVIEWED+":"+path),git("rev-parse",BASE+":"+path),"Merged V142 UI does not match exact reviewed source "+path);
 }
 for(const name of ["VITE_PARITY_V136_FULL","VITE_PARITY_V136_CINEMATIC","VITE_IREN_SPATIAL_GUIDE",
  "VITE_NATIVE_CREATOR_STUDIO_V095","VITE_PACKAGE_CREATOR_GALLERY_V010","VITE_MEMBER_COLLECTION_NAV_REVIEW"])
   assert.equal(process.env[name],"true","Missing verified production UI feature flag "+name);
 for(const name of ["VITE_PARITY_V136_NATIVE_VIDEO","VITE_PARITY_V136_HORIZON_QA",
  "VITE_PARITY_V136_SHARED_SCENE_QA","VITE_ANEVUM_OWNER_REVIEW"])
   assert.notEqual(process.env[name],"true","Disallowed review-only UI feature flag "+name);
 return {approved:BASE,reviewed:REVIEWED,head:git("rev-parse","HEAD"),changed};
}
function packageSite(oldRoot,newRoot,out){
 const src=source(),old=json(join(oldRoot,"manifest.json"));
 assert.equal(old.variant,"baseline","Need exact V141 asset-compatible baseline (original V69 HTML)");
 assert.equal(old.originalVersion,LIVE_VERSION);
 assert.equal(old.originalHtmlSha256,LIVE_HTML_SHA);
 assert.equal(old.originalGatewaySha256,GATEWAY_SHA);
 assert.equal(old.oldAssetsPreserved,true);
 assert.equal(sha(file(join(oldRoot,"worker-bundle/gateway.js"))),GATEWAY_SHA);
 const original=walk(join(oldRoot,"compiled-web")),expected=json(join(oldRoot,"assets.json"));
 assert.deepEqual(original,expected,"Retained V141 asset artifact inventory mismatch");
 assert.ok(original.length>570,"Missing original V69 files + V141 brand assets");
 assert.equal(sha(file(join(oldRoot,"compiled-web/index.html"))),LIVE_HTML_SHA,"Old live entrypoint mutated");
 const names=new Map(original.map(f=>[f.path,f.sha256]));
 for(const name of BRAND){
  assert.ok(names.has(name),"Original V141 orbit-brand asset missing "+name);
  assert.ok(original.find(x=>x.path===name).bytes>1200);
 }
 assert.ok(names.has("anevum-severance-v141.webmanifest"),"V141 home-screen manifest missing");
 const compiled=walk(newRoot);
 assert.ok(compiled.length>250,"V142 compiled public output missing");
 const newPaths=new Map(compiled.map(x=>[x.path,x.sha256]));
 for(const media of ["assets/severance/hero-poster-v139.webp",
  "assets/severance/hero-motion-v139-720p.mp4","assets/severance/hero-motion-v139-1080p.mp4"]){
  assert.ok(newPaths.has(media),"Original cinematic asset missing "+media);
  assert.equal(newPaths.get(media),names.get(media),"Cinematic media byte drift "+media);
 }
 for(const name of BRAND)assert.equal(newPaths.get(name),names.get(name),"Original orbit asset changed "+name);
 const html=file(join(newRoot,"index.html")).toString("utf8");
 for(const word of ["anevum-severance-share-v141-1200x630.png",
  "anevum-severance-apple-touch-v141-180.png","anevum-severance-v141.webmanifest",
  "anevum-severance-favicon-v141-64.png"])assert.ok(html.includes(word),"New app entrypoint lost V141 branding "+word);
 assert.ok(!html.includes("anevum-social-share-v2.png?v=20261017b"),"Old share card present");
 assert.ok(!html.includes("portfolio."),"Retired portfolio must not be linked");
 assert.notEqual(sha(Buffer.from(html)),LIVE_HTML_SHA,"V142 app did not compile a new entrypoint");
 const collisions=compiled.filter(x=>x.path!=="index.html"&&names.has(x.path)&&names.get(x.path)!==x.sha256);
 assert.deepEqual(collisions.filter(x=>!RETAIN_PUBLIC_URLS.has(x.path)&&!RETAIN_METADATA.has(x.path)).map(x=>x.path),[],
  "Unreviewed overwrite of published cached URL");
 for(const entry of collisions)assert.equal(sha(file(join(oldRoot,"compiled-web",entry.path))),names.get(entry.path),"Archived cached URL mismatch");
 const blocked=compiled.filter(x=>x.path.startsWith("portfolio/")||x.path.endsWith(".map"));
 assert.deepEqual(blocked.map(x=>x.path),[],"Retired personal portfolio or sourcemap included");
 for(const variant of ["baseline","candidate"]){
  const dir=join(out,variant),dest=join(dir,"compiled-web");
  assert.ok(!existsSync(dir),"Refuse stale output directory "+dir);
  mkdirSync(dir,{recursive:true});
  cpSync(join(oldRoot,"worker-bundle"),join(dir,"worker-bundle"),{recursive:true});
  cpSync(join(oldRoot,"compiled-web"),dest,{recursive:true});
  for(const entry of compiled){
   if(entry.path==="index.html"||names.has(entry.path))continue;
   const destPath=join(dest,entry.path);mkdirSync(dirname(destPath),{recursive:true});
   cpSync(join(newRoot,entry.path),destPath);
  }
  if(variant==="candidate")writeFileSync(join(dest,"index.html"),html);
  const inventory=walk(dest);
  for(const entry of original.filter(x=>x.path!=="index.html"))
   assert.equal(inventory.find(x=>x.path===entry.path)?.sha256,entry.sha256,"Previously published V69/V141 asset mutated "+entry.path);
  assert.equal(sha(file(join(dir,"worker-bundle/gateway.js"))),GATEWAY_SHA,"Original gateway changed");
  const entryHtml=sha(file(join(dest,"index.html")));
  assert.equal(entryHtml,variant==="baseline"?LIVE_HTML_SHA:sha(Buffer.from(html)));
  const manifest={session:"ANEVUM.WEB.RELEASE.2026-10-28.001.V142-BRAND-NAVIGATION",
   variant,approvedSource:BASE,reviewedUI:REVIEWED,releaseSource:src.head,
   worker:WORKER,originalLiveVersion:LIVE_VERSION,originalLiveDeployment:LIVE_DEPLOY,
   gatewaySha256:GATEWAY_SHA,htmlSha256:entryHtml,
   inventorySha256:sha(stable(inventory)),assetCount:inventory.length,
   originalAssetsPreserved:true,unchangedGateway:true,
   originalV141Assets:BRAND,reviewedCollisions:collisions.map(x=>x.path),
   noBackendAuthOrDbChanges:true,zeroTrafficUpload:true};
  save(join(dir,"manifest.json"),manifest);
  save(join(dir,"assets.json"),inventory);
 }
 const b=walk(join(out,"baseline/compiled-web")),c=walk(join(out,"candidate/compiled-web"));
 assert.deepEqual(b.filter(x=>x.path!=="index.html"),c.filter(x=>x.path!=="index.html"),
  "V142 baseline/candidate must share every immutable cached asset");
 const receipt={source:BASE,reviewedUI:REVIEWED,releaseSource:src.head,
  originalVersion:LIVE_VERSION,originalDeployment:LIVE_DEPLOY,baselineHtmlSha256:LIVE_HTML_SHA,
  candidateHtmlSha256:sha(Buffer.from(html)),newAssetCount:c.length-original.length,
  sharedAssetCount:c.length-1,originalArtifactAssetCount:original.length,
  originalBrandAssetsRetained:BRAND.length,retainedCollisions:collisions.map(x=>x.path),
  sharedAssetsDigest:sha(stable(b.filter(x=>x.path!=="index.html"))),originalGatewaySha256:GATEWAY_SHA,
  trafficChanged:false};
 save(join(out,"package-receipt.json"),receipt);return receipt;
}
async function apiGet(path){
 assert.ok(process.env.CLOUDFLARE_API_TOKEN?.length>16,"Missing scoped Cloudflare token");
 const response=await fetch("https://api.cloudflare.com/client/v4"+path,{
  headers:{Authorization:"Bearer "+process.env.CLOUDFLARE_API_TOKEN},
  signal:AbortSignal.timeout(30000),redirect:"error"});
 const json=await response.json();assert.ok(response.ok&&json.success,"Cloudflare readback failed "+response.status+" "+path);
 return json.result;
}
const sig=items=>(items||[]).map(x=>({name:x.name,type:x.type,
 ...(x.type==="plain_text"?{text:x.text}:{}),
 ...(x.type==="d1"?{database_id:x.database_id}:{})})).sort((a,b)=>a.name.localeCompare(b.name));
async function provider(){
 const [d,settings,live,controller,routes,versions]=await Promise.all([
  apiGet(ROOT+"/deployments"),apiGet(ROOT+"/settings"),apiGet(ROOT+"/versions/"+LIVE_VERSION),
  apiGet("/accounts/"+ACCOUNT+"/workers/scripts/anevum-package-alpha-v003-control/deployments"),
  apiGet("/zones/"+ZONE+"/workers/routes"),apiGet(ROOT+"/versions?per_page=100")
 ]);
 return {deployment:d.deployments[0],settings,live,controller:controller.deployments[0],routes,versions:versions.items};
}
function verifyProvider(s){
 assert.equal(s.deployment.id,LIVE_DEPLOY,"Live Worker changed: stop");
 assert.deepEqual(s.deployment.versions,[{version_id:LIVE_VERSION,percentage:100}],"Live V69 traffic changed");
 assert.equal(s.controller.id,CONTROLLER_DEPLOY,"Controller Worker drift");
 assert.equal(s.routes.length,45,"Routes count drift");
 assert.equal(sha(stable([...s.routes].sort((a,b)=>a.id.localeCompare(b.id)))),ROUTES_SHA,"Route SHA drift");
 assert.equal(s.settings.bindings.length,26,"Bindings count drift");
 assert.deepEqual(sig(s.settings.bindings),sig(s.live.resources.bindings),"Bindings drift");
 const flags=Object.fromEntries(s.settings.bindings.filter(x=>x.type==="plain_text").map(x=>[x.name,x.text]));
 assert.equal(flags.CANONICAL_XP_TEST_ENABLED,"false");
 assert.equal(flags.CANONICAL_CREATOR_UPLOADS_ENABLED,"false");
 assert.equal(flags.ANEVUM_PRELAUNCH_MODE,"public");
 assert.equal(flags.CANONICAL_PUBLIC_SIGNUP_ENABLED,"true");
}
function inspect(root){
 const m=json(join(root,"manifest.json")),src=source();
 assert.equal(m.releaseSource,src.head,"Unreviewed release source");
 assert.equal(m.gatewaySha256,GATEWAY_SHA);
 assert.equal(sha(file(join(root,"worker-bundle/gateway.js"))),GATEWAY_SHA);
 assert.equal(sha(stable(walk(join(root,"compiled-web")))),m.inventorySha256,"Package asset bytes drift");
 assert.equal(sha(file(join(root,"compiled-web/index.html"))),m.htmlSha256);
 return m;
}
async function before(root){
 const m=inspect(root),s=await provider();verifyProvider(s);
 const runtime=s.live.resources.script_runtime;
 assert.ok(runtime.compatibility_date&&runtime.compatibility_flags,"Live runtime missing");
 const config={name:WORKER,account_id:ACCOUNT,
  main:resolve(root,"worker-bundle/gateway.js"),no_bundle:true,
  compatibility_date:runtime.compatibility_date,compatibility_flags:runtime.compatibility_flags,
  workers_dev:false,preview_urls:false,routes:[],upload_source_maps:false,
  assets:{directory:resolve(root,"compiled-web"),binding:"ASSETS",run_worker_first:true,not_found_handling:"single-page-application"},
  vars:Object.fromEntries(s.settings.bindings.filter(x=>x.type==="plain_text").map(x=>[x.name,x.text])),
  d1_databases:s.settings.bindings.filter(x=>x.type==="d1").map(x=>({binding:x.name,database_id:x.database_id}))};
 save(join(root,"upload.json"),config);
 save(join(root,"provider-before.json"),{originalDeployment:s.deployment.id,
  versionIds:s.versions.map(x=>x.id),routesSha256:ROUTES_SHA,
  bindingsSha256:sha(stable(sig(s.settings.bindings))),runtime,controllerId:s.controller.id,variant:m.variant});
 return {ready:true,variant:m.variant,source:m.releaseSource,assets:m.assetCount,trafficChanged:false};
}
async function after(root){
 const m=inspect(root),prior=json(join(root,"provider-before.json")),s=await provider();verifyProvider(s);
 assert.equal(s.deployment.id,prior.originalDeployment,"Production changed during inactive upload");
 const added=s.versions.filter(x=>!prior.versionIds.includes(x.id));
 assert.equal(added.length,1,"Exactly one new inactive Worker version must be uploaded");
 const v=await apiGet(ROOT+"/versions/"+added[0].id);
 const message="ANEVUM V142 "+m.variant+" "+m.releaseSource+"; V69 gateway unchanged; INACTIVE";
 assert.equal(v.annotations?.["workers/message"],message,"Unreviewed Worker annotation");
 assert.deepEqual(sig(v.resources.bindings),sig(s.live.resources.bindings),"Binding drift on uploaded version");
 assert.deepEqual(v.resources.script_runtime,s.live.resources.script_runtime,"Runtime drift on uploaded version");
 assert.equal(sha(stable(sig(s.settings.bindings))),prior.bindingsSha256,"Live bindings changed");
 const receipt={pass:true,source:m.releaseSource,variant:m.variant,workerVersion:v.id,
  versionNumber:v.number,assetCount:m.assetCount,
  originalLiveVersion:LIVE_VERSION,originalDeployment:LIVE_DEPLOY,
  originalGatewaySha256:GATEWAY_SHA,preservedBindings:26,preservedRoutes:45,publicTrafficChanged:false};
 save(join(root,"inactive-receipt.json"),receipt);return receipt;
}
const [command,...args]=process.argv.slice(2);
if(command==="source")console.log(JSON.stringify(source()));
else if(command==="package")console.log(JSON.stringify(packageSite(...args)));
else if(command==="before")console.log(JSON.stringify(await before(args[0])));
else if(command==="after")console.log(JSON.stringify(await after(args[0])));
else throw Error("Commands: source, package, before, after");
