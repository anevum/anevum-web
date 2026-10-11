import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {preferenceExpectedMemberMatches} from "../src/server/member-preference-guard.mjs";
import {parseMemberCommandResponse,verifiedPreferenceAcknowledgement} from "../src/member/member-command-contract.ts";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const body=(id="member-A")=>({
  user:{id,email:"a@example.test",name:"Member A",operator:true},
  profile:{displayName:"Member A",theme:"dark"},
  savedApps:["rhen"],
  follows:["rhen"],
  entitlements:[],
  owner:{isAdmin:true},
  broker:{key:"should-never-appear"}
});
const request=expected=>new Request("https://anevum-v5-beta.devonakins.workers.dev/api/member/saved-apps/rhen",{
  method:"PUT",headers:expected===null?{}:{"X-ANEVUM-EXPECTED-MEMBER-ID":expected}
});
test("save/follow expected-member header rejects stale browser sessions but never selects a tenant",()=>{
 assert.equal(preferenceExpectedMemberMatches(request("member-A"),"member-A"),true);
 assert.equal(preferenceExpectedMemberMatches(request("member-A"),"member-B"),false);
 assert.equal(preferenceExpectedMemberMatches(request(""),"member-A"),false);
 assert.equal(preferenceExpectedMemberMatches(request(null),"member-A"),true);
 assert.equal(preferenceExpectedMemberMatches(request("member-A"),""),false);
 assert.equal(preferenceExpectedMemberMatches(request("member-A"),"x".repeat(129)),false);
 const server=read("src/server/member.mjs");
 assert.match(server,/import \{ preferenceExpectedMemberMatches \} from "\.\/member-preference-guard\.mjs"/);
 const choices=server.slice(server.indexOf('const choice = pathname.match'));
 const guard=choices.indexOf('!preferenceExpectedMemberMatches(request, user.id)');
 const write=choices.indexOf('INSERT OR IGNORE INTO');
 const remove=choices.indexOf('DELETE FROM');
 assert.ok(guard>=0&&guard<write&&guard<remove);
 assert.match(choices,/WHERE user_id = \?/);
 assert.match(choices,/\.bind\(user\.id, slug\)/);
 assert.match(choices,/return reply\(\{ message: "Authenticated member changed\. Reload your Command\." \}, 409\)/);
 const auth=server.indexOf("const user = session?.user");
 assert.ok(auth>=0&&auth<server.indexOf("const choice = pathname.match"));
 assert.ok(server.indexOf("!safeMutation(request, verifiedOrigin)")<server.indexOf("const choice = pathname.match"));
});

test("Command loads only strictly verified data from its active Better Auth member",()=>{
 const a=parseMemberCommandResponse(body(),"member-A");
 assert.equal(a.user.id,"member-A");
 assert.equal(a.profile.displayName,"Member A");
 assert.deepEqual(a.savedApps,["rhen"]);
 assert.deepEqual(a.follows,["rhen"]);
 assert.deepEqual(a.entitlements,[]);
 assert.equal(Object.isFrozen(a),true);
 assert.equal(Object.isFrozen(a.savedApps),true);
 assert.equal(Object.hasOwn(a,"broker"),false);
 assert.equal(Object.hasOwn(a,"owner"),false);
 assert.equal(Object.hasOwn(a.user,"operator"),false);
 assert.throws(()=>parseMemberCommandResponse(body(),"member-B"),/active member account/);
 assert.throws(()=>parseMemberCommandResponse({...body(),user:{id:"member-B"}},"member-A"));
 assert.throws(()=>parseMemberCommandResponse({...body(),savedApps:["rhen",{}]},"member-A"));
 assert.throws(()=>parseMemberCommandResponse({...body(),follows:["rhen","rhen"]},"member-A"));
 assert.throws(()=>parseMemberCommandResponse({...body(),profile:{displayName:"",theme:"dark"}},"member-A"));
 assert.throws(()=>parseMemberCommandResponse({...body(),profile:{displayName:"Member",theme:"admin"}},"member-A"));
 assert.throws(()=>parseMemberCommandResponse({...body(),entitlements:[{app:"rhen",capability:7}]},"member-A"));
 assert.throws(()=>parseMemberCommandResponse({...body(),entitlements:Array(200).fill({})},"member-A"));
});

test("a response cannot mark a preference mutation successful for a different action",()=>{
 assert.equal(verifiedPreferenceAcknowledgement({saved:true,slug:"rhen"},"rhen",true),true);
 assert.equal(verifiedPreferenceAcknowledgement({saved:false,slug:"rhen"},"rhen",false),true);
 for(const response of [
  null,{},[],{saved:false,slug:"rhen"},
  {saved:true,slug:"other"},
  {saved:true,slug:"rhen",userId:"member-B"},
  {saved:true,slug:"rhen",brokerageAuthorized:true},
  {saved:"true",slug:"rhen"}
 ])assert.equal(verifiedPreferenceAcknowledgement(response,"rhen",true),false);
});

test("Command session-change aborts reads and writes, never renders old user data",()=>{
 const app=read("src/pages/MemberHome.tsx");
 assert.match(app,/key=\{session\?\.user\?\.id \|\| "signed-out"\}/);
 assert.match(app,/const signedIn = enabled && !checking && Boolean\(identity\?\.id\)/);
 assert.match(app,/const scope = useRef<AbortController \| null>\(null\)/);
 assert.match(app,/controller\.abort\(\)/);
 assert.match(app,/scope\.current === controller/);
 assert.match(app,/if \(signal\.aborted\) return/);
 assert.match(app,/parseMemberCommandResponse\(body, identity\.id\)/);
 assert.match(app,/data\.user\.id !== expectedMemberId/);
 assert.match(app,/method: selected \? "DELETE" : "PUT", credentials: "same-origin"/);
 assert.match(app,/"X-ANEVUM-EXPECTED-MEMBER-ID": expectedMemberId/);
 assert.match(app,/signal: controller\.signal/);
 assert.match(app,/verifiedPreferenceAcknowledgement\(confirmation, slug, !selected\)/);
 assert.match(app,/await load\(controller\.signal\)/);
 assert.doesNotMatch(app,/await load\(\)/);
 assert.doesNotMatch(app,/setError\(String\(reason\.message\)\)/);
 assert.match(app,/value\?\.command_admin === true &&/);
 assert.match(app,/value\?\.owner_member_bound === true && value\?\.auth_source === "cloudflare_access"/);
 assert.doesNotMatch(app,/\/v2\/orders|alpacaKey|brokerSecret/);
});
