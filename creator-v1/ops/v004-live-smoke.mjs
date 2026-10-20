/* ANEVUM Creator Package V004 read-only deployed smoke.
 * Run on CI after staging Worker routes exist. Never signs in, uploads or writes.
 */
import assert from "node:assert/strict";

const BASE="https://anevum.com";
const RUNTIME="https://anevum-package-alpha-v004-runtime.devonakins.workers.dev";
const timeout=AbortSignal.timeout(15000);
async function read(path,from=BASE) {
  const r=await fetch(from+path,{
    headers:{"accept":"text/html,application/json","user-agent":"Mozilla/5.0 (ANEVUM-Staging-ReadOnly-QA)"},
    redirect:"manual",signal:timeout
  });
  const text=await r.text();
  console.log("CHECK",r.status,path,from===BASE?"ANEVUM":"ISOLATED-RUNTIME");
  assert.match(r.headers.get("cache-control")||"",/no-store/,"No staging response should cache private content");
  assert.match(r.headers.get("x-robots-tag")||"",/noindex/,"Staging must not be indexed");
  return {r,text};
}
const health=await read("/api/v1/packages/v004/health");
assert.equal(health.r.status,200);
const service=JSON.parse(health.text);
assert.equal(service.ok,true);
assert.equal(service.version,"004");
assert.equal(service.db,true);
assert.equal(service.storage,true);
assert.equal(service.runnerConfigured,true);
const lab=await read("/creator-lab/v004");
assert.equal(lab.r.status,200);
assert.match(lab.text,/Create freely\. Keep what works\./);
assert.match(lab.text,/Member sign-in required/);
assert.doesNotMatch(lab.text,/id="publish-form"/,"Signed-out visitors should not get an uploader");
assert.ok(lab.text.includes('href="/creator-lab/v004/help"'));
assert.ok(lab.text.includes('href="/creator-lab/v004/projects"'));
assert.ok(!lab.text.includes('href="/upload/v3"'),"Links must remain within V004 staging");
const me=await read("/api/v1/packages/v004/me");
const identity=JSON.parse(me.text);
assert.equal(identity.authenticated,false);
assert.equal(identity.pilot,false);
assert.equal(identity.reviewer,false);
const privateUsage=await read("/api/v1/packages/v004/usage");
assert.equal(privateUsage.r.status,401);
const staffMetrics=await read("/api/v1/packages/v004/staff/metrics");
assert.equal(staffMetrics.r.status,404);
const staffPage=await read("/creator-lab/v004/staff");
assert.doesNotMatch(staffPage.text,/STORAGE GUARDIAN \/ OPERATIONS/);
assert.match(staffPage.text,/Project unavailable/);
const help=await read("/creator-lab/v004/help");
assert.equal(help.r.status,200);
assert.match(help.text,/PUBLISHING GUIDE/);
assert.match(help.text,/48 hours/);
const projects=await read("/creator-lab/v004/projects");
assert.equal(projects.r.status,200);
assert.match(projects.text,/Playable releases/);
const runner=await read("/__anevum_runtime_health_v004",RUNTIME);
assert.equal(runner.r.status,200);
const state=JSON.parse(runner.text);
assert.equal(state.version,"004");
assert.equal(state.ok,true);
assert.equal(state.isolated,true);
const fakeRelease="123e4567-e89b-42d3-a456-426614174000";
const direct=await read("/r/"+fakeRelease+"/index.html",RUNTIME);
assert.equal(direct.r.status,404);
const fakePreview=await read("/p/"+fakeRelease+"/"+(Date.now()/1000|0)+"."+"a".repeat(64)+"/index.html",RUNTIME);
assert.equal(fakePreview.r.status,404);
console.log("ANEVUM V004 deployed read-only smoke PASSED; no uploads, account writes or publishing.");
