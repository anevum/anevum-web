import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../web/a-canonical-stage.review.mjs';
import {canonicalSpace,jpegDimensions} from '../canonical-auth/space.mjs';
import {fixture} from './helpers/canonical-fixture.mjs';
const origin='https://a.anevum.com';
const req=(path,method='GET',body,cookie,extra={})=>new Request(origin+path,{method,headers:{origin,'sec-fetch-site':'same-origin',...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{}),...extra},body:body?JSON.stringify(body):undefined});
// Structural JPEG fixture only; real browser canvas output is exercised separately.
const jpeg=new Uint8Array([255,216,255,192,0,17,8,1,128,1,128,3,1,17,0,2,17,0,3,17,0,255,217]);

test('member space: real independent sessions, private media/walls, persisted settings, idempotent milestones, public opt-in and revocation',async()=>{
 const {db,env}=fixture();const prior=globalThis.fetch;const codes=new Map();
 globalThis.fetch=async (url,opts)=>{assert.equal(url,'https://api.resend.com/emails');const mail=JSON.parse(opts.body);codes.set(mail.to[0],/verification code is (\d{8})/.exec(mail.text)[1]);return Response.json({id:'offline'})};
 try{
  async function signIn(email){assert.equal((await worker.fetch(req('/api/v1/member/auth/email-otp/send-verification-otp','POST',{email,type:'sign-in'}),env)).status,200);const r=await worker.fetch(req('/api/v1/member/auth/sign-in/email-otp','POST',{email,otp:codes.get(email)}),env);assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0]}
  const a=await signIn('pilot_a@fixture.invalid'),b=await signIn('pilot_b@fixture.invalid');
  const profile='/api/v1/member/creator-profile',space='/api/v1/member/space',wall='/api/v1/member/wall';
  assert.equal((await worker.fetch(req(space),env)).status,401);
  assert.equal((await worker.fetch(req(space,'GET',undefined,a),env)).status,409);
  for(const [cookie,handle] of [[a,'pilot_alpha'],[b,'pilot_beta']])assert.equal((await worker.fetch(req(profile,'POST',{handle,displayName:handle,bio:'A real saved introduction.\nSecond line.'},cookie),env)).status,201);
  const aProfile=await (await worker.fetch(req(profile,'GET',undefined,a),env)).json();
  assert.equal((await worker.fetch(req('/api/v1/members/pilot_alpha/wall'),env)).status,404);
  const post=await worker.fetch(req(wall,'POST',{body:'Hello from my own wall.\nA second line.'},a),env);assert.equal(post.status,201);
  const entries=await (await worker.fetch(req(wall,'GET',undefined,a),env)).json();assert.equal(entries.posts.length,1);const entry=entries.posts[0];
  assert.equal((await (await worker.fetch(req(wall,'GET',undefined,b),env)).json()).posts.length,0);
  assert.equal((await worker.fetch(req(wall+'/'+entry.id,'DELETE',undefined,b),env)).status,404);
  assert.equal((await worker.fetch(req(wall+'/'+entry.id,'PATCH',{body:'Stolen',revision:1},b),env)).status,409);
  assert.equal((await worker.fetch(req(wall+'/'+entry.id,'PATCH',{body:'Updated entry',revision:1},a),env)).status,200);
  assert.equal((await worker.fetch(req(wall+'/'+entry.id,'PATCH',{body:'Stale entry',revision:1},a),env)).status,409);
  for(const slot of ['avatar','banner']){
   const upload=new Request(origin+'/api/v1/member/media/'+slot,{method:'PUT',headers:{cookie:a,origin,'content-type':'image/jpeg'},body:jpeg});
   assert.equal((await worker.fetch(upload,env)).status,200);
   const own=await worker.fetch(req('/api/v1/member/media/'+slot,'GET',undefined,a),env);assert.equal(own.status,200);assert.equal(own.headers.get('content-type'),'image/jpeg');assert.deepEqual(new Uint8Array(await own.arrayBuffer()),jpeg);
   assert.equal((await worker.fetch(req('/api/v1/member/media/'+slot,'GET',undefined,b),env)).status,404);
   assert.equal((await worker.fetch(req('/api/v1/members/pilot_alpha/media/'+slot),env)).status,404);
  }
  let state=await (await worker.fetch(req(space,'GET',undefined,a),env)).json();assert.equal(state.stats.xp,35);assert.equal(state.stats.level,2);assert.equal(state.stats.awards,2);
  assert.equal((await worker.fetch(req(space,'PATCH',{featuredAwards:['fake_award'],showStats:true,revision:0},a),env)).status,400);
  assert.equal((await worker.fetch(req(space,'PATCH',{featuredAwards:['world_shaper'],showStats:false,revision:0},a),env)).status,200);
  assert.equal((await worker.fetch(req(space,'PATCH',{featuredAwards:[],showStats:true,revision:0},a),env)).status,409);
  assert.equal((await worker.fetch(req(profile,'PATCH',{displayName:'Pilot Alpha',bio:'Intro',visibility:'public',revision:aProfile.profile.revision},a),env)).status,200);
  const publicSpace=await worker.fetch(req('/api/v1/members/pilot_alpha/space'),env);assert.equal(publicSpace.status,200);const publicData=await publicSpace.json();assert.equal(publicData.stats,undefined);assert.equal(publicData.revision,undefined);assert.deepEqual(publicData.awards.map(a=>a.id),['world_shaper']);
  const publicWall=await worker.fetch(req('/api/v1/members/pilot_alpha/wall'),env);assert.equal(publicWall.status,200);assert.equal((await publicWall.json()).posts[0].body,'Updated entry');
  assert.equal((await worker.fetch(req('/api/v1/members/pilot_alpha/media/avatar'),env)).status,200);
  assert.equal((await worker.fetch(req(wall,'POST',{body:'CSRF'},a,{origin:'https://evil.invalid'}),env)).status,403);
  assert.equal((await worker.fetch(new Request(origin+'/api/v1/member/media/avatar',{method:'PUT',headers:{cookie:a,'content-type':'image/jpeg'},body:jpeg}),env)).status,403);
  assert.equal((await worker.fetch(req('/api/v1/member/media/avatar','DELETE',undefined,a,{origin:'https://evil.invalid'}),env)).status,403);
  const exportData=await (await worker.fetch(req('/api/v1/member/account-export','GET',undefined,a),env)).json();assert.equal(exportData.wall.length,1);assert.equal(exportData.images.length,2);assert.ok(!JSON.stringify(exportData).includes('pilot_b@fixture.invalid'));
  assert.equal((await worker.fetch(req(profile,'PATCH',{displayName:'Pilot Alpha',bio:'Intro',visibility:'private',revision:2},a),env)).status,200);
  for(const suffix of ['space','wall','media/avatar','media/banner'])assert.equal((await worker.fetch(req('/api/v1/members/pilot_alpha/'+suffix),env)).status,404);
  assert.equal((await worker.fetch(req(wall+'/'+entry.id,'DELETE',undefined,a),env)).status,200);
  state=await (await worker.fetch(req(space,'GET',undefined,a),env)).json();assert.equal(state.stats.wallPosts,0);assert.equal(state.stats.xp,35,'Deleting entries does not revoke or reissue earned milestones');
 }finally{globalThis.fetch=prior;db.close()}
});

