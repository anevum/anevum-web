import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";
import {DatabaseSync} from "node:sqlite";
import {verifiedCreatorRecognition} from "../web/src/lib/creator-recognition.ts";
import {earnedFeaturedAward,readFeaturedPreference} from "../auth/showcase.mjs";
import {deriveAchievements} from "../auth/social.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const picker=read("web/src/components/FeaturedAwardPicker.tsx");
const editor=read("web/src/pages/MemberProfileEditorPage.tsx");
const client=read("web/src/lib/member-api.ts");
const server=read("auth/showcase.mjs");
const memberWorker=read("auth/worker.mjs");
const migration=read("auth/migrations/0014_creator_featured_awards.sql");
const strip=read("web/src/components/CreatorRecognitionStrip.tsx");
const stylesheet=read("web/src/components/creator-featured-award-v010.css");

test("V010 persists only a single bounded owned earned award and no new privileges",()=>{
 assert.match(migration,/member_id TEXT PRIMARY KEY NOT NULL REFERENCES creator_profiles\(member_id\) ON DELETE CASCADE/);
 assert.match(migration,/award_key TEXT CHECK/);
 assert.match(migration,/revision INTEGER NOT NULL DEFAULT 1/);
 assert.match(migration,/0014_creator_featured_awards/);
 assert.doesNotMatch(migration,/INSERT INTO community_xp_events|ALTER TABLE member_accounts|UPDATE member_accounts/);
 assert.match(server,/if\(!member\)return response\(req,\{error:"Sign-in required"\},401\)/);
 assert.match(server,/if\(!owner\|\|owner.id!==member.id\)/);
 assert.match(server,/choice.revision!==Number\(current\?\.revision\|\|0\)/);
 assert.match(server,/Earn this achievement before featuring it/);
 assert.match(server,/12,3600/);
 assert.match(server,/updated_at=\?/);
 assert.match(memberWorker,/checkWrite\(req\)/);
 assert.match(client,/memberSetFeaturedAward/);
 assert.match(client,/method:"POST",body:\{awardKey,revision\}/);
 assert.doesNotMatch(server,/grantXp|awardXp|INSERT INTO community_xp_events|is_staff|memberRole|broker/);
});

test("selected award must remain genuinely earned and has deterministic fallback",()=>{
 const stats={ratings:5,publishedProjects:3,releases:0};
 assert.equal(earnedFeaturedAward(stats,"keen-eye",deriveAchievements)?.key,"keen-eye");
 assert.equal(earnedFeaturedAward(stats,"first-launch",deriveAchievements)?.name,"First Launch");
 assert.equal(earnedFeaturedAward(stats,"release-steward",deriveAchievements),null);
 assert.equal(earnedFeaturedAward(stats,"admin",deriveAchievements),null);
 assert.equal(earnedFeaturedAward(stats,null,deriveAchievements),null);
 const profile={
  creator:{handle:"verified_maker"},progression:{level:2,artifact:"Copper Key",artifactEarned:true},
  achievements:[{key:"first-launch",name:"First Launch",earned:true},{key:"keen-eye",name:"Keen Eye",earned:true}],
  showcase:{featuredAward:{key:"first-launch",name:"First Launch"}}
 };
 const chosen=verifiedCreatorRecognition("verified_maker",profile);
 assert.equal(chosen?.featuredAward,true);
 assert.deepEqual(chosen?.earnedAward,{key:"first-launch",name:"First Launch"});
 const forged=verifiedCreatorRecognition("verified_maker",{
  ...profile,showcase:{featuredAward:{key:"admin",name:"Administrator"}}
 });
 assert.notEqual(forged?.featuredAward,true);
 assert.deepEqual(forged?.earnedAward,{key:"first-launch",name:"First Launch"});
 const revoked=verifiedCreatorRecognition("verified_maker",{
  ...profile,achievements:[{key:"first-launch",name:"First Launch",earned:false}],
  showcase:{featuredAward:{key:"first-launch",name:"First Launch"}}
 });
 assert.notEqual(revoked?.featuredAward,true);
 assert.equal(revoked?.earnedAward,null);
 assert.equal(verifiedCreatorRecognition("other_maker",profile),null);
});

test("empty persisted award is not an earned item and revision is owner scoped",async()=>{
 const db=new DatabaseSync(":memory:");
 try {
  db.exec("CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY);");
  db.exec(migration.replace(/INSERT OR IGNORE INTO schema_migrations\(version\) VALUES\('0014_creator_featured_awards'\);/,""));
  db.prepare("INSERT INTO creator_profiles(member_id) VALUES(?)").run("first");
  const access={prepare(sql){return{bind(...args){return{async all(){return{success:true,results:db.prepare(sql).all(...args)}}}},async all(){return{success:true,results:db.prepare(sql).all()}}}}};
  assert.equal(await readFeaturedPreference(access,"first"),null);
  db.prepare("INSERT INTO creator_featured_awards(member_id,award_key,revision,updated_at) VALUES('first','first-launch',3,1)").run();
  assert.equal((await readFeaturedPreference(access,"first"))?.awardKey,"first-launch");
  assert.equal(await readFeaturedPreference(access,"second"),null);
 }finally{db.close()}
});

test("member UI is parseable and cannot select a role or grant rewards",()=>{
 assert.doesNotThrow(()=>parse(picker,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(editor,/member.handle&&<FeaturedAwardPicker\/>/);
 assert.match(picker,/eligibleAwards\.map/);
 assert.match(picker,/memberSetFeaturedAward\(chosen,data\.data\.selection\.revision\)/);
 assert.match(picker,/No featured award/);
 assert.match(picker,/Award selection is not available/);
 assert.match(picker,/A revoked award automatically stops appearing publicly/);
 assert.match(strip,/recognition\.featuredAward/);
 assert.match(strip,/FEATURED/);
 assert.doesNotMatch(picker,/localStorage|sessionStorage|document\.cookie|isAdmin|setXp|grantXp|Math\.random/);
 assert.match(stylesheet,/:focus-visible/);
 assert.match(stylesheet, /@media\(max-width:640px\)/);
 assert.match(stylesheet, /@media\(forced-colors:active\)/);
});
