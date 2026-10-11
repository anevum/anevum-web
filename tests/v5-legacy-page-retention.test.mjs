import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import path from "node:path";
import os from "node:os";
import {auditLegacyPageRetention} from "../scripts/audit-v5-legacy-page-retention.mjs";
import {listAuditFiles} from "../scripts/audit-v5-source-reachability.mjs";

test("active validator no longer blocks retirement through obsolete public page reads",()=>{
  const report=auditLegacyPageRetention();
  const validatorReferences=report.pages.filter(page=>page.references.some(ref=>ref.file==="scripts/validate-release-registry.mjs"));
  assert.deepEqual(validatorReferences.map(page=>page.file),["src/pages/Command.tsx"]);
  assert.ok(validatorReferences.every(page=>page.status==="RUNTIME_REACHABLE"));
  assert.equal(report.deletionAuthorized,false);
  assert.equal(report.runtimeUnresolved.length,0);
  // Member Beta is a new active page; its source must be retained and counted.
  assert.equal(report.counts.pages,41);
  const beta=report.pages.find(page=>page.file==="src/pages/MemberBeta.tsx");
  assert.equal(beta?.status,"RUNTIME_REACHABLE");
  const founderPaper=report.pages.find(page=>page.file==="src/pages/OwnerPersonalPaperReadiness.tsx");
  assert.equal(founderPaper?.status,"RUNTIME_REACHABLE");
});

test("witnesses, literal reads, join suffixes and documentary mentions remain distinct and read-only",()=>{
  const root=mkdtempSync(path.join(os.tmpdir(),"v5-retention-"));
  const put=(file,content)=>{mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),content);};
  const snapshot=()=>Object.fromEntries(listAuditFiles(root).map(file=>[file,readFileSync(path.join(root,file),"utf8")]));
  try{
    put("worker.mjs","export default {};");
    put("src/main.tsx","import './App';");
    put("src/App.tsx","import './pages/Active';");
    for(const name of ["Active","Read","Join","Auxiliary","Child","Documented","Unused"])
      put(`src/pages/${name}.tsx`,name==="Auxiliary"?"import './Child';":"export default null;");
    put("tests/read.mjs","readFileSync(new URL('../src/pages/Read.tsx', import.meta.url));");
    put("scripts/join.mjs","readFileSync(path.join(ROOT, 'src', 'pages', 'Join.tsx'));");
    put("tests/import.mjs","import '../src/pages/Auxiliary';");
    put("src/pages/Active.tsx","const label='Unused'; export default label;");
    put("docs/keep.md","Historical source: src/pages/Documented.tsx\n");
    const before=snapshot(),report=auditLegacyPageRetention(root);
    const page=name=>report.pages.find(x=>x.file===`src/pages/${name}.tsx`);
    assert.deepEqual(page("Active").runtimePath,["src/main.tsx","src/App.tsx","src/pages/Active.tsx"]);
    assert.equal(page("Read").status,"UNREACHED_REVIEW");
    assert.equal(page("Read").decision,"RETAIN_LITERAL_REFERENCE");
    assert.equal(page("Join").references[0].kind,"STATIC_JOIN_SUFFIX");
    assert.equal(page("Child").decision,"RETAIN_AUXILIARY_DEPENDENCY");
    assert.deepEqual(page("Child").auxiliaryPath,["tests/import.mjs","src/pages/Auxiliary.tsx","src/pages/Child.tsx"]);
    assert.deepEqual(page("Child").importers,["src/pages/Auxiliary.tsx"]);
    assert.equal(page("Documented").decision,"MANUAL_REVIEW_REQUIRED");
    assert.equal(page("Documented").references[0].kind,"TEXT_PATH_MENTION");
    assert.equal(page("Unused").decision,"MANUAL_REVIEW_REQUIRED");
    assert.deepEqual(page("Unused").references,[]);
    assert.deepEqual(auditLegacyPageRetention(root),report);
    assert.deepEqual(snapshot(),before);
    assert.equal(report.deletionAuthorized,false);
    // A newly restored import must immediately prevent retirement.
    put("src/App.tsx","import './pages/Read';");
    assert.equal(auditLegacyPageRetention(root).pages.find(x=>x.file==="src/pages/Read.tsx").decision,"RETAIN_RUNTIME");
    // Incomplete source analysis fails closed instead of producing a safe-to-delete list.
    put("src/App.tsx","import {");
    assert.throws(()=>auditLegacyPageRetention(root));
  }finally{rmSync(root,{recursive:true,force:true});}
});