test('JPEG bounds, field allowlists, unearned display and mutation rate limits',async()=>{
 const {db,env}=fixture();
 const id='fixture-member';db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,0,0)').run(id,'Fixture','a@fixture.invalid');db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,0,0)').run(id,'fixture_member','Fixture');
 const user={id,emailVerified:true};
 try{
  assert.equal(jpegDimensions(new TextEncoder().encode('<svg></svg>')),null);
  const upload=(bytes,mime='image/jpeg')=>canonicalSpace(new Request(origin+'/api/v1/member/media/avatar',{method:'PUT',headers:{'content-type':mime},body:bytes}),env,user);
  assert.equal((await upload(new TextEncoder().encode('<svg/>'),'image/svg+xml')).status,400);
  assert.equal((await upload(new Uint8Array(262145))).status,400);
  assert.equal((await canonicalSpace(req('/api/v1/member/wall','POST',{body:'Hello',userId:'other',xp:999}),env,user)).status,400);
  assert.equal((await canonicalSpace(req('/api/v1/member/space','PATCH',{featuredAwards:['first_signal'],showStats:true,revision:0}),env,user)).status,400);
  for(let i=0;i<20;i++)assert.equal((await canonicalSpace(req('/api/v1/member/wall','POST',{body:'Entry '+i}),env,user)).status,201);
  assert.equal((await canonicalSpace(req('/api/v1/member/wall','POST',{body:'Over rate'}),env,user)).status,429);
  const snapshot=await (await canonicalSpace(req('/api/v1/member/space'),env,user)).json();assert.equal(snapshot.stats.xp,10);assert.equal(snapshot.stats.awards,1);
 }finally{db.close()}
});
