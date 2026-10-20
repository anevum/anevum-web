import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { deflateRawSync, deflateSync } from "node:zlib";
import { DatabaseSync } from "node:sqlite";
import { Script } from "node:vm";
import { SCRIPT, CSS } from "../site/alpha/v003/ui.mjs";
import api from "../site/alpha/v003/api.mjs";
import runtime from "../site/alpha/v003/runtime.mjs";
import { inspectZip, extractEntry, crc32, PackageError } from "../site/alpha/v003/archive.mjs";
import { prepareCover, COVER_PATH } from "../site/alpha/v003/cover.mjs";
import { mintPreview, verifyPreview } from "../site/alpha/v003/tokens.mjs";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function makeZip(files,opts={}) {
  const locals=[],centrals=[];let offset=0;
  for(const [name,content] of Object.entries(files)){
    const data=Buffer.from(content),nameBytes=Buffer.from(name),method=opts.method??8;
    const packed=method===8?deflateRawSync(data):data,crc=crc32(data);
    const local=Buffer.alloc(30),central=Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(method,8);
    local.writeUInt32LE(crc,14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(nameBytes.length,26);
    const localBytes=Buffer.concat([local,nameBytes,packed]);
    locals.push(localBytes);
    central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(((opts.symlink===name?3:0)<<8)|20,4);
    central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(method,10);
    central.writeUInt32LE(crc,16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(data.length,24);
    central.writeUInt16LE(nameBytes.length,28);central.writeUInt32LE(opts.symlink===name?((0xa1ff<<16)>>>0):0,38);
    central.writeUInt32LE(offset,42);centrals.push(Buffer.concat([central,nameBytes]));offset+=localBytes.length;
  }
  const dir=Buffer.concat(centrals),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(centrals.length,8);end.writeUInt16LE(centrals.length,10);
  end.writeUInt32LE(dir.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,dir,end]);
}
const sample=()=>makeZip({
  "index.html":'<!doctype html><html><head><link rel="stylesheet" href="./style.css"></head><body><h1>NEBULA</h1><script type="module" src="./game.js"></script></body></html>',
  "game.js":'document.querySelector("h1").textContent="READY";',
  "style.css":"body{background:#111;color:white}",
  "assets/sfx.wav":Buffer.from("RIFF0000WAVE", "utf-8")
});
function mockD1(){
  const sqlite=new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(resolve(ROOT,"site/alpha/v003/schema.sql"),"utf8"));
  const db={
    prepare(sql){
      const statement=(args=[])=>({
        bind(...values){return statement(values);},
        first:async()=>sqlite.prepare(sql).get(...args)||null,
        all:async()=>({results:sqlite.prepare(sql).all(...args)}),
        run:async()=>{const r=sqlite.prepare(sql).run(...args);return {meta:{changes:r.changes}}}
      });
      return statement();
    },
    async batch(statements) {
      sqlite.exec("BEGIN IMMEDIATE");
      try{const res=[];for(const s of statements)res.push(await s.run());sqlite.exec("COMMIT");return res;}
      catch(e){sqlite.exec("ROLLBACK");throw e;}
    },
    close(){sqlite.close()}
  };
  return db;
}
function mockR2(){
  const data=new Map();
  return {
    data,
    async put(key,bytes,opts={}) {
      data.set(key,{data:new Uint8Array(bytes),size:bytes.byteLength,customMetadata:opts.customMetadata||{}});
    },
    async head(key){
      const x=data.get(key);
      return x?{size:x.size,customMetadata:x.customMetadata}:null;
    },
    async get(key,options={}){
      const x=data.get(key);
      const slice=options.range?x.data.slice(options.range.offset,options.range.offset+options.range.length):x?.data;
      return x?{size:x.size,customMetadata:x.customMetadata,body:new Blob([slice]).stream()}:null;
    },
    async delete(keys){
      for(const k of Array.isArray(keys)?keys:[keys]) data.delete(k);
    }
  };
}
function setup(){
  const env={DB:mockD1(),MEDIA:mockR2(),RUNTIME_HOST:"run-tests.example",PACKAGE_PREVIEW_KEY:"a".repeat(48),PACKAGE_PUBLIC_PUBLISH_ENABLED:"true",
    PILOT_IDS:"owner-id",STAFF_IDS:"staff-id",
    AUTH:{async fetch(req){
      const v=req.headers.get("cookie")||"";
      const id=v.includes("session=owner")?"owner-id":v.includes("session=staff")?"staff-id":null;
      return Response.json(id?{user:{id,emailVerified:true},session:{id:"valid"}}:{user:null,session:null});
    }}};
  return env;
}
function req(method,path,body=null,identity="owner"){
  const h={"origin":"https://anevum.com","x-anevum-package":"v003",cookie:"session="+identity};
  const init={method,headers:h};
  if(body instanceof FormData)init.body=body;
  else if(body!==null){init.headers["content-type"]="application/json";init.body=JSON.stringify(body);}
  return new Request("https://anevum.com"+path,init);
}
function uploadForm(zip,title="Cosmic Racer",projectId="",fileName="cosmic-racer.zip"){
  const f=new FormData();
  f.set("title",title);
  f.set("summary","A real playable prototype with several web assets.");
  f.set("category","game");
  f.set("rights_ack","yes");
  if(projectId)f.set("project_id",projectId);
  f.set("file",new File([zip],fileName,{type:fileName.endsWith(".zip")?"application/zip":"text/html"}));
  return f;
}
async function post(env,path,payload,id="owner"){
  return api.fetch(req("POST",path,payload,id),env);
}
async function getPage(env,path,id="owner"){
  return api.fetch(req("GET",path,null,id),env);
}
function iframeSrc(html){
  const m=html.match(/<iframe[^>]*src="([^"]+)"/);
  assert.ok(m,"Play page includes a runnable iframe");
  return m[1].replaceAll("&amp;","&");
}

