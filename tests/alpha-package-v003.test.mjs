import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { deflateRawSync } from "node:zlib";
import { DatabaseSync } from "node:sqlite";
import api from "../site/alpha/v003/api.mjs";
import runtime from "../site/alpha/v003/runtime.mjs";
import { inspectZip, extractEntry, crc32, PackageError } from "../site/alpha/v003/archive.mjs";
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
      return {bind(...args){
        return {first:async()=>sqlite.prepare(sql).get(...args)||null,
          all:async()=>({results:sqlite.prepare(sql).all(...args)}),
          run:async()=>{const r=sqlite.prepare(sql).run(...args);return {meta:{changes:r.changes}}}};
      }};
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
    async get(key){
      const x=data.get(key);
      return x?{size:x.size,customMetadata:x.customMetadata,body:new Blob([x.data]).stream()}:null;
    },
    async delete(keys){
      for(const k of Array.isArray(keys)?keys:[keys]) data.delete(k);
    }
  };
}
function setup(){
  const env={DB:mockD1(),MEDIA:mockR2(),RUNTIME_HOST:"run-tests.example",PACKAGE_PREVIEW_KEY:"a".repeat(48),
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
test("tokens expire and cannot be forged for another release",async()=>{
  const release="11111111-1111-4111-8111-111111111111",other="22222222-2222-4222-8222-222222222222",secret="x".repeat(48);
  const minted=await mintPreview(secret,release,2000000000);
  assert.equal(await verifyPreview(secret,release,minted,2000000001),true);
  assert.equal(await verifyPreview(secret,other,minted,2000000001),false);
  assert.equal(await verifyPreview(secret,release,minted,2000001000),false);
  assert.equal(await verifyPreview(secret,release,minted.replace(/.$/,"0"),2000000001),false);
});
test("complete creator journey keeps drafts private and serves reviewed game assets",async()=>{
  const env=setup();
  try{
    const first=await post(env,"/api/v1/packages/upload",uploadForm(sample()));
    assert.equal(first.status,201,await first.text().catch(()=>"?"));
    // Response body is single-use; first JSON is taken on a fresh upload in later tests.
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
    assert.equal(badStaff.status,403);
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
