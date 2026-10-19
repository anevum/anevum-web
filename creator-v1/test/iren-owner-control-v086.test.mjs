// ANEVUM IREN V086 — owner/member/reward source evidence and least privilege.
// Uses in-memory SQLite and synthetic identities. Never reaches live Cloudflare.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalStaffOps} from '../canonical-auth/staff-ops.mjs';

const PATH='https://anevum.com/api/v1/member/staff-ops';
const mig=n=>readFileSync(new URL('../canonical-auth/migrations/'+n,import.meta.url),'utf8');
const fixtureDb=()=>{
 const f=fixture();
 f.db.exec(mig('0010_staff_command.sql'));
 f.db.exec(mig('0011_staff_roles.sql'));
 // Minimal copies of the already-live V084 recognition *read* schema.
 // No schema migrations or privileged grants are applied outside this DB.
 f.db.exec(`CREATE TABLE member_recognition_preferences (
    user_id TEXT PRIMARY KEY, aura TEXT, badge_mode TEXT
  );
  CREATE TABLE member_recognition_grants (
    user_id TEXT,kind TEXT,recognition_id TEXT,earned_at INTEGER,
    revoked_at INTEGER
  );`);
 const seed=(id,email,name,verified=true)=>{
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,?,?)')
   .run(id,name,email,verified?1:0,'2026-10-19T00:00:00.000Z','2026-10-19T00:00:00.000Z');
 };
 seed('owner-fixture','founder@fixture.invalid','Founder');
 seed('reviewer-fixture','moderator@fixture.invalid','Reviewer');
 seed('member-fixture','studio@fixture.invalid','Studio Member');
 seed('unverified-fixture','pending@fixture.invalid','Pending',false);
 f.db.prepare("INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at) VALUES('owner-fixture','owner','owner-fixture',1792396800,1792396800)").run();
 f.db.prepare("INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at) VALUES('reviewer-fixture','reviewer','owner-fixture',1792396800,1792396800)").run();
 f.db.prepare("INSERT INTO member_recognition_preferences(user_id,aura,badge_mode) VALUES('member-fixture','nebula','curated')").run();
 f.db.prepare("INSERT INTO member_recognition_grants(user_id,kind,recognition_id,earned_at,revoked_at) VALUES('member-fixture','badge','first_orbit',1792396800,NULL)").run();
 f.db.prepare("INSERT INTO member_space_milestones(user_id,milestone,earned_at) VALUES('member-fixture','first_signal',1792396800)").run();
 const owner={id:'owner-fixture',emailVerified:true},reviewer={id:'reviewer-fixture',emailVerified:true},member={id:'member-fixture',emailVerified:true};
 f.env.CANONICAL_STAFF_OPS_ENABLED='true';
 const call=(query='',who=owner)=>canonicalStaffOps(new Request(PATH+query),f.env,who,1792396800);
 return {...f,call,owner,reviewer,member};
};
const close=async(f,run)=>{try{await run(f)}finally{f.db.close()}};

