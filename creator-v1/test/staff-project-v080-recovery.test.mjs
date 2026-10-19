// ANEVUM V080 recovery cases. Synthetic requests and no live identities.
import test from "node:test";
import assert from "node:assert/strict";
import worker from "../operations/staff-project-worker-v080.mjs";
import {staffInventory} from "../operations/staff-project-control-v080.mjs";

const ROOT="https://anevum.com";
function request(path="/staff/projects",method="GET",cookie="fixture-session",body=null){
 const headers=new Headers({accept:"text/html"});
 if(cookie)headers.set("cookie",cookie);
 if(method==="POST"){
  headers.set("content-type","application/json");
  headers.set("origin",ROOT);
  headers.set("sec-fetch-site","same-origin");
  headers.set("x-anevum-staff","1");
 }
 return new Request(ROOT+path,{method,headers,...(body===null?{}:{body:JSON.stringify(body)})});
}
const AUTH={async fetch(){return Response.json({
 user:{id:"verified-fixture-owner",emailVerified:true},
 session:{userId:"verified-fixture-owner",expiresAt:"2099-01-01T00:00:00Z"}
})}};
const quotaDb={
 prepare(){throw new Error("D1_ERROR: Your account has exceeded D1's free tier daily row read limit. Error 7500");}
};
const env=(db=quotaDb,auth=AUTH)=>({DB:db,AUTH:auth,MEDIA:{async delete(){throw Error("Should never delete")}}});

test("quota exhaustion renders branded HTML on staff page, never raw JSON",async()=>{
 const res=await worker.fetch(request(),env());
 assert.equal(res.status,503);
 assert.match(res.headers.get("content-type"),/^text\/html/);
 const html=await res.text();
 assert.match(html,/ANEVUM \/ CONTINUANCE INSTITUTE/);
 assert.match(html,/STAFF_D1_DAILY_LIMIT/);
 assert.match(html,/midnight UTC/);
 assert.doesNotMatch(html,/D1_ERROR|verified-fixture-owner|exception|stack trace/i);
});
test("quota exhaustion reports machine-readable code on mutation API",async()=>{
 const res=await worker.fetch(request("/staff/projects/api/manage","POST","fixture-session",{
  action:"delete",projectId:"11111111-1111-4111-8111-111111111111",
  confirmedTitle:"Fixture",confirmDelete:true
 }),env());
 assert.equal(res.status,503);
 assert.match(res.headers.get("content-type"),/^application\/json/);
 const body=await res.json();
 assert.equal(body.code,"STAFF_D1_DAILY_LIMIT");
 assert.doesNotMatch(JSON.stringify(body),/verified-fixture-owner|D1_ERROR/);
});
test("unavailable auth upstream never downgrades to anonymous or a misleading login",async()=>{
 const unavailable={async fetch(){throw Error("Service binding temporarily unavailable")}};
 const res=await worker.fetch(request(),env(quotaDb,unavailable));
 assert.equal(res.status,503);
 assert.match(await res.text(),/STAFF_AUTH_UPSTREAM_UNAVAILABLE/);
});
test("failed session endpoint returns branded unavailable instead of clearing staff grant",async()=>{
 const unavailable={async fetch(){return new Response("Unavailable",{status:503})}};
 const res=await worker.fetch(request(),env(quotaDb,unavailable));
 assert.equal(res.status,503);
 assert.match(await res.text(),/Sign-in service temporarily unavailable/);
});
test("absent member session gets sign-in page without querying staff D1",async()=>{
 const res=await worker.fetch(request("/staff/projects","GET",null),env());
 assert.equal(res.status,401);
 const html=await res.text();
 assert.match(html,/STAFF_SIGNIN_REQUIRED/);
 assert.match(html,/href="\/join"/);
 assert.doesNotMatch(html,/D1_ERROR/);
});
test("unknown staff role is a safe denial, not quota disclosure",async()=>{
 const db={prepare(){return {bind(){return {async first(){return null}}}}}};
 const res=await worker.fetch(request(),env(db));
 assert.equal(res.status,403);
 const html=await res.text();
 assert.match(html,/STAFF_CLEARANCE_REQUIRED/);
 assert.doesNotMatch(html,/verified-fixture-owner/);
});
test("unparameterized project-list query never invokes bind with zero parameters",async()=>{
 const db={
  prepare(){return {async all(){return {success:true,results:[]}},bind(...params){
   assert.notEqual(params.length,0,"zero-parameter D1 queries must call all() directly");
   return this;
  }}}
 };
 const state=await staffInventory(db,"reviewer");
 assert.deepEqual(state.projects,[]);
 assert.deepEqual(state.cleanups,[]);
});
test("HEAD error never serves a body to staff pages",async()=>{
 const res=await worker.fetch(request("/staff/projects","HEAD"),env());
 assert.equal(res.status,503);
 assert.equal(await res.text(),"");
 assert.match(res.headers.get("content-type"),/^text\/html/);
});
