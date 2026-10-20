import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const catalog=read('web/src/lib/player-recognition.ts');
const studio=read('web/src/components/PlayerCardStudio.tsx');
const card=read('web/src/components/CompactMemberIdentity.tsx');
const codex=read('web/src/pages/AuraCodexPage.tsx');
const app=read('web/src/App.tsx');
const css=read('web/src/pages/aura-codex-v091.css');

test('V091 aura codex preserves six live identifiers and original earned roles',()=>{
 for(const name of ['none','aurora','eclipse','ember','nebula','transcosmic'])
  assert.match(catalog,new RegExp("id:'"+name+"'"));
 assert.match(catalog,/AURA_CATALOG/);
 assert.match(catalog,/safePlayerAura/);
 assert.match(catalog,/VerifiedRole='founder'\|'administrator'\|'moderator'\|'curator'/);
 assert.match(catalog,/ReputationTier='none'\|'signal'\|'orbit'\|'nova'\|'zenith'/);
 assert.doesNotMatch(catalog,/staff_access_grants|member_role_grants|member_xp_events/);
});
test('V091 aura guide is discoverable and contains no invented permissions or achievement previews',()=>{
 for(const source of [studio,card,codex,app])
  assert.doesNotThrow(()=>parse(source,{sourceType:'module',plugins:['typescript','jsx']}));
 assert.match(studio,/AURA_CATALOG\.map/);
 assert.match(studio,/to="\/auras"/);
 assert.match(app,/path="auras"/);
 assert.match(codex,/AURA_CATALOG\.map/);
 assert.match(codex,/not a rank/);
 assert.match(card,/Personal aura:/);
 assert.doesNotMatch(codex,/<LevelEmblem|BadgeInsignia|HonorInsignia|sample member/i);
});
test('V091 codex honors compact mobile layouts and reduced motion',()=>{
 assert.match(css,/@media\(max-width:390px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(read('web/src/components/player-card-studio-v065.css'),/av65-aura-discipline/);
});
