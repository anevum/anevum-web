/**
 * ANEVUM V138 / review-only static UI artifact receipt.
 * Never deploy or read from Cloudflare here. The live Worker and its bindings
 * are maintained by a separate, explicitly authorized release process.
 */
import assert from "node:assert/strict";
import {existsSync,mkdirSync,readFileSync,readdirSync,statSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {join,relative,dirname} from "node:path";
const root="creator-v1/dist/web";
const manifestPath="evidence/stage-focused-v137/static-inventory.json";
assert.ok(existsSync(join(root,"index.html")),"Expected compiled V138 index missing");
assert.ok(!existsSync(join(root,"portfolio")),"Retired personal portfolio cannot ship in V138 bundle");
assert.ok(!existsSync(join(root,"assets/cinematic-v136/arrival/review-001")),
 "Unaccepted V136 owner-review media cannot ship in public bundle");
const cinematicDir="assets/severance";
const mediaManifestFile=join(root,cinematicDir,"manifest-v139.json");
assert.ok(existsSync(mediaManifestFile),"Missing first-party cinematic media SHA256 manifest");
const mediaManifest=JSON.parse(readFileSync(mediaManifestFile,"utf8"));
assert.equal(mediaManifest.contract,"ANEVUM-V139-FIRST-PARTY-MEDIA-REVIEW");
assert.equal(mediaManifest.approvedSourceSha256,"71c1bb6ca774841386857a1e8b344420d7c95fa5e1e96a6fb23dc656df005ba5");
assert.equal(mediaManifest.runtimeThirdPartyRequests,false);
assert.equal(mediaManifest.gameplayFootage,false);
for(const media of mediaManifest.media){
 assert.ok(media.path.startsWith(cinematicDir+"/"),"Media must be local");
 const sourceFile=join(root,media.path);
 assert.ok(existsSync(sourceFile),"Missing generated media: "+media.path);
 const bytes=readFileSync(sourceFile);
 assert.equal(bytes.byteLength,media.bytes,"Generated media size mismatch");
 assert.equal(createHash("sha256").update(bytes).digest("hex"),media.sha256,
  "Generated media digest mismatch: "+media.path);
 assert.ok(media.bytes<=6_000_000,"Unexpectedly large unoptimized background media");
}
assert.equal(mediaManifest.scrollFrameCountPerDevice,48,
 "Scroll sequence must have exactly 48 pre-rendered frames per device");
assert.equal(mediaManifest.frames.length,96,
 "Scroll sequence must have the mobile and desktop 48-frame ladders");
const variantCounts={desktop:0,mobile:0};
for(const frame of mediaManifest.frames){
 assert.ok(frame.path.startsWith(cinematicDir+"/frames-"),
  "No external or arbitrary scroll frame path may be bundled");
 const variant=frame.path.includes("/frames-desktop/")?"desktop":
  frame.path.includes("/frames-mobile/")?"mobile":null;
 assert.ok(variant,"Unknown scroll frame variant: "+frame.path);
 variantCounts[variant]++;
 const source=join(root,frame.path);
 assert.ok(existsSync(source),"Scroll frame absent from compiled bundle: "+frame.path);
 const bytes=readFileSync(source);
 assert.equal(bytes.byteLength,frame.bytes,"Scroll frame size mismatch: "+frame.path);
 assert.equal(createHash("sha256").update(bytes).digest("hex"),frame.sha256,
  "Scroll frame digest mismatch: "+frame.path);
 assert.ok(frame.bytes<=500_000,"Oversized per-frame WebP: "+frame.path);
}
assert.deepEqual(variantCounts,{desktop:48,mobile:48});
assert.deepEqual(mediaManifest.media.map(item=>item.path).sort(),[
 cinematicDir+"/hero-motion-v139-1080p.mp4",
 cinematicDir+"/hero-motion-v139-720p.mp4",
 cinematicDir+"/hero-poster-v139.webp"
].sort());
assert.ok(Array.isArray(mediaManifest.scrollFrameSequences)&&
 mediaManifest.scrollFrameSequences.length===2,"Expected mobile and desktop scroll media");
for(const seq of mediaManifest.scrollFrameSequences){
 assert.ok(["mobile","desktop"].includes(seq.device),"Unknown scroll-media tier");
 assert.equal(seq.fps,6,"Reviewed scroll sequence must have 6 frames per second");
 assert.equal(seq.count,48,"Incomplete cinematic scroll media");
 assert.equal(seq.files.length,48,"Unmatched frame file count");
 assert.ok(seq.directory===cinematicDir+"/frames-"+seq.device);
 let total=0;
 for(const item of seq.files){
  assert.ok(item.path.startsWith(seq.directory+"/frame-"),"Unexpected scroll frame");
  const file=join(root,item.path);assert.ok(existsSync(file),"Missing scroll frame: "+item.path);
  const bytes=readFileSync(file);total+=bytes.length;
  assert.equal(item.bytes,bytes.length,"Frame-byte inventory mismatch");
  assert.equal(item.sha256,createHash("sha256").update(bytes).digest("hex"),
   "Frame SHA256 does not match pinned media manifest");
  assert.ok(bytes.length<300_000,"A scroll frame is too large for mobile cache");
 }
 assert.equal(seq.totalBytes,total,"Scroll inventory total mismatch");
 assert.ok(total<4_500_000,"Unoptimized scroll animation sequence");
}
const entries=[];
function walk(directory){
 for(const name of readdirSync(directory).sort()){
  const file=join(directory,name);
  const stats=statSync(file);
  if(stats.isDirectory()){walk(file);continue;}
  assert.ok(stats.isFile(),"Unexpected non-file in public bundle: "+file);
  const path=relative(root,file).split("\\").join("/");
  assert.ok(!/(^|\/)(\.env(?:\.|$)|\.git(?:\/|$)|.*\.(?:pem|key|map)$)/i.test(path),
   "Sensitive or debug artifact in public bundle: "+path);
  const data=readFileSync(file);
  entries.push({path,bytes:data.byteLength,sha256:createHash("sha256").update(data).digest("hex")});
 }
}
walk(root);
assert.ok(entries.length>10&&entries.length<5000,"Unexpected frontend asset count");
assert.ok(entries.some(e=>e.path==="index.html"),"HTML entry missing from inventory");
assert.ok(entries.some(e=>e.path.endsWith(".js")),"Compiled JS missing");
assert.ok(entries.some(e=>e.path.endsWith(".css")),"Compiled CSS missing");
const manifest={
 contract:"ANEVUM-V138-PUBLIC-UI-REVIEW-ONLY",
 productionReleased:false,containsWorkerSource:false,containsPrivateBindings:false,
 sourceSha:process.env.ANEVUM_SOURCE_SHA||null,
 entryCount:entries.length,totalBytes:entries.reduce((n,e)=>n+e.bytes,0),
 entries
};
mkdirSync(dirname(manifestPath),{recursive:true});
writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+"\n");
console.log("V138 static asset inventory: "+entries.length+" files / "+manifest.totalBytes+" bytes / review-only");
