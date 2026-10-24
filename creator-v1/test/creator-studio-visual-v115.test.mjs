/** V115 isolated visual review source contracts.
 * Synthetic scene/asset UI only; no publishing, member writes, cloud GPU or AI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';

const app=readFileSync('creator-v1/web/src/App.tsx','utf8');
const page=readFileSync('creator-v1/web/src/pages/CreatorStudioVisualReviewV115.tsx','utf8');
const css=readFileSync('creator-v1/web/src/pages/creator-studio-visual-v115.css','utf8');
const spec=readFileSync('docs/production/creator-studio-v115-visual-system-and-build-20261023.md','utf8');

test('P0 Studio TSX parses as a standalone React component',()=>{
 const ast=parse(page,{sourceType:'module',plugins:['typescript','jsx']});
 assert.ok(ast.program.body.length>8);
 assert.match(page,/export function CreatorStudioVisualReviewV115/);
 assert.match(page,/data-creator-visual-review="v115"/);
});

test('review route is opt-in, lazy loaded, isolated from V109+ public and private routes',()=>{
 assert.match(app,/CreatorVisualReviewPageV115=lazy\(\(\)=>import\("\.\/pages\/CreatorStudioVisualReviewV115"\)/);
 assert.match(app,/path="studio\/visual-review" element=\{import\.meta\.env\.VITE_CREATOR_VISUAL_REVIEW_V115==='true'/);
 assert.match(app,/path="studio\/workspace" element=\{import\.meta\.env\.VITE_CREATOR_WORKSPACE_V109==='true'/);
 assert.match(app,/path="studio" element=\{nativeCreatorEnabled/);
 assert.match(app,/path="studio\/records"/);
 assert.match(app,/path="studio\/packages"/);
 assert.match(app,/path="studio\/:projectId"/);
});

test('real OrbitalMark reuse and existing IREN companion; no duplicated assistant identity',()=>{
 assert.match(page,/import \{OrbitalMark\} from '\.\.\/components\/OrbitalMark'/);
 assert.match(page,/anevum:iren-open/);
 assert.match(page,/ONE COMPANION \/ EXISTING SITE RIG/);
 assert.doesNotMatch(page,/api\.openai\.com|api\.anthropic\.com|new Event\('anevum:iren-init'\)/);
});

test('local-only preview; Save is disabled; no API calls, private data or scripts',()=>{
 assert.match(page,/Every name\/object\/asset is synthetic/);
 assert.match(page,/NO PROJECT OR SERVER WRITES/);
 assert.match(page,/<button type="button" className="cvs-primary" disabled/);
 assert.match(page,/NO GPU RENDERER YET/);
 assert.match(page,/No changes were saved/);
 assert.doesNotMatch(page,/\bfetch\s*\(|\baxios\b|\blocalStorage\b|\bsessionStorage\b|\beval\s*\(|new Function|dangerouslySetInnerHTML/);
 assert.doesNotMatch(page,/studioFileUpdate|uploadNativeBuild|studioCreate|studioPublish/);
});

test('real local visual-review controls and multiple editor modes exist',()=>{
 assert.match(page,/const \[mode,setMode\]=useState<Mode>\('World'\)/);
 assert.match(page,/useState<SceneObject\[]>\(STARTERS\)/);
 assert.match(page,/setObjects\(old=>old\.map/);
 assert.match(page,/setObjects\(old=>\[\.\.\.old,/);
 assert.match(page,/function reset\(\)/);
 assert.match(page,/setAssetCategory\(a\)/);
 assert.match(page,/setNight\(e\.target\.checked\)/);
 assert.match(page,/setLight\(Number\(e\.target\.value\)\)/);
 for(const mode of ['World','Interface','Code','Assets','Playtest','Publish'])assert.match(page,new RegExp("mode:'"+mode+"'"));
 assert.match(page,/SELECTED OBJECT/);
 assert.match(page,/LOCAL CHANGES/);
});

test('Instrument Glass visual tokens and mobile/reduced-motion pathways exist',()=>{
 for(const token of ['--v115-void','--v115-surface','--v115-ice','--v115-auric','--v115-violet','--v115-muted','--v115-ok'])
  assert.ok(css.includes(token),token);
 for(const breakpoint of ['1400px','1120px','820px','640px','360px'])
  assert.ok(css.includes('max-width:'+breakpoint),breakpoint);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/focus-visible/);
 assert.match(css,/\bcvs-mobile-actionbar\b/);
 assert.match(page,/aria-label="Mobile workspace panels"/);
 assert.match(page,/aria-label="Demonstration scene hierarchy"/);
});

test('spec separates visual target, live 3D renderer and source migration gates',()=>{
 assert.match(spec,/CONTINUANCE \/ INSTRUMENT GLASS/);
 assert.match(spec,/P0 — Design fidelity/);
 assert.match(spec,/P1 — Functional GPU world editing/);
 assert.match(spec,/P2 — Private persistence/);
 assert.match(spec,/migration 0014/);
 assert.match(spec,/#658/);
 assert.match(spec,/#682/);
 assert.match(spec,/#679/);
 assert.match(spec,/V131/);
});
