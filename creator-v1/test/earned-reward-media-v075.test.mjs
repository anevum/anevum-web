import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {earnedRewardMedia,matchRewardMedia,earnedRewardInventory,matchRewardInventory} from '../canonical-auth/reward-media.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const levelUrl=(level,kind='scene',handle)=>'https://anevum.com/api/v1/'+
 (handle?'members/'+handle:'member')+'/rewards/levels/'+level+'/'+kind;
const signed={id:'owner-verified',emailVerified:true};
const fakeEnv=(overrides={})=>{
 const assets=[];
 const state={xp:300,visibility:'public',verified:true,stats:true,...overrides};
 const member={
  prepare(sql){return {
   bind(...args){return {
    async all(){
     if(sql.includes('sqlite_master'))return {
      success:true,results:[{name:'member_xp_events'},
       {name:'member_reward_notifications'},{name:'member_notification_receipts'}]};
     if(sql.includes('member_space_milestones'))return {success:true,results:[]};
     throw Error('Unexpected all query '+sql.slice(0,75));
    },
    async first(){
     if(sql.includes("COALESCE(SUM(amount)"))return {xp:state.xp};
     if(sql.includes('WHERE user_id=?')&&sql.includes('SELECT user_id FROM member_creator_profiles'))
      return {user_id:args[0]};
     if(sql.includes("JOIN user u")&&sql.includes("visibility='public'"))
      return state.visibility==='public'&&state.verified?
       {user_id:'owner-verified',show_stats:state.stats?1:0}:null;
     throw Error('Unexpected first query '+sql.slice(0,80));
    }
   }}
  }}
 };
 const jsonRuntime={version:'anevum.mini-native.v062',vertex:'void main(){}',
  fragment:'void main(){}',materials:{stone:[[1,1,1],1,0,0,1,0]},
  accents:Array.from({length:30},(_,i)=>i===2?'#123456':'#abcdef'),
  height:'/evolution/assets/height.png',albedo:'/evolution/assets/albedo.webp'};
 const staticAssets={async fetch(request){
  const assetUrl=new URL(request instanceof URL?request:request.url||request);
  assets.push(assetUrl.pathname);
  const suffix=assetUrl.pathname;
  const type=suffix.endsWith('.json')?'application/json':
   suffix.endsWith('.gz')?'application/gzip':
   suffix.endsWith('.webp')?'image/webp':'image/png';
  return new Response(request instanceof Request&&request.method==='HEAD'?null:
   type==='application/json'?JSON.stringify(jsonRuntime):
   type==='application/gzip'?new Uint8Array([31,139,8,0,0,0,0,0,0,3]):'original optical bytes',
   {status:200,headers:{'content-type':type}});
 }};
 return {env:{MEMBER_DB:member,ASSETS:staticAssets},assets};
};
test('V075 reward asset router matches only numbered levels and known media names',()=>{
 assert.deepEqual(matchRewardMedia('/api/v1/member/rewards/levels/2/scene'),
  {level:2,kind:'scene',handle:null});
 assert.deepEqual(matchRewardMedia('/api/v1/member/rewards/levels/2/card'),
  {level:2,kind:'card',handle:null});
 assert.deepEqual(matchRewardMedia('/api/v1/members/devon/rewards/levels/30/poster'),
  {level:30,kind:'poster',handle:'devon'});
 for(const path of [
  '/api/v1/member/rewards/levels/0/scene',
  '/api/v1/member/rewards/levels/31/scene',
  '/api/v1/member/rewards/levels/02/scene',
  '/api/v1/member/rewards/levels/2/glb',
  '/api/v1/members/other/rewards/levels/30/../../assets/level-30-scene.gz',
  '/evolution/assets/level-30-scene.gz'
 ])assert.equal(matchRewardMedia(path),null,path);
});
test('V075 owner must be verified and never receives unreached level model or poster',async()=>{
 const {env,assets}=fakeEnv();
 const anonymous=await earnedRewardMedia(new Request(levelUrl(2)),env);
 assert.equal(anonymous.status,401);
 const unearned=await earnedRewardMedia(new Request(levelUrl(30)),env,signed);
 assert.equal(unearned.status,404);
 const noSpoiler=await earnedRewardMedia(new Request(levelUrl(30,'poster')),env,signed);
 assert.equal(noSpoiler.status,404);
 const unreachedCard=await earnedRewardMedia(new Request(levelUrl(30,'card')),env,signed);
 assert.equal(unreachedCard.status,404);
 const owned=await earnedRewardMedia(new Request(levelUrl(2)),env,signed);
 assert.equal(owned.status,200);
 assert.equal(owned.headers.get('cache-control'),'private, no-store');
 assert.equal(owned.headers.get('content-type'),'application/gzip');
 assert.ok(assets.every(path=>!path.includes('level-30-')),assets.join(','));
 assert.equal(assets.filter(path=>path.includes('level-02-scene.gz')).length,1);
});
test('V075 public reward media needs verified opt-in profile, visible statistics and sufficient earned level',async()=>{
 for(const changes of [
  {visibility:'private'}, {verified:false},{stats:false},{xp:0}
 ]){
  const {env,assets}=fakeEnv(changes);
  const result=await earnedRewardMedia(new Request(levelUrl(3,'icon','example')),env);
  assert.equal(result.status,404,JSON.stringify(changes));
  assert.deepEqual(assets,[]);
 }
 const {env,assets}=fakeEnv();
 const valid=await earnedRewardMedia(new Request(levelUrl(3,'icon','example')),env);
 assert.equal(valid.status,200);
 assert.equal(valid.headers.get('content-type'),'image/png');
 assert.equal(assets[0],'/evolution/assets/level-03-compact-128.png');
 const card=await earnedRewardMedia(new Request(levelUrl(3,'card','example')),env);
 assert.equal(card.status,200);
 assert.match(card.headers.get('content-type'),/^image\/svg\+xml/);
 assert.equal(card.headers.get('cache-control'),'private, no-store');
 assert.equal(card.headers.get('content-disposition'),'inline');
 assert.match(card.headers.get('content-security-policy'),/script-src 'none'/);
 const xml=await card.text();
 assert.match(xml,/Quantum Foam/);
 assert.match(xml,/viewBox="0 0 256 256"/);
 assert.doesNotMatch(xml,/Symmetry Field|ANEVUM|<script/);
 // SVGs are privately composed in the Worker, not retrieved from direct ASSETS.
 assert.equal(assets.length,1);
 const head=await earnedRewardMedia(new Request(levelUrl(3,'card','example'),{method:'HEAD'}),env);
 assert.equal(head.status,200);
 assert.equal(await head.text(),'');
});
test('V075 runtime never reveals other level colors, static paths or failed image redirects',async()=>{
 const {env}=fakeEnv();
 const url=levelUrl(3,'runtime','example');
 const res=await earnedRewardMedia(new Request(url),env);
 assert.equal(res.status,200);
 const body=await res.json();
 assert.deepEqual(body.accents,['#123456']);
 assert.equal(body.height,'/api/v1/members/example/rewards/levels/3/height');
 assert.equal(body.albedo,'/api/v1/members/example/rewards/levels/3/albedo');
 assert.equal(res.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
 const head=await earnedRewardMedia(new Request(url,{method:'HEAD'}),env);
 assert.equal(head.status,200);
 assert.equal(await head.text(),'');
 const tampered=await earnedRewardMedia(new Request(url+'?level=30'),env);
 assert.equal(tampered.status,404);
 const post=await earnedRewardMedia(new Request(url,{method:'POST'}),env);
 assert.equal(post.status,405);
});
test('V075 direct gallery and model paths are blocked before static ASSETS delivery',()=>{
 const platform=read('apex-prelaunch/platform.mjs');
 const worker=read('canonical-auth/worker.mjs');
 const publicStage=read('web/a-staging-worker.mjs');
 const preview=read('web/staging-path-worker.mjs');
 const prod=read('web/production-worker.mjs');
 for(const s of [platform,publicStage,preview,prod]){
  assert.match(s,/evolution/);
  assert.match(s,/assets/);
 }
 assert.match(platform,/SECRET_EVOLUTION\.test\(url\.pathname\)/);
 assert.match(worker,/ownRewardMedia/);
 assert.match(worker,/publicRewardMedia/);
 assert.match(worker,/earnedRewardMedia\(/);
 assert.match(worker,/auth\.api\.getSession/);
 assert.doesNotMatch(worker,/member_xp_events.*INSERT/);
});
test('V075 renders no public level gallery, badge preview or simulated Level 30 unlock',()=>{
 const levels=read('web/src/pages/LevelsPage.tsx');
 const badges=read('web/src/pages/RecognitionRegistryPage.tsx');
 const vault=read('web/src/components/EarnedRewardVault.tsx');
 const modal=read('web/src/components/RewardInspector.tsx');
 const renderer=read('web/src/lib/reward-model-renderer.ts');
 const notices=read('web/src/components/AnevumNotifications.tsx');
 for(const s of [levels,badges,vault,modal,renderer])
  assert.doesNotThrow(()=>parse(s,{sourceType:'module',plugins:['typescript','jsx']}));
 assert.doesNotMatch(levels,/LevelCollection|\.an-series-grid|\/evolution\//);
 assert.doesNotMatch(badges,/BadgeItem|DistinctionItem|BADGE_CATALOG|statusOf|preview/);
 assert.match(vault,/inventory\?\.levels/);
 assert.match(vault,/validInventory/);
 assert.doesNotMatch(vault,/LEVEL_ARTIFACTS|shared\/level-artifacts\.json/);
 assert.match(vault,/ledger\?\.earnedBadges/);
 assert.match(vault,/EarnedRewardVault/);
 assert.match(modal,/<dialog/);
 assert.match(modal,/<LevelEmblem level=\{level!\} artwork="card"/);
 assert.doesNotMatch(modal,/RewardModelRenderer|<canvas/);
 assert.match(renderer,/DecompressionStream\('gzip'\)/);
 assert.match(renderer,/webgl/);
 assert.doesNotMatch(renderer,/position:'fixed'|document\.body\.appendChild\(canvas\)/);
 assert.doesNotMatch(notices,/notify\(kind==='level'\?\{kind,level:30/);
 assert.match(read('web/src/main.tsx'),/earned-rewards-v075\.css/);
 const member=read('web/src/components/MemberSpaceDashboard.tsx');
 const publicPage=read('web/src/pages/Phase1PublicMemberPage.tsx');
 assert.match(member,/<EarnedRewardVault/);
 assert.match(publicPage,/<EarnedRewardVault/);
 assert.match(publicPage,/handle=\{profile\.handle\}/);
});


test('V075 only earned inventory names are returned; no unreached level metadata',async()=>{
 assert.deepEqual(matchRewardInventory('/api/v1/member/rewards/inventory'),{handle:null});
 assert.deepEqual(matchRewardInventory('/api/v1/members/example/rewards/inventory'),{handle:'example'});
 assert.equal(matchRewardInventory('/api/v1/member/rewards/inventory/30'),null);
 const {env}=fakeEnv();
 const response=await earnedRewardInventory(new Request('https://anevum.com/api/v1/member/rewards/inventory'),env,signed);
 assert.equal(response.status,200);
 const inventory=await response.json();
 assert.equal(inventory.currentLevel,3);
 assert.deepEqual(inventory.levels.map(level=>level.level),[1,2,3]);
 assert.ok(inventory.levels.every(x=>typeof x.name==='string'&&x.subtitle&&x.motion));
 assert.equal(inventory.levels.some(item=>item.level===30),false);
 assert.equal(inventory.levels.some(item=>item.name==='ANEVUM'),false);
 assert.equal(Object.hasOwn(inventory,'allLevels'),false);
 assert.equal(Object.hasOwn(inventory,'testXp'),false);
 const anonymous=await earnedRewardInventory(new Request('https://anevum.com/api/v1/member/rewards/inventory'),env);
 assert.equal(anonymous.status,401);
});
test('V075 public inventory never exposes private, hidden-stats or unverified reward identities',async()=>{
 const path='https://anevum.com/api/v1/members/example/rewards/inventory';
 for(const changes of [{visibility:'private'},{verified:false},{stats:false}]){
  const {env}=fakeEnv(changes);
  const result=await earnedRewardInventory(new Request(path),env);
  assert.equal(result.status,404);
 }
 const {env}=fakeEnv();
 const permitted=await earnedRewardInventory(new Request(path),env);
 assert.equal(permitted.status,200);
 const data=await permitted.json();
 assert.equal(data.levels.length,1);
 assert.equal(data.levels[0].level,3);
 const head=await earnedRewardInventory(new Request(path,{method:'HEAD'}),env);
 assert.equal(head.status,200);
 assert.equal(await head.text(),'');
});
test('V075 shared player-card and inspector code does not bundle all 30 hidden level names',()=>{
 const shared=read('web/src/components/LevelEmblem.tsx');
 const card=read('web/src/components/CompactMemberIdentity.tsx');
 const publicAuthor=read('web/src/components/PublicAuthorShowcase.tsx');
 const vault=read('web/src/components/EarnedRewardVault.tsx');
 for(const code of [shared,card,publicAuthor,vault]){
  assert.doesNotMatch(code,/LEVEL_ARTIFACTS|shared\/level-artifacts\.json/);
 }
 const catalog=read('web/src/components/LevelCollection.tsx');
 assert.doesNotMatch(catalog,/level-artifacts\.json/);
 assert.doesNotMatch(read('web/src/pages/LevelsPage.tsx'),/LevelCollection/);
 assert.match(read('canonical-auth/reward-media.mjs'),/ARTIFACTS\.slice\(0,state\.level\)/);
});


test('V076 original Evolution media uses URL-based private assets and never substitutes OrbitalMark',async()=>{
 const server=read('canonical-auth/reward-media.mjs');
 const emblem=read('web/src/components/LevelEmblem.tsx');
 assert.match(server,/ASSETS\.fetch\(upstream\)/);
 assert.match(server,/https:\/\/assets\.local/);
 assert.doesNotMatch(server,/redirect:'error'/);
 assert.match(emblem,/ARTWORK UNAVAILABLE/);
 assert.doesNotMatch(emblem,/OrbitalMark/);
 const {env,assets}=fakeEnv();
 const accepted=await earnedRewardMedia(new Request(levelUrl(3,'icon','example')),env);
 assert.equal(accepted.status,200);
 assert.equal(accepted.headers.get('content-type'),'image/png');
 assert.deepEqual(assets,['/evolution/assets/level-03-compact-128.png']);
 const unearned=await earnedRewardMedia(new Request(levelUrl(4,'scene','example')),env);
 assert.equal(unearned.status,404);
 assert.equal(assets.length,1);
});
test('V076 identifies transport failure distinctly without relaxing canonical level gating',async()=>{
 const {env}=fakeEnv();
 env.ASSETS={async fetch(){throw Error('asset transport unavailable')}};
 const response=await earnedRewardMedia(new Request(levelUrl(3,'poster','example')),env);
 assert.equal(response.status,502);
 assert.equal(response.headers.get('cache-control'),'private, no-store');
 const denied=await earnedRewardMedia(new Request(levelUrl(30,'poster','example')),env);
 assert.equal(denied.status,404);
});
