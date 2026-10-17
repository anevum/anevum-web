import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {awardPublicProfileBadge,forumApprovalBadgeStatements} from '../canonical-auth/recognition-issuer.mjs';
import {recognitionReady,memberRecognitionState,publicRecognitionSummary} from '../canonical-auth/recognition.mjs';
import {hydratedPublicMemberCards} from '../canonical-auth/public-member-card.mjs';

const migration=readFileSync(new URL('../canonical-auth/migrations/0010_player_recognition.sql',import.meta.url),'utf8');
let counter=0;
const unique=()=>String(++counter).padStart(36,'0');
function createDb(){
 const raw=new DatabaseSync(':memory:');
 raw.exec(`
 CREATE TABLE "user"(id TEXT PRIMARY KEY);
 CREATE TABLE member_creator_profiles(user_id TEXT PRIMARY KEY REFERENCES "user"(id),handle TEXT NOT NULL,visibility TEXT NOT NULL);
 CREATE TABLE member_space_settings(user_id TEXT PRIMARY KEY REFERENCES "user"(id),featured_json TEXT NOT NULL DEFAULT '[]',show_stats INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE member_space_milestones(user_id TEXT,milestone TEXT,earned_at INTEGER,PRIMARY KEY(user_id,milestone));
 CREATE TABLE member_reward_notifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT NOT NULL,kind TEXT NOT NULL,reference TEXT NOT NULL,created_at INTEGER NOT NULL,UNIQUE(user_id,kind,reference));
 CREATE TABLE member_forum_threads(id TEXT PRIMARY KEY,author_id TEXT NOT NULL,status TEXT NOT NULL,published_at INTEGER,body TEXT NOT NULL);
 CREATE TABLE member_forum_replies(id TEXT PRIMARY KEY,thread_id TEXT NOT NULL,author_id TEXT NOT NULL,status TEXT NOT NULL,published_at INTEGER,body TEXT NOT NULL);
 CREATE TABLE member_forum_review_log(id TEXT PRIMARY KEY,reviewer_id TEXT NOT NULL,target_kind TEXT NOT NULL,target_id TEXT NOT NULL,action TEXT NOT NULL);
 CREATE TABLE member_creator_edit_limits(user_id TEXT PRIMARY KEY,window_start INTEGER NOT NULL,requests INTEGER NOT NULL);
 INSERT INTO "user"(id) VALUES ('creator'),('moderator'),('newcomer');
 INSERT INTO member_creator_profiles(user_id,handle,visibility) VALUES ('creator','creator_sample','public'),('newcomer','newcomer_sample','private');
 INSERT INTO member_space_settings(user_id,featured_json) VALUES ('creator','[]');
 `);
 raw.exec(migration);
 const db={
  raw,
  prepare(sql){
   const stmt=raw.prepare(sql);
   const wrapper={
    args:[],
    bind(...args){wrapper.args=args;return wrapper},
    async first(){return stmt.get(...wrapper.args)||null},
    async all(){return {success:true,results:stmt.all(...wrapper.args)}},
    async run(){const r=stmt.run(...wrapper.args);return {success:true,meta:{changes:r.changes}}}
   };
   return wrapper;
  },
  async batch(stmts){
   raw.exec('BEGIN IMMEDIATE');
   try{
    const out=[];
    for(const stmt of stmts){
     const item=await stmt.run();
     out.push({...item,results:[]});
    }
    raw.exec('COMMIT');
    return out;
   }catch(e){raw.exec('ROLLBACK');throw e}
  }
 };
 return db;
}
const one=(db,sql,...args)=>db.raw.prepare(sql).get(...args);
const total=(db,name)=>Number(one(db,'SELECT COUNT(*) AS c FROM '+name).c);
const addApproved=(db,{kind='thread',id=unique(),at=100000,author='creator',reviewer='moderator',audit=true}={})=>{
 const table=kind==='thread'?'member_forum_threads':'member_forum_replies';
 if(kind==='thread')db.raw.prepare('INSERT INTO member_forum_threads(id,author_id,status,published_at,body) VALUES(?,?,?,?,?)')
  .run(id,author,'published',at,'Original independently moderated conversation with meaningful discussion and substance. '.repeat(3));
 else db.raw.prepare('INSERT INTO member_forum_replies(id,thread_id,author_id,status,published_at,body) VALUES(?,?,?,?,?,?)')
  .run(id,'thread-1',author,'published',at,'Detailed thoughtful response');
 const reviewId=unique();
 if(audit)db.raw.prepare('INSERT INTO member_forum_review_log(id,reviewer_id,target_kind,target_id,action) VALUES(?,?,?,?,?)')
  .run(reviewId,reviewer,kind,id,'publish');
 return {kind,targetId:id,reviewId,reviewerId:reviewer,enabled:true,now:at};
};
test('migration is additive and preserves pre-existing member progress and privacy',async t=>{
 const db=createDb();t.after(()=>db.raw.close());
 assert.equal(await recognitionReady(db),true);
 assert.equal(one(db,"SELECT badge_mode FROM member_recognition_preferences WHERE user_id='creator'").badge_mode,'hidden');
 assert.equal(total(db,'member_recognition_grants'),0);
 assert.equal(total(db,'member_reward_notifications'),0);
});
test('First Orbit mints exactly once from a canonical public profile and cannot bypass closed feature flag',async t=>{
 const db=createDb();t.after(()=>db.raw.close());
 assert.equal(await awardPublicProfileBadge(db,'newcomer',100,false),false);
 assert.equal(await awardPublicProfileBadge(db,'newcomer',100,true),false);
 assert.equal(await awardPublicProfileBadge(db,'creator',100,true),true);
 assert.equal(await awardPublicProfileBadge(db,'creator',101,true),false);
 assert.equal(one(db,"SELECT COUNT(*) AS c FROM member_recognition_grants WHERE recognition_id='first_orbit'").c,1);
 assert.equal(one(db,"SELECT COUNT(*) AS c FROM member_reward_notifications WHERE reference='first_orbit'").c,1);
 // An opted-in member's old hidden preference must not be silently widened.
 const visible=await publicRecognitionSummary(db,'creator');
 assert.equal(visible.featuredAwards.length,0);
 const privateState=await memberRecognitionState(db,'creator');
 assert.deepEqual(privateState.earnedBadges.map(b=>b.id),['first_orbit']);
});
test('approved forum thread and response grant badges, never double reward on replay',async t=>{
 const db=createDb();t.after(()=>db.raw.close());
 const thread=addApproved(db,{at:100000});
 let instructions=await forumApprovalBadgeStatements(db,thread);
 assert.equal(instructions.length,4); // Two possible grants plus two idempotent notifications
 await db.batch(instructions);
 await db.batch(await forumApprovalBadgeStatements(db,thread));
 assert.equal(one(db,"SELECT COUNT(*) AS c FROM member_recognition_grants WHERE recognition_id='first_thread'").c,1);
 assert.equal(one(db,"SELECT COUNT(*) AS c FROM member_reward_notifications WHERE reference='first_thread'").c,1);
 const reply=addApproved(db,{kind:'reply',at:100200});
 await db.batch(await forumApprovalBadgeStatements(db,reply));
 await db.batch(await forumApprovalBadgeStatements(db,reply));
 assert.equal(one(db,"SELECT COUNT(*) AS c FROM member_recognition_grants WHERE recognition_id='first_reply'").c,1);
 assert.equal(one(db,"SELECT COUNT(*) AS c FROM member_reward_notifications WHERE reference='first_reply'").c,1);
 assert.equal(total(db,'member_recognition_grants'),2);
});
test('unreviewed posts, self-review, and disabled feature cannot issue any recognition',async t=>{
 const db=createDb();t.after(()=>db.raw.close());
 const noAudit=addApproved(db,{audit:false,at:120000});
 await db.batch(await forumApprovalBadgeStatements(db,noAudit));
 const self=addApproved(db,{reviewer:'creator',at:130000});
 await db.batch(await forumApprovalBadgeStatements(db,self));
 const disabled=addApproved(db,{at:140000});
 assert.deepEqual(await forumApprovalBadgeStatements(db,{...disabled,enabled:false}),[]);
 assert.equal(total(db,'member_recognition_grants'),0);
 assert.equal(total(db,'member_reward_notifications'),0);
});
test('Open Channel requires ten substantive approved discussions on ten UTC dates',async t=>{
 const db=createDb();t.after(()=>db.raw.close());
 for(let i=0;i<9;i++){
  const info=addApproved(db,{at:100000+i*86400});
  await db.batch(await forumApprovalBadgeStatements(db,info));
 }
 assert.equal(one(db,"SELECT COUNT(*) AS c FROM member_recognition_grants WHERE recognition_id='conversationalist'").c,0);
 const tenth=addApproved(db,{at:100000+9*86400});
 await db.batch(await forumApprovalBadgeStatements(db,tenth));
 assert.equal(one(db,"SELECT COUNT(*) AS c FROM member_recognition_grants WHERE recognition_id='conversationalist'").c,1);
 assert.equal(one(db,"SELECT COUNT(*) AS c FROM member_reward_notifications WHERE reference='conversationalist'").c,1);
 await db.batch(await forumApprovalBadgeStatements(db,tenth));
 assert.equal(one(db,"SELECT COUNT(*) AS c FROM member_recognition_grants WHERE recognition_id='conversationalist'").c,1);
});
test('a grant with an unrelated or fabricated audit reference must fail closed',async t=>{
 const db=createDb();t.after(()=>db.raw.close());
 const info=addApproved(db,{at:120000});
 await db.batch(await forumApprovalBadgeStatements(db,{...info,reviewId:unique()}));
 assert.equal(total(db,'member_recognition_grants'),0);
});