test("strict ZIP parser extracts a real multi-file compressed build",async()=>{
  const zip=sample();
  const info=inspectZip(zip);
  assert.equal(info.entries.length,4);
  assert.equal(info.entrypoint,"index.html");
  const script=info.entries.find(e=>e.path==="game.js");
  assert.match(new TextDecoder().decode(await extractEntry(zip,script)),/textContent/);
  assert.equal(info.entries.find(e=>e.path==="assets/sfx.wav").mime,"audio/wav");
});
test("ZIP preflight rejects traversal, disallowed extensions, corrupt CRC and symlinks",async()=>{
  assert.throws(()=>inspectZip(makeZip({"../evil.js":"alert(1)","index.html":"<html/>"})),PackageError);
  assert.throws(()=>inspectZip(makeZip({"index.html":"<html/>","password.env":"SECRET"})),PackageError);
  assert.throws(()=>inspectZip(makeZip({"index.html":"<html/>","assets/backdoor.js":"1"},{symlink:"assets/backdoor.js"})),PackageError);
  const zip=makeZip({"index.html":"<html>safe</html>"},{method:0});
  const info=inspectZip(zip),broken=Buffer.from(zip);
  broken[info.entries[0].dataAt+2]^=0xff;
  await assert.rejects(()=>extractEntry(broken,info.entries[0]),PackageError);
  assert.throws(()=>inspectZip(makeZip({"dist/index.html":"<html/>"})),/index.html/);
});
test("preview tokens are hashed in D1, expire, and cannot be reused across releases",async()=>{
  const env=setup();
  try{
    const created=await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json();
    const release=created.release_id,other="22222222-2222-4222-8222-222222222222";
    const minted=await mintPreview(env.DB,release,"owner-id",2000000000);
    assert.match(minted,/^[0-9a-f]{64}$/);
    assert.equal(await verifyPreview(env.DB,release,minted,2000000001),true);
    assert.equal(await verifyPreview(env.DB,other,minted,2000000001),false);
    assert.equal(await verifyPreview(env.DB,release,minted,2000001000),false);
    const modified=minted.slice(0,-1)+(minted.endsWith("0")?"1":"0");
    assert.equal(await verifyPreview(env.DB,release,modified,2000000001),false);
    const stored=await env.DB.prepare("SELECT token_hash FROM anevum_package_preview_tokens WHERE release_id=?").bind(release).first();
    assert.notEqual(stored.token_hash,minted,"No bearer token plaintext in the database");
  }finally{env.DB.close();}
});
test("real multi-file workflow: private preview -> submit -> staff approve -> public play -> draft update",async()=>{
  const env=setup();
  try{
    const result=await post(env,"/api/v1/packages/upload",uploadForm(sample()));
    assert.equal(result.status,201);
    const created=await result.json();
    assert.match(created.id,uuid);assert.match(created.release_id,uuid);assert.equal(created.version,1);
    assert.ok(env.MEDIA.data.size>=5,"source + four extracted assets stored privately");
    const before=await getPage(env,"/api/v1/packages/projects");
    assert.deepEqual((await before.json()).projects,[]);
    const denied=await getPage(env,"/play/v3/"+created.id,"visitor");
    assert.doesNotMatch(await denied.text(),/<iframe/);
    const play=await getPage(env,"/play/v3/"+created.id+"?preview=1");
    const privateSrc=iframeSrc(await play.text());
    assert.match(privateSrc,/^https:\/\/run-tests\.example\/p\//);
    const privateResp=await runtime.fetch(new Request(privateSrc),env);
    assert.equal(privateResp.status,200);
    assert.match(privateResp.headers.get("content-security-policy"),/sandbox allow-scripts/);
    assert.match(privateResp.headers.get("content-security-policy"),/connect-src https:\/\/run-tests\.example/);
    const rel=privateSrc.slice(0,privateSrc.lastIndexOf("/")+1);
    const js=await runtime.fetch(new Request(rel+"game.js"),env);
    assert.equal(js.status,200);
    assert.match(await js.text(),/READY/);
    const ranged=await runtime.fetch(new Request(rel+"game.js",{headers:{range:"bytes=0-7"}}),env);
    assert.equal(ranged.status,206);
    assert.match(ranged.headers.get("content-range"),/^bytes 0-7\//);
    assert.equal((await ranged.text()).length,8);
    assert.equal((await runtime.fetch(new Request(rel+"game.js",{headers:{range:"bytes=99999-"}}),env)).status,416);
    assert.equal((await runtime.fetch(new Request(rel+"game.js?v=cachebuster"),env)).status,200);
    const publicBefore=await runtime.fetch(new Request("https://run-tests.example/r/"+created.release_id+"/index.html"),env);
    assert.equal(publicBefore.status,404);
    assert.equal((await post(env,"/api/v1/packages/projects/"+created.id+"/submit",{})).status,200);
    const q=await getPage(env,"/review/packages","staff");
    assert.match(await q.text(),/Cosmic Racer/);
    assert.equal((await post(env,"/api/v1/packages/projects/"+created.id+"/review",{action:"publish"},"staff")).status,200);
    const publicPlay=await getPage(env,"/play/v3/"+created.id,"visitor");
    const publicSrc=iframeSrc(await publicPlay.text());
    assert.match(publicSrc,/\/r\//);
    const publicAsset=await runtime.fetch(new Request(publicSrc),env);
    assert.equal(publicAsset.status,200);
    assert.match((await (await getPage(env,"/packages","visitor")).text()),/Cosmic Racer/);
    const badStaff=await post(env,"/api/v1/packages/projects/"+created.id+"/review",{action:"reject",reason:"invalid"},"visitor");
    assert.equal(badStaff.status,401);
    // A fresh version is private; the public URL stays on v1 until approved.
    const update=await post(env,"/api/v1/packages/upload",uploadForm(sample(),"Cosmic Racer II",created.id));
    assert.equal(update.status,201);
    const v2=await update.json();
    assert.equal(v2.version,2);
    const unchanged=iframeSrc(await (await getPage(env,"/play/v3/"+created.id,"visitor")).text());
    assert.equal(unchanged,publicSrc);
    assert.equal((await post(env,"/api/v1/packages/projects/"+created.id+"/submit",{})).status,200);
    const rejected=await post(env,"/api/v1/packages/projects/"+created.id+"/review",{action:"reject",reason:"Music license information required"},"staff");
    assert.equal(rejected.status,200);
    const stillLive=iframeSrc(await (await getPage(env,"/play/v3/"+created.id,"visitor")).text());
    assert.equal(stillLive,publicSrc);
    const v3response=await post(env,"/api/v1/packages/upload",uploadForm(sample(),"Cosmic Racer II",created.id));
    assert.equal(v3response.status,201);
    assert.equal((await v3response.json()).version,3);
  }finally{env.DB.close();}
});
test("ZIP path attack is rejected before R2 or project metadata is written",async()=>{
  const env=setup();
  try {
    const bad=makeZip({"index.html":"<!doctype html><html></html>","../../bypass.js":"danger"});
    const result=await post(env,"/api/v1/packages/upload",uploadForm(bad));
    assert.equal(result.status,422);
    assert.match((await result.json()).error,/Unsafe file path/);
    assert.equal(env.MEDIA.data.size,0);
    assert.equal((await (await getPage(env,"/api/v1/packages/projects")).json()).projects.length,0);
  } finally{env.DB.close();}
});
test("runtime refuses wrong host, unsigned private build and invalid methods",async()=>{
  const env=setup();
  try {
    const u=await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json();
    const unsigned="https://run-tests.example/r/"+u.release_id+"/index.html";
    assert.equal((await runtime.fetch(new Request(unsigned),env)).status,404);
    assert.equal((await runtime.fetch(new Request(unsigned.replace("run-tests.example","anevum.com")),env)).status,404);
    assert.equal((await runtime.fetch(new Request(unsigned,{method:"POST"}),env)).status,404);
  }finally{env.DB.close();}
});

test("rejecting a first release allows owner to submit a revised ZIP",async()=>{
  const env=setup();
  try{
    const created=(await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json());
    assert.equal((await post(env,"/api/v1/packages/projects/"+created.id+"/submit",{})).status,200);
    const denial=await post(env,"/api/v1/packages/projects/"+created.id+"/review",{
      action:"reject",reason:"Please replace third-party artwork before publication"
    },"staff");
    assert.equal(denial.status,200);
    const playerPage=await getPage(env,"/play/v3/"+created.id+"?preview=1");
    assert.doesNotMatch(await playerPage.text(),/<iframe/);
    const uploadPage=await getPage(env,"/upload/v3?update="+created.id);
    assert.match(await uploadPage.text(),/Revise project/);
    const v2=await post(env,"/api/v1/packages/upload",uploadForm(sample(),"Cosmic Racer Updated",created.id));
    assert.equal(v2.status,201,await v2.clone().text());
    assert.equal((await v2.json()).version,2);
  }finally{env.DB.close();}
});
test("deleted private projects immediately revoke previously signed build previews",async()=>{
  const env=setup();
  try{
    const created=(await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json());
    const page=await getPage(env,"/play/v3/"+created.id+"?preview=1");
    const src=iframeSrc(await page.text());
    assert.equal((await runtime.fetch(new Request(src),env)).status,200);
    const result=await post(env,"/api/v1/packages/projects/"+created.id+"/delete",{});
    assert.equal(result.status,200);
    assert.equal((await runtime.fetch(new Request(src),env)).status,404);
    assert.equal(env.MEDIA.data.size,0);
  }finally{env.DB.close();}
});
test("runtime permits ordinary asset cache-busting queries but restricts arbitrary paths",async()=>{
  const env=setup();
  try{
    const created=(await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json());
    const src=iframeSrc(await (await getPage(env,"/play/v3/"+created.id+"?preview=1")).text());
    const dir=src.slice(0,src.lastIndexOf("/")+1);
    assert.equal((await runtime.fetch(new Request(dir+"game.js?v=12"),env)).status,200);
    assert.equal((await runtime.fetch(new Request(dir+"../../other-project/game.js"),env)).status,404);
  }finally{env.DB.close();}
});


test("simultaneous creator updates publish at most one new draft", async()=>{
  const env=setup();
  try{
    const created=await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json();
    assert.equal((await post(env,"/api/v1/packages/projects/"+created.id+"/submit",{})).status,200);
    assert.equal((await post(env,"/api/v1/packages/projects/"+created.id+"/review",{action:"publish"},"staff")).status,200);
    const [first,second]=await Promise.all([
      post(env,"/api/v1/packages/upload",uploadForm(sample(),"Cosmic Racer Update A",created.id)),
      post(env,"/api/v1/packages/upload",uploadForm(sample(),"Cosmic Racer Update B",created.id))
    ]);
    const statuses=[first.status,second.status].sort((a,b)=>a-b);
    assert.deepEqual(statuses,[201,409]);
    const releases=await env.DB.prepare("SELECT COUNT(*) AS n FROM anevum_package_releases WHERE project_id=?").bind(created.id).first();
    assert.equal(releases.n,2,"only one update release is retained");
    const p=await env.DB.prepare("SELECT draft_release_id,live_release_id FROM anevum_package_projects WHERE id=?").bind(created.id).first();
    assert.ok(p.draft_release_id);
    assert.notEqual(p.draft_release_id,p.live_release_id);
    const publicPage=await getPage(env,"/play/v3/"+created.id,"visitor");
    const src=iframeSrc(await publicPage.text());
    assert.match(src,new RegExp(p.live_release_id));
  }finally{env.DB.close();}
});


test("browser interface scripts parse and publishing UI has accurate functional controls",async()=>{
  assert.doesNotThrow(()=>new Script(SCRIPT));
  assert.match(CSS,/@media\(max-width:500px\)/);
  assert.match(CSS,/safe-area-inset-top/);
  const env=setup();
  try {
    const uploader=await (await getPage(env,"/upload/v3")).text();
    assert.match(uploader,/id="publish-form"/);
    assert.match(uploader,/accept="\.zip,\.html/);
    assert.match(uploader,/ZIP up to 20 MiB/);
    assert.match(uploader,/HTML up to 5 MiB/);
    assert.match(uploader,/name="rights_ack" value="yes" required/);
    assert.match(uploader,/href="\/studio"/);
    assert.match(uploader,/id="activity" role="status"/);
    const guest=await (await getPage(env,"/upload/v3","visitor")).text();
    assert.match(guest,/Sign in to upload/);
    assert.doesNotMatch(guest,/id="publish-form"/);
    const guide=await (await getPage(env,"/help/packages")).text();
    assert.match(guide,/index\.html/);
    assert.match(guide,/≤ 180 files/);
    assert.match(guide,/Node\/Python\/PHP backends/);
  } finally{env.DB.close();}
});
test("server refuses uploads without creator rights and persists a receipt per release",async()=>{
  const env=setup();
  try {
    const f=uploadForm(sample());f.delete("rights_ack");
    const denied=await post(env,"/api/v1/packages/upload",f);
    assert.equal(denied.status,422);
    assert.match((await denied.json()).error,/permission to publish/);
    assert.equal(env.MEDIA.data.size,0);
    const ok=await post(env,"/api/v1/packages/upload",uploadForm(sample()));
    assert.equal(ok.status,201);
    const release=(await ok.json()).release_id;
    const rights=await env.DB.prepare("SELECT owner_id,statement FROM anevum_package_rights_receipts WHERE release_id=?").bind(release).first();
    assert.equal(rights.owner_id,"owner-id");
    assert.equal(rights.statement,"creator_has_publication_rights_v1");
  } finally{env.DB.close();}
});
test("a creator with staff role cannot approve their own executable project",async()=>{
  const env=setup();env.STAFF_IDS="owner-id,staff-id";
  try {
    const project=(await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json());
    assert.equal((await post(env,"/api/v1/packages/projects/"+project.id+"/submit",{})).status,200);
    const denied=await post(env,"/api/v1/packages/projects/"+project.id+"/review",{action:"publish"},"owner");
    assert.equal(denied.status,403);
    assert.match((await denied.json()).error,/independent reviewer/);
    const independent=await post(env,"/api/v1/packages/projects/"+project.id+"/review",{action:"publish"},"staff");
    assert.equal(independent.status,200);
  } finally{env.DB.close();}
});
test("a missing isolated runtime blocks submission and public approval",async()=>{
  const env=setup();
  try {
    const project=(await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json());
    env.RUNTIME_HOST="";
    const page=await (await getPage(env,"/play/v3/"+project.id+"?preview=1")).text();
    assert.match(page,/Private playback is not configured/);
    assert.doesNotMatch(page,/<iframe/);
    const blocked=await post(env,"/api/v1/packages/projects/"+project.id+"/submit",{});
    assert.equal(blocked.status,503);
    env.RUNTIME_HOST="run-tests.example";
    assert.equal((await post(env,"/api/v1/packages/projects/"+project.id+"/submit",{})).status,200);
    env.RUNTIME_HOST="";
    const blockedReview=await post(env,"/api/v1/packages/projects/"+project.id+"/review",{action:"publish"},"staff");
    assert.equal(blockedReview.status,503);
    assert.deepEqual((await (await getPage(env,"/api/v1/packages/projects")).json()).projects,[]);
  } finally{env.DB.close();}
});
test("private player, reviewer decisions and public player share the accessible Continuance shell",async()=>{
  const env=setup();
  try {
    const project=(await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json());
    const privatePage=await (await getPage(env,"/play/v3/"+project.id+"?preview=1")).text();
    assert.match(privatePage,/id="game-viewport"/);
    assert.match(privatePage,/id="exit-immersive"/);
    assert.match(privatePage,/data-package-action="submit"/);
    assert.match(privatePage,/Private playtest/);
    assert.equal((await post(env,"/api/v1/packages/projects/"+project.id+"/submit",{})).status,200);
    const reviewer=await (await getPage(env,"/play/v3/"+project.id+"?preview=1","staff")).text();
    assert.match(reviewer,/id="review-dialog"/);
    assert.match(reviewer,/data-package-action="publish"/);
    assert.match(reviewer,/data-package-action="reject"/);
    assert.match(reviewer,/id="decision-confirm"/);
    assert.equal((await post(env,"/api/v1/packages/projects/"+project.id+"/review",{action:"publish"},"staff")).status,200);
    const publicPage=await (await getPage(env,"/play/v3/"+project.id,"visitor")).text();
    assert.match(publicPage,/data-package-action="share"/);
    assert.doesNotMatch(publicPage,/id="review-dialog"/);
    assert.match(publicPage,/ANEVUM/);
  } finally{env.DB.close();}
});
test("untrusted creator metadata is escaped in package catalogue and player",async()=>{
  const env=setup();
  try{
    const form=uploadForm(sample(),'<img src=x onerror=alert(1)>');
    assert.equal((await post(env,"/api/v1/packages/upload",form)).status,201);
    const mine=(await (await getPage(env,"/upload/v3")).text());
    assert.match(mine,/&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(mine,/<h3><img src=x/);
  } finally{env.DB.close();}
});


test("executable publication defaults OFF until an explicit guarded release flag is enabled",async()=>{
  const env=setup();delete env.PACKAGE_PUBLIC_PUBLISH_ENABLED;
  try {
    const p=(await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json());
    assert.equal((await post(env,"/api/v1/packages/projects/"+p.id+"/submit",{})).status,200);
    const disabled=await post(env,"/api/v1/packages/projects/"+p.id+"/review",{action:"publish"},"staff");
    assert.equal(disabled.status,503);
    assert.match((await disabled.json()).error,/security and release gates/);
    assert.deepEqual((await (await getPage(env,"/api/v1/packages/projects")).json()).projects,[]);
    env.PACKAGE_PUBLIC_PUBLISH_ENABLED="true";
    assert.equal((await post(env,"/api/v1/packages/projects/"+p.id+"/review",{action:"publish"},"staff")).status,200);
  } finally {env.DB.close();}
});
test("a missing player shows no submission or approval actions",async()=>{
  const env=setup();env.RUNTIME_HOST="";
  try {
    const p=(await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json());
    const html=await (await getPage(env,"/play/v3/"+p.id+"?preview=1")).text();
    assert.match(html,/Private playback is not configured/);
    assert.doesNotMatch(html,/data-package-action="submit"/);
  } finally {env.DB.close();}
});


function pngChunk(type,data){
  const name=Buffer.from(type,"ascii"),bytes=Buffer.from(data),chunk=Buffer.alloc(12+bytes.length);
  chunk.writeUInt32BE(bytes.length,0);name.copy(chunk,4);bytes.copy(chunk,8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name,bytes])),8+bytes.length);
  return chunk;
}
function makeCover(width=960,height=540){
  const head=Buffer.alloc(13);head.writeUInt32BE(width,0);head.writeUInt32BE(height,4);
  head[8]=8;head[9]=6;
  const rows=Buffer.alloc(height*(width*4+1));
  for(let y=0;y<height;y++){
    const off=y*(width*4+1);rows[off]=0;
    for(let x=0;x<width;x++){
      const p=off+1+x*4;
      rows[p]=24;rows[p+1]=(x%160)+63;rows[p+2]=132;rows[p+3]=255;
    }
  }
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk("IHDR",head),
    pngChunk("IDAT",deflateSync(rows,{level:6})),
    pngChunk("IEND",Buffer.alloc(0))
  ]);
}
function uploadWithCover(img,projectId=""){
  const form=uploadForm(sample(),"Real Artwork Project",projectId);
  form.set("cover",new File([img],"cover.png",{type:"image/png"}));
  return form;
}
test("PNG cover validation checks dimensions, chunk checksums and image structure",async()=>{
  const good=makeCover(),ok=await prepareCover(new File([good],"my-cover.png",{type:"image/png"}));
  assert.equal(ok.width,960);assert.equal(ok.height,540);
  assert.equal(ok.path,COVER_PATH);
  assert.equal(ok.mime,"image/png");
  assert.equal(ok.bytes.length,good.length);
  const broken=Buffer.from(good);broken[45]^=0x88; // Mutate IDAT payload, not the PNG chunk length.
  await assert.rejects(prepareCover(new File([broken],"corrupt.png",{type:"image/png"})),/checksum/i);
  await assert.rejects(prepareCover(new File([makeCover(300,300)],"small.png",{type:"image/png"})),/640/);
  await assert.rejects(prepareCover(new File([good],"cover.svg",{type:"image/svg+xml"})),/PNG/);
});
test("private cover is owner and staff only, and approved cover is public with secure MIME",async()=>{
  const env=setup();
  try{
    const png=makeCover();
    const response=await post(env,"/api/v1/packages/upload",uploadWithCover(png));
    assert.equal(response.status,201,await response.clone().text());
    const project=await response.json(),url="/api/v1/packages/covers/"+project.release_id;
    const rows=await env.DB.prepare(
      "SELECT path,mime,bytes FROM anevum_package_files WHERE release_id=? AND path=?"
    ).bind(project.release_id,COVER_PATH).first();
    assert.equal(rows.path,COVER_PATH);assert.equal(rows.mime,"image/png");
    assert.equal(rows.bytes,png.length);
    const privateOwner=await getPage(env,url,"owner");
    assert.equal(privateOwner.status,200);
    assert.equal(privateOwner.headers.get("content-type"),"image/png");
    assert.equal(privateOwner.headers.get("x-content-type-options"),"nosniff");
    assert.match(privateOwner.headers.get("content-security-policy"),/default-src 'none'/);
    assert.equal(Buffer.compare(Buffer.from(await privateOwner.arrayBuffer()),png),0);
    assert.equal((await getPage(env,url,"visitor")).status,404);
    assert.equal((await getPage(env,url,"intruder")).status,404);
    assert.equal((await getPage(env,url,"staff")).status,200);
    const draft=await (await getPage(env,"/upload/v3")).text();
    assert.match(draft,new RegExp("/api/v1/packages/covers/"+project.release_id));
    assert.equal((await post(env,"/api/v1/packages/projects/"+project.id+"/submit",{})).status,200);
    const queue=await (await getPage(env,"/staff/packages","staff")).text();
    assert.match(queue,new RegExp("/api/v1/packages/covers/"+project.release_id));
    assert.equal((await post(env,"/api/v1/packages/projects/"+project.id+"/review",{action:"publish"},"staff")).status,200);
    assert.equal((await getPage(env,url,"visitor")).status,200);
    const catalog=await (await getPage(env,"/packages","visitor")).text();
    assert.match(catalog,/av-project-cover/);
    assert.match(catalog,new RegExp("/api/v1/packages/covers/"+project.release_id));
    const publicAPI=await (await getPage(env,"/api/v1/packages/projects","visitor")).json();
    assert.equal(publicAPI.projects[0].cover_url,url);
    const publicPlayer=await (await getPage(env,"/play/v3/"+project.id,"visitor")).text();
    assert.match(publicPlayer,/av-release-art/);
    const suspend=await post(env,"/api/v1/packages/projects/"+project.id+"/moderate",
      {action:"suspend",reason:"Temporary safety and rights investigation"},"staff");
    assert.equal(suspend.status,200);
    assert.equal((await getPage(env,url,"visitor")).status,404,"suspension must revoke public artwork immediately");
    assert.equal((await post(env,"/api/v1/packages/projects/"+project.id+"/moderate",
      {action:"restore"},"staff")).status,200);
    assert.equal((await getPage(env,url,"visitor")).status,200);
  } finally{env.DB.close();}
});
test("revision cover remains private until approval, and previous cover is not attached to new release",async()=>{
  const env=setup();
  try {
    const initial=await (await post(env,"/api/v1/packages/upload",uploadWithCover(makeCover()))).json();
    assert.equal((await post(env,"/api/v1/packages/projects/"+initial.id+"/submit",{})).status,200);
    assert.equal((await post(env,"/api/v1/packages/projects/"+initial.id+"/review",
      {action:"publish"},"staff")).status,200);
    const firstCover="/api/v1/packages/covers/"+initial.release_id;
    const update=await (await post(env,"/api/v1/packages/upload",uploadForm(sample(),"Revision without cover",initial.id))).json();
    assert.equal(update.version,2);
    const publicBefore=await (await getPage(env,"/api/v1/packages/projects","visitor")).json();
    assert.equal(publicBefore.projects[0].cover_url,firstCover);
    const ownDraft=await (await getPage(env,"/upload/v3")).text();
    assert.match(ownDraft,/Revision without cover|Real Artwork Project/);
    assert.equal((await post(env,"/api/v1/packages/projects/"+initial.id+"/submit",{})).status,200);
    assert.equal((await post(env,"/api/v1/packages/projects/"+initial.id+"/review",
      {action:"publish"},"staff")).status,200);
    const publicAfter=await (await getPage(env,"/api/v1/packages/projects","visitor")).json();
    assert.equal(publicAfter.projects[0].cover_url,null);
    assert.equal((await getPage(env,firstCover,"visitor")).status,404);
  }finally{env.DB.close();}
});
test("unsafe PNG cover or reserved ZIP metadata path fails without uploading assets",async()=>{
  const env=setup();
  try {
    const png=makeCover(),bad=Buffer.from(png);bad[39]^=8;
    const failed=await post(env,"/api/v1/packages/upload",uploadWithCover(bad));
    assert.equal(failed.status,422);
    assert.equal(env.MEDIA.data.size,0);
    const zip=makeZip({
      "index.html":"<!doctype html><html><body>Safe</body></html>",
      "_anevum/cover.png":Buffer.from("unreviewed", "utf8")
    });
    const reserved=await post(env,"/api/v1/packages/upload",uploadForm(zip));
    assert.equal(reserved.status,422);
    assert.match((await reserved.json()).error,/reserved/);
    assert.equal(env.MEDIA.data.size,0);
  }finally{env.DB.close();}
});


