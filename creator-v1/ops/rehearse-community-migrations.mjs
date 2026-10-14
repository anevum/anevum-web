// ANEVUM Creator V1 / disposable member-community migration rehearsal.
// This script NEVER connects to Cloudflare or mutates an actual D1 instance.
import test from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync,copyFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
const dir=mkdtempSync(join(tmpdir(),"anevum-community-rehearsal-"));
const root=fileURLToPath(new URL("../",import.meta.url));
const beforeFile=join(dir,"before.sqlite"), afterFile=join(dir,"after.sqlite"),restoreFile=join(dir,"restore.sqlite");
const migrations=["0010_member_worlds","0011_creator_follows","0012_forum_discussions"];
const memberA="fixture-alpha",memberB="fixture-beta",topic="a".repeat(32),post="b".repeat(32),reply="c".repeat(32),reportId="d".repeat(32);
let db;
const check=(name,condition)=>{test.ok(condition,name);console.log("PASS "+name);};
const rows=(query,params=[])=>db.prepare(query).all(...params);
const tables=()=>new Set(rows("SELECT name FROM sqlite_master WHERE type='table'").map(x=>x.name));
try {
 db=new DatabaseSync(beforeFile);
 db.exec("PRAGMA foreign_keys=ON; CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT DEFAULT CURRENT_TIMESTAMP);"+
   "CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY NOT NULL,handle TEXT NOT NULL COLLATE NOCASE UNIQUE,display_name TEXT NOT NULL,bio TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active',is_staff INTEGER NOT NULL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);");
 db.exec(readFileSync(join(root,"auth/migrations/0003_member_identity_staging.sql"),"utf8"));
 for(const version of ["0001_initial_creator_platform","0002_staff_authoring","0004_member_project_workflow","0005_voting_progression","0006_account_privacy"])
   db.prepare("INSERT OR IGNORE INTO schema_migrations(version) VALUES(?)").run(version);
 for(const [id,handle] of [[memberA,"fixture_alpha"],[memberB,"fixture_beta"]]){
  db.prepare("INSERT INTO member_accounts(id,email,verified_at,status,created_at) VALUES(?,?,1,'active',1)").run(id,handle+"@anevum.invalid");
  db.prepare("INSERT INTO creator_profiles(member_id,handle,display_name) VALUES(?,?,?)").run(id,handle,handle);
 }
 const versionsBefore=rows("SELECT version FROM schema_migrations ORDER BY version").map(x=>x.version);
 const tablesBefore=[...tables()].sort();
 db.close();db=null;
 copyFileSync(beforeFile,afterFile);
 db=new DatabaseSync(afterFile);
 db.exec("PRAGMA foreign_keys=ON; BEGIN IMMEDIATE;");
 try{
  for(const version of migrations){
   const sql=readFileSync(join(root,"auth/migrations",version+".sql"),"utf8");
   check("Version marker present "+version,sql.includes("schema_migrations(version)")&&sql.includes(version));
   db.exec(sql);
  }
  db.exec("COMMIT;");
 }catch(e){db.exec("ROLLBACK;");throw e;}
 const installed=rows("SELECT version FROM schema_migrations ORDER BY version").map(x=>x.version);
 check("Exactly three additional migrations",installed.length===versionsBefore.length+3&&migrations.every(v=>installed.includes(v)));
 check("New tables and foreign keys ready",["member_world_appearances","member_creator_follows","forum_threads","forum_posts","forum_reports","forum_moderation_events","forum_report_events"].every(t=>tables().has(t))&&db.prepare("PRAGMA foreign_keys").get().foreign_keys===1);
 check("Original member identities preserved",rows("SELECT id FROM member_accounts").length===2);
 db.prepare("INSERT INTO member_world_appearances(member_id,created_at,updated_at) VALUES(?,100,100)").run(memberA);
 check("Profile private by default",db.prepare("SELECT visibility FROM member_world_appearances WHERE member_id=?").get(memberA).visibility==="private");
 db.prepare("INSERT INTO member_creator_follows(follower_member_id,creator_member_id,created_at) VALUES(?,?,100)").run(memberA,memberB);
 test.throws(()=>db.prepare("INSERT INTO member_creator_follows(follower_member_id,creator_member_id,created_at) VALUES(?,?,100)").run(memberA,memberA),/CHECK/);
 check("Self-follow refused and owner follow isolated",rows("SELECT follower_member_id FROM member_creator_follows").length===1&&rows("SELECT follower_member_id FROM member_creator_follows")[0].follower_member_id===memberA);
 db.prepare("INSERT INTO forum_threads(id,room,author_member_id,title,created_at,updated_at) VALUES(?,?,?,?,200,200)").run(topic,"arcade",memberA,"An isolated creation rehearsal");
 db.prepare("INSERT INTO forum_posts(id,thread_id,author_member_id,body,starter,created_at) VALUES(?,?,?,?,1,200)").run(post,topic,memberA,"Private synthetic opening post");
 db.prepare("INSERT INTO forum_posts(id,thread_id,author_member_id,body,starter,created_at) VALUES(?,?,?,?,0,201)").run(reply,topic,memberB,"Private synthetic reply");
 check("Forum thread and messages pending",rows("SELECT id FROM forum_posts WHERE status='visible'").length===0&&db.prepare("SELECT status FROM forum_threads WHERE id=?").get(topic).status==="pending");
 db.prepare("UPDATE forum_threads SET status='visible',visible_at=202 WHERE id=?").run(topic);
 db.prepare("UPDATE forum_posts SET status='visible',reviewed_at=202 WHERE id=?").run(post);
 check("Only approved starter visible",rows("SELECT id FROM forum_posts WHERE status='visible'").length===1);
 db.prepare("INSERT INTO forum_reports(id,post_id,reporter_member_id,reason,created_at) VALUES(?,?,?,?,203)").run(reportId,post,memberB,"spam");
 check("Reported posts and foreign-key integrity",rows("SELECT id FROM forum_reports").length===1&&rows("PRAGMA foreign_key_check").length===0);
 db.close();db=null;
 copyFileSync(beforeFile,restoreFile);
 db=new DatabaseSync(restoreFile);
 check("Backup returns to exact schema and versions",JSON.stringify(rows("SELECT version FROM schema_migrations ORDER BY version").map(x=>x.version))===JSON.stringify(versionsBefore)&&JSON.stringify([...tables()].sort())===JSON.stringify(tablesBefore));
 check("No community tables survive recovery",!tables().has("forum_posts")&&!tables().has("member_world_appearances")&&rows("SELECT id FROM member_accounts").length===2);
 console.log("COMMUNITY_MIGRATION_REHEARSAL=PASS | disposable fixture only | remote D1 unchanged");
}catch(e){console.error("COMMUNITY_MIGRATION_REHEARSAL=FAIL",e);process.exitCode=1;}
finally{db?.close();rmSync(dir,{recursive:true,force:true});}
