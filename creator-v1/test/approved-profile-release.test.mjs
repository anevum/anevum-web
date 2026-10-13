import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const workflow=readFileSync(new URL("../../.github/workflows/creator-v1-approved-profile-staging.yml",import.meta.url),"utf8");
const source="94adc74a97ab0c979c103ba23610b8a9f786b0a8",parent="a".repeat(40);
const guard=workflow.match(/jq -e --arg source "\$REVIEWED_SOURCE" --arg parent "\$parent" '([\s\S]+?)' "\$marker"/)[1];
const valid={schema:"anevum.creator.staging-authorization.v1",reviewed_source_sha:source,release_scaffold_sha:parent,
  target_worker:"anevum-creator-v1-react-staging",target_route:"next.anevum.com/creator/*",target_d1:"fa96e36d-6257-4883-bf15-074947e11a13",
  production_change_authorized:false,member_worker_change_authorized:false,public_signup_authorized:false,invitations_authorized:false,migrations_authorized:false};
const accepted=marker=>spawnSync("jq",["-e","--arg","source",source,"--arg","parent",parent,guard],{input:JSON.stringify(marker),encoding:"utf8"}).status===0;

test("the actual release jq guard accepts only the reviewed isolated frontend target",()=>{
  assert.equal(accepted(valid),true);
  for(const altered of [{reviewed_source_sha:"b".repeat(40)},{release_scaffold_sha:"b".repeat(40)},
    {target_worker:"anevum-creator-v1"},{target_route:"anevum.com/*"},{target_d1:"6c7b5f0c-33db-4b6a-9569-0a6af5e07534"},
    {production_change_authorized:true},{member_worker_change_authorized:true},{public_signup_authorized:true},
    {invitations_authorized:true},{migrations_authorized:true}])
    assert.equal(accepted({...valid,...altered}),false,JSON.stringify(altered));
  for(const key of Object.keys(valid)){
    const missing={...valid};delete missing[key];assert.equal(accepted(missing),false,key);
  }
});

test("release is a one-time marker event with exact-source CI before credentials",()=>{
  assert.match(workflow,/branches: \[release\/creator-v1-profile-submission-20261013\]/);
  assert.match(workflow,/paths: \[docs\/production\/CREATOR-STAGING-AUTHORIZATION-20261013.json\]/);
  assert.match(workflow,/github.actor == 'anevum'/);
  assert.match(workflow,/git diff-tree --no-commit-id --name-only -r HEAD/);
  assert.match(workflow,/\.status == "completed" and \.conclusion == "success"/);
  assert.match(workflow,/git checkout --detach "\$REVIEWED_SOURCE"/);
  assert.ok(workflow.indexOf('Validate one-time approval')<workflow.indexOf('CLOUDFLARE_API_TOKEN'));
  assert.equal((workflow.match(/npx wrangler deploy/g)||[]).length,1);
  assert.match(workflow,/npm run test:project-readiness/);
  assert.match(workflow,/STAGING_MEMBER_BOUNDARY=PASS/);
  assert.match(workflow,/OLD_STAGING_HOMEPAGE_UNCHANGED=PASS/);
  assert.doesNotMatch(workflow,/workflow_dispatch:|pull_request:|schedule:|wrangler d1 (?:execute|migrations)/);
});