test("unsubmitted private cover build can be discarded without leaving playable assets",async()=>{
  const env=setup();
  try {
    const created=await (await post(env,"/api/v1/packages/upload",uploadWithCover(makeCover()))).json();
    const privatePage=await getPage(env,"/play/v3/"+created.id+"?preview=1");
    const signed=iframeSrc(await privatePage.text());
    const coverURL="/api/v1/packages/covers/"+created.release_id;
    assert.equal((await runtime.fetch(new Request(signed),env)).status,200);
    assert.equal((await getPage(env,coverURL,"owner")).status,200);
    const failed=await post(env,"/api/v1/packages/projects/"+created.id+"/discard",{},"staff");
    assert.equal(failed.status,404,"Unrelated reviewer cannot delete a creator's private work");
    const discarded=await post(env,"/api/v1/packages/projects/"+created.id+"/discard",{});
    assert.equal(discarded.status,200);
    const result=await discarded.json();
    assert.equal(result.discarded,true);
    assert.equal(result.cleanup_pending,false);
    assert.equal(result.live_release_preserved,false);
    assert.equal((await runtime.fetch(new Request(signed),env)).status,404);
    assert.equal((await getPage(env,coverURL,"owner")).status,404);
    assert.equal(env.MEDIA.data.size,0);
    assert.equal((await env.DB.prepare("SELECT COUNT(*) AS n FROM anevum_package_files WHERE release_id=?").bind(created.release_id).first()).n,0);
    assert.equal((await env.DB.prepare("SELECT COUNT(*) AS n FROM anevum_package_preview_tokens WHERE release_id=?").bind(created.release_id).first()).n,0);
    const audit=await env.DB.prepare("SELECT status,source_key FROM anevum_package_releases WHERE id=?").bind(created.release_id).first();
    assert.equal(audit.status,"revoked");
    assert.equal(audit.source_key,null);
    assert.doesNotMatch(await (await getPage(env,"/upload/v3")).text(),/Real Artwork Project/);
  }finally{env.DB.close();}
});
test("discarding a private update preserves approved v1 and allows another upload",async()=>{
  const env=setup();
  try {
    const v1=await (await post(env,"/api/v1/packages/upload",uploadWithCover(makeCover()))).json();
    assert.equal((await post(env,"/api/v1/packages/projects/"+v1.id+"/submit",{})).status,200);
    assert.equal((await post(env,"/api/v1/packages/projects/"+v1.id+"/review",{action:"publish"},"staff")).status,200);
    const publicBefore=iframeSrc(await (await getPage(env,"/play/v3/"+v1.id,"visitor")).text());
    const v2=await (await post(env,"/api/v1/packages/upload",uploadWithCover(makeCover(800,450),v1.id))).json();
    assert.equal((await post(env,"/api/v1/packages/projects/"+v1.id+"/discard",{})).status,200);
    assert.equal((await getPage(env,"/api/v1/packages/covers/"+v2.release_id,"owner")).status,404);
    const publicAfter=iframeSrc(await (await getPage(env,"/play/v3/"+v1.id,"visitor")).text());
    assert.equal(publicAfter,publicBefore,"Discard must not alter the live version");
    assert.equal((await getPage(env,"/api/v1/packages/covers/"+v1.release_id,"visitor")).status,200);
    const v3=await post(env,"/api/v1/packages/upload",uploadForm(sample(),"Fixed upload",v1.id));
    assert.equal(v3.status,201,await v3.clone().text());
    assert.equal((await v3.json()).version,3);
  }finally{env.DB.close();}
});
test("discard is denied during staff review and after a live-only publication",async()=>{
  const env=setup();
  try{
    const p=await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json();
    assert.equal((await post(env,"/api/v1/packages/projects/"+p.id+"/submit",{})).status,200);
    assert.equal((await post(env,"/api/v1/packages/projects/"+p.id+"/discard",{})).status,409);
    assert.equal((await post(env,"/api/v1/packages/projects/"+p.id+"/review",{action:"publish"},"staff")).status,200);
    assert.equal((await post(env,"/api/v1/packages/projects/"+p.id+"/discard",{})).status,409);
  }finally{env.DB.close();}
});
test("R2 cleanup failures preserve nonpublic revoked release metadata for later GC",async()=>{
  const env=setup(),original=env.MEDIA.delete.bind(env.MEDIA);
  try{
    const p=await (await post(env,"/api/v1/packages/upload",uploadWithCover(makeCover()))).json();
    const privatePage=await getPage(env,"/play/v3/"+p.id+"?preview=1");
    const signed=iframeSrc(await privatePage.text());
    env.MEDIA.delete=async()=>{throw Error("synthetic R2 outage");};
    const result=await post(env,"/api/v1/packages/projects/"+p.id+"/discard",{});
    assert.equal(result.status,200);
    assert.equal((await result.json()).cleanup_pending,true);
    assert.equal((await runtime.fetch(new Request(signed),env)).status,404);
    const audit=await env.DB.prepare("SELECT source_key,status FROM anevum_package_releases WHERE id=?").bind(p.release_id).first();
    assert.equal(audit.status,"revoked");
    assert.ok(audit.source_key,"Deferred cleanup retains its source reference");
    assert.ok((await env.DB.prepare("SELECT COUNT(*) AS n FROM anevum_package_files WHERE release_id=?").bind(p.release_id).first()).n>0);
  }finally{env.MEDIA.delete=original;env.DB.close();}
});


