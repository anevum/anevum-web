import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyBetaProbe} from "../src/member/beta-probe.ts";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const user="beta-member";
const profile={user:{id:user},profile:{displayName:"Tester"},savedApps:[],follows:[]};
const ws={schema_version:"anevum.workspace-state.v1",workspace_id:"wrk_1234567890abcdef1234567890abcdef",
 member_id:user,workspace_kind:"MEMBER_PRIVATE",engine_source:"RHEN_NEXT",evidence_state:"NOT_CONFIGURED",
 execution_permission:"NONE",broker_link_state:"NOT_LINKED",capabilities:["VIEW"],updated_at:"2026-10-11T00:00:00Z"};
const feed={schemaVersion:"anevum.commons-discussions.v1",viewerMemberId:user,available:true,pilot:true,
 moderationStatus:"PILOT_REVIEW_REQUIRED",posts:[],pageCap:30,hasMore:false,nextCursor:null,olderPostsMayExist:false};
test("beta status verifies member identity and prohibits authority escalation",()=>{
 assert.equal(verifyBetaProbe("account",200,profile,user),"available");
 assert.equal(verifyBetaProbe("workspace",200,{available:true,workspace:null},user),"available");
 assert.equal(verifyBetaProbe("workspace",200,{available:true,workspace:ws},user),"available");
 assert.equal(verifyBetaProbe("draft",200,{available:true,executionEnabled:false,brokerageConnected:false,draft:null},user),"available");
 assert.equal(verifyBetaProbe("discussions",200,feed,user),"available");
 for(const [kind,data] of [
  ["account",{...profile,user:{id:"other"}}],
  ["workspace",{available:true,workspace:{...ws,member_id:"other"}}],
  ["workspace",{available:true,workspace:{...ws,execution_permission:"LIVE_AUTHORIZED"}}],
  ["draft",{available:true,executionEnabled:true,brokerageConnected:false,draft:null}],
  ["draft",{available:true,executionEnabled:false,brokerageConnected:true,draft:null}],
  ["discussions",{...feed,viewerMemberId:"other"}]
 ])assert.throws(()=>verifyBetaProbe(kind,200,data,user));
});
test("disabled, unauthenticated and failed reads cannot claim available",()=>{
 for(const kind of ["account","workspace","draft","discussions"]){
   assert.equal(verifyBetaProbe(kind,503,null,user),"disabled");
   assert.equal(verifyBetaProbe(kind,403,null,user),"restricted");
   assert.equal(verifyBetaProbe(kind,401,null,user),"sign-in-required");
   assert.throws(()=>verifyBetaProbe(kind,500,null,user));
   assert.throws(()=>verifyBetaProbe(kind,200,{},user));
 }
});
test("beta UI is identity-keyed, read-only and not indexed",()=>{
 const app=source("src/App.tsx"),page=source("src/pages/MemberBeta.tsx");
 assert.match(app,/path="\/me\/beta"/);
 assert.match(app,/path\.startsWith\("\/me"\)/);
 assert.doesNotMatch(source("src/data/public-routes.json"),/\/me\/beta/);
 assert.match(page,/<Checks key=\{session\.user\.id\} memberId=\{session\.user\.id\}/);
 assert.match(page,/controller\.abort\(\)/);
 assert.match(page,/credentials:"same-origin"/);
 assert.match(page,/method:"GET"/);
 assert.doesNotMatch(page,/\bPOST\b|\bPUT\b|\bDELETE\b|alpaca_secret/);
 assert.match(source("src/pages/MemberHome.tsx"),/to="\/me\/beta"/);
 const prod=JSON.parse(source("wrangler.jsonc")).vars;
 assert.equal(prod.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
 assert.equal(prod.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED,"false");
});
test("first-time signup can recheck without changing server-side authorization",()=>{
 assert.match(source("src/pages/SignIn.tsx"),/refreshMemberAvailability\(\)/);
 assert.match(source("src/member/useMemberAvailability.ts"),/controller\?\.abort\(\)/);
 assert.doesNotMatch(source("src/member/useMemberAvailability.ts"),/addEventListener\("focus"/);
 assert.match(source("src/server/member.mjs"),/memberConfigured\(env\) && Boolean\(verifiedOrigin\) && await memberSchemaReady\(env\)/);
});


test("beta capability probe rejects overprivileged or malformed saved draft data",()=>{
  const safe={
    available:true,executionEnabled:false,brokerageConnected:false,
    draft:{
      label:"Member research",marketScope:"us_equities_etfs",direction:"long_only",
      maxOpenPositions:2,maxTotalExposurePercent:30,maxPositionPercent:10,
      updatedAt:"2026-10-11 10:12:22"
    }
  };
  assert.equal(verifyBetaProbe("draft",200,safe,user),"available");
  for(const payload of [
    {...safe,draft:{...safe.draft,apiKey:"private"}},
    {...safe,draft:{...safe.draft,direction:"short"}},
    {...safe,draft:{...safe.draft,maxOpenPositions:100}},
    {...safe,draft:{...safe.draft,maxPositionPercent:60}},
    {...safe,brokerLink:true}
  ])assert.throws(()=>verifyBetaProbe("draft",200,payload,user));
});


test("signed-in beta members can find the real verification UI only in isolated previews",()=>{
 const page=source("src/pages/MemberBeta.tsx");
 const settings=source("src/pages/MemberSettings.tsx");
 const verifier=source("src/pages/MemberStagingVerify.tsx");
 assert.match(page,/window\.location\.origin === "https:\/\/anevum-v5-beta\.devonakins\.workers\.dev"/);
 assert.match(page,/isolatedBeta && <section/);
 assert.match(page,/to="\/me\/verify">Run beta account verification/);
 assert.match(page,/Each browser test proves only its own session/);
 assert.match(settings,/https:\/\/anevum-member-staging\.devonakins\.workers\.dev/);
 assert.match(settings,/https:\/\/anevum-v5-beta\.devonakins\.workers\.dev/);
 assert.match(settings,/\.includes\(window\.location\.origin\)/);
 assert.match(settings,/to="\/me\/verify">Run private beta account verification/);
 assert.match(verifier,/const ALLOWED_ACCEPTANCE_ORIGINS = new Set\(\[STAGING_ORIGIN, V5_BETA_ORIGIN\]\)/);
 assert.match(verifier,/if \(!ALLOWED_ACCEPTANCE_ORIGINS\.has\(window\.location\.origin\)\)/);
 assert.doesNotMatch(page,/\/api\/member\/.*method:"POST"/);
});
