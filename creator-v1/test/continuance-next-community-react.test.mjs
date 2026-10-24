import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;
try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')} 
const root=new URL('../',import.meta.url);
const read=(f)=>fs.readFileSync(new URL(f,root),'utf8');
const page=read('web/src/pages/CommunityNextReviewPage.tsx');
const css=read('web/src/pages/community-next-review.css');
const model=read('web/src/lib/commons-next-model.ts');
const appPatch=fs.readFileSync(process.env.ANEVUM_APP_SOURCE || new URL('../web/src/App.tsx',import.meta.url),'utf8');
test('TSX parses as an isolated React component',()=>{
 const r=ts.transpileModule(page,{fileName:'CommunityNextReviewPage.tsx',compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
 assert.equal(r.diagnostics?.length,0);
});
test('live Community uses only existing public canonical read APIs',()=>{
 for(const name of ['readStatus','readProjects','readCommunityPosts','readCreators','readCategories'])
   assert.match(page,new RegExp('\\b'+name+'\\b'));
 for(const banned of ['memberCreateReply','memberReactPost','canonicalEdit','fetch(','localStorage','sessionStorage','new WebSocket','new EventSource'])
   assert.equal(page.includes(banned),false,'Unexpected direct write or persistence: '+banned);
});
test('discussion feature flags fail closed and are server sourced',()=>{
 assert.match(page,/moderatedPostsEnabled\(status\.data\)/);
 assert.match(page,/view!=='signals'\|\|!discussionAvailable/);
 assert.match(page,/\.status===404/);
});
test('read-only public directories are not mistaken for private member worlds',()=>{
 assert.match(page,/Private member worlds remain opt-in/);
 assert.match(page,/creatorRoute\(creator\.handle\)/);
 assert.doesNotMatch(page,/readMember|memberSpace|memberProfile/);
});
test('real data and real empty, loading, error and closed states are distinct',()=>{
 for(const state of ['Public project catalogue unavailable','Nothing published in this view yet','Discussions temporarily unavailable','No approved discussions yet','Public conversations not available yet','Discussion availability unknown'])assert.ok(page.includes(state));
});
test('real canonical mark and single existing shell companion are retained',()=>{
 assert.match(page,/<OrbitalMark\/>/);
 assert.doesNotMatch(page,/<IrenGuidedContinuance|<IrenProvider|<IrenAvatar/);
});
test('the atlas has equivalent semantic list and no fake map activity',()=>{
 assert.match(page,/className="lnx-atlas-list"/);
 assert.match(page,/category taxonomy/);
 assert.match(page,/readCategories/);
 assert.doesNotMatch(page,/onlineCount|random\(\)|Math\.random|viewerCount/);
});
test('preview CSS is strictly prefixed and motion protected',()=>{
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.lnx-root\[data-motion=off\]/);
 assert.match(css,/focus-visible/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.doesNotMatch(css,/^\s*(html|body|:root)\s*\{/m);
});
test('opt-in React route only and live route unchanged',()=>{
 assert.match(appPatch,/VITE_LIVING_COMMONS_REVIEW/);
 assert.match(appPatch,/path="__review\/commons"/);
 assert.match(appPatch,/path="community" element={<CommunityPage\/>}/);
 assert.doesNotMatch(appPatch,/replace CommunityPage/);
});
test('public views are scoped and no invented XP or rewards',()=>{
 assert.match(page,/Only the canonical member inventory/);
 assert.doesNotMatch(page,/setXp|awardBadge|makeEarned|fakeFollowers/);
});
test('the pure URL model parses without JSX',()=>{
 const r=ts.transpileModule(model,{fileName:'commons-next-model.ts',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
 assert.equal(r.diagnostics?.length,0);
});