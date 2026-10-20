// ANEVUM Package Uplink / non-authenticated read-only staging probe.
// Runs from GitHub CI with no Cloudflare credentials and never mutates resources.
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";

const CONTROL="https://anevum-package-alpha-v003-control.devonakins.workers.dev";
const RUNTIME="https://anevum-package-alpha-v003-runtime.devonakins.workers.dev";
const EXPECTED="uplink-v007-readiness";
const GUEST_UUID="00000000-0000-4000-8000-000000000001";
async function probe(url,json=false){
  try{
    const result=await fetch(url,{
      method:"GET",redirect:"manual",
      headers:{"accept":json?"application/json":"text/html, text/plain"},
      signal:AbortSignal.timeout(12000)
    });
    let body=null;
    if(json){try{body=await result.json()}catch{body=null}}
    else if(result.status===200)body=(await result.text()).slice(0,75000);
    return {status:result.status,body,redirect:result.headers.get("location")?true:false};
  }catch(e){
    return {status:null,error:e?.name==="TimeoutError"?"request_timeout":"fetch_unavailable"};
  }
}
const [control,runtime,missing,guest]=await Promise.all([
  probe(CONTROL+"/api/v1/packages/health",true),
  probe(RUNTIME+"/__anevum_runtime_health_v1",true),
  probe(RUNTIME+"/r/"+GUEST_UUID+"/index.html"),
  probe(CONTROL+"/upload/v3")
]);
const controllerReady=control.status===200&&control.body?.ok===true&&
  control.body?.stageContract===EXPECTED&&control.body?.schemaReady===true&&
  control.body?.uploadReady===true&&control.body?.runnerConfigured===true&&
  control.body?.publicPublishingEnabled===false;
const runnerReady=runtime.status===200&&runtime.body?.ok===true&&
  runtime.body?.stageContract===EXPECTED&&runtime.body?.schemaReady===true&&
  runtime.body?.storage===true&&runtime.body?.cookieless===true;
const unknownReleaseBlocked=missing.status===404;
const guestNotUploader=guest.status===200&&
  !guest.body?.includes('id="publish-form"')&&/sign in/i.test(guest.body||"");
const report={
  stage:"anevum isolated package alpha v003",
  source_sha:process.env.GITHUB_SHA||"unknown",
  checked_at:new Date().toISOString(),
  readOnlyStageReady:controllerReady&&runnerReady&&unknownReleaseBlocked&&guestNotUploader,
  publicPublishingAuthorized:false,
  authenticatedJourneyVerified:false,
  actualGameExecuted:false,
  control:{status:control.status,stageContract:control.body?.stageContract||null,
    dbConfigured:control.body?.db===true,storageConfigured:control.body?.storage===true,
    schemaReady:control.body?.schemaReady===true,uploadReady:control.body?.uploadReady===true,
    publicPublishingEnabled:control.body?.publicPublishingEnabled===true,error:control.error||null},
  runtime:{status:runtime.status,stageContract:runtime.body?.stageContract||null,
    schemaReady:runtime.body?.schemaReady===true,storageReady:runtime.body?.storage===true,
    cookieless:runtime.body?.cookieless===true,error:runtime.error||null},
  nonexistentRelease:{status:missing.status,blocked:unknownReleaseBlocked},
  guestUploader:{status:guest.status,signInGate:guestNotUploader},
  knownExclusions:[
    "No authenticated founder/reviewer/guest publication flow verified",
    "No real game ZIP uploaded or executed",
    "No production URL or route update",
    "No real iPhone Safari acceptance"
  ]
};
const output=resolve("artifacts/package-stage-readiness");
await mkdir(output,{recursive:true});
await writeFile(resolve(output,"stage-readiness.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
if(!report.readOnlyStageReady&&!process.argv.includes("--report-only"))process.exitCode=2;
