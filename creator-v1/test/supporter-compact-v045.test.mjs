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

test('public support status uses the existing compact layout with truthful game-first actions',()=>{
 assert.match(home,/av45-hero/);
 assert.match(home,/av45-offer/);
 assert.match(home,/av45-impact/);
 assert.doesNotMatch(home,/<SupporterTransparency\s*\/>/);
 assert.doesNotMatch(home,/<SupporterRewardsStudio\b/);
 assert.doesNotMatch(home,/SupporterBenefitAtlas|SupporterQuestions/);
 assert.match(home,/to="\/severance"/);
 assert.match(home,/to="\/status"/);
 assert.match(home,/data-support-enrollment="inactive"/);
 assert.match(home,/PAID ENROLLMENT NOT OPEN/);
});
test('retired subscriptions and checkout cannot accidentally reappear on public support page',()=>{
 assert.doesNotMatch(home,/checkout\.stripe\.com|billing\.stripe\.com/);
 assert.doesNotMatch(home,/\/api\/v1\/member\/supporter/);
 assert.doesNotMatch(home,/onClick=\{\(\)=>void action\(/);
 assert.doesNotMatch(home,/<button[^>]*>\s*(?:Open test checkout|Manage test membership)/);
 assert.doesNotMatch(home,/to="\/support\/collection"/);
 assert.doesNotMatch(home,/\$36|\$5|save 40%/);
 assert.match(home,/No checkout, donation collection or supporter payment service is active/);
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
