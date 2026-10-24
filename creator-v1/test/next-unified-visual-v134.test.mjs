import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL(file,root),'utf8');
const main=read('web/src/main.tsx');
const app=read('web/src/App.tsx');
const css=read('web/src/continuance-next-visual-v134.css');
const lab=read('web/src/pages/NextVisualLabV134.tsx');
test('V134 only mounts through the explicitly flagged NEXT review path',()=>{
  assert.match(app,/VITE_NEXT_VISUAL_SYSTEM==="true"/);
  assert.match(app,/path="__review\/visual-system"/);
  assert.match(app,/lazy\(\(\)=>import\("\.\/pages\/NextVisualLabV134"\)/);
  assert.match(main,/if \(import\.meta\.env\.VITE_NEXT_VISUAL_SYSTEM === "true"\)/);
  assert.match(main,/void import\("\.\/continuance-next-visual-v134\.css"\)/);
  assert.match(main,/dataset\.avNextVisual = "v134"/);
  assert.match(app,/path="community" element={<CommunityPage\/>}/);
  assert.match(app,/path="studio" element=/);
});
test('global styles have a strict opt-in root, and no raw global reset',()=>{
  assert.match(css,/html\[data-av-next-visual="v134"\]/);
  assert.doesNotMatch(css,/^\s*(?:html|body|:root)\s*\{/m);
  assert.match(css,/--av134-cyan/);
  assert.match(css,/--av134-violet/);
  assert.match(css,/--av134-glass/);
  assert.match(css,/--av134-mono/);
  assert.match(css,/@media \(max-width:430px\)/);
});
test('respect focus, accessible color schemes, responsive layouts and reduced-motion preference',()=>{
  for(const part of ['focus-visible','prefers-reduced-motion:reduce','forced-colors:active','max-width:760px','max-width:430px','min-height:44px','shape-rendering:geometricPrecision'])
    assert.ok(css.includes(part),part);
  assert.match(lab,/role="tablist"/);
  assert.match(lab,/role="tab"/);
  assert.match(lab,/aria-selected=\{active===item\.id\}/);
  assert.match(lab,/aria-pressed=\{previewTab==="scene"\}/);
  assert.match(lab,/aria-label=\{"Edit sample "\+active\}/);
  assert.match(lab,/onKeyDown=\{handleFileKeys/);
});
test('use the canonical ANEVUM SVG mark, not a newly invented brand symbol',()=>{
  assert.match(lab,/import \{OrbitalMark\} from "\.\.\/components\/OrbitalMark"/);
  assert.match(lab,/<OrbitalMark\/>/);
  assert.doesNotMatch(lab,/<IrenGuidedContinuance/);
});
test('sample files edit in memory with safe syntax colors and bounded input',()=>{
  for(const part of ['index.html','styles.css','main.ts','coloredSource','tokenClass','av134-token--','maxLength={12000}','onChange={e=>changeText(e.target.value)}'])
    assert.ok(lab.includes(part),part);
  for(const forbidden of ['localStorage','sessionStorage','window.fetch(','eval(','new Function(','studioUpload(','memberCreate','awardXp('])
    assert.ok(!lab.includes(forbidden),'No persistence, execution or writes: '+forbidden);
});
test('HTML preview has an opaque sandbox, restrictive CSP, and no script execution',()=>{
  assert.match(lab,/sandbox=""/);
  assert.match(lab,/referrerPolicy="no-referrer"/);
  assert.match(lab,/script-src 'none'/);
  assert.match(lab,/default-src 'none'/);
  assert.match(lab,/connect-src 'none'/);
  assert.match(lab,/iframe className="av134-live-frame"/);
  assert.match(lab,/main\.ts is never executed/);
});
test('public and member source controls are not touched by the lab',()=>{
  for(const part of ['LOCAL REVIEW ONLY','No server writes','not attached to a real project','NOT the production Creator Studio'])
    assert.ok(lab.includes(part),part);
  assert.doesNotMatch(lab,/\breadProjects\b|\breadCommunityPosts\b|\bcanonicalAuthClient\b/);
});