test('25 canonical member cards share one bounded verified-recognition projection, never 25 separate ledger reads',async t=>{
 const db=createDb();t.after(()=>db.raw.close());
 await awardPublicProfileBadge(db,'creator',1234,true);
 db.raw.prepare("UPDATE member_recognition_preferences SET badge_mode='automatic' WHERE user_id='creator'").run();
 db.raw.prepare("UPDATE member_creator_profiles SET visibility='public' WHERE user_id='newcomer'").run();
 const source=[
  {member_identity_key:'creator',handle:'creator_sample',display_name:'First Creator',avatar:1,show_stats:1,
   featured_json:'[]',earned_awards:null,member_xp:0},
  {member_identity_key:'newcomer',handle:'newcomer_sample',display_name:'Second Creator',avatar:0,show_stats:0,
   featured_json:'[]',earned_awards:null,member_xp:100}
 ];
 // Long forum threads frequently contain the same few authors. The
 // per-user grant reads must remain constant regardless of card count.
 const rows=Array.from({length:25},(_,i)=>source[i%2]);
 let queryCount=0;
 const originalPrepare=db.prepare.bind(db);
 db.prepare=function(sql){queryCount++;return originalPrepare(sql)};
 const cards=await hydratedPublicMemberCards(db,rows,true);
 assert.equal(queryCount,4,'one schema read and three bounded recognition queries');
 assert.equal(cards.length,25);
 assert.deepEqual(cards[0].featuredAwards,['first_orbit']);
 assert.equal(cards[0].level,1);
 assert.equal(cards[1].level,null,'member level opt-out remains private');
 assert.deepEqual(cards[1].featuredAwards,[]);
 assert.equal(cards.every(v=>!Object.hasOwn(v,'member_identity_key')&&!Object.hasOwn(v,'user_id')&&!Object.hasOwn(v,'member_xp')),true);
 queryCount=0;
 const disabled=await hydratedPublicMemberCards(db,rows,false);
 assert.equal(queryCount,0,'feature flag off cannot query additional recognition records');
 assert.equal(disabled[0].featuredAwards.length,0);
});
