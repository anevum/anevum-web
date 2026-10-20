import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {canonicalSchemaReady} from '../canonical-auth/policy.mjs';

const source=readFileSync(new URL('../canonical-auth/policy.mjs',import.meta.url),'utf8');
function fixture(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(`
 CREATE TABLE "user"(id TEXT);
 CREATE TABLE "session"(id TEXT);
 CREATE TABLE "account"(id TEXT);
 CREATE TABLE "verification"(id TEXT);
 CREATE TABLE "rateLimit"(id TEXT);
 CREATE TABLE canonical_identity_manifest(id INTEGER PRIMARY KEY,issuer TEXT,migration TEXT);
 INSERT INTO canonical_identity_manifest VALUES(1,'anevum-better-auth-staging-v1','0001_canonical_better_auth_core');
 `);
 for(let i=0;i<130;i++)sqlite.exec('CREATE TABLE unrelated_'+i+'(n INTEGER)');
 const queries=[];
 const database={
  prepare(sql){queries.push(sql);return {async all(){return {success:true,results:sqlite.prepare(sql).all()}}}},
  async batch(){return []}
 };
 return {sqlite,database,queries};
}

test('canonical issuer readiness selects only six required tables despite unrelated schemas',async t=>{
 const {sqlite,database,queries}=fixture();t.after(()=>sqlite.close());
 assert.equal(await canonicalSchemaReady({MEMBER_DB:database}),true);
 assert.equal(queries.length,2);
 const [tables,marker]=queries;
 assert.match(tables,/SELECT name FROM sqlite_master/);
 assert.match(tables,/name IN/);
 for(const name of ['user','session','account','verification','rateLimit','canonical_identity_manifest'])
  assert.ok(tables.includes("'"+name+"'"),name);
 assert.doesNotMatch(tables,/unrelated_/);
 assert.equal(sqlite.prepare(tables).all().length,6);
 assert.match(marker,/SELECT issuer,migration FROM canonical_identity_manifest WHERE id=1/);
 assert.match(source,/CANONICAL_ISSUER/);
});

test('bounded schema lookup still fails closed on missing tables and issuer drift',async t=>{
 const {sqlite,database}=fixture();t.after(()=>sqlite.close());
 sqlite.exec('DROP TABLE "session"');
 assert.equal(await canonicalSchemaReady({MEMBER_DB:database}),false);
 sqlite.exec('CREATE TABLE "session"(id TEXT)');
 sqlite.exec("UPDATE canonical_identity_manifest SET issuer='unapproved-issuer' WHERE id=1");
 assert.equal(await canonicalSchemaReady({MEMBER_DB:database}),false);
 sqlite.exec("UPDATE canonical_identity_manifest SET issuer='anevum-better-auth-staging-v1',migration='legacy-schema' WHERE id=1");
 assert.equal(await canonicalSchemaReady({MEMBER_DB:database}),false);
});

test('D1 errors fail closed and never trigger a fallback to old member tables',async()=>{
 let calls=0;
 const broken={prepare(){calls++;throw new Error('D1 quota exceeded')},async batch(){return []}};
 assert.equal(await canonicalSchemaReady({MEMBER_DB:broken}),false);
 assert.equal(calls,1);
 assert.equal(await canonicalSchemaReady({MEMBER_DB:null}),false);
});
