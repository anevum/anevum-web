import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const snapshot=JSON.parse(readFileSync(new URL('../web/src/data/supporter-transparency-snapshot-v037.json',import.meta.url),'utf8'));
const component=readFileSync(new URL('../web/src/components/SupporterTransparency.tsx',import.meta.url),'utf8');
const page=readFileSync(new URL('../web/src/pages/SupporterPage.tsx',import.meta.url),'utf8');
const detail=readFileSync(new URL('../web/src/pages/SupporterTransparencyPage.tsx',import.meta.url),'utf8');
test('published snapshot is explicitly dated, staging scoped and never pretends to be live',()=>{
 assert.match(snapshot.verifiedOn,/^2026-10-16$/);
 assert.equal(snapshot.liveTelemetry,false);
 assert.match(snapshot.reportingScope,/staging/i);
 assert.equal(snapshot.funding.ledgerConnected,false);
});
test('unverified operating cost, net revenue and supporter counts remain null',()=>{
 for(const key of ['verifiedMonthlySupporterNetUsd','verifiedActiveSupporterCount','approvedMonthlyTargetUsd'])
  assert.equal(snapshot.funding[key],null,key+' must not be a fabricated 0');
 assert.equal(snapshot.operations.verifiedMonthlyOperatingCostUsd,null,'verified monthly operating cost must remain unverified');
 for(const key of ['actualCloudflareMonthlyInvoiceUsd','actualRailwayMonthlyInvoiceUsd','actualOtherMonthlyExpensesUsd','verifiedMonthlyOperatingCostUsd'])
  assert.equal(snapshot.operations[key],null);
 assert.equal(snapshot.offer.activeCheckout,false);
});
test('storage snapshot preserves scope, accounting and source-controlled limits',()=>{
 assert.equal(snapshot.storage.canonicalMemberD1FileBytes,475136);
 assert.equal(snapshot.storage.communityD1FileBytes,278528);
 assert.equal(snapshot.storage.memberUploadedImageBlobBytes,null,'small-cohort image data must be withheld');
 assert.equal(snapshot.storage.memberImageCount,null);
 assert.equal(snapshot.community.stagingMemberAccounts,null);
 assert.equal(snapshot.community.stagingCreatorProfiles,null);
 assert.equal(snapshot.community.stagingWallPosts,null);
 assert.equal(snapshot.privacy.policyVersion,2);
 assert.equal(snapshot.privacy.minimumDistinctContributors,25);
 assert.equal(snapshot.privacy.smallCohortSourceValuesPublished,false);
 assert.equal(snapshot.storage.r2ProfileObjectCount,0);
 assert.equal(snapshot.storage.perImageUploadMaxBytes,262144);
 assert.equal(snapshot.storage.imageSlotsPerMember,2);
 assert.equal(snapshot.storage.generalCreatorAssetQuotaBytes,null);
});
test('future unlocks are not presented as funded or guaranteed',()=>{
 assert.equal(snapshot.milestones.length,4);
 for(const m of snapshot.milestones){
  assert.equal(m.fundingGoalUsdMonthly,null);
  assert.equal(m.verifiedRaisedUsdMonthly,null);
  assert.ok(m.deliverables.length>=2);
 }
});
test('verified progress bars remain available on their own transparency route',()=>{
 assert.match(page,/to="\/support\/transparency"/);
 assert.doesNotMatch(page,/<SupporterTransparency\/>/);
 assert.match(detail,/<SupporterTransparency\/>/);
 assert.match(component,/role="progressbar"/);
 assert.match(component,/No verified denominator available/);
 assert.match(component,/Source is not the same as launch/);
 assert.match(component,/not live telemetry/i);
 assert.match(component,/must not be added together/);
});
