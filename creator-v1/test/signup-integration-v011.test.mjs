import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {memberSignInCapabilities,verifiedMemberSignInCapabilities,memberMe} from "../web/src/lib/member-api.ts";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const allowed={
 version:1,registration:"invite-only",linking:"disabled",
 methods:{
  email:{available:true,path:"/api/v1/member/join"},
  google:{available:false},github:{available:false},passkey:{available:false},
  microsoft:{available:false},apple:{available:false}
 }
};
const closed=data=>{
 assert.equal(data.registration,"closed");
 assert.equal(data.linking,"disabled");
 for(const key of ["email","google","github","passkey","microsoft","apple"])
   assert.equal(data.methods[key].available,false,key);
};
test("V011 capability discovery permits only proven invite-only same-origin email",()=>{
 const valid=verifiedMemberSignInCapabilities(allowed);
 assert.equal(valid.registration,"invite-only");
 assert.equal(valid.methods.email.available,true);
 assert.equal(valid.methods.email.path,"/api/v1/member/join");
 assert.equal(valid.linking,"disabled");
 for(const [name,item] of Object.entries(valid.methods))
   if(name!=="email")assert.equal(item.available,false,name);
});

test("unknown, incorrect and forged login providers fail closed rather than render broken actions",()=>{
 for(const item of [
  null,undefined,[],{},false,"invite-only",
  {...allowed,version:2},
  {...allowed,registration:"open"},
  {...allowed,linking:"implicit"},
  {...allowed,methods:null},
  {...allowed,methods:{email:null}},
  {...allowed,methods:{email:{available:true,path:"https://next.anevum.com/api/v1/member/join"}}},
  {...allowed,methods:{email:{available:true,path:"/api/v1/member/verify"}}},
  {...allowed,methods:{email:{available:"true",path:"/api/v1/member/join"}}},
  {...allowed,registration:"closed"}
 ])closed(verifiedMemberSignInCapabilities(item));
 const attacker={...allowed,methods:{...allowed.methods,github:{available:true,path:"/api/auth/github"},google:{available:true,path:"/api/auth/google"}}};
 const clean=verifiedMemberSignInCapabilities(attacker);
 assert.equal(clean.registration,"invite-only");
 assert.equal(clean.methods.github.available,false);
 assert.equal(clean.methods.google.available,false);
});

test("method discovery sends no member cookie, never follows redirects and is same-origin only",async()=>{
 const original=globalThis.fetch;const seen=[];
 globalThis.fetch=async (path,options)=>{
  seen.push({path,options});
  return new Response(JSON.stringify(allowed),{status:200,headers:{"content-type":"application/json"}});
 };
 try{
  assert.equal((await memberSignInCapabilities()).methods.email.available,true);
  const req=seen.at(-1);
  assert.equal(req.path,"/api/v1/member/auth-methods");
  assert.equal(req.options.method,"GET");
  assert.equal(req.options.mode,"same-origin");
  assert.equal(req.options.credentials,"omit");
  assert.equal(req.options.redirect,"error");
  assert.equal(req.options.cache,"no-store");
  assert.equal(req.options.headers.Accept,"application/json");
 }finally{globalThis.fetch=original;}
});

test("real session read remains credentialed but incapable of forging owner identity",async()=>{
 const original=globalThis.fetch;const seen=[];
 globalThis.fetch=async (path,options)=>{
  seen.push({path,options});
  return Response.json({member:{id:"fixture-member",email:"test@invalid.example",handle:"guest_one",displayName:"Guest One",bio:""}});
 };
 try{
  const identity=await memberMe();assert.equal(identity.member.handle,"guest_one");
  assert.equal(seen[0].path,"/api/v1/member/me");
  assert.equal(seen[0].options.credentials,"same-origin");
  assert.equal(seen[0].options.mode,"same-origin");
  assert.equal(seen[0].options.redirect,"error");
 }finally{globalThis.fetch=original;}
});

test("V011 retains V010 featured-award editor, protected routes and both join entrypoints",()=>{
 const app=read("web/src/App.tsx"),gate=read("web/src/components/MemberGate.tsx");
 const edit=read("web/src/pages/MemberProfileEditorPage.tsx");
 const hub=read("web/src/pages/CommunityPage.tsx"),entry=read("web/src/pages/JoinPage.tsx");
 const shell=read("web/src/components/Shell.tsx"),styles=read("web/src/join-page.css");
 const worker=read("web/production-worker.mjs");
 assert.match(app,/path="join" element={<Phase1JoinPage\/>}/);
 assert.match(app,/path="join" element={<JoinPage\/>}/);
 assert.match(app,/path="member" element={<Phase1MemberPage\/>}/);
 assert.match(app,/path="sign-in" element={<Navigate to="\/join" replace\/>}/);
 assert.match(app,/path="sign-in" element={<Navigate to="\/atlas\/join" replace\/>}/);
 assert.match(gate,/!activeMember\.handle/);
 assert.match(gate,/\/atlas\/account\/edit/);
 assert.match(edit,/<FeaturedAwardPicker\/>/);
 assert.match(edit,/accountPath=location\.pathname\.startsWith\("\/atlas\/"\)/);
 assert.match(hub,/CreatorRecognitionStrip/);
 assert.match(shell,/to="\/join" className="cw-signup-link"/);
 assert.match(styles,/\.join-experience/);
 assert.match(styles,/@media\(max-width:500px\)/);
 assert.match(entry,/member\?"SIGNED IN"/);
 assert.match(entry,/method\.id==="email" && emailReady/);
 assert.match(worker,/JOIN_PREFIX\.test\(path\) && path !== "\/join"/);
 assert.doesNotMatch(entry,/Math\.random|localStorage|sessionStorage|postMessage|window\.opener|dangerouslySetInnerHTML/);
});
