import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {
 publicSupporterTelemetry,PUBLIC_TELEMETRY_CACHE_SECONDS,
 PUBLIC_TELEMETRY_MIN_COHORT,PUBLIC_TELEMETRY_COUNT_GRANULARITY
} from '../canonical-auth/public-supporter-telemetry.mjs';

const URI='https://a.anevum.com/api/v1/public/supporter/metrics';
const NOW=1792155000000;
const fakeCache=()=>{
 const stored=new Map();let hits=0,writes=0;
 return {
  async match(request){hits++;return stored.get(request.url)?.clone()??null},
  async put(request,response){writes++;stored.set(request.url,response.clone())},
  stats:()=>({hits,writes}),
  seed:(key,response)=>stored.set(key,response)
 };
};
function setup(){
 const {db,env}=fixture();
 env.CANONICAL_SUPPORTER_PUBLIC_METRICS_ENABLED='true';
 const users=[];
 const add=(count,{publicWalls=false,media=false,posts=false}={})=>{
  for(let i=0;i<count;i++){
   const number=users.length+1,member='member-fixture-'+number;
   db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,0,0)')
    .run(member,'User '+number,'member'+number+'@fixture.invalid');
   db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,0,0)')
    .run(member,'member_'+number,'User '+number,'');
   if(publicWalls)db.prepare("UPDATE member_creator_profiles SET visibility='public' WHERE user_id=?").run(member);
   if(media)db.prepare('INSERT INTO member_space_media(user_id,slot,data,version,updated_at) VALUES(?,?,?,?,?)')
    .run(member,'avatar',new Uint8Array(50000).fill(5),1,1);
   if(posts)db.prepare('INSERT INTO member_wall_posts(id,user_id,body,created_at,updated_at) VALUES(?,?,?,?,?)')
    .run(randomUUID(),member,'Private information never published',1,1);
   users.push(member);
  }
 };
 const publishWalls=()=>db.prepare("UPDATE member_creator_profiles SET visibility='public'").run();
 const post=(member)=>db.prepare('INSERT INTO member_wall_posts(id,user_id,body,created_at,updated_at) VALUES(?,?,?,?,?)')
  .run(randomUUID(),member,'Never publish post contents',1,1);
 const query=async({cache=fakeCache(),now=NOW}={})=>{
  const res=await publicSupporterTelemetry(new Request(URI),env,{now,cache});
  return {status:res.status,body:await res.json(),headers:res.headers};
 };
 return {db,env,users,add,publishWalls,post,query};
}
test('24 members, 24 media owners and one prolific poster remain entirely suppressed',async()=>{
 const t=setup();
 try{
  t.add(24,{media:true});
  for(let i=0;i<60;i++)t.post(t.users[0]);
  const {status,body}=await t.query();
  assert.equal(status,200);
  assert.equal(body.schemaVersion,2);
  assert.equal(body.privacy.minimumDistinctContributors,25);
  assert.deepEqual(body.community,{memberAccountsLowerBound:null,creatorProfilesLowerBound:null,wallPostsLowerBound:null});
  assert.deepEqual(body.media,{
   imageObjectsLowerBound:null,imageBytesLowerBound:null,imageSlotsPerMember:2,imageUploadMaxBytes:262144
  });
  assert.equal(JSON.stringify(body).includes('member-fixture'),false);
  assert.equal(JSON.stringify(body).includes('Private information'),false);
  assert.equal(JSON.stringify(body).includes('1200000'),false);
 }finally{t.db.close()}
});
test('25 distinct members/creators/media owners unlock coarse lower bounds, not exact file totals',async()=>{
 const t=setup();
 try{
  t.add(25,{media:true});
  const {status,body}=await t.query();
  assert.equal(status,200);
  assert.equal(body.community.memberAccountsLowerBound,25);
  assert.equal(body.community.creatorProfilesLowerBound,25);
  assert.equal(body.community.wallPostsLowerBound,null,'zero contributing public posters stays suppressed');
  assert.equal(body.media.imageObjectsLowerBound,25);
  assert.equal(body.media.imageBytesLowerBound,1048576,'1.25 MB actual bytes must be coarsened down');
  assert.notEqual(body.media.imageBytesLowerBound,1250000);
  assert.equal(body.excluded.includes('private-wall-posts'),true);
 }finally{t.db.close()}
});
test('25 distinct public posters are required even if one private wall has hundreds of posts',async()=>{
 const t=setup();
 try{
  t.add(25,{media:false,publicWalls:false});
  for(let i=0;i<100;i++)t.post(t.users[0]);
  assert.equal((await t.query()).body.community.wallPostsLowerBound,null);
  t.publishWalls();
  assert.equal((await t.query()).body.community.wallPostsLowerBound,null,'one public poster cannot meet distinct author threshold');
  for(const member of t.users.slice(1))t.post(member);
  const {body}=await t.query();
  assert.equal(body.community.wallPostsLowerBound,100,'124 posts round down to lower bound 100');
 }finally{t.db.close()}
});
test('community bands move only at 25-member increments and do not reveal exact additions',async()=>{
 const t=setup();
 try{
  t.add(49);
  assert.equal((await t.query()).body.community.memberAccountsLowerBound,25);
  t.add(1);
  assert.equal((await t.query()).body.community.memberAccountsLowerBound,50);
  assert.equal(PUBLIC_TELEMETRY_MIN_COHORT,25);
  assert.equal(PUBLIC_TELEMETRY_COUNT_GRANULARITY,25);
 }finally{t.db.close()}
});
test('expired cached responses are recomputed; older v1 cached values are never served',async()=>{
 const t=setup();
 try{
  t.add(25,{publicWalls:true});
  const cache=fakeCache();
  const first=await t.query({cache,now:NOW});
  assert.equal(first.status,200);
  const now=NOW+PUBLIC_TELEMETRY_CACHE_SECONDS*1000+1;
  t.add(25);
  const latest=await t.query({cache,now});
  assert.equal(latest.status,200);
  assert.equal(latest.body.community.memberAccountsLowerBound,50);
  assert.equal(cache.stats().writes,2);

  const alternate=fakeCache();
  alternate.seed(URI+'?policy=v2',new Response(JSON.stringify({
    schemaVersion:1,community:{memberAccounts:2},
    media:{imageBytes:285792}
   }),{status:200,headers:{'x-anevum-public-telemetry':'v1'}}));
  const checked=await t.query({cache:alternate,now});
  assert.equal(checked.body.schemaVersion,2);
  assert.equal('memberAccounts' in checked.body.community,false);
  assert.equal(alternate.stats().writes,1);
  const forged=fakeCache();
  const candidate=JSON.parse(JSON.stringify(checked.body));
  candidate.community.memberAccountsLowerBound=26;
  candidate.privateMemberEmail='private@example.invalid';
  forged.seed(URI+'?policy=v2',new Response(JSON.stringify(candidate),{
   status:200,headers:{'x-anevum-public-telemetry':'v2'}
  }));
  const safe=await t.query({cache:forged,now});
  assert.equal(safe.status,200);
  assert.equal(safe.body.community.memberAccountsLowerBound,50);
  assert.equal('privateMemberEmail' in safe.body,false);
  assert.equal(forged.stats().writes,1,'invalid policy-compliant-looking cache must be replaced');
 }finally{t.db.close()}
});
test('cache write failure prevents public response and does not disclose aggregate payload',async()=>{
 const t=setup();
 try{
  t.add(25);
  const cache={match:async()=>null,put:async()=>{throw Error('Cloudflare cache write unavailable')}};
  const {status,body}=await t.query({cache});
  assert.equal(status,503);
  assert.equal(body.error,'Aggregate metrics unavailable');
 }finally{t.db.close()}
});
test('checked-in static fallback does not include private small-cohort numbers',()=>{
 const s=JSON.parse(readFileSync(new URL('../web/src/data/supporter-transparency-snapshot-v037.json',import.meta.url),'utf8'));
 for(const value of [s.community.stagingMemberAccounts,s.community.stagingCreatorProfiles,
  s.community.stagingWallPosts,s.storage.memberImageCount,s.storage.memberUploadedImageBlobBytes])
  assert.equal(value,null);
 assert.equal(s.privacy.minimumDistinctContributors,25);
 assert.equal(s.privacy.smallCohortSourceValuesPublished,false);
 const client=readFileSync(new URL('../web/src/components/SupporterTransparency.tsx',import.meta.url),'utf8');
 assert.match(client,/protectedCount/);
 assert.match(client,/WITHHELD/);
 assert.match(client,/schemaVersion!==2/);
 assert.match(client,/age>900000/);
 assert.doesNotMatch(client,/\bimageSlots filled\b/i);
});
