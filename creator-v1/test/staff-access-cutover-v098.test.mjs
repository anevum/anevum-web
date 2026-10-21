import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {appPatterns,covers,summarizeApps,assertStaffWorkerGuards,audit,ROUTES} from "../ops/staff-access-cutover-v098.mjs";

test("covers public Cloudflare Access application routes without matching unrelated domains",()=>{
  assert.equal(covers("anevum.com/staff*", "/staff/observatory"),true);
  assert.equal(covers("https://anevum.com/staff*", "/staff/projects"),true);
  assert.equal(covers("anevum.com/staff/observatory*", "/staff/observatory/api/overview"),true);
  assert.equal(covers("anevum.com/", "/studio/alpha"),true);
  assert.equal(covers("anevum.com/staff/observatory", "/staff/observatory"),true);
  assert.equal(covers("anevum.com/staff/observatory", "/staff/projects"),false);
  assert.equal(covers("anevum.com/staff*", "/member"),false);
  assert.equal(covers("other-anevum.com/staff*", "/staff/observatory"),false);
  assert.equal(covers("anevum.com.evil.invalid/staff*", "/staff/observatory"),false);
  assert.equal(covers("*.anevum.com/staff*", "/staff/observatory"),false);
  assert.equal(covers("anevum.com/staff*", "/api/v1/member/staff-ops"),false);
  assert.equal(covers("anevum.com/api/v1/*","/api/v1/member/staff-ops"),true);
});
test("extracts Cloudflare self-hosted domains and public destinations",()=>{
  assert.deepEqual(appPatterns({
    domain:"https://anevum.com/staff*",
    self_hosted_domains:["anevum.com/staff/observatory*"],
    destinations:[{type:"public",uri:"https://anevum.com/member"},{type:"private",uri:"private.example"}]
  }),["https://anevum.com/staff*","https://anevum.com/member","anevum.com/staff/observatory*"]);
});
test("scoped protection is reported without exposing application ids",()=>{
 const apps=[{id:"audit-secret-id",type:"self_hosted",domain:"anevum.com/staff*"}];
 const result=summarizeApps(apps);
 assert.equal(result.staffProtected,true);
 assert.equal(result.broadPublicProtection,false);
 assert.equal(result.matchingApplicationCount,1);
 assert.ok(result.routeCoverage["/staff/observatory"].length===1);
 assert.deepEqual(result.routeCoverage["/join"],[]);
 assert.ok(!JSON.stringify(result).includes("audit-secret-id"));
 assert.equal(result.removalCandidateType,"STAFF_SCOPED_APP_REQUIRES_STAFF_ACCEPTANCE");
});
test("broad Cloudflare Access application is blocked from a casual cutover",()=>{
 const result=summarizeApps([{id:"a",type:"self_hosted",domain:"anevum.com/*"}]);
 assert.equal(result.staffProtected,true);
 assert.equal(result.broadPublicProtection,true);
 assert.equal(result.removalCandidateType,"OVERLAPPING_BROAD_APP_REQUIRES_MANUAL_REVIEW");
 assert.ok(result.routeCoverage["/member"].length===1);
 assert.ok(result.routeCoverage["/studio/alpha"].length===1);
});
test("missing or unrelated Access application never means it was safely removed",()=>{
 const result=summarizeApps([{id:"a",type:"self_hosted",domain:"other.example/staff*"}]);
 assert.equal(result.staffProtected,false);
 assert.equal(result.removalCandidateType,"NO_VERIFIED_STAFF_APP_FOUND");
 assert.equal(result.matchingApplicationCount,0);
});
test("local canonical staff guards require sessions, active grants, explicit denial",()=>{
 const folder="creator-v1/operations/";
 const files={
   entry:readFileSync(folder+"anevum-iren-staff-entry-v003.mjs","utf8"),
   observatory:readFileSync(folder+"anevum-iren-staff-observatory-v001.mjs","utf8"),
   ops:readFileSync(folder+"anevum-iren-apex-staff-v002.mjs","utf8"),
   tests:readFileSync("creator-v1/test/staff-session-transport-v091.test.mjs","utf8")
 };
 const ok=assertStaffWorkerGuards(files);
 assert.equal(ok.allPassed,true,JSON.stringify(ok));
 for (const bad of ["entry","observatory","tests"]){
   const altered={...files,[bad]:""};
   assert.throws(()=>assertStaffWorkerGuards(altered));
 }
});
test("remote inventory auditor makes read-only network calls and never promotes production",async ()=>{
 const original=globalThis.fetch;
 const calls=[];
 const account=JSON.parse(readFileSync("creator-v1/operations/staff-transport-v091.json","utf8")).account_id;
 globalThis.fetch=async (url,init={})=>{
  calls.push({url:String(url),method:init.method});
  if(String(url).includes("/accounts/"+account+"/access/apps?")){
   return new Response(JSON.stringify({success:true,result:[
    {id:"private-access-id",type:"self_hosted",domain:"anevum.com/staff*"}
   ],result_info:{total_pages:1}}),{status:200,headers:{"content-type":"application/json"}});
  }
  if(String(url).startsWith("https://anevum.com/")){
   return new Response(null,{status:403,headers:{"cache-control":"private, no-store"}});
  }
  throw Error("Unexpected API "+url);
 };
 try{
  const result=await audit({token:"synthetic-read-only-token",account});
  assert.equal(result.status,"READ_ONLY_AUDIT_COMPLETE");
  assert.equal(result.localGuards.allPassed,true);
  assert.equal(result.coverage.staffProtected,true);
  assert.equal(result.productionPromotion,false);
  assert.equal(result.cloudflarePolicyMutation,false);
  assert.equal(result.cloudflareWorkerMutation,false);
  assert.equal(Object.keys(result.live).length,ROUTES.length);
  assert.ok(calls.every(x=>["GET","HEAD"].includes(x.method)),JSON.stringify(calls));
  assert.ok(!JSON.stringify(result).includes("synthetic-read-only-token"));
  assert.ok(!JSON.stringify(result).includes("private-access-id"));
 } finally {globalThis.fetch=original;}
});
test("remote inventory errors and wrong account fail closed",async()=>{
 const account=JSON.parse(readFileSync("creator-v1/operations/staff-transport-v091.json","utf8")).account_id;
 await assert.rejects(()=>audit({token:"test",account:"wrong-account"}));
 const old=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({success:false,errors:[{message:"Denied"}]}),{status:403});
 try{await assert.rejects(()=>audit({token:"test",account}),/CLOUDFLARE_ACCESS_API_HTTP_403/)}
 finally{globalThis.fetch=old;}
});
