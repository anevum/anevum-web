import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const card=read('web/src/components/CompactMemberIdentity.tsx');
const presence=read('web/src/components/MemberPresenceStatus.tsx');
const privateWorld=read('web/src/components/MemberSpaceDashboard.tsx');
const publicWorld=read('web/src/pages/Phase1PublicMemberPage.tsx');
const stylesheet=read('web/src/member-presence-v092.css');
const backend=read('canonical-auth/space.mjs');
const activity=read('canonical-auth/member-reputation.mjs');

test('V092 presence surface is valid TSX and is connected to both member worlds',()=>{
 for(const component of [card,presence,privateWorld,publicWorld])
  assert.doesNotThrow(()=>parse(component,{sourceType:'module',plugins:['typescript','jsx']}));
 assert.match(card,/av92-player-card av65-aura--/);
 assert.match(card,/av92-aura-compass/);
 assert.match(card,/Personal aura: /);
 assert.match(card,/av81-role-token/);
 assert.match(privateWorld,/<MemberPresenceStatus aura=\{space\.aura\} role=\{space\.role\}/);
 assert.match(privateWorld,/av92-presence-cover--/);
 assert.match(publicWorld,/av92-presence-cover--/);
 assert.match(publicWorld,/<CompactMemberIdentity size="featured"/);
});

test('V092 must not infer founder or moderator from cosmetic preferences or email',()=>{
 assert.match(presence,/safeVerifiedRole\(role\)/);
 assert.match(presence,/safePublicReputation\(reputation\)/);
 assert.match(presence,/safePlayerAura\(aura\)/);
 assert.match(card,/const role=channel\?null:safeVerifiedRole\(member\.role\)/);
 assert.match(card,/const earnedAura:ReputationTier=reputation\?\.tier\?\?'none'/);
 assert.doesNotMatch(presence,/email|member_role_grants|staff_access_grants|localStorage/);
 assert.match(backend,/CANONICAL_RECOGNITION_ENABLED==='true'/);
 assert.match(backend,/CANONICAL_REPUTATION_ENABLED==='true'/);
 assert.match(activity,/member_role_grants/);
 assert.doesNotMatch(presence,/fetch\(|async function/);
});

test('V092 atmosphere and insignia presentations cover all five live affinities and three card sizes',()=>{
 for(const aura of ['aurora','eclipse','ember','nebula','transcosmic']){
  assert.match(stylesheet,new RegExp('av92-player-card\\.av65-aura--'+aura));
  assert.match(stylesheet,new RegExp('av92-presence-cover--'+aura));
 }
 for(const role of ['founder','administrator','moderator','curator'])
  assert.match(stylesheet,new RegExp('av92-presence-role--'+role));
 for(const size of ['featured','compact','inline'])
  assert.match(stylesheet,new RegExp('av65-player-card--'+size));
 assert.match(stylesheet,/@media\(max-width:430px\)/);
 assert.match(stylesheet,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(stylesheet,/@media\(forced-colors:active\)/);
 assert.doesNotMatch(stylesheet,/position:fixed|100vh|pointer-events:auto/);
});

test('V092 protected staff member directory distinguishes saved auras from unsaved previews',()=>{
 const source=read('operations/anevum-iren-staff-observatory-v001.mjs');
 const prefix='const CLIENT = ';
 const start=source.indexOf(prefix);
 assert.ok(start>=0,'Embedded staff frontend must be available for review');
 const end=source.indexOf(';\n',start);
 assert.ok(end>start,'Staff frontend literal must have a terminator');
 const script=JSON.parse(source.slice(start+prefix.length,end));
 assert.doesNotThrow(()=>parse(script,{sourceType:'script'}));
 assert.match(script,/const assignedAura=roles\.includes\(m\.aura\)/);
 assert.match(script,/roles\.includes\(selector\.value\)/);
 assert.match(script,/Preview only/);
 assert.match(script,/member-aura-label/);
 assert.match(source,/member-aura--transcosmic/);
 assert.match(source,/prefers-reduced-motion/);
});
