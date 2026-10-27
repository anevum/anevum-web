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
