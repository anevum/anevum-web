import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BASE,REVIEW,GATEWAY_HASH,ORIGINAL_ASSET_COUNT,ORIGINAL_EARNED_MEDIA,UI_FILES,REVIEW_FILES,META_FILES} from '../ops/v132-member-collections-package.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('V132 is pinned exactly to the owner-accepted V131 and reviewed V011 source',()=>{
 assert.equal(BASE,'ad0d3aef473e12c124b003d2c3bb45b79bff520e');
 assert.equal(REVIEW,'84c634f5677beaf0ef842281285f7ca537f64fba');
 assert.equal(GATEWAY_HASH,'1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99');
 assert.equal(ORIGINAL_ASSET_COUNT,395);assert.equal(ORIGINAL_EARNED_MEDIA,152);
 assert.equal(UI_FILES.length,10);assert.equal(new Set(REVIEW_FILES).size,REVIEW_FILES.length);
 assert.equal(new Set([...REVIEW_FILES,...META_FILES]).size,REVIEW_FILES.length+META_FILES.length);
});
test('worker and database never modified by this candidate package code',()=>{
 const s=read('ops/v132-member-collections-package.mjs');
 assert.match(s,/SEALED_OFFLINE_ONLY/);
 assert.match(s,/assert\.deepEqual\(finalMedia,media/);
 assert.match(s,/Refuse to overwrite an existing candidate/);
 assert.match(s,/Original Worker bytes drifted/);
 assert.match(s,/uploadAuthorized:false/);
 assert.match(s,/controllerChanged:false,memberDbChanged:false, xpChanged:false/);
 assert.match(s,/VITE_MEMBER_COLLECTION_NAV_REVIEW:true/);
 assert.doesNotMatch(s,/cloudflare\.request|wrangler versions deploy|wrangler deploy|execFileSync\('npx'/);
});
test('saved and earned view retention is a presentation feature, not a permissions change',()=>{
 const saved=read('web/src/pages/CanonicalSavedWorksPage.tsx');
 const vault=read('web/src/components/EarnedRewardVault.tsx');
 const levels=read('web/src/pages/LevelsPage.tsx');
 const recogn=read('web/src/pages/RecognitionRegistryPage.tsx');
 assert.match(saved,/capability\.data\.kind==="canonical-saves"/);
 assert.match(saved,/browseSavedWorks\(items,safeCategory,query\)/);
 assert.match(vault,/const simple=MEMBER_COLLECTION_NAV_REVIEW&&!publicProfile/);
 assert.match(vault,/showHonors&&\(validBadges/);
 assert.match(levels,/showHonors=\{!MEMBER_COLLECTION_NAV_REVIEW\}/);
 assert.match(recogn,/signedIn&&<MemberCollectionNav/);
 assert.doesNotMatch(saved+vault+levels+recogn,/member\/xp-test|grantXp|runMigration|resetXp/);
});
