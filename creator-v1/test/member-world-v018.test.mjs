import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {normalizeWorldUpdate,worldFromRow,WORLD_THEMES,FOCUS_KEYS} from "../canonical-auth/worlds.mjs";
import {canonicalCreatorSchemaReady,canonicalCreatorMember,canonicalPublicCreator} from "../canonical-auth/profile.mjs";

const origin="https://a.anevum.com";
const file=name=>readFileSync(new URL("../canonical-auth/migrations/"+name,import.meta.url),"utf8");
const setup=()=>{
  const db=new DatabaseSync(":memory:");
  db.exec(file("0001_canonical_better_auth_core.sql"));
  db.exec(file("0002_member_creator_profiles.sql"));
  const adapter={
    prepare(sql){
      let args=[];
      return {
        bind(...values){args=values;return this;},
        async all(){return {success:true,results:db.prepare(sql).all(...args)};},
        async first(){return db.prepare(sql).get(...args)||null;}
      };
    },
    async batch(){return [];}
  };
  const env={
    ANEVUM_CANONICAL_STAGE_ENABLED:"true",CANONICAL_SCHEMA_APPROVED:"true",
    CANONICAL_EMAIL_ENABLED:"true",CANONICAL_INVITED_SIGNUP_ENABLED:"true",
    CANONICAL_BETTER_AUTH_SECRET:"s".repeat(48),
    CANONICAL_RESEND_API_KEY:"r".repeat(48),
    CANONICAL_PROTECTED_EMAILS:"protected@fixture.invalid",
    CANONICAL_INVITE_EMAILS:"a@fixture.invalid,b@fixture.invalid",
    MEMBER_DB:adapter
  };
  const now=1760481000;
  const add=(id,email,verified=1)=>db.prepare(
    'INSERT INTO "user"("id","name","email","emailVerified","createdAt","updatedAt") VALUES(?,?,?,?,?,?)'
  ).run(id,id,email,verified,now,now);
  const member=(id,email,verified=true)=>({id,email,emailVerified:verified});
  const call=(id,email,method,body)=>canonicalCreatorMember(new Request(origin+"/api/v1/member/creator-profile",{
    method,headers:body?{"content-type":"application/json"}:undefined,
    body:body?JSON.stringify(body):undefined
  }),env,member(id,email),origin,now);
  const read=handle=>canonicalPublicCreator(new Request(origin+"/api/v1/members/"+handle),env,origin,handle);
  return {db,adapter,env,add,call,read,now};
};

test("server-owned world choices reject arbitrary visuals, duplicates and unsafe input",()=>{
 assert.deepEqual(WORLD_THEMES,["continuance","nocturne","verdant"]);
 assert.ok(FOCUS_KEYS.includes("games"));
 assert.equal(normalizeWorldUpdate({headline:"  Hello  ",worldTheme:"nocturne",focus:["writing","games"]}).headline,"Hello");
 for(const input of [
  {headline:"OK",worldTheme:"url(https://example.invalid)",focus:[]},
  {headline:"x".repeat(121),worldTheme:"nocturne",focus:[]},
  {headline:"bad\u0000data",worldTheme:"nocturne",focus:[]},
  {headline:"OK",worldTheme:"nocturne",focus:["games","games"]},
  {headline:"OK",worldTheme:"nocturne",focus:["games","apps","art","tools","research"]},
  {headline:"OK",worldTheme:"nocturne",focus:["unknown"]},
  {headline:"OK",worldTheme:"nocturne",focus:"games"},
  {headline:"OK",worldTheme:"nocturne",focus:["games"],role:"owner",userId:"someone"}
 ]) {
  if(input.role)assert.equal(normalizeWorldUpdate({...input,focus:["games"]})?.worldTheme,"nocturne");
  else assert.equal(normalizeWorldUpdate(input),null);
 }
 assert.deepEqual(worldFromRow({headline:"Sample",world_theme:"not-real",focus_json:'["games","unknown"]'}),
  {headline:"Sample",worldTheme:"continuance",focus:[]});
});

test("new migration preserves existing private profiles and blocks signup before schema readiness",async()=>{
 const {db,adapter,add,now}=setup();
 try{
  add("alpha","a@fixture.invalid");
  db.prepare("INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)")
    .run("alpha","first_world","First Member",now,now);
  assert.equal(await canonicalCreatorSchemaReady(adapter),false);
  db.exec(file("0003_member_world_personalization.sql"));
  assert.equal(await canonicalCreatorSchemaReady(adapter),true);
  const p=db.prepare("SELECT visibility,world_theme,focus_json,headline FROM member_creator_profiles WHERE user_id=?").get("alpha");
  assert.deepEqual(p,{visibility:"private",world_theme:"continuance",focus_json:"[]",headline:""});
  assert.throws(()=>db.prepare("UPDATE member_creator_profiles SET world_theme=? WHERE user_id=?")
    .run("arbitrary","alpha"),/CHECK/);
 }finally{db.close()}
});

