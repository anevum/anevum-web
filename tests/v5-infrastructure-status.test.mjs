import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {observeCloudflare,observeRailway,observeOwnerInfrastructure} from "../src/server/owner-infrastructure-status.mjs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const env={
  CF_INFRA_ACCOUNT_ID:"a".repeat(32),CF_INFRA_READ_TOKEN:"CLOUDFLARE_TEST_TOKEN",
  RAILWAY_INFRA_PROJECT_ID:"808098a9-937e-4ca4-ac98-dd2dcfef5d0c",
  RAILWAY_INFRA_ENVIRONMENT_ID:"88888888-8888-4888-8888-888888888888",
  RAILWAY_INFRA_PROJECT_TOKEN:"RAILWAY_TEST_TOKEN"
};
const d={id:"1ad98799-924d-46ed-bb4d-f7549ac0c8f6",created_on:"2026-10-10T02:34:43Z",author_email:"secret@example.test",versions:[{metadata:{secrets:["DO_NOT_LEAK"]}}]};
const uuid="00000000-0000-4000-8000-000000000001";
const response=(json,ok=true)=>({ok,json:async()=>json});
test("absent provider bindings never call external APIs",async()=>{
  let calls=0;
  const r=await observeOwnerInfrastructure({}, {fetchImpl:async()=>{calls++;throw Error("unexpected")}});
  assert.equal(calls,0);
  assert.equal(r.providers.cloudflare.state,"NOT_CONFIGURED");
  assert.equal(r.providers.railway.state,"NOT_CONFIGURED");
  assert.equal(r.can_mutate,false);
  assert.equal(r.broker_connected,false);
  assert.ok(!JSON.stringify(r).includes("TOKEN"));
});
test("Cloudflare permits only pinned read endpoints and projects only deployment metadata",async()=>{
  const requests=[];
  const x=await observeCloudflare(env,async(url,options)=>{
    requests.push({url,options});
    return response({success:true,result:{deployments:[d]},errors:[]});
  });
  assert.equal(x.state,"OBSERVED");
  assert.deepEqual(x.workers.map(w=>w.name),["anevum-web-nextgen","anevum-member-staging"]);
  assert.ok(x.workers.every(w=>w.state==="OBSERVED"&&w.revision===d.id));
  assert.equal(requests.length,2);
  assert.ok(requests.every(r=>r.options.method==="GET"&&r.options.cache==="no-store"&&r.options.redirect==="error"));
  assert.ok(requests.every(r=>r.url.endsWith("/deployments?per_page=1")&&r.url.includes("/workers/scripts/")));
  const sanitized=JSON.stringify(x);
  for(const secret of ["secret@example.test","DO_NOT_LEAK","CLOUDFLARE_TEST_TOKEN","versions"])
    assert.ok(!sanitized.includes(secret),"Leaked upstream Cloudflare property: "+secret);
});
test("Cloudflare invalid response and partial failure fail visibly, not healthy",async()=>{
  const x=await observeCloudflare(env,async(url)=>{
    if(url.includes("nextgen")) return response({success:false,errors:[{message:"token secret leaked"}]});
    return response({success:true,result:{deployments:[]}});
  });
  assert.equal(x.state,"PARTIAL");
  assert.deepEqual(x.workers.map(w=>w.state),["UNAVAILABLE","NO_DEPLOYMENTS"]);
  const y=await observeCloudflare(env,async()=>response({success:true,result:{deployments:[{...d,id:"nope"}]}}));
  assert.equal(y.state,"UNAVAILABLE");
  assert.ok(y.workers.every(w=>w.state==="UNAVAILABLE"));
});
test("Railway is no-services only after provider token scope, project and production env are verified",async()=>{
  const requests=[];
  const fetchImpl=async(_url,options)=>{
    requests.push(options);
    const p=JSON.parse(options.body);
    if(p.query.includes("projectToken"))
      return response({data:{projectToken:{projectId:env.RAILWAY_INFRA_PROJECT_ID,environmentId:env.RAILWAY_INFRA_ENVIRONMENT_ID}}});
    return response({data:{project:{id:env.RAILWAY_INFRA_PROJECT_ID,name:"RHEN",services:{edges:[]},
      environments:{edges:[{node:{id:env.RAILWAY_INFRA_ENVIRONMENT_ID,name:"production"}}]}}}});
  };
  const result=await observeRailway(env,fetchImpl);
  assert.equal(result.state,"NO_SERVICES");
  assert.deepEqual(result.services,[]);
  assert.equal(requests.length,2);
  assert.ok(requests.every(p=>p.method==="POST"&&p.headers["Project-Access-Token"]==="RAILWAY_TEST_TOKEN"&&p.cache==="no-store"));
  assert.ok(requests.every(p=>!p.body.includes("mutation")));
  assert.ok(!JSON.stringify(result).includes("RAILWAY_TEST_TOKEN"));
});
test("Railway rejects project-scope mismatch and HTTP-200 GraphQL auth errors",async()=>{
  let calls=0;
  const bad=await observeRailway(env,async()=>{calls++;return response({data:{projectToken:{projectId:uuid,environmentId:env.RAILWAY_INFRA_ENVIRONMENT_ID}}});});
  assert.equal(bad.state,"UNAVAILABLE");
  assert.equal(calls,1);
  const bad2=await observeRailway(env,async()=>response({data:null,errors:[{message:"Not Authorized"}]}));
  assert.equal(bad2.state,"UNAVAILABLE");
});
test("Railway reads capped service instances and never infers health from SUCCESS",async()=>{
  const calls=[];
  const fetchImpl=async(_url,opts)=>{
    const {query,variables}=JSON.parse(opts.body);
    calls.push({query,variables});
    if(query.includes("projectToken"))
      return response({data:{projectToken:{projectId:env.RAILWAY_INFRA_PROJECT_ID,environmentId:env.RAILWAY_INFRA_ENVIRONMENT_ID}}});
    if(query.includes("project(id:"))
      return response({data:{project:{id:env.RAILWAY_INFRA_PROJECT_ID,name:"RHEN",services:{edges:[{node:{id:uuid,name:"RHEN core"}}]},
        environments:{edges:[{node:{id:env.RAILWAY_INFRA_ENVIRONMENT_ID,name:"production"}}]}}}});
    return response({data:{serviceInstance:{serviceName:"RHEN core",latestDeployment:{
      id:d.id,status:"SUCCESS",createdAt:"2026-10-10T01:34:00Z",privateToken:"LEAK"
    }}}});
  };
  const result=await observeRailway(env,fetchImpl);
  assert.equal(result.state,"OBSERVED");
  assert.deepEqual(result.services.map(x=>x.deployment_status),["SUCCESS"]);
  assert.equal(result.services[0].state,"OBSERVED");
  assert.equal(calls.length,3);
  assert.ok(!JSON.stringify(result).includes("LEAK"));
  assert.ok(!JSON.stringify(result).includes(uuid));
});
test("Railway projects larger than eight services show partial evidence",async()=>{
  const fetchImpl=async(_url,opts)=>{
    const p=JSON.parse(opts.body);
    if(p.query.includes("projectToken"))
      return response({data:{projectToken:{projectId:env.RAILWAY_INFRA_PROJECT_ID,environmentId:env.RAILWAY_INFRA_ENVIRONMENT_ID}}});
    if(p.query.includes("project(id:"))
      return response({data:{project:{id:env.RAILWAY_INFRA_PROJECT_ID,name:"RHEN",
        environments:{edges:[{node:{id:env.RAILWAY_INFRA_ENVIRONMENT_ID,name:"production"}}]},
        services:{edges:Array.from({length:9},(_,i)=>({node:{id:"00000000-0000-4000-8000-"+String(i+1).padStart(12,"0"),name:"service"}}))}}}});
    return response({data:{serviceInstance:{latestDeployment:null}}});
  };
  const v=await observeRailway(env,fetchImpl);
  assert.equal(v.state,"PARTIAL");
  assert.equal(v.truncated,true);
  assert.equal(v.services.length,8);
});
test("Worker route authenticates before querying provider APIs, and never has a public fallthrough",()=>{
  const worker=source("worker.mjs");
  const start=worker.indexOf('if (pathname === "/api/command/integrations/infrastructure")');
  const end=worker.indexOf('if (pathname === "/api/command/iren/status")',start);
  assert.ok(start>0&&end>start);
  const block=worker.slice(start,end);
  assert.match(block,/request\.method !== "GET"/);
  assert.match(block,/url\.search/);
  assert.ok(block.indexOf("await commandCredential(request, env)") <
    block.indexOf("await observeOwnerInfrastructure(env)"));
  assert.doesNotMatch(block,/mutation|Bearer |Project-Access-Token|CF_INFRA_READ_TOKEN/);
  const terminal=source("src/pages/RhenTerminal.tsx");
  assert.match(terminal,/<OwnerInfrastructureStatus\s*\/>/);
  const ui=source("src/components/OwnerInfrastructureStatus.tsx");
  assert.match(ui,/\/api\/command\/integrations\/infrastructure/);
  assert.doesNotMatch(ui,/CF_INFRA_READ_TOKEN|RAILWAY_INFRA_PROJECT_TOKEN|localStorage/);
  const pkg=JSON.parse(source("package.json"));
  assert.match(pkg.scripts["test:foundation"],/tests\/v5-infrastructure-status\.test\.mjs/);
});
