/**
 * Guard source-only PUBLIC_V5_VISUAL_ONLY against accidental feature activation.
 * This does not authorize production deployment, migrations or member privileges.
 * Reviewed SHA, rollback proof and remote checks remain in deploy-production.yml.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

export function validatePublicOnlyV5Scope(config) {
  assert.equal(config.name,"anevum-web-nextgen");
  assert.equal(config.main,"./worker.mjs");
  assert.deepEqual(config.routes,[{pattern:"anevum.com/*",zone_name:"anevum.com"}]);
  assert.equal(config.d1_databases?.length,1);
  assert.equal(config.d1_databases[0].binding,"MEMBER_DB");
  assert.equal(config.d1_databases[0].database_name,"anevum-members");
  assert.equal(config.d1_databases[0].database_id,"7f0d4c0c-2e85-4900-8504-1347954e1df1");
  const values=config.vars||{};
  const required={
    COMMAND_AUTH_MODE:"cloudflare_access",
    ANEVUM_MEMBERS_ENABLED:"true",
    ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED:"true",
    ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED:"false",
    ANEVUM_V5_WORKSPACES_ENABLED:"false",
    ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED:"false",
    ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"false",
    COMMAND_LIVE_STREAM_ENABLED:"false",
    ANEVUM_MEMBER_PREVIEW_ENABLED:"false",
    ANEVUM_OWNER_PAPER_OBSERVER_ENABLED:"false"
  };
  for(const [name,expected] of Object.entries(required)){
    assert.equal(values[name],expected,"Public-only release must not change privileged flag: "+name);
  }
  assert.equal(config.assets?.run_worker_first,true);
  assert.equal(config.assets?.not_found_handling,"single-page-application");
  return Object.freeze({
    worker:"anevum-web-nextgen",
    database:"anevum-members",
    memberAccountsEnabled:true,
    operatorAuthorization:"UNALTERED_CLOUDFLARE_ACCESS_AND_OWNER_BINDING_REQUIRED",
    privateRhenWorkspaces:false,
    paperOrLiveBrokerAuthority:false,
    socialPosting:false,
    migrationAuthorized:false
  });
}
if(process.argv[1]?.endsWith("/verify-v5-production-public-scope.mjs")){
  try{
    const result=validatePublicOnlyV5Scope(JSON.parse(read("wrangler.jsonc")));
    console.log("PUBLIC V5 SOURCE SCOPE VERIFIED: existing site and D1, member login retained, new workspace/social/trading authority OFF.");
  }catch{
    console.error("PUBLIC V5 SCOPE BLOCKED: source config does not satisfy restricted production rules.");
    process.exitCode=1;
  }
}
