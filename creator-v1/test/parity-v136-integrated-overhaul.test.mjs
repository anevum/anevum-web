/** PARITY V136.022 — maintain integration when working on the active
 * homepage, Community, Discovery, Creator Studio and member world overhaul.
 * These source contracts do not replace browser screenshot acceptance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('future agents have one active source of truth, not split re-start plans',()=>{
 const instructions=read('web/AGENTS.md');
 const handoff=read('../docs/production/ACTIVE-V136-WEB-OVERHAUL.md');
 assert.match(instructions,/ACTIVE-V136-WEB-OVERHAUL\.md/);
 assert.match(handoff,/PR #735/);
 assert.match(handoff,/PR #737/);
 assert.match(handoff,/V136\.018/);
 assert.match(handoff,/V136\.021/);
 assert.match(handoff,/Creator Studio/);
 assert.match(handoff,/Discovery/);
 assert.match(handoff,/Community/);
 assert.match(handoff,/NOT released/);
});
test('creation media uses canonical creator cover or approved first-party category default',()=>{
 const media=read('web/src/components/ProjectThumbnail.tsx');
 const gallery=read('web/src/components/CreatorPackageGallery.tsx');
 const category=read('web/src/lib/project-thumbnails.ts');
 const publicProject=read('web/src/components/ProjectCard.tsx');
 assert.match(media,/safePackageCover\(uploadedUrl\)/);
 assert.match(media,/defaultProjectThumbnailUrl\(kind/);
 assert.match(media,/onError=\{uploaded\?/);
 assert.match(gallery,/uploadedUrl=\{work\.coverUrl\}/);
 assert.match(publicProject,/<ProjectThumbnail/);
 for(const k of ['games','tools','automation','research','creative','learning','libraries','other','simulation','story']){
   assert.ok(category.includes(k+':{asset:'),'Mapped category '+k);
 }
 const assets=readdirSync(new URL('web/public/assets/default-thumbnails/',root))
  .filter(f=>f.endsWith('.svg')).sort();
 assert.deepEqual(assets,['automation','creative','games','learning','libraries','other',
   'research','simulation','story','tools'].map(k=>k+'.svg').sort());
});
test('public space and Community preserve true media, real records and actual sections',()=>{
 const portrait=read('web/src/components/MemberPortrait.tsx');
 const privateMember=read('web/src/components/MemberSpaceDashboard.tsx');
 const publicMember=read('web/src/pages/Phase1PublicMemberPage.tsx');
 const community=read('web/src/pages/CommunityPage.tsx');
 assert.match(portrait,/MemberCoverMedia/);
 assert.match(portrait,/setFailedSrc/);
 assert.match(portrait,/<OrbitalMark\/>/);
 assert.match(privateMember,/<MemberCoverMedia src=\{banner\}/);
 assert.match(publicMember,/ms-public-index/);
 assert.match(publicMember,/member-world-wall/);
 assert.match(publicMember,/member-world-recognition/);
 assert.match(publicMember,/packageGalleryUIEnabled/);
 assert.match(community,/<ProjectThumbnail/);
 assert.doesNotMatch(community,/<div className="ch7-hero-art"/);
});
test('motion-first Institute preserves real Studio capabilities and safe release bounds',()=>{
 const arrival=read('web/src/parity/CinematicArrivalV136.tsx');
 const main=read('web/src/main.tsx');
 const visual=read('web/src/parity/sitewide-interface-v136.css');
 const studio=read('web/src/parity/StudioSpatialWorkspaceV136.tsx');
 const release=read('ops/parity-v136-release.mjs');
 assert.match(arrival,/data-cinematic-v136="motion-first"/);
 assert.match(arrival,/ownerReview&&!posterFailed&&<picture/);
 assert.doesNotMatch(arrival,/cinematicWorldReadiness/);
 assert.match(main,/sitewide-interface-v136\.css/);
 assert.match(visual,/prefers-reduced-motion:reduce/);
 assert.match(visual,/:focus-visible/);
 assert.match(studio,/children/);
 assert.match(read('web/src/parity/ArtifactWorkbenchV136.tsx'),/MonacoSourceV136/);
 assert.match(release,/VITE_PARITY_V136_HORIZON_QA/);
 assert.match(release,/VITE_PARITY_V136_SHARED_SCENE_QA/);
});

test('V136 stops loading the legacy procedural canvas on every route while retaining V131 fallback',()=>{
 const shell=read('web/src/components/Shell.tsx');
 const oldStage=read('web/src/components/ContinuanceWorldStage.tsx');
 assert.match(shell,/!FullParityHeader&&!publicSpatial&&!parityFullBleed&&<ContinuanceWorldStage path=\{location\.pathname\}\/>/);
 assert.match(shell,/\{FullParityHeader&&<ControllerBridgeV136 navigationEnabled=\{publicSpatial\}\/>\}/);
 assert.match(oldStage,/data-continuance-scene=\{room\}/);
 assert.match(read('web/src/parity/CinematicArrivalV136.tsx'),/data-cinematic-v136="motion-first"/);
});