test("A/B profile saves, private visibility, public opt-in and legacy editor preserve owners and appearance",async()=>{
 const {db,add,call,read}=setup();
 try{
  db.exec(file("0003_member_world_personalization.sql"));
  add("alpha","a@fixture.invalid");
  add("beta","b@fixture.invalid");
  let a=await call("alpha","a@fixture.invalid","POST",{handle:"first_world",displayName:"Member A",bio:"A private introduction"});
  let b=await call("beta","b@fixture.invalid","POST",{handle:"second_world",displayName:"Member B",bio:"B private introduction"});
  assert.equal(a.status,201);assert.equal(b.status,201);
  a=await a.json();b=await b.json();
  assert.equal(a.profile.visibility,"private");
  assert.equal(a.profile.worldTheme,"continuance");
  assert.equal(b.profile.handle,"second_world");

  const selection={displayName:"Member A",bio:"My world",visibility:"private",revision:a.profile.revision,
    headline:"Building strange little worlds",worldTheme:"nocturne",focus:["games","writing"]};
  let updated=await call("alpha","a@fixture.invalid","PATCH",selection);
  assert.equal(updated.status,200);updated=await updated.json();
  assert.equal(updated.profile.worldTheme,"nocturne");
  assert.deepEqual(updated.profile.focus,["games","writing"]);
  assert.equal((await read("first_world")).status,404);

  const forbidden=await call("beta","b@fixture.invalid","PATCH",{...selection,revision:updated.profile.revision});
  assert.equal(forbidden.status,409);
  assert.equal((await call("alpha","a@fixture.invalid","PATCH",{...selection,revision:updated.profile.revision,userId:"beta"})).status,400);
  assert.equal((await call("alpha","a@fixture.invalid","PATCH",{...selection,revision:updated.profile.revision,worldTheme:"invalid"})).status,400);

  let visible=await call("alpha","a@fixture.invalid","PATCH",{...selection,revision:updated.profile.revision,visibility:"public"});
  assert.equal(visible.status,200);visible=await visible.json();
  let publicView=await read("first_world");
  assert.equal(publicView.status,200);
  const exposed=(await publicView.json()).profile;
  assert.equal(exposed.headline,"Building strange little worlds");
  assert.equal(exposed.worldTheme,"nocturne");
  assert.deepEqual(exposed.focus,["games","writing"]);
  for(const secret of ["userId","memberId","email","role","session","token","isStaff"])assert.equal(exposed[secret],undefined);
  assert.equal((await read("second_world")).status,404);

  let oldClient=await call("alpha","a@fixture.invalid","PATCH",{
    displayName:"Member A",bio:"Changed from an older client",
    visibility:"public",revision:visible.profile.revision
  });
  assert.equal(oldClient.status,200);oldClient=await oldClient.json();
  assert.equal(oldClient.profile.worldTheme,"nocturne");
  assert.equal(oldClient.profile.headline,"Building strange little worlds");
  assert.deepEqual(oldClient.profile.focus,["games","writing"]);

  const privateAgain=await call("alpha","a@fixture.invalid","PATCH",{
    displayName:"Member A",bio:"Back to private",visibility:"private",
    revision:oldClient.profile.revision,headline:"Building strange little worlds",
    worldTheme:"nocturne",focus:["games","writing"]
  });
  assert.equal(privateAgain.status,200);
  assert.equal((await read("first_world")).status,404);
  const ownB=await call("beta","b@fixture.invalid","GET");
  assert.equal((await ownB.json()).profile.handle,"second_world");
 }finally{db.close()}
});

test("no profile personalization escapes an unverified session or inactive origin",async()=>{
 const {db,env,add,now}=setup();
 try{
  db.exec(file("0003_member_world_personalization.sql"));
  add("unverified","a@fixture.invalid",0);
  const req=new Request(origin+"/api/v1/member/creator-profile");
  const forbidden=await canonicalCreatorMember(req,env,{id:"unverified",email:"a@fixture.invalid",emailVerified:false},origin,now);
  assert.equal(forbidden.status,403);
  const closed=await canonicalCreatorMember(req,env,{id:"unverified",email:"a@fixture.invalid",emailVerified:true},"https://anevum.com",now);
  assert.equal(closed.status,503);
  assert.equal((await canonicalPublicCreator(new Request(origin+"/api/v1/members/first_world"),
    {...env,ANEVUM_CANONICAL_STAGE_ENABLED:"false"},origin,"first_world")).status,404);
 }finally{db.close()}
});
