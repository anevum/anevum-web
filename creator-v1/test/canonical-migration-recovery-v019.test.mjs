// Disposable local SQLite recovery rehearsal for the isolated canonical
// profile migration. Does not export or modify the deployed Cloudflare D1.
import test from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const migration=(name)=>readFileSync(
  new URL("../canonical-auth/migrations/"+name,import.meta.url),"utf8");
const columns=db=>db.prepare("PRAGMA table_info(member_creator_profiles)").all().map(row=>row.name);
const counts=db=>({
  users:db.prepare('SELECT COUNT(*) AS n FROM "user"').get().n,
  profiles:db.prepare("SELECT COUNT(*) AS n FROM member_creator_profiles").get().n,
  sessions:db.prepare('SELECT COUNT(*) AS n FROM "session"').get().n
});
const marker=db=>db.prepare("SELECT issuer,migration FROM canonical_identity_manifest WHERE id=1").get();

test("backup-before-migration, V018 apply, and restore from disposable SQLite file",()=>{
  const folder=mkdtempSync(join(tmpdir(),"anevum-v019-"));
  const snapshot=join(folder,"canonical-pre-v018.sqlite");
  const original=new DatabaseSync(":memory:");
  let restored=null;
  try{
    original.exec(migration("0001_canonical_better_auth_core.sql"));
    original.exec(migration("0002_member_creator_profiles.sql"));
    const now=1760500000;
    original.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,?,?)')
      .run("test-identity","Fixture User","fixture@invalid.example",1,now,now);
    original.prepare("INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,?,?)")
      .run("test-identity","fixture_person","Fixture User","Private bio",now,now);
    const baseline=counts(original);
    const before=columns(original);
    assert.equal(baseline.users,1);
    assert.equal(baseline.profiles,1);
    assert.equal(baseline.sessions,0);
    assert.ok(!before.includes("world_theme"));
    assert.equal(original.prepare("SELECT visibility FROM member_creator_profiles").get().visibility,"private");

    // SQLite VACUUM INTO performs a consistent snapshot for an OFFLINE
    // rehearsal. The real D1 rollout still requires a separate D1
    // bookmark and an independently validated actual export/restore.
    original.exec("VACUUM INTO '"+snapshot+"'");
    restored=new DatabaseSync(snapshot);
    assert.deepEqual(counts(restored),baseline);
    assert.deepEqual(columns(restored),before);
    assert.equal(marker(restored).issuer,"anevum-better-auth-staging-v1");

    original.exec(migration("0003_member_world_personalization.sql"));
    const after=columns(original);
    for(const required of ["headline","world_theme","focus_json"])assert.ok(after.includes(required));
    const upgraded=original.prepare(
      "SELECT visibility,headline,world_theme,focus_json FROM member_creator_profiles").get();
    assert.equal(upgraded.visibility,"private");
    assert.equal(upgraded.headline,"");
    assert.equal(upgraded.world_theme,"continuance");
    assert.equal(upgraded.focus_json,"[]");
    original.prepare("UPDATE member_creator_profiles SET headline=?,world_theme=?,focus_json=? WHERE user_id=?")
      .run("Changed","verdant",'["games","writing"]',"test-identity");
    assert.equal(original.prepare("SELECT world_theme FROM member_creator_profiles").get().world_theme,"verdant");

    // Simulated recovery returns to the pre-migration snapshot, retaining
    // the canonical marker and member's private original profile.
    assert.deepEqual(counts(restored),baseline);
    assert.deepEqual(columns(restored),before);
    assert.equal(restored.prepare("SELECT bio,visibility FROM member_creator_profiles").get().bio,"Private bio");
    assert.equal(restored.prepare("SELECT bio,visibility FROM member_creator_profiles").get().visibility,"private");
    assert.equal(marker(restored).migration,"0001_canonical_better_auth_core");
  }finally{
    restored?.close();
    original.close();
    rmSync(folder,{force:true,recursive:true});
  }
});

test("the 0003 migration requires an existing canonical profile schema",()=>{
  const isolated=new DatabaseSync(":memory:");
  try{
    isolated.exec(migration("0001_canonical_better_auth_core.sql"));
    assert.throws(()=>isolated.exec(migration("0003_member_world_personalization.sql")),
      /no such table|missing table|no such column/i);
    const schema=isolated.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='member_creator_profiles'").get();
    assert.equal(schema,undefined);
  }finally{isolated.close()}
});
