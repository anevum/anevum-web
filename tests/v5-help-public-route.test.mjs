import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app=src("src/App.tsx"),worker=src("worker.mjs"),pages=src("src/commons/CommonsPages.tsx"),sidebar=src("src/commons/CommonsV5.tsx");
const qa=src("scripts/visual-ops-browser-qa.mjs"),pkg=JSON.parse(src("package.json"));
test("Help is a first-class, indexable V5 Commons page in SPA and Worker metadata",()=>{
  assert.match(app, /<Route path="\/help" element=\{<Suspense fallback=\{<Loader \/>\}><CommonsV5 \/><\/Suspense>\} \/>/);
  assert.match(app, /"\/help": "Help — ANEVUM Commons"/);
  assert.match(app, /"\/about", "\/help", "\/resume"/);
  assert.match(pages, /function Help\(\)/);
  assert.match(pages, /if \(pathname === "\/help"\) return <Help\/>/);
  assert.match(worker, /"\/help": \{/);
  assert.match(worker, /title: "Help — ANEVUM Commons"/);
  assert.match(sidebar, /<Link to="\/help">Help<\/Link>/);
});
test("Help links are real and never ask visitors for secret credentials",()=>{
  for (const link of ["/sign-in","/me/settings","/products/rhen/evidence","/products/rhen","/communities","/privacy","/terms","/field-notes","/about"])
    assert.ok(pages.includes('to="'+link+'"'),"missing safe destination "+link);
  for (const text of ["Never share an account export","non-executing drafts","provider approval","Signing in does not automatically enable posting","Do not include passwords"])
    assert.ok(pages.includes(text),"missing truthful user guidance "+text);
  assert.match(pages, /mailto:devon@anevum.com\?subject=ANEVUM%20support/);
  assert.doesNotMatch(pages, /\<form|fetch\(|broker_secret|api_secret|oauth_code|auth_token/i);
  assert.match(qa, /"\/about", "\/help", "\/resume"/);
  assert.match(qa, /route === "\/help"/);
  assert.match(qa, /v\.cards!==6/);
  assert.match(pkg.scripts["test:foundation"], /tests\/v5-help-public-route\.test\.mjs/);
});
