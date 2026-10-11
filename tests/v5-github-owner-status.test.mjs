import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeGitHubRun,observeOwnerGitHub} from "../src/server/github-owner-status.mjs";

const source = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const SAMPLE = {
  id:38103579658,name:"ANEVUM Verify",status:"completed",conclusion:"success",
  head_branch:"build/commons-v5",head_sha:"a".repeat(40),updated_at:"2026-10-10T23:12:24Z",
  html_url:"https://evil.example/steal?cookie=fake"
};
test("allowlisted GitHub workflows discard arbitrary upstream links and extra keys",()=>{
  const run=normalizeGitHubRun("anevum/anevum-web",SAMPLE);
  assert.equal(run.url,"https://github.com/anevum/anevum-web/actions/runs/38103579658");
  assert.equal(run.head_sha,"a".repeat(40));
  assert.equal("html_url" in run,false);
  assert.equal(normalizeGitHubRun("someuser/other",SAMPLE),null);
  assert.equal(normalizeGitHubRun("anevum/rhen",{...SAMPLE,id:"not-an-integer"}),null);
  assert.equal(normalizeGitHubRun("anevum/rhen",{...SAMPLE,status:"PUBLISHED"}),null);
});
test("bounded public GitHub data reads return exact repos and do not infer deployment",async()=>{
  const requests=[];
  const fetchImpl=async(url,options)=>{
    requests.push({url,options});
    return {ok:true,json:async()=>({workflow_runs:[SAMPLE]})};
  };
  const report=await observeOwnerGitHub({fetchImpl,now:new Date("2026-10-10T23:30:00Z")});
  assert.equal(report.schema_version,"anevum.owner.github.v1");
  assert.equal(report.deployment_inferred,false);
  assert.equal(report.can_trigger_workflows,false);
  assert.equal(report.public_workflow_metadata_only,true);
  assert.deepEqual(report.repositories.map(r=>r.repository),["anevum/anevum-web","anevum/rhen"]);
  assert.deepEqual(report.repositories.map(r=>r.state),["OBSERVED","OBSERVED"]);
  assert.equal(requests.length,2);
  assert.ok(requests.every(r=>r.url.startsWith("https://api.github.com/repos/anevum/") && r.url.endsWith("/actions/runs?per_page=1")));
  assert.ok(requests.every(r=>r.options.method==="GET" && r.options.cf.cacheTtl===300));
  assert.ok(requests.every(r=>!JSON.stringify(r.options.headers).toLowerCase().includes("authorization")));
  assert.equal(JSON.stringify(report).includes("evil.example"),false);
});
test("failed, malformed and empty GitHub results stay explicitly unavailable",async()=>{
  const urls=[];
  const mixed=await observeOwnerGitHub({fetchImpl:async(url)=>{
    urls.push(url);
    if(url.includes("anevum-web"))return {ok:false,status:403};
    return {ok:true,json:async()=>({workflow_runs:[]})};
  }});
  assert.deepEqual(mixed.repositories.map(r=>r.state),["UNAVAILABLE","NO_RUNS"]);
  assert.deepEqual(mixed.repositories.map(r=>r.latest_run),[null,null]);
  const forged=await observeOwnerGitHub({fetchImpl:async()=>({ok:true,json:async()=>({workflow_runs:[{...SAMPLE,id:0}]})})});
  assert.ok(forged.repositories.every(r=>r.state==="UNAVAILABLE"));
});
test("github endpoint remains underneath the existing owner dual-identity gate",()=>{
  const worker=source("worker.mjs");
  const start=worker.indexOf('if (pathname === "/api/command/integrations/github")');
  const end=worker.indexOf('if (pathname === "/api/command/iren/status")',start);
  assert.ok(start>0 && end>start);
  const route=worker.slice(start,end);
  assert.match(route,/request\.method !== "GET"/);
  assert.match(route,/await commandCredential\(request, env\)/);
  assert.match(route,/observeOwnerGitHub\(\)/);
  assert.ok(route.indexOf("await commandCredential(request, env)") < route.indexOf("await observeOwnerGitHub()"));
  assert.match(route,/url\.search/);
  assert.doesNotMatch(route,/commandApi\(|proxyTrader\(|Bearer |secret|token/);
  const auth=source("src/server/command-owner-binding.mjs");
  assert.match(auth,/throw new OwnerMemberBindingError\(503\)/);
  const terminal=source("src/pages/RhenTerminal.tsx");
  assert.match(terminal,/page === "system"/);
  assert.match(terminal,/<GitHubOwnerStatus\s*\/>/);
  const panel=source("src/components/GitHubOwnerStatus.tsx");
  assert.match(panel,/\/api\/command\/integrations\/github/);
  assert.match(panel,/deployment_inferred === false/);
  assert.doesNotMatch(panel,/VITE_GITHUB_TOKEN|process\.env|localStorage/);
});
