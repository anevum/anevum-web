import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const card=read('web/src/components/CompactMemberIdentity.tsx');
const privateSpace=read('web/src/components/MemberSpaceDashboard.tsx');
const publicSpace=read('web/src/pages/Phase1PublicMemberPage.tsx');
const ribbon=read('web/src/components/MemberPresenceStatus.tsx');
const css=read('web/src/member-presence-v092.css');
const projection=read('canonical-auth/space.mjs');

test('V092 presentation parses and is attached to the existing member surfaces',()=>{
 for(const code of [card,privateSpace,publicSpace,ribbon])
  assert.doesNotThrow(()=>parse(code,{sourceType:'module',plugins:['typescript','jsx']}));
 assert.match(card,/av92-player-card/);
 assert.match(card,/av92-aura-compass/);
 assert.ok(card.includes("import '../member-presence-v092.css'"));
 assert.match(privateSpace,/<MemberPresenceStatus aura=\{space\.aura\}/);
 assert.match(privateSpace,/featuredAwards=\{space\.featuredAwards\}/);
 assert.match(publicSpace,/ms-cover av92-presence-cover/);
 assert.match(publicSpace,/safePlayerAura\(space\.aura\)/);
});

test('V092 never guesses founder role or grants unearned awards',()=>{
 assert.match(card,/safeVerifiedRole\(member\.role\)/);
 assert.match(card,/source==='creator-channel'/);
 assert.match(card,/selectFeaturedBadges/);
 assert.match(ribbon,/safeVerifiedRole\(role\)/);
 assert.match(ribbon,/selectFeaturedBadges\(featuredAwards\|\|\[\],earnedBadges,badgeDisplay\)/);
 assert.match(ribbon,/badge=\{id\} size="tiny" state="earned"/);
 assert.match(ribbon,/verified\?ROLE_LABELS\[verified\]:'Member'/);
 assert.doesNotMatch(ribbon,/localStorage|sessionStorage|fetch\(|staff_access_grants|@anevum.com|member_role_grants/);
 assert.doesNotMatch(card,/email\.includes|@anevum.com|staff_access_grants/);
});

test('V092 reads aura and verified standing through existing guarded server projection',()=>{
 assert.match(privateSpace,/safePlayerAura\(space\?\.aura\)/);
 assert.match(privateSpace,/safeVerifiedRole\(space\?\.role\)/);
 assert.match(publicSpace,/safeVerifiedRole\(space\.role\)/);
 assert.match(projection,/CANONICAL_RECOGNITION_ENABLED==='true'/);
 assert.match(projection,/CANONICAL_REPUTATION_ENABLED==='true'/);
 assert.match(projection,/publicReputationProjection/);
 assert.doesNotMatch(ribbon,/memberChanged|saveRecognition|grant.*role|staffOps|PATCH/);
});

test('V092 responsive treatments respect reduced motion and legible static identity',()=>{
 for(const token of [
  '.av92-player-card','.av92-presence-cover','.av92-presence-status',
  '.av92-presence-rank','.av92-presence-aura','.av92-presence-level',
  '.av92-presence-marks','@media(max-width:430px)',
  '@media(prefers-reduced-motion:reduce)','@media(forced-colors:active)'
 ])assert.ok(css.includes(token),'Absent V092 style: '+token);
 assert.match(ribbon,/aria-label="Member identity and recognition"/);
 assert.match(card,/aria-label=\{'Personal aura: '/);
 assert.doesNotMatch(css,/url\(https?:|image-rendering:\s*pixelated/);
});
