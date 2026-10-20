import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
import {POLICY,MiB,ResourceError,physicalBytes,isDuplicate,testExpired,
 quotaFits,sourcePrefix,readBoundedMultipart,readBoundedJson} from "../package-alpha-v004/resource-policy.mjs";

test("physical quotas include extracted assets and other members in the shared pilot",()=>{
 assert.equal(physicalBytes(20*MiB,48*MiB),68*MiB);
 assert.ok(quotaFits({memberArchive:80*MiB,memberPhysical:110*MiB,
   pilotPhysical:420*MiB,archive:20*MiB,physical:68*MiB}));
 assert.equal(quotaFits({memberArchive:100*MiB,archive:1,physical:1}),false);
 assert.equal(quotaFits({memberPhysical:200*MiB,physical:1}),false);
 assert.equal(quotaFits({pilotPhysical:512*MiB,physical:1}),false);
 assert.throws(()=>physicalBytes(NaN,2),ResourceError);
});
test("duplicate detection requires both SHA and verified size, and safe status",()=>{
 const sha="a".repeat(64);
 assert.equal(isDuplicate({wantedSha:sha,existingSha:sha,existingSize:5,expectedSize:5,status:"ready"}),true);
 assert.equal(isDuplicate({wantedSha:sha,existingSha:sha,existingSize:5,expectedSize:5,status:"published"}),true);
 assert.equal(isDuplicate({wantedSha:sha,existingSha:sha,existingSize:5,expectedSize:6,status:"published"}),false);
 assert.equal(isDuplicate({wantedSha:sha,existingSha:sha,existingSize:5,expectedSize:5,status:"revoked"}),false);
 assert.equal(isDuplicate({wantedSha:"bad",existingSha:"bad",existingSize:5,expectedSize:5,status:"ready"}),false);
});
test("only unsaved private tests expire",()=>{
 const release={id:"test",status:"ready"},temp={mode:"test",expires_at:100};
 assert.equal(testExpired(release,temp,101,"test"),true);
 assert.equal(testExpired(release,{mode:"saved",expires_at:null},101,"test"),false);
 assert.equal(testExpired({...release,status:"published"},temp,101,"test"),false);
 assert.equal(testExpired(release,temp,101,"other"),false);
});
test("private cleanup cannot escape the version-scoped R2 prefix",()=>{
 const prefix="package-alpha/v004/owner/123e4567-e89b-42d3-a456-426614174000/123e4567-e89b-42d3-a456-426614174001/";
 assert.equal(sourcePrefix(prefix+"source/build.zip"),prefix);
 for(const invalid of ["other/package.zip",prefix+"assets/index.html",prefix+"source/../../other"])
  assert.throws(()=>sourcePrefix(invalid),ResourceError);
});
test("multipart stream is capped even without Content-Length",async()=>{
 const form=new FormData();
 form.set("file",new Blob([new Uint8Array(1024)],{type:"application/zip"}),"demo.zip");
 const req=new Request("https://anevum.com/api/v1/packages/upload",{method:"POST",body:form});
 const parsed=await readBoundedMultipart(req);
 assert.equal(parsed.get("file").size,1024);
 const oversized=new Request("https://anevum.com/api/v1/packages/upload",{
   method:"POST",headers:{"content-type":"multipart/form-data; boundary=x"},
   body:new ReadableStream({start(c){c.enqueue(new Uint8Array(POLICY.multipartBytes+1));c.close();}}),
   duplex:"half"
 });
 await assert.rejects(()=>readBoundedMultipart(oversized),e=>e.status===413);
});
test("preflight JSON rejects excessive bodies and invalid content",async()=>{
 const make=data=>new Request("https://anevum.com/api/v1/packages/preflight",{
   method:"POST",headers:{"content-type":"application/json"},body:data
 });
 const good=await readBoundedJson(make(JSON.stringify({name:"demo.zip"})));
 assert.equal(good.name,"demo.zip");
 await assert.rejects(()=>readBoundedJson(make("x".repeat(2049))),e=>e.status===413);
 await assert.rejects(()=>readBoundedJson(make("{bad")),e=>e.status===400);
});
test("API source, generated browser script and additive migration satisfy contracts",()=>{
 const root=new URL("../package-alpha-v004/",import.meta.url);
 const api=readFileSync(new URL("api.mjs",root),"utf8");
 const ui=readFileSync(new URL("ui.mjs",root),"utf8");
 const sql=readFileSync(new URL("migrations/0002_resource_protection.sql",root),"utf8");
 const marker="const SCRIPT = String.raw"+String.fromCharCode(96);
 const body=ui.split(marker)[1]?.split(String.fromCharCode(96)+";")[0];
 assert.ok(body,"browser script must exist");
 new Script(body);
 for(const name of ["readBoundedMultipart","preflight","reserveUpload","cleanupPackageResources",
  "saveDraft","discardDraft","async scheduled","resourcePolicyReady","findDuplicate"])
  assert.ok(api.includes(name),"API missing "+name);
 for(const phrase of ["Save draft","Discard build","Replace test build","Storage used","48 hours"])
  assert.ok(ui.includes(phrase),"UI missing "+phrase);
 for(const table of ["anevum_package_upload_leases","anevum_package_upload_reservations",
  "anevum_package_build_retention","anevum_package_cleanup_jobs","anevum_package_daily_limits"])
  assert.ok(sql.includes(table),"migration missing "+table);
 assert.ok(!sql.includes("DROP TABLE"));
 assert.ok(!api.includes("env.MEDIA.delete(touched)"));
});
