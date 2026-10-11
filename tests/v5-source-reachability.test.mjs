import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {auditSourceReachability} from "../scripts/audit-v5-source-reachability.mjs";

test("V5 graph distinguishes published and legacy pages without deletion",()=>{
  const report=auditSourceReachability();
  assert.equal(report.version,"anevum.v5.source-reachability.v1");
  assert.equal(report.runtimeUnresolved.length,0,JSON.stringify(report.runtimeUnresolved));
  assert.ok(report.counts.pages>=30);
  const status=name=>report.pages.find(x=>x.file==="src/pages/"+name+".tsx")?.status;
  assert.equal(status("RhenTerminal"),"RUNTIME_REACHABLE");
  assert.equal(status("Privacy"),"RUNTIME_REACHABLE");
  assert.equal(status("MemberStagingVerify"),"RUNTIME_REACHABLE");
  assert.equal(status("Archive"),"UNREACHED_REVIEW");
  assert.ok(report.counts.unreachedReviewPages>=3);
  assert.ok(report.limitations.some(s=>s.includes("automatically deleted")));
  console.log("V5 reachability inventory: "+JSON.stringify(report.counts));
});
test("relative resolver follows TSX and CSS imports and retains test-only files",()=>{
  const root=mkdtempSync(path.join(os.tmpdir(),"anevum-v5-audit-"));
  const put=(p,source)=>{
    mkdirSync(path.dirname(path.join(root,p)),{recursive:true});
    writeFileSync(path.join(root,p),source);
  };
  try {
    put("worker.mjs","export default {};");
    put("src/App.tsx","import Page from './pages/Active'; export default Page;");
    put("src/main.tsx","import './App'; import './styles/live.css?inline';");
    put("src/pages/Active.tsx","export default function Active(){return null;}");
    put("src/pages/Unused.tsx","export default function Unused(){return null;}");
    put("src/styles/live.css",":host{display:block}");
    put("tests/keep.mjs","import '../src/pages/Unused.tsx';");
    let result=auditSourceReachability(root);
    assert.equal(result.runtimeUnresolved.length,0);
    assert.deepEqual(result.pages,[
      {file:"src/pages/Active.tsx",status:"RUNTIME_REACHABLE"},
      {file:"src/pages/Unused.tsx",status:"NON_RUNTIME_REFERENCE"}
    ]);
    put("src/App.tsx","import './pages/Active'; import './pages/Missing';");
    result=auditSourceReachability(root);
    assert.ok(result.runtimeUnresolved.some(x=>x.specifier==="./pages/Missing"));
  } finally {rmSync(root,{recursive:true,force:true});}
});