test("bounded staff GC retries failed discarded-build cleanup without touching public assets",async()=>{
  const env=setup(),prior=env.MEDIA.delete.bind(env.MEDIA);
  try{
    const live=await (await post(env,"/api/v1/packages/upload",uploadWithCover(makeCover()))).json();
    assert.equal((await post(env,"/api/v1/packages/projects/"+live.id+"/submit",{})).status,200);
    assert.equal((await post(env,"/api/v1/packages/projects/"+live.id+"/review",{action:"publish"},"staff")).status,200);
    const draft=await (await post(env,"/api/v1/packages/upload",uploadWithCover(makeCover(800,450),live.id))).json();
    env.MEDIA.delete=async()=>{throw Error("simulated R2 unavailable");};
    const discarded=await (await post(env,"/api/v1/packages/projects/"+live.id+"/discard",{})).json();
    assert.equal(discarded.cleanup_pending,true);
    env.MEDIA.delete=prior;
    const path="/api/v1/packages/maintenance/reclaim";
    assert.equal((await post(env,path,{confirm:"reclaim_revoked_v1"},"owner")).status,403);
    assert.equal((await post(env,path,{},"staff")).status,422);
    const processed=await post(env,path,{confirm:"reclaim_revoked_v1"},"staff");
    assert.equal(processed.status,200);
    assert.deepEqual(await processed.json(),{scanned:1,reclaimed:1,pending:0,limited_to:2});
    const old=await env.DB.prepare("SELECT status,source_key FROM anevum_package_releases WHERE id=?").bind(draft.release_id).first();
    assert.equal(old.status,"revoked");assert.equal(old.source_key,null);
    assert.equal((await env.DB.prepare("SELECT COUNT(*) AS n FROM anevum_package_files WHERE release_id=?").bind(draft.release_id).first()).n,0);
    assert.equal((await getPage(env,"/api/v1/packages/covers/"+live.release_id,"visitor")).status,200);
    assert.equal((await getPage(env,"/api/v1/packages/covers/"+draft.release_id,"owner")).status,404);
    assert.equal((await post(env,path,{confirm:"reclaim_revoked_v1"},"staff")).status,200);
    assert.equal((await (await getPage(env,"/api/v1/packages/projects","visitor")).json()).projects[0].id,live.id);
  }finally{env.MEDIA.delete=prior;env.DB.close();}
});