test('owner can page and filter real member records, no stale client fixture',async()=>close(fixtureDb(),async f=>{
 const response=await f.call('?lane=members&q=studio&page=0');
 assert.equal(response.status,200);
 assert.equal(response.headers.get('cache-control'),'private, no-store');
 const r=await response.json();
 assert.equal(r.members.length,1);
 assert.equal(r.members[0].id,'member-fixture');
 assert.equal(r.members[0].email,'studio@fixture.invalid');
 assert.equal(r.members[0].cosmeticAura,'nebula');
 assert.equal(r.members[0].staffRole,null);
 assert.equal(r.pageSize,25);assert.equal(r.hasMore,false);
 const everything=await (await f.call('?lane=members&page=0')).json();
 assert.equal(everything.members.length,4);
 assert.equal(everything.members.find(x=>x.id==='owner-fixture').staffRole,'owner');
 assert.equal(everything.members.find(x=>x.id==='unverified-fixture').verified,false);
 const next=await (await f.call('?lane=members&page=1')).json();
 assert.deepEqual(next.members,[]);
 assert.equal((await f.call('?lane=members&q=s')).status,400);
 assert.equal((await f.call('?lane=members&q=%25')).status,200);
 assert.equal((await f.call('?lane=members&page=999')).status,400);
 assert.equal((await f.call('?lane=members&page=0&page=1')).status,400);
 assert.equal((await f.call('?lane=members&unknown=1')).status,400);
}));
test('earned ledger and cosmetic aura do not confer staff power or unearned XP',async()=>close(fixtureDb(),async f=>{
 const reply=await f.call('?lane=member-rewards&member=member-fixture');
 assert.equal(reply.status,200);
 const data=await reply.json();
 assert.equal(data.memberVerified,true);
 assert.equal(data.cosmeticAura,'nebula');
 assert.equal(data.badgeDisplayMode,'curated');
 assert.equal(data.roleRegistryReady,false);
 assert.deepEqual(data.roleDistinctions,[]);
 assert.equal(data.canIssue,false);assert.equal(data.canChangeXp,false);
 assert.equal(data.grants[0].id,'first_orbit');
 assert.equal(data.milestones[0].id,'first_signal');
 assert.equal((await f.call('?lane=member-rewards&member=unverified-fixture')).status,404);
 assert.equal((await f.call('?lane=member-rewards&member=member-fixture&page=1')).status,400);
}));
test('moderators and ordinary accounts cannot inspect founder member data or release evidence',async()=>close(fixtureDb(),async f=>{
 for(const lane of ['members','member-rewards&member=owner-fixture','release-evidence']){
  const r=await f.call('?lane='+lane,f.reviewer);assert.equal(r.status,403,lane);
  assert.doesNotMatch(JSON.stringify(await r.json()),/founder@fixture|studio@fixture/);
 }
 assert.equal((await f.call('?lane=members',f.member)).status,403);
 assert.equal((await f.call('?lane=members',{id:'owner-fixture',emailVerified:false})).status,401);
}));
test('release panel serves audited build evidence and labels fake staging honestly',async()=>close(fixtureDb(),async f=>{
 const r=await f.call('?lane=release-evidence');
 assert.equal(r.status,200);
 const data=await r.json();
 assert.equal(data.stagingReady,false);
 assert.match(data.stagingReason,/retired/);
 assert.equal(data.releases[0].status,'live');
 assert.equal(data.releases.some(x=>x.status==='synthetic'),true);
 assert.ok(data.releases.every(x=>x.source.startsWith('https://github.com/')));
 assert.equal((await f.call('?lane=release-evidence&q=foo')).status,400);
}));
test('founder-only control room does not invent award-grant or XP write commands',async()=>close(fixtureDb(),async f=>{
 const request=new Request(PATH,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({kind:'grant-unearned-level',memberId:'member-fixture',level:30})});
 const result=await canonicalStaffOps(request,f.env,f.owner);
 assert.equal(result.status,400);
 assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_recognition_grants").get().n,1);
 assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM staff_access_audit").get().n,0);
}));
test('Control Room is actually wired into staff navigation; verified catalog metadata is not user grants',()=>{
 const jsx=readFileSync(new URL('../web/src/pages/StaffCommandPage.tsx',import.meta.url),'utf8');
 const component=readFileSync(new URL('../web/src/components/StaffOwnerControl.tsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('../web/src/components/staff-owner-control-v086.css',import.meta.url),'utf8');
 assert.match(jsx,/pane==='members'&&snapshot.role==='owner'/);
 assert.match(jsx,/StaffOwnerControl onPersonnel/);
 assert.match(jsx,/item.id!=='members'\|\|snapshot.role==='owner'/);
 assert.match(component,/lane=members&q=/);assert.match(component,/lane=member-rewards&member=/);
 assert.match(component,/lane=release-evidence/);
 assert.match(component,/kind:revoke\?'staff-revoke':'staff-grant'/);
 assert.match(component,/BADGE_CATALOG/);assert.match(component,/DISTINCTION_CATALOG/);
 assert.match(css,/ir-owner-members/);assert.match(css,/@media\(max-width:600px\)/);
 assert.doesNotMatch(component,/localStorage|mockMember|fakeGrant|autoGrant/i);
});
