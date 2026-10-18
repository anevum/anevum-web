import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const parseTsx=text=>parse(text,{sourceType:'module',plugins:['typescript','jsx']});

test('V078 keeps the canonical player-card component unified across sizes',()=>{
 const identity=read('web/src/components/CompactMemberIdentity.tsx');
 const studio=read('web/src/components/PlayerCardStudio.tsx');
 const css=read('web/src/components/player-card-premium-v078.css');
 for(const code of [identity,studio])assert.doesNotThrow(()=>parseTsx(code));
 assert.match(identity,/export const PlayerCard=CompactMemberIdentity/);
 assert.match(identity,/type PlayerCardSize='inline'\|'compact'\|'standard'\|'featured'/);
 assert.match(identity,/av78-player-card/);
 assert.match(identity,/av78-featured-art/);
 assert.match(identity,/artwork="card"/);
 assert.match(identity,/size==='featured'&&specimen/);
 assert.match(identity,/progress\?:Pick<SpaceStats/);
 assert.match(identity,/member\.progress\.level===level/);
 assert.match(identity,/Number\.isSafeInteger\(member\.progress\.xp\)/);
 assert.match(identity,/MAX LEVEL REACHED/);
 assert.match(identity,/selectFeaturedBadges\(/);
 assert.match(identity,/selectedDistinctions\(/);
 assert.match(identity,/safePlayerAura\(/);
 assert.match(identity,/safeConstellation\(/);
 assert.match(identity,/channel\?\[\]/);
 assert.ok(!identity.includes('status:Online'));
 assert.ok(!identity.includes('2400 / 3000'));
 assert.ok(!identity.includes('allLevels'));
 assert.match(css,/\.av78-player-card\.av65-player-card--featured/);
 assert.match(css,/@media\(max-width:430px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.doesNotMatch(css,/url\(https?:\/\/|image-rendering:\s*pixelated/);
});
test('V078 studio previews actual owner recognition at three scales, without dummy accounts',()=>{
 const studio=read('web/src/components/PlayerCardStudio.tsx');
 const css=read('web/src/components/player-card-studio-v065.css');
 assert.match(studio,/const previewMember:PublicIdentity=/);
 assert.match(studio,/progress:space\.showStats\?space\.stats:undefined/);
 assert.match(studio,/interactive=\{false\}/);
 for(const size of ['featured','compact','inline'])
  assert.ok(studio.includes('size="'+size+'" interactive={false}'));
 assert.match(studio,/av78-preview-variants/);
 assert.match(css,/\.av78-preview-variants/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.doesNotMatch(studio,/QA Member|Luna|Example XP|test_level|unearnedBadge/);
});
test('V078 profile shows only opted-in, authoritative XP; wall and forum cards remain compact',()=>{
 const page=read('web/src/pages/Phase1PublicMemberPage.tsx');
 const wall=read('web/src/components/MemberWall.tsx');
 const member=read('web/src/components/MemberSpaceDashboard.tsx');
 assert.doesNotThrow(()=>parseTsx(page));
 assert.match(page,/level:space\.stats\?\.level\?\?null/);
 assert.match(page,/progress:space\.stats/);
 assert.match(page,/size="featured"/);
 assert.match(wall,/size="compact"/);
 assert.match(member,/showStats:|const \[featured,setFeatured\]/);
 assert.doesNotMatch(page,/LEVEL_ARTIFACTS|shared\/level-artifacts\.json/);
});
test('V078 collectible stage uses existing earned 3D native renderer, not a mock model',()=>{
 const inspector=read('web/src/components/RewardInspector.tsx');
 const css=read('web/src/earned-rewards-v075.css');
 const media=read('canonical-auth/reward-media.mjs');
 assert.doesNotThrow(()=>parseTsx(inspector));
 assert.match(inspector,/av78-reward-inspector--model/);
 assert.match(inspector,/new RewardModelRenderer\(element\)/);
 assert.match(inspector,/rewardModelBase\(reward\.level,handle\)/);
 assert.match(inspector,/native\.current\?\.rotate/);
 assert.match(inspector,/native\.current\?\.setZoom/);
 assert.match(inspector,/native\.current\?\.pause\(\)/);
 assert.match(css,/\.av78-reward-inspector--model \.av75-reward-controls/);
 assert.match(css,/@media\(max-width:690px\)/);
 assert.match(media,/readProgression\(env\.MEMBER_DB,ownerId\)/);
 assert.doesNotMatch(inspector,/model-viewer|fabricate|placeholder-sample/);
});
