import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MEMBER_COLLECTION_DESTINATIONS,memberCollectionPath,memberCollectionCurrent} from '../web/src/lib/member-collection-map.ts';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('four explicit canonical member destinations are unambiguous',()=>{
 assert.deepEqual(MEMBER_COLLECTION_DESTINATIONS.map(x=>x.to),['/member','/saved','/levels','/recognition']);
 assert.equal(new Set(MEMBER_COLLECTION_DESTINATIONS.map(x=>x.id)).size,4);
 for(const item of MEMBER_COLLECTION_DESTINATIONS){
  assert.equal(memberCollectionPath(item.id),item.to);
  assert.equal(memberCollectionCurrent(item.to),item.id);
  assert.ok(item.label.length>2&&item.description.length>15);
 }
 assert.equal(memberCollectionCurrent('/saved?sort=recent'),'saved');
 assert.equal(memberCollectionCurrent('/recognition/'),'awards');
 assert.equal(memberCollectionCurrent('/library'),null);
 assert.equal(memberCollectionCurrent('/studio'),null);
 assert.throws(()=>memberCollectionPath('fake'));
});
test('one shared navigation is default-off and grants nothing',()=>{
 const component=read('web/src/components/MemberCollectionNav.tsx');
 const css=read('web/src/member-collection-nav.css');
 assert.match(component,/VITE_MEMBER_COLLECTION_NAV_REVIEW==='true'/);
 assert.match(component,/if\(!MEMBER_COLLECTION_NAV_REVIEW\)return null/);
 assert.match(component,/aria-current=\{current===item\.id\?'page':undefined\}/);
 assert.match(component,/MEMBER_COLLECTION_DESTINATIONS\.map/);
 assert.match(css,/max-width:390px/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
 assert.doesNotMatch(component,/fetch\(|localStorage|sessionStorage|setCanonicalProjectSaved|xp-test|grantXp/);
});
test('member pages retain independent authentication and capability gates',()=>{
 const saved=read('web/src/pages/CanonicalSavedWorksPage.tsx');
 const levels=read('web/src/pages/LevelsPage.tsx');
 const awards=read('web/src/pages/RecognitionRegistryPage.tsx');
 const member=read('web/src/components/MemberSpaceDashboard.tsx');
 assert.match(saved,/capability\.data\.kind==="canonical-saves"/);
 assert.match(saved,/<SavedWorksCollection key=\{member!\.id\}/);
 assert.match(saved,/<MemberCollectionNav current="saved"\/>/);
 assert.match(levels,/\{signedIn&&<MemberCollectionNav current="levels"\/>\}/);
 assert.match(awards,/\{signedIn&&<MemberCollectionNav current="awards"\/>\}/);
 assert.match(member,/<MemberCollectionNav current="space"\/>/);
 assert.match(member,/MemberSpaceDashboardView key=\{profile\.handle\+':'\+profile\.revision\}/);
 assert.match(member,/MEMBER_COLLECTION_NAV_REVIEW\?/);
 assert.match(member,/ms-toolbar-next/);
 assert.match(member,/tab==='wall'&&\(wallError\?/);
 assert.match(member,/PlayerCardStudio profile=\{profile\}/);
 assert.doesNotMatch([saved,levels,awards,member].join(''),/grantXp|new IREN|member\/xp-test/);
});
test('only owner-earned reward lists collapse, not public profiles',()=>{
 const vault=read('web/src/components/EarnedRewardVault.tsx');
 assert.match(vault,/const simple=MEMBER_COLLECTION_NAV_REVIEW&&!publicProfile/);
 assert.match(vault,/records\]\.slice\(-4\)/);
 assert.match(vault,/validBadges\.slice\(0,3\)/);
 assert.match(vault,/shownLevels\.map/);
 assert.match(vault,/shownBadges\.map/);
 assert.match(vault,/shownHonors\.map/);
 assert.match(vault,/aria-expanded=\{allLevels\}/);
 assert.match(vault,/aria-expanded=\{allHonors\}/);
 assert.match(vault,/validInventory\(result,publicProfile\)/);
 assert.doesNotMatch(vault,/level-artifacts\.json|allLevelsCatalogue|fetchAllSpecimens/);
});
test('deep links, privacy and stats controls remain accessible',()=>{
 const app=read('web/src/App.tsx');
 const member=read('web/src/components/MemberSpaceDashboard.tsx');
 for(const route of ['member','saved','levels','recognition'])assert.match(app,new RegExp('path="'+route+'"'));
 for(const tab of ['profile','appearance','awards','wall','overview'])assert.ok(member.includes("tab==='"+tab+"'")||member.includes('tab==="'+tab+'"'));
 assert.match(member,/<VerifiedStaffShortcut location="profile"\/>/);
 assert.match(member,/href="\/api\/v1\/member\/account-export"/);
 assert.match(member,/spaceRequest<MemberSpace>\('\/api\/v1\/member\/space','PATCH'/);
 assert.match(member,/showStats/);
});

test('review mode separates level specimens from awards without affecting legacy vault',()=>{
 const levels=read('web/src/pages/LevelsPage.tsx');
 const badges=read('web/src/pages/RecognitionRegistryPage.tsx');
 const vault=read('web/src/components/EarnedRewardVault.tsx');
 assert.match(levels,/showHonors=\{!MEMBER_COLLECTION_NAV_REVIEW\}/);
 assert.match(vault,/showHonors=true/);
 assert.match(vault,/showHonors&&\(validBadges\.length/);
 assert.match(badges,/!MEMBER_COLLECTION_NAV_REVIEW&&<Link to="\/levels"/);
});