test("upload readiness health truthfully reflects intact isolated DB and media",async()=>{
  const env=setup();
  try{
    const ready=await getPage(env,"/api/v1/packages/health","visitor");
    assert.equal(ready.status,200);
    const body=await ready.json();
    assert.equal(body.schemaReady,true);
    assert.equal(body.stageContract,"uplink-v007-readiness");
    assert.equal(body.uploadReady,true);
    assert.equal(body.db,true);
    assert.equal(body.storage,true);
    assert.equal(body.runnerConfigured,true);
    assert.equal(body.publicPublishingEnabled,true);
    assert.equal(body.runtimeLiveVerified,false,"Presence of a configured hostname is not a live runtime acceptance test");
    const uploader=await (await getPage(env,"/upload/v3")).text();
    assert.match(uploader,/id="publish-form"/);
    assert.doesNotMatch(uploader,/New uploads are paused/);
  }finally{env.DB.close();}
});
test("missing rights table halts uploader before touching staging R2 or project metadata",async()=>{
  const env=setup();
  try{
    const actualPrepare=env.DB.prepare.bind(env.DB);
    env.DB.prepare=(sql)=>{
      const stmt=actualPrepare(sql);
      if(!sql.includes("sqlite_master"))return stmt;
      return {first:async()=>({n:5})};
    };
    const status=await (await getPage(env,"/api/v1/packages/health","visitor")).json();
    assert.equal(status.ok,true);
    assert.equal(status.schemaReady,false);
    assert.equal(status.uploadReady,false);
    const page=await (await getPage(env,"/upload/v3")).text();
    assert.match(page,/New uploads are paused/);
    assert.doesNotMatch(page,/id="publish-form"/);
    assert.match(page,/Your existing approved creations remain unchanged/);
    const before=env.MEDIA.data.size;
    const denied=await post(env,"/api/v1/packages/upload",uploadForm(sample()));
    assert.equal(denied.status,503);
    assert.match((await denied.json()).error,/schema is not ready/);
    assert.equal(env.MEDIA.data.size,before,"No archive or cover can be written while the schema is incomplete");
    const projects=await (await getPage(env,"/api/v1/packages/projects","visitor")).json();
    assert.deepEqual(projects.projects,[]);
  }finally{env.DB.close();}
});
test("missing R2 binding halts upload and communicates unavailable storage",async()=>{
  const env=setup(),media=env.MEDIA;
  try {
    delete env.MEDIA;
    const health=await (await getPage(env,"/api/v1/packages/health","visitor")).json();
    assert.equal(health.schemaReady,true);
    assert.equal(health.storage,false);
    assert.equal(health.uploadReady,false);
    assert.match(await (await getPage(env,"/upload/v3")).text(),/New uploads are paused/);
    const denied=await post(env,"/api/v1/packages/upload",uploadForm(sample()));
    assert.equal(denied.status,503);
    assert.match((await denied.json()).error,/storage is not configured/);
    assert.equal(media.data.size,0);
  }finally{env.MEDIA=media;env.DB.close();}
});


