import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(file)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("staging Worker deployment requires owner-approved exact main SHA",()=>{
  const yml=read(".github/workflows/member-staging-bootstrap.yml");
  assert.match(yml,/workflow_dispatch:\s*\n\s+inputs:/);
  assert.match(yml,/confirmation:/);
  assert.match(yml,/DEPLOY_MEMBER_STAGING_ONLY/);
  assert.match(yml,/reviewed_head_sha:/);
  assert.match(yml,/github\.ref == 'refs\/heads\/main'/);
  assert.match(yml,/inputs\.reviewed_head_sha == github\.sha/);
  assert.match(yml,/inputs\.confirmation == 'DEPLOY_MEMBER_STAGING_ONLY'/);
  assert.equal((yml.match(/if: github\.event_name == 'workflow_dispatch'/g)||[]).length,3);
  assert.match(yml, /name: Reject stale approved main SHA before staging deployment/);
  assert.doesNotMatch(yml,/if: github\.event_name != 'pull_request'/);
  assert.match(yml,/name: Deploy isolated staging OAuth Worker/);
  assert.match(yml,/name: Verify staging Google identity readiness and deny operator access/);
  assert.doesNotMatch(yml,/wrangler deploy --env production|ANE VUM.*production.*deploy/);
  const config=JSON.parse(read("wrangler.member-staging.jsonc"));
  assert.equal(config.name,"anevum-member-staging");
  assert.equal(config.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"false");
  assert.equal(config.vars.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
});

test("pull requests and main pushes cannot accidentally deploy staging",()=>{
  const yml=read(".github/workflows/member-staging-bootstrap.yml");
  const steps=yml.split(/\n      - name:/);
  for(const header of [
    " Deploy isolated staging OAuth Worker",
    " Verify staging Google identity readiness and deny operator access"
  ]){
    const step=steps.find(s=>s.startsWith(header));
    assert.ok(step, "Missing gated step "+header);
    assert.match(step,/if: github\.event_name == 'workflow_dispatch'/);
  }
  assert.match(yml,/github\.event_name != 'workflow_dispatch'/);
  assert.match(yml,/if: >-/);
});
