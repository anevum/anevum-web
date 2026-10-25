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
test('retired payment flows and proposed charges are absent from public support',()=>{
 assert.equal(home.includes('checkout.stripe.com'),false);
 assert.equal(home.includes('billing.stripe.com'),false);
 assert.equal(home.includes('$36')||home.includes('$5'),false);
 assert.equal(home.includes('Open test checkout')||home.includes('Manage test membership'),false);
 assert.equal(home.includes('/api/v1/member/supporter/checkout'),false);
 assert.equal(home.includes('/api/v1/member/supporter/portal'),false);
 assert.equal(home.includes('Payment enrollment is closed'),true);
 assert.equal(home.includes('to="/join"'),true);
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