test("isolated runtime CSP permits only pinned staging parent and defaults to production-only",async()=>{
  const env=setup();
  try{
    const created=await (await post(env,"/api/v1/packages/upload",uploadForm(sample()))).json();
    const token=await mintPreview(env.DB,created.release_id,"owner-id");
    const originalHost=env.RUNTIME_HOST;
    const stageRuntime="anevum-package-alpha-v003-runtime.devonakins.workers.dev";
    const stageControl="anevum-package-alpha-v003-control.devonakins.workers.dev";
    env.RUNTIME_HOST=stageRuntime;
    const src="https://"+stageRuntime+"/p/"+created.release_id+"/"+token+"/index.html";
    const productionOnly=await runtime.fetch(new Request(src),env);
    assert.equal(productionOnly.status,200);
    assert.match(productionOnly.headers.get("content-security-policy"),/frame-ancestors https:\/\/anevum\.com$/);
    env.STAGING_CONTROL_HOST="evil-stage.example";
    const untrusted=await runtime.fetch(new Request(src),env);
    assert.equal(untrusted.status,200);
    assert.doesNotMatch(untrusted.headers.get("content-security-policy"),/evil-stage/);
    env.STAGING_CONTROL_HOST=stageControl;
    const accepted=await runtime.fetch(new Request(src),env);
    assert.equal(accepted.status,200);
    assert.match(accepted.headers.get("content-security-policy"),
      /frame-ancestors https:\/\/anevum\.com https:\/\/anevum-package-alpha-v003-control\.devonakins\.workers\.dev$/);
    env.RUNTIME_HOST=originalHost;
    const notStage=await runtime.fetch(new Request("https://"+originalHost+"/p/"+created.release_id+"/"+token+"/index.html"),env);
    assert.equal(notStage.status,200);
    assert.match(notStage.headers.get("content-security-policy"),/frame-ancestors https:\/\/anevum\.com$/);
  }finally{env.DB.close();}
});


