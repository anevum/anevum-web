import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = p => readFileSync(new URL(p,import.meta.url),'utf8');
const home = read('../web/src/pages/SupporterPage.tsx');
const app = read('../web/src/App.tsx');
const main = read('../web/src/main.tsx');
const css = read('../web/src/supporter-compact-v045.css');
const transparency = read('../web/src/pages/SupporterTransparencyPage.tsx');
const collection = read('../web/src/pages/SupporterCollectionPage.tsx');

test('short invitation does not inline technical dashboards or large collection workbench',()=>{
 assert.match(home,/av45-hero/);
 assert.match(home,/av45-offer/);
 assert.match(home,/av45-impact/);
 assert.doesNotMatch(home,/<SupporterTransparency\s*\/>/);
 assert.doesNotMatch(home,/<SupporterRewardsStudio\b/);
 assert.doesNotMatch(home,/SupporterBenefitAtlas|SupporterQuestions/);
 assert.match(home,/to="\/support\/transparency"/);
 assert.match(home,/to="\/support\/collection"/);
});
test('payment status and prices remain honest and fail-closed',()=>{
 assert.match(home,/billing\?\.available/);
 assert.match(home,/!id\|\|!billing\?\.available\|\|checking\|\|busy/);
 assert.match(home,/checkout\.stripe\.com/);
 assert.match(home,/billing\.stripe\.com/);
 assert.match(home,/ENROLLMENT NOT OPEN/);
 assert.match(home,/Memberships and live payments are not open/);
 assert.match(home,/interval==='year'\?'\$36':'\$5'/);
 assert.match(home,/updateDisplay\(show:boolean\)/);
 assert.match(home,/supporter\?'portal':'checkout'/);
});
test('three route surfaces preserve real transparency and private cosmetics',()=>{
 assert.match(app,/path="support" element=\{<SupporterPage\/>\}/);
 assert.match(app,/path="support\/transparency" element=\{<SupporterTransparencyPage\/>\}/);
 assert.match(app,/path="support\/collection" element=\{<SupporterCollectionPage\/>\}/);
 assert.match(transparency,/<SupporterTransparency\/>/);
 assert.match(collection,/<SupporterRewardsStudio memberId=\{memberId\}\/>/);
 assert.match(collection,/session\?\.user\?\.emailVerified === true/);
});
test('styles are imported, responsive, keyboard friendly and motion aware',()=>{
 assert.match(main,/supporter-compact-v045\.css/);
 assert.match(css,/@media\(max-width:690px\)/);
 assert.match(css,/@media\(max-width:395px\)/);
 assert.match(css, /focus-visible/);
 assert.match(css, /prefers-reduced-motion:reduce/);
 assert.match(css, /forced-colors:active/);
});
