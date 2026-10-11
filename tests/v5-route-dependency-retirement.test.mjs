import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const app=read("src/App.tsx");
const pages=read("src/commons/CommonsPages.tsx");
const worker=read("worker.mjs");
const pkg=JSON.parse(read("package.json"));

test("every V5 App lazy import is mounted by a real route, never an orphan old page",()=>{
  const imports=[...app.matchAll(/^const ([A-Z]\\w+) = lazy\\(\\(\\) => import\\("([^"]+)"\\)\\);/gm)];
  assert.ok(imports.length>=8,"found too few route modules");
  for(const [,identifier,module] of imports){
    assert.match(app,new RegExp("<"+identifier+"(?=[\\s/>])"),"unused route import "+module);
    assert.ok(module.startsWith("./pages/")||module==="./commons/CommonsV5");
  }
  for(const name of ["HomeCompany","Products","RhenProduct","Feed","ResearchHub","FieldNoteDetail","Architecture","Founder","Resume","Releases","ReleaseDetail","SignIn","Privacy","Terms"]){
    assert.doesNotMatch(app,new RegExp("^const "+name+" = lazy\\(","m"),"unreachable old public module "+name);
  }
  for(const path of ["/","/products","/feed","/field-notes","/about","/help","/privacy","/terms"]){
    assert.ok(app.includes('path="'+path+'"'),"V5 route removed "+path);
  }
});
test("public legal and login components retained through Commons, not removed",()=>{
  for(const name of ["Privacy","Terms","SignIn"]){
    assert.ok(pages.includes('import '+name+' from "../pages/'+name+'"'));
    assert.ok(existsSync(new URL("../src/pages/"+name+".tsx",import.meta.url)));
  }
  assert.match(app,/path="\\/command\\/rhen\\/\\*"/);
  assert.match(app,/path="\\/apps\\/rhen\\/\\*"/);
  assert.match(app,/path="\\/me\\/settings"/);
  assert.match(app,/path="\\/me\\/verify"/);
});
test("server public route metadata and separate V5 retirement guards remain intact",()=>{
  assert.match(worker,/function publicRouteMetadata\\(pathname\\)/);
  assert.match(worker,/"\\/help": \\{/);
  assert.match(worker,/retiredRhenBoundary\\(pathname\\)/);
  assert.match(worker,/commandCredential\\(request, env\\)/);
  assert.match(pkg.scripts["test:foundation"],/tests\\/v5-route-dependency-retirement\\.test\\.mjs/);
  for(const p of ["vercel.json",".vercel/project.json"])assert.equal(existsSync(new URL("../"+p,import.meta.url)),false,"obsolete Vercel config tracked: "+p);
});
