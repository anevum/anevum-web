// Read-only, aggregate beta two-member prerequisites.
// This never replaces the two separate browser /me/verify tests and
// signed-in cross-member denial. No account identifiers or private rows
// are selected, printed, retained or uploaded.
const WORKER="anevum-v5-beta";
const DATABASE="b2f9b4ad-4b97-483c-ae78-5dc7c8da76bf";
const REQUIRED_CONFIRMATION="READ_ISOLATED_BETA_AGGREGATES_ONLY";

export const BETA_TWO_MEMBER_QUERY=[
  "SELECT",
  '(SELECT COUNT(*) FROM "user") AS members,',
  '(SELECT COUNT(*) FROM "user" WHERE "emailVerified"=1) AS verifiedMembers,',
  '(SELECT COUNT(DISTINCT "userId") FROM "account" WHERE "providerId"=\'google\') AS googleMembers,',
  '(SELECT COUNT(*) FROM "member_rhen_workspaces") AS workspaces,',
  '(SELECT COUNT(DISTINCT "user_id") FROM "member_rhen_workspaces") AS workspaceOwners,',
  '(SELECT COUNT(DISTINCT "workspace_id") FROM "member_rhen_workspaces") AS distinctWorkspaces,',
  '(SELECT COUNT(DISTINCT w.user_id) FROM "member_rhen_workspaces" w JOIN "user" u ON u.id=w.user_id JOIN "account" a ON a."userId"=u.id WHERE u."emailVerified"=1 AND a."providerId"=\'google\') AS verifiedGoogleWorkspaceOwners,',
  '(SELECT COUNT(*) FROM "member_rhen_workspaces" w LEFT JOIN "user" u ON w.user_id=u.id WHERE u.id IS NULL) AS orphanWorkspaces,',
  '(SELECT COUNT(*) FROM "member_rhen_drafts") AS drafts'
].join(" ");

const FIELDS=Object.freeze([
  "members","verifiedMembers","googleMembers","workspaces","workspaceOwners",
  "distinctWorkspaces","verifiedGoogleWorkspaceOwners","orphanWorkspaces","drafts"
]);

export function assessTwoMemberAggregates(value){
  if(!value||typeof value!=="object"||Array.isArray(value)||
     Object.keys(value).sort().join("|")!==[...FIELDS].sort().join("|"))
    throw new Error("Beta aggregate response shape invalid.");
  const data={};
  for(const key of FIELDS){
    if(!Number.isSafeInteger(value[key])||value[key]<0||value[key]>1000000)
      throw new Error("Invalid beta aggregate count.");
    data[key]=value[key];
  }
  // Counts are aggregate-only but contradictions still fail the audit.
  if(data.verifiedMembers>data.members||data.googleMembers>data.members||
     data.workspaceOwners>data.workspaces||data.workspaces>data.members||
     data.distinctWorkspaces>data.workspaces||
     data.verifiedGoogleWorkspaceOwners>data.workspaceOwners||
     data.verifiedGoogleWorkspaceOwners>data.googleMembers||
     data.drafts>data.members||
     data.orphanWorkspaces>0||data.distinctWorkspaces!==data.workspaces||
     data.workspaceOwners!==data.workspaces)
    throw new Error("Beta account/workspace integrity inconsistent.");
  const twoMembersReady=data.members>=2&&data.verifiedMembers>=2&&data.googleMembers>=2;
  const twoWorkspacesReady=data.workspaces>=2&&data.workspaceOwners>=2&&
    data.distinctWorkspaces>=2&&data.verifiedGoogleWorkspaceOwners>=2;
  return Object.freeze({
    readyForManualTwoAccountAcceptance:twoMembersReady&&twoWorkspacesReady,
    identityPrerequisites:twoMembersReady?"READY":"AWAITING_SECOND_VERIFIED_GOOGLE_MEMBER",
    workspacePrerequisites:twoWorkspacesReady?"READY":"AWAITING_SECOND_PRIVATE_RHEN_WORKSPACE",
    // Aggregate counters only: never expose user IDs, account IDs, emails,
    // tokens, full provider payloads, individual drafts or workspace IDs.
    counts:Object.freeze(data),
    crossMemberApiIsolation:"NOT_PROVEN_BY_AGGREGATES",
    actualGoogleCallbackAndSessionBehavior:"REQUIRES_TWO_REAL_BROWSER_SESSIONS",
    thirdPartyInvitations:"NOT_AUTHORIZED"
  });
}

export async function fetchBetaTwoMemberAggregates({
  accountId,token,confirmation,fetcher=fetch
}){
  if(confirmation!==REQUIRED_CONFIRMATION)
    throw new Error("Explicit read-only beta audit confirmation required.");
  if(!/^[a-f0-9]{32}$/.test(accountId||"")||typeof token!=="string"||token.length<20)
    throw new Error("Cloudflare audit account/token not configured.");
  const url="https://api.cloudflare.com/client/v4/accounts/"+accountId+
    "/d1/database/"+DATABASE+"/query";
  let response;
  try{
    response=await fetcher(url,{
      method:"POST",redirect:"manual",cache:"no-store",
      headers:{
        "Authorization":"Bearer "+token,
        "Content-Type":"application/json",
        "Accept":"application/json"
      },
      body:JSON.stringify({sql:BETA_TWO_MEMBER_QUERY}),
      signal:AbortSignal.timeout(20000)
    });
  }catch{
    throw new Error("Cloudflare beta aggregate audit request failed.");
  }
  if(response.status!==200)throw new Error("Cloudflare beta aggregate audit HTTP status "+response.status);
  let payload;
  try{payload=await response.json();}catch{throw new Error("Cloudflare beta aggregate response is not JSON.");}
  if(payload?.success!==true||!Array.isArray(payload.result)||
     payload.result.length!==1||payload.result[0]?.success!==true||
     !Array.isArray(payload.result[0].results)||payload.result[0].results.length!==1)
    throw new Error("Cloudflare beta aggregate response invalid.");
  return assessTwoMemberAggregates(payload.result[0].results[0]);
}

if(process.argv[1]?.endsWith("/v5-beta-two-member-aggregate-audit.mjs")){
  fetchBetaTwoMemberAggregates({
    accountId:process.env.CLOUDFLARE_ACCOUNT_ID,
    token:process.env.CLOUDFLARE_D1_TOKEN,
    confirmation:process.env.ANEVUM_BETA_AUDIT_CONFIRMATION
  }).then(result=>{
    console.log("V5 BETA TWO-MEMBER AGGREGATE AUDIT: "+
      (result.readyForManualTwoAccountAcceptance?"PREREQUISITES_READY":"INCOMPLETE"));
    console.log("Member prereqs: "+result.identityPrerequisites);
    console.log("Workspace prereqs: "+result.workspacePrerequisites);
    console.log("Cross-member API isolation: NOT PROVEN by database counts.");
    console.log("Real two-browser acceptance and invitation authorization: REQUIRED.");
  }).catch(error=>{
    console.error("V5 BETA AUDIT BLOCKED: "+(error instanceof Error?error.message:"unknown failure"));
    process.exitCode=1;
  });
}
