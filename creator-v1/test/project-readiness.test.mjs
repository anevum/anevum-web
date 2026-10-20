import test from "node:test";
import assert from "node:assert/strict";
import {canSubmitSavedProject,draftFingerprint,projectDestination,projectReadiness} from "../web/src/lib/project-readiness.ts";
import {memberUpdateProject,memberProject,memberSubmitProject} from "../web/src/lib/member-api.ts";

const draft=()=>({slug:"original-game",title:"Original Game",summary:"An original puzzle experience.",category:"games",description:"",freeToUse:true,
  sourceUrl:null,demoUrl:"https://example.org/play",license:null,aiDisclosure:"No AI tools were used.",humanContribution:"I designed and coded the puzzle."});

test("review can only submit the saved version and every editable field invalidates it",()=>{
  const saved=draft();
  assert.equal(canSubmitSavedProject(saved,saved,"draft",false),true);
  for(const [key,value] of Object.entries({slug:"another-game",title:"Changed Title",summary:"A changed project summary.",category:"tools",description:"Changed full description.",freeToUse:false,
    sourceUrl:"https://example.org/source",demoUrl:"https://example.org/other",license:"MIT",aiDisclosure:"AI was used for testing.",humanContribution:"I wrote all the code and made the art."})){
    const edited={...saved,[key]:value};
    assert.notEqual(draftFingerprint(edited),draftFingerprint(saved),key);
    assert.equal(canSubmitSavedProject(edited,saved,"draft",false),false,key);
  }
  assert.equal(canSubmitSavedProject({...saved},saved,"changes_requested",false),true);
  for(const status of ["new","pending_review","published","hidden","rejected"])
    assert.equal(canSubmitSavedProject(saved,saved,status,false),false,status);
  assert.equal(canSubmitSavedProject(saved,null,"draft",false),false);
  assert.equal(canSubmitSavedProject(saved,saved,"draft",true),false);
});

test("readiness is honest about incomplete passports, optional fields and source-only work",()=>{
  assert.ok(projectReadiness(draft()).every(check=>check.ready));
  assert.ok(projectReadiness({...draft(),demoUrl:null,sourceUrl:"https://github.com/anevum/anevum-web"}).every(check=>check.ready));
  for(const bad of [{title:"  "},{slug:"a-"},{summary:"short"},{category:"invented"},{demoUrl:null},{aiDisclosure:"None"},{humanContribution:" "},{license:"x".repeat(81)},{description:"\u0000"}]){
    const incomplete={...draft(),...bad};
    assert.ok(projectReadiness(incomplete).some(check=>!check.ready),JSON.stringify(bad));
    assert.equal(canSubmitSavedProject(incomplete,incomplete,"draft",false),false);
  }
  const invalidOptional={...draft(),sourceUrl:"http://example.org/source"};
  assert.equal(projectReadiness(invalidOptional).find(x=>x.key==="destination").ready,false);
});

test("editor destination checks reject credentials, secrets and private-looking addresses",()=>{
  for(const value of ["http://example.org/","https://user:pass@example.org/","https://localhost/","https://service.internal/","https://127.0.0.1/","https://[::1]/","https://example.org:8080/","https://example.org/?access_token=secret","https://example.org/?PASSWORD=x","javascript:alert(1)"])
    assert.equal(projectDestination(value),null,value);
  assert.equal(projectDestination("https://example.org/play")?.hostname,"example.org");
});

test("server-normalized save is read back before a revision-only review submission",async()=>{
  const original=globalThis.fetch,calls=[];
  const id="a".repeat(32),typed={...draft(),title:"  Original Game  ",demoUrl:"https://example.org"};
  const canonical={...typed,title:"Original Game",demoUrl:"https://example.org/"};
  globalThis.fetch=async(url,init)=>{
    calls.push({url,init});
    const body=init.method==="PATCH"?{id,status:"draft",revision:2}:init.method==="GET"?{project:{...canonical,id,status:"draft",revision:2},reviewHistory:[]}:{id,status:"pending_review",revision:3};
    return new Response(JSON.stringify(body),{headers:{"content-type":"application/json"}});
  };
  try {
    const save=await memberUpdateProject(id,1,typed);
    assert.equal(canSubmitSavedProject(typed,null,save.status,false),false);
    const confirmed=await memberProject(id);
    assert.equal(canSubmitSavedProject(typed,confirmed.project,"draft",false),false);
    assert.equal(canSubmitSavedProject(canonical,confirmed.project,"draft",false),true);
    await memberSubmitProject(id,confirmed.project.revision);
    assert.deepEqual(calls.map(x=>x.init.method),["PATCH","GET","POST"]);
    assert.deepEqual(JSON.parse(calls[2].init.body),{revision:2});
    assert.ok(calls.every(x=>x.init.credentials==="same-origin"&&x.init.mode==="same-origin"));
  }finally{globalThis.fetch=original;}
});
