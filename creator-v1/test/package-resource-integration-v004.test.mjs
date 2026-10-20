import {test} from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {fileURLToPath} from "node:url";
import {join as pathJoin} from "node:path";
import {createHash} from "node:crypto";
import worker from "../package-alpha-v004/api.mjs";
import {cleanupPackageResources} from "../package-alpha-v004/resource-cleanup.mjs";

const MiB=1048576;
const bridge=fileURLToPath(new URL("../package-alpha-v004/tests/sqlite-bridge.py",import.meta.url));
function setup(){
 const dir=mkdtempSync(pathJoin(tmpdir(),"anevum-pack004-")),file=pathJoin(dir,"scratch.sqlite");
 function callBridge(mode,commands=[]){
  const p=spawnSync("python3",[bridge,file,mode],{
    input:JSON.stringify({commands}),encoding:"utf8",maxBuffer:4*MiB});
  if(p.status!==0)throw new Error("SQLite "+mode+": "+(p.stdout||p.stderr).slice(0,1800));
  const data=JSON.parse(p.stdout);
  if(data.error)throw new Error(data.error);
  return data.results;
 }
 callBridge("init");
 function prepare(sql){
  let values=[];
  return {
   bind(...args){values=args;return this;},
   async first(){return callBridge("execute",[{sql,params:values}])[0].first||null;},
   async all(){return {results:callBridge("execute",[{sql,params:values}])[0].results||[]};},
   async run(){const r=callBridge("execute",[{sql,params:values}])[0];return {meta:r.meta};},
   sql,values(){return values;}
  };
 }
 const DB={prepare,async batch(statements){
  return callBridge("batch",statements.map(x=>({sql:x.sql,params:x.values()})));
 }};
 const objects=new Map();
 const MEDIA={
  failNext:false,
  async put(key,data,opts={}){
   if(this.failNext){this.failNext=false;throw new Error("simulated R2 write failure");}
   objects.set(key,{bytes:Uint8Array.from(data),customMetadata:opts.customMetadata||{}});
  },
  async head(key){
   const x=objects.get(key);return x?{size:x.bytes.length,customMetadata:x.customMetadata}:null;
  },
  async list({prefix,limit=100}){
   return {objects:[...objects.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(key=>({key}))};
  },
  async delete(keys){
   for(const k of Array.isArray(keys)?keys:[keys])objects.delete(k);
  }
 };
 const AUTH={async fetch(req){
  const id=/member=(alice|bob)/.exec(req.headers.get("cookie")||"")?.[1];
  if(!id)return new Response("Not signed in",{status:401});
  return Response.json({user:{id,emailVerified:true},session:{id:"active"}});
 }};
 const env={DB,MEDIA,AUTH,PILOT_IDS:"alice,bob",STAFF_IDS:"bob",
  RUNTIME_HOST:"runner.independent-example.org",PACKAGE_UPLOADS_ENABLED:"true",PACKAGE_PREVIEW_KEY:"test-only-not-production"};
 const pending=[];
 async function request(path,who="alice",options={}){
  const method=options.method||"POST",headers={"cookie":"member="+who};
  if(method==="POST"){
   headers.origin="https://anevum.com";
   headers["x-anevum-package"]="v003";
   if(options.json!==undefined)headers["content-type"]="application/json";
  }
  const req=new Request("https://anevum.com"+path,{method,headers,
   body:method==="POST"?(options.form||JSON.stringify(options.json||{})):undefined});
  const ctx={waitUntil(p){pending.push(Promise.resolve(p));}};
  return worker.fetch(req,env,ctx);
 }
 const f=(html,title="A creator experiment",projectId="",replace=false)=>{
  const form=new FormData();
  form.set("file",new Blob([html],{type:"text/html"}),"game.html");
  form.set("title",title);form.set("summary","An isolated HTML5 app built for testing.");
  form.set("category","app");form.set("project_id",projectId);
  form.set("replace_draft",replace?"1":"0");
  return form;
 };
 const upload=(html,projectId="",replace=false)=>request("/api/v1/packages/upload","alice",{
  form:f(html,"A creator experiment",projectId,replace)});
 const get=(sql,...params)=>callBridge("execute",[{sql,params}])[0].results||[];
 return {dir,DB,MEDIA,objects,env,pending,request,upload,get,
  async close(){await Promise.allSettled(pending);rmSync(dir,{recursive:true,force:true});}};
}
const HTML=x=>"<!doctype html><html lang=\"en\"><head><title>Demo</title></head><body><main>Release "+x+"</main></body></html>";
async function result(r){const body=await r.text();let data;try{data=JSON.parse(body)}catch{data={raw:body}}return {...data,httpStatus:r.status};}

test("upload, duplicate no-op, atomic replace, saved draft and owner discard",async()=>{
 const s=setup();
 try{
  const initial=await result(await s.upload(HTML("one")));
  assert.equal(initial.httpStatus,201,JSON.stringify(initial));
  assert.equal(initial.version,1);
  assert.equal(initial.id.length,36);
  assert.equal(s.objects.size,2);
  const hash=createHash("sha256").update(HTML("one")).digest("hex");
  const pre=await result(await s.request("/api/v1/packages/preflight","alice",{
   json:{filename:"game.html",projectId:initial.id,sha256:hash,size:Buffer.byteLength(HTML("one"))}}));
  assert.equal(pre.httpStatus,200,JSON.stringify(pre));
  assert.equal(pre.duplicate,true);
  assert.equal(s.objects.size,2);
  const duplicate=await result(await s.upload(HTML("one"),initial.id,true));
  assert.equal(duplicate.httpStatus,200,JSON.stringify(duplicate));
  assert.equal(duplicate.duplicate,true);
  assert.equal(s.objects.size,2);
  const notOwner=await result(await s.request("/api/v1/packages/preflight","bob",{
   json:{filename:"game.html",projectId:initial.id,sha256:hash,size:Buffer.byteLength(HTML("one"))}}));
  assert.equal(notOwner.httpStatus,404);
  const replacement=await result(await s.upload(HTML("two"),initial.id,true));
  assert.equal(replacement.httpStatus,201,JSON.stringify(replacement));
  assert.equal(replacement.id,initial.id);
  assert.equal(replacement.version,2);
  assert.equal(s.get("SELECT status FROM anevum_package_releases WHERE id=?",initial.release_id)[0].status,"revoked");
  assert.equal(s.get("SELECT COUNT(*) count FROM anevum_package_cleanup_jobs")[0].count,1);
  const cleanup=await cleanupPackageResources(s.env,Math.floor(Date.now()/1000));
  assert.equal(cleanup.processed,1,JSON.stringify(cleanup));
  assert.equal(s.objects.size,2,"the old R2 source and extracted file must be removed");
  const saved=await result(await s.request("/api/v1/packages/projects/"+initial.id+"/save"));
  assert.equal(saved.httpStatus,200,JSON.stringify(saved));
  assert.equal(saved.saved,true);
  const muchLater=Math.floor(Date.now()/1000)+5*86400;
  const later=await cleanupPackageResources(s.env,muchLater);
  assert.equal(later.expired,0,JSON.stringify(later));
  assert.equal(s.objects.size,2,"saved draft must not automatically expire");
  s.MEDIA.failNext=true;
  const failed=await result(await s.upload(HTML("third"),initial.id,true));
  assert.equal(failed.httpStatus,503,JSON.stringify(failed));
  assert.equal(s.get("SELECT draft_release_id FROM anevum_package_projects WHERE id=?",initial.id)[0].draft_release_id,replacement.release_id);
  assert.equal(s.get("SELECT COUNT(*) count FROM anevum_package_upload_reservations")[0].count,1);
  await cleanupPackageResources(s.env,Math.floor(Date.now()/1000)+1800);
  assert.equal(s.get("SELECT COUNT(*) count FROM anevum_package_upload_reservations")[0].count,0);
  s.env.PACKAGE_UPLOADS_ENABLED="false";
  const paused=await result(await s.upload(HTML("paused"),initial.id,true));
  assert.equal(paused.httpStatus,403,"operators can halt new uploads safely");
  const ownerPage=await s.request("/upload/v3","alice",{method:"GET"});
  assert.equal(ownerPage.status,200);
  assert.ok((await ownerPage.text()).includes("A creator experiment"));
  const discard=await result(await s.request("/api/v1/packages/projects/"+initial.id+"/discard"));
  assert.equal(discard.httpStatus,200,JSON.stringify(discard));
  assert.equal(discard.discarded,true);
  await cleanupPackageResources(s.env,Math.floor(Date.now()/1000)+1800);
  assert.equal(s.get("SELECT draft_release_id,status FROM anevum_package_projects WHERE id=?",initial.id)[0].status,"draft");
  assert.equal(s.objects.size,0);
 }finally{await s.close();}
});

test("published releases survive failed edits, expired tests, R2 cleanup and new versions",async()=>{
 const s=setup();
 try{
  const v1=await result(await s.upload(HTML("published")));
  assert.equal(v1.httpStatus,201,JSON.stringify(v1));
  const submit=await result(await s.request("/api/v1/packages/projects/"+v1.id+"/submit"));
  assert.equal(submit.httpStatus,200,JSON.stringify(submit));
  const review=await result(await s.request("/api/v1/packages/projects/"+v1.id+"/review","bob",{
   json:{action:"publish"}}));
  assert.equal(review.httpStatus,200,JSON.stringify(review));
  const published=await result(await s.request("/api/v1/packages/projects","alice",{method:"GET"}));
  assert.equal(published.projects.length,1);
  assert.equal(published.projects[0].id,v1.id);
  assert.equal(s.objects.size,2);
  const v2=await result(await s.upload(HTML("temporary"),v1.id));
  assert.equal(v2.httpStatus,201,JSON.stringify(v2));
  assert.equal(s.objects.size,4);
  await s.DB.prepare("UPDATE anevum_package_build_retention SET expires_at=? WHERE release_id=?")
    .bind(Math.floor(Date.now()/1000)-1,v2.release_id).run();
  const currentSha=createHash("sha256").update(HTML("temporary")).digest("hex");
  const oldPre=await result(await s.request("/api/v1/packages/preflight","alice",{
    json:{projectId:v1.id,filename:"game.html",sha256:currentSha,size:Buffer.byteLength(HTML("temporary"))}}));
  assert.equal(oldPre.httpStatus,200);
  assert.equal(oldPre.duplicate,false,"expired private builds cannot be reused");
  const after48h=await cleanupPackageResources(s.env,Math.floor(Date.now()/1000)+3*86400);
  assert.equal(after48h.expired,1,JSON.stringify(after48h));
  assert.equal(after48h.processed,1,JSON.stringify(after48h));
  assert.equal(s.objects.size,2,"only temporary R2 objects may be erased");
  const project=s.get("SELECT status,live_release_id,draft_release_id FROM anevum_package_projects WHERE id=?",v1.id)[0];
  assert.equal(project.status,"published");
  assert.equal(project.live_release_id,v1.release_id);
  assert.equal(project.draft_release_id,null);
  const health=await result(await s.request("/api/v1/packages/health","alice",{method:"GET"}));
  assert.equal(health.version,"004");
  assert.equal(health.resourcePolicy,true);
  const usage=await result(await s.request("/api/v1/packages/usage","alice",{method:"GET"}));
  assert.equal(usage.httpStatus,200);
  assert.ok(usage.pilotPhysicalBytes>=Buffer.byteLength(HTML("published"))*2);
  const metrics=await result(await s.request("/api/v1/packages/staff/metrics","bob",{method:"GET"}));
  assert.equal(metrics.httpStatus,200);
  const blocked=await result(await s.request("/api/v1/packages/staff/metrics","alice",{method:"GET"}));
  assert.equal(blocked.httpStatus,404);
  assert.equal(s.get("SELECT status FROM anevum_package_releases WHERE id=?",v1.release_id)[0].status,"published");
 }finally{await s.close();}
});
