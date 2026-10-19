import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../../canonical-auth/migrations/"+p,import.meta.url),"utf8");
export function fixture(){
  const db=new DatabaseSync(":memory:");
  for(const file of ["0001_canonical_better_auth_core.sql",
    "0002_member_creator_profiles.sql","0003_member_world_personalization.sql","0004_member_spaces.sql","0005_progression_notifications.sql"]){
    db.exec(read(file));
  }
  const adapter={
    prepare(sql){
      let params=[];
      const compile=()=>db.prepare(sql);
      const statement={
        sql,get args(){return params},
        bind(...args){params=args.map(x=>x instanceof ArrayBuffer?new Uint8Array(x):x);return statement},
        async all(){return {success:true,results:compile().all(...params),meta:{changes:0,last_row_id:0,changed_db:false}}},
        async first(column){const row=compile().get(...params)||null;return column?row?.[column]??null:row},
        async raw(options){const query=compile();const rows=query.all(...params).map(Object.values);
          return options?.columnNames?[query.columns().map(c=>c.name),...rows]:rows;},
        async run(){const result=compile().run(...params);return {success:true,meta:{
          changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid),
          changed_db:result.changes>0},results:[]}}
      };
      return statement;
    },
    async batch(statements){const result=[];db.exec("SAVEPOINT better_auth_fixture");try{
      for(const stmt of statements){const query=db.prepare(stmt.sql);
        if(query.columns().length>0)result.push({success:true,results:query.all(...stmt.args),meta:{changes:0,last_row_id:0,changed_db:false}});
        else {const change=query.run(...stmt.args);result.push({success:true,results:[],
          meta:{changes:Number(change.changes),last_row_id:Number(change.lastInsertRowid)}});}
      }
      db.exec("RELEASE SAVEPOINT better_auth_fixture");
    }catch(e){db.exec("ROLLBACK TO SAVEPOINT better_auth_fixture");db.exec("RELEASE SAVEPOINT better_auth_fixture");throw e}return result},
    async exec(sql){db.exec(sql);return {count:1,duration:0}},
    async dump(){throw Error("Dump is unavailable in local test fixture")},
    withSession(){return {prepare:adapter.prepare,batch:adapter.batch,getBookmark:()=>null}}
  };
  const env={
    CANONICAL_XP_TEST_ENABLED:"true",ANEVUM_CANONICAL_STAGE_ENABLED:"true",CANONICAL_SCHEMA_APPROVED:"true",
    CANONICAL_EMAIL_ENABLED:"true",CANONICAL_GOOGLE_ENABLED:"false",
    CANONICAL_INVITED_SIGNUP_ENABLED:"true",
    CANONICAL_BETTER_AUTH_SECRET:"private-fixture-unique-not-deployed-value".padEnd(48,"x"),
    CANONICAL_RESEND_API_KEY:"never-live-fixture-not-a-key".padEnd(48,"x"),
    CANONICAL_PROTECTED_EMAILS:"owner@fixture.invalid",
    CANONICAL_INVITE_EMAILS:"pilot_a@fixture.invalid,pilot_b@fixture.invalid",
    MEMBER_DB:adapter
  };
  return {db,env};
}