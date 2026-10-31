import test from "node:test";
import assert from "node:assert/strict";
import {validateVaultProjectName,readTinyProjectJson,vaultProjectsEnabled,vaultProjectSchemaReady,vaultProjectEndpoint} from "../src/server/vault-projects.mjs";

const userA={id:"member-A"},userB={id:"member-B"};
const projectId="ec164f15-102e-4f3e-bc7c-11ef8c2c2316";
function mockDb(){
  const calls=[];
  const projects=[{id:projectId,user_id:"member-A",name:"Private A",created_at_ms:123}];
  const usage=new Map();
  const q={
    prepare(sql) {
      const values=[];
      return {
        bind(...items){values.push(...items);return this;},
        async all(){
          calls.push({sql,values});
          if(sql.includes("sqlite_master"))return {results:["vault_projects","vault_usage","vault_files"].map(name=>({name}))};
          if(sql.includes("FROM vault_projects WHERE user_id=?"))return {results:projects.filter(p=>p.user_id===values[0])};
          if(sql.includes("FROM vault_files"))return {results:[]};
          throw Error("Unexpected SQL");
        },
        async first(){
          calls.push({sql,values});
          if(sql.includes("FROM vault_projects WHERE id=?"))return projects.find(p=>p.id===values[0]&&p.user_id===values[1])||null;
          if(sql.includes("FROM vault_usage"))return usage.get(values[0])||null;
          throw Error("Unexpected SQL");
        },
        async run() {
          calls.push({sql,values});
          if(sql.includes("INSERT INTO vault_projects"))projects.push({id:values[0],user_id:values[1],name:values[2],created_at_ms:values[3]});
          if(sql.includes("INSERT OR IGNORE INTO vault_usage"))usage.set(values[0],{included_bytes:2*1024**3,used_bytes:0,reserved_bytes:0});
          return {success:true};
        }
      };
    },
    async batch(statements){for(const s of statements)await s.run();return [{success:true},{success:true}];}
  };
  return {q,calls};
}
const req=(path,method="GET",body=null)=>new Request("https://anevum.example"+path, {
  method,headers:body?{"Content-Type":"application/json"}:undefined,body
});
const path="/api/member/vault/projects";
test("Vault project names reject malicious or extraneous fields",()=>{
  for(const name of ["",".env\u0000"," Bad ","a".repeat(101),null])assert.throws(()=>validateVaultProjectName(name));
  assert.equal(validateVaultProjectName("Absence Protocol"),"Absence Protocol");
});
test("Private project API unavailable until explicitly configured and schema exists",async()=>{
  assert.equal(vaultProjectsEnabled({}),false);
  const {q}=mockDb();assert.equal(await vaultProjectSchemaReady(q),true);
  assert.equal((await vaultProjectEndpoint(req(path),{MEMBER_DB:q},userA,path)).status,503);
  assert.equal((await vaultProjectEndpoint(req(path),{MEMBER_DB:q,ANEVUM_VAULT_PROJECTS_PREVIEW_ENABLED:"true"},null,path)).status,401);
});
test("Two verified accounts cannot list each other's projects",async()=>{
  const {q}=mockDb(),env={MEMBER_DB:q,ANEVUM_VAULT_PROJECTS_PREVIEW_ENABLED:"true"};
  const a=await (await vaultProjectEndpoint(req(path),env,userA,path)).json();
  const b=await (await vaultProjectEndpoint(req(path),env,userB,path)).json();
  assert.equal(a.projects.length,1);
  assert.equal(b.projects.length,0);
  const filesPath="/api/member/vault/projects/"+projectId+"/files";
  const bFiles=await vaultProjectEndpoint(req(filesPath),env,userB,filesPath);
  assert.equal(bFiles.status,404);
  const aFiles=await vaultProjectEndpoint(req(filesPath),env,userA,filesPath);
  assert.equal(aFiles.status,200);
  assert.equal((await aFiles.json()).downloadsEnabled,false);
});
test("Project creation is member-bound and no upload or client member ID works",async()=>{
  const {q,calls}=mockDb(),env={MEMBER_DB:q,ANEVUM_VAULT_PROJECTS_PREVIEW_ENABLED:"true"};
  let r=await vaultProjectEndpoint(req(path,"POST",JSON.stringify({name:"My Project",user_id:"member-B"})),env,userA,path);
  assert.equal(r.status,400);
  r=await vaultProjectEndpoint(req(path,"POST",JSON.stringify({name:"My Project"})),env,userA,path);
  assert.equal(r.status,201);
  const body=await r.json();
  assert.equal(body.filesEnabled,false);
  assert.equal(body.project.name,"My Project");
  assert(calls.some(x=>x.sql.includes("INSERT INTO vault_projects") && x.values[1]==="member-A"));
  assert.equal((await vaultProjectEndpoint(req("/api/member/vault/uploads","POST"),env,userA,"/api/member/vault/uploads")).status,503);
  const qReq=req(path+"?userId=member-B");
  assert.equal((await vaultProjectEndpoint(qReq,env,userA,path)).status,400);
});
test("Free quota has no paid entitlement and no bytes consumed",async()=>{
  const {q}=mockDb(),env={MEMBER_DB:q,ANEVUM_VAULT_PROJECTS_PREVIEW_ENABLED:"true"};
  const url="/api/member/vault/quota",res=await vaultProjectEndpoint(req(url),env,userA,url);
  const value=await res.json();
  assert.equal(value.includedBytes,2*1024**3);
  assert.equal(value.additionalPaidBytes,0);
  assert.equal(value.paymentAcceptance,false);
  assert.equal(value.uploadsEnabled,false);
});

test("Project request streams are bounded before JSON parsing",async()=>{
  const small=req(path,"POST",JSON.stringify({name:"Small"}));
  assert.deepEqual(await readTinyProjectJson(small),{name:"Small"});
  const huge=req(path,"POST",JSON.stringify({name:"a".repeat(280)}));
  await assert.rejects(readTinyProjectJson(huge),RangeError);
});
test("Oversized HTTP request is rejected and D1 failures are not blamed on the user",async()=>{
  const {q}=mockDb(),env={MEMBER_DB:q,ANEVUM_VAULT_PROJECTS_PREVIEW_ENABLED:"true"};
  const huge=req(path,"POST",JSON.stringify({name:"a".repeat(280)}));
  assert.equal((await vaultProjectEndpoint(huge,env,userA,path)).status,413);
  q.batch=async()=>{throw new Error("DB outage");};
  const valid=req(path,"POST",JSON.stringify({name:"Okay"}));
  assert.equal((await vaultProjectEndpoint(valid,env,userA,path)).status,503);
});