test("isolated runtime exposes narrow host-locked readiness with no secrets or credentials",async()=>{
  const env=setup();
  try{
    const endpoint="https://run-tests.example/__anevum_runtime_health_v1";
    const ok=await runtime.fetch(new Request(endpoint),env);
    assert.equal(ok.status,200);
    const body=await ok.json();
    assert.deepEqual(body,{
      ok:true,runtime:"package-v003",stageContract:"uplink-v007-readiness",schemaReady:true,storage:true,
      independentOrigin:true,cookieless:true
    });
    assert.equal(ok.headers.get("cache-control"),"no-store");
    assert.equal(ok.headers.get("x-robots-tag"),"noindex, nofollow");
    assert.equal(ok.headers.get("referrer-policy"),"no-referrer");
    assert.equal((await runtime.fetch(new Request(endpoint.replace("run-tests.example","anevum.com")),env)).status,404);
    assert.equal((await runtime.fetch(new Request(endpoint,{method:"POST"}),env)).status,404);
    const media=env.MEDIA;
    delete env.MEDIA;
    const down=await runtime.fetch(new Request(endpoint),env);
    assert.equal(down.status,503);
    const partial=await down.json();
    assert.equal(partial.storage,false);
    assert.equal(partial.ok,false);
    env.MEDIA=media;
  }finally{env.DB.close();}
});
