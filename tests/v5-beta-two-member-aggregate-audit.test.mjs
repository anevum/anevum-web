import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  BETA_TWO_MEMBER_QUERY,assessTwoMemberAggregates,fetchBetaTwoMemberAggregates
} from "../scripts/v5-beta-two-member-aggregate-audit.mjs";

const first=Object.freeze({
 members:1,verifiedMembers:1,googleMembers:1,
 workspaces:1,workspaceOwners:1,distinctWorkspaces:1,
 verifiedGoogleWorkspaceOwners:1,orphanWorkspaces:0,drafts:1
});
const ready=Object.freeze({
 ...first,members:2,verifiedMembers:2,googleMembers:2,
 workspaces:2,workspaceOwners:2,distinctWorkspaces:2,
 verifiedGoogleWorkspaceOwners:2,drafts:2
});

test("real one-member beta is not misreported as two-account acceptance",()=>{
 const result=assessTwoMemberAggregates(first);
 assert.equal(result.readyForManualTwoAccountAcceptance,false);
 assert.equal(result.identityPrerequisites,"AWAITING_SECOND_VERIFIED_GOOGLE_MEMBER");
 assert.equal(result.workspacePrerequisites,"AWAITING_SECOND_PRIVATE_RHEN_WORKSPACE");
 assert.equal(result.crossMemberApiIsolation,"NOT_PROVEN_BY_AGGREGATES");
 assert.equal(result.thirdPartyInvitations,"NOT_AUTHORIZED");
 assert.equal(Object.isFrozen(result),true);
});

test("two verified Google users must own two distinct valid workspaces",()=>{
 const result=assessTwoMemberAggregates(ready);
 assert.equal(result.readyForManualTwoAccountAcceptance,true);
 assert.equal(result.identityPrerequisites,"READY");
 assert.equal(result.workspacePrerequisites,"READY");
 assert.equal(result.crossMemberApiIsolation,"NOT_PROVEN_BY_AGGREGATES");
 assert.equal(result.actualGoogleCallbackAndSessionBehavior,"REQUIRES_TWO_REAL_BROWSER_SESSIONS");
 assert.equal(result.thirdPartyInvitations,"NOT_AUTHORIZED");
 for(const row of [
  {...ready,googleMembers:1},
  {...ready,verifiedMembers:1},
  {...ready,verifiedGoogleWorkspaceOwners:1},
  {...ready,workspaces:1,workspaceOwners:1,distinctWorkspaces:1,
    verifiedGoogleWorkspaceOwners:1},
 ]) assert.equal(assessTwoMemberAggregates(row).readyForManualTwoAccountAcceptance,false);
});

test("fail closed on malformed or contradictory aggregate responses",()=>{
 for(const row of [
  null,{},[ready],{...ready,email:"private@example.test"},
  {...ready,members:"2"},{...ready,members:2.5},{...ready,members:-1},
  {...ready,orphanWorkspaces:1},{...ready,distinctWorkspaces:1},
  {...ready,workspaceOwners:1},{...ready,workspaceOwners:3},
  {...ready,verifiedGoogleWorkspaceOwners:3},
  {...ready,googleMembers:3}
 ]) assert.throws(()=>assessTwoMemberAggregates(row));
});

test("only an explicitly confirmed fixed read-only Cloudflare beta aggregate query is executed",async()=>{
 const calls=[];
 const fetcher=async (url,request)=>{
  calls.push({url,request});
  return Response.json({success:true,result:[{success:true,results:[first]}]});
 };
 const input={accountId:"2f7ee83107240152097efd956a4e8335",
   token:"abcdefghijklmnopqrstuvwxyz0123456789",
   confirmation:"READ_ISOLATED_BETA_AGGREGATES_ONLY",fetcher};
 await assert.rejects(fetchBetaTwoMemberAggregates({...input,confirmation:"READ_PROD"}));
 assert.equal(calls.length,0);
 const result=await fetchBetaTwoMemberAggregates(input);
 assert.equal(result.readyForManualTwoAccountAcceptance,false);
 assert.equal(calls.length,1);
 assert.equal(calls[0].request.method,"POST");
 assert.equal(calls[0].request.redirect,"manual");
 assert.equal(calls[0].request.cache,"no-store");
 assert.equal(calls[0].request.headers.Authorization,"Bearer "+input.token);
 assert.ok(calls[0].url.endsWith("/d1/database/b2f9b4ad-4b97-483c-ae78-5dc7c8da76bf/query"));
 assert.equal(JSON.parse(calls[0].request.body).sql,BETA_TWO_MEMBER_QUERY);
 assert.match(BETA_TWO_MEMBER_QUERY,/COUNT\(DISTINCT w\.user_id\)/);
 assert.doesNotMatch(BETA_TWO_MEMBER_QUERY,/\b(INSERT|UPDATE|DELETE|DROP|ALTER|ATTACH|CREATE|REPLACE)\b/i);
 assert.doesNotMatch(BETA_TWO_MEMBER_QUERY,/\bSELECT\s+(?:\*|email|token|accountId|workspace_id)\b/i);
 const auditSource=readFileSync(new URL("../scripts/v5-beta-two-member-aggregate-audit.mjs",import.meta.url),"utf8");
 assert.doesNotMatch(auditSource,/console\.log\(\s*(?:payload|response|token|accountId|url)\s*\)/);
});

test("Cloudflare error bodies are not reflected or logged",async()=>{
 const a={accountId:"2f7ee83107240152097efd956a4e8335",
  token:"abcdefghijklmnopqrstuvwxyz0123456789",
  confirmation:"READ_ISOLATED_BETA_AGGREGATES_ONLY"};
 for(const response of [
  new Response("secret-error",{status:403}),
  Response.json({success:false,errors:[{message:"secret-detail"}]}),
  Response.json({success:true,result:[{success:true,results:[{email:"secret-detail"}]}]})
 ])await assert.rejects(fetchBetaTwoMemberAggregates({
    ...a,fetcher:async()=>response
 }),e=>!String(e.message).includes("secret"));
});
