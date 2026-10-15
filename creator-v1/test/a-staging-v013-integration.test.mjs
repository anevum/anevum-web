import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import stage from "../web/a-staging-worker.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("V013 keeps the V012 public shell with closed canonical signup UI",()=>{
  const app=read("web/src/App.tsx"),shell=read("web/src/components/Shell.tsx");
  for(const route of ["join","member","account/studio","create","account"])
    assert.ok(app.includes('path="'+route+'"'),route);
  assert.match(app,/LegacyAtlasRedirect/);
  assert.doesNotMatch(app,/<AtlasMorphLayout\/>|<AtlasPage\/>|<WorkspacePage\/>/);
  assert.match(shell,/to:"\/join"/);
  assert.match(read("web/src/pages/Phase1JoinPage.tsx"),/REGISTRATION CLOSED/);
  assert.match(read("web/src/lib/canonical-beta.ts"),/registration==="invite-only"/);
});
test("V013 read-only public staging cannot activate canonical auth or private uploads",async()=>{
  const env={ASSETS:{fetch:async()=>new Response('<div id="root"></div>',{headers:{"content-type":"text/html"}})}};
  for(const path of ["/join","/member","/@example","/account/studio","/create/new"]){
    const res=await stage.fetch(new Request("https://a.anevum.com"+path),env,{});
    assert.equal(res.status,200,path);assert.match(res.headers.get("x-robots-tag")||"",/noindex/);
  }
  for(const path of ["/api/v1/member/auth-methods","/api/v1/member/auth/sign-in/email-otp",
     "/api/v1/member/projects/0123456789abcdef0123456789abcdef/assets","/api/v1/members/example"]){
    const res=await stage.fetch(new Request("https://a.anevum.com"+path),env,{});
    assert.equal(res.status,404,path);
  }
  for(const path of ["/api/v1/member/creator-profile","/api/v1/member/projects/0123456789abcdef0123456789abcdef/assets"]){
    const res=await stage.fetch(new Request("https://a.anevum.com"+path,{method:"POST"}),env,{});
    assert.equal(res.status,405,path);
  }
});
test("Private uploader exists only inside the legacy member-gated project editor",()=>{
  const app=read("web/src/App.tsx"),project=read("web/src/pages/ProjectEditorPage.tsx");
  assert.match(app,/<Route element={<MemberGate\/>}>/);
  assert.match(project,/project&&<CreatorAssetUploader/);
  assert.match(read("web/src/components/CreatorAssetUploader.tsx"),/!available/);
  assert.match(read("web/src/main.tsx"),/staging-integration-v013\.css/);
});
