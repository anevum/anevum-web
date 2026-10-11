import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {studioDraftDirty,studioDraftProblem} from "../src/member/studio-editorial.ts";
const ui=readFileSync(new URL("../src/pages/StudioDashboard.tsx",import.meta.url),"utf8");
const api=readFileSync(new URL("../src/server/studio-content.mjs",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles/commons-v5-studio.css",import.meta.url),"utf8");
const draft={kind:"UPDATE",title:"Verified development note",summary:"A detailed, honest project status update.",
 body:"A first-party update documenting what changed, why, and what remains."};
test("new editor drafts and modified entries are explicitly marked unsaved",()=>{
 assert.equal(studioDraftDirty(null,{kind:"UPDATE",title:"",summary:"",body:""}),false);
 assert.equal(studioDraftDirty(null,{...draft,title:""}),true);
 assert.equal(studioDraftDirty(draft,{...draft}),false);
 assert.equal(studioDraftDirty(draft,{...draft,body:draft.body+" Revised."}),true);
 assert.equal(studioDraftDirty(draft,{...draft,kind:"AHA"}),true);
});
test("invalid Studio drafts explain problems without submitting uncertain writes",()=>{
 assert.equal(studioDraftProblem(draft),null);
 assert.match(studioDraftProblem({...draft,title:"No"})||"",/title/);
 assert.match(studioDraftProblem({...draft,summary:"Short"})||"",/summary/);
 assert.match(studioDraftProblem({...draft,body:"Short"})||"",/body/);
 assert.match(studioDraftProblem({...draft,title:"unsafe\u0000char"})||"",/control characters/);
});
test("publish requires a saved revision and explicit consent",()=>{
 assert.match(ui,/action==="PUBLISH"&&dirty/);
 assert.match(ui,/locked\|\|!grant\.publishingEnabled\|\|dirty/);
 assert.match(ui,/window\.confirm\("Publish this entry on ANEVUM now\?"\)/);
 assert.match(ui,/studioDraftProblem\(form\)/);
 assert.match(ui,/Discard unsaved editorial changes/);
 assert.match(ui,/result\.status===400/);
 assert.match(ui,/result\.status===409/);
});
test("staff-only history validates identity and revision before rendering",()=>{
 assert.match(api,/\/history/);
 assert.match(api,/viewerMemberId:user\.id,entryId:row\.id/);
 assert.match(api,/ORDER BY revision DESC LIMIT 101/);
 assert.match(ui,/data\.viewerMemberId!==id\|\|data\.entryId!==entryId\|\|data\.entryRevision!==expectedRevision/);
 assert.match(ui,/studio-history/);
 assert.match(ui,/Publication audit history/);
 assert.match(ui,/controller\.abort\(\)/);
});
test("private preview preserves readable paragraphs without HTML injection",()=>{
 assert.match(ui,/PRIVATE PREVIEW/);
 assert.match(ui,/studio-preview-body/);
 assert.match(css,/white-space:pre-wrap/);
 assert.doesNotMatch(ui,/dangerouslySetInnerHTML/);
});
