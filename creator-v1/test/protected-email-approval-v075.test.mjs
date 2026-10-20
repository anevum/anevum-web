import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {permitCanonicalUserCreation,permitCanonicalUserCreationApproved} from '../canonical-auth/policy.mjs';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const makeEnv=({approved=false,throwDb=false,open=true,ownerRevoked=false}={})=>{
 const queries=[];
 const env={
  ANEVUM_CANONICAL_STAGE_ENABLED:'true',
  CANONICAL_SCHEMA_APPROVED:'true',
  CANONICAL_PUBLIC_SIGNUP_ENABLED:open?'true':'false',
  CANONICAL_EMAIL_ENABLED:'true',
  CANONICAL_BETTER_AUTH_SECRET:'s'.repeat(45),
  CANONICAL_RESEND_API_KEY:'r'.repeat(45),
  CANONICAL_PROTECTED_EMAILS:'owner@example.com',
  MEMBER_DB:{
   batch:async()=>[],
   prepare(sql){queries.push(sql);return {
    bind(email){return{async first(){
     if(throwDb)throw Error('Database unavailable');
     if(!sql.includes("g.role='owner'")||!sql.includes('g.revoked_at IS NULL')||!sql.includes('u.emailVerified=1')||!sql.includes('a.revoked_at IS NULL'))
       throw Error('Missing owner authorization safeguards');
     return approved&&!ownerRevoked?{email}:null;
    }}}
   }}
  }
 };
 return {env,queries};
};
test('normal verified sign-in is still available, protected addresses fail closed',async()=>{
 const {env,queries}=makeEnv();
 assert.equal(permitCanonicalUserCreation(env,'member@example.com'),true);
 assert.equal(await permitCanonicalUserCreationApproved(env,'member@example.com'),true);
 assert.deepEqual(queries,[]);
 assert.equal(permitCanonicalUserCreation(env,'owner@example.com'),false);
 assert.equal(await permitCanonicalUserCreationApproved(env,'owner@example.com'),false);
 assert.equal(queries.length,1);
});
test('protected mailbox requires an independent, unrevoked, verified owner grant',async()=>{
 assert.equal(await permitCanonicalUserCreationApproved(makeEnv({approved:true}).env,'owner@example.com'),true);
 assert.equal(await permitCanonicalUserCreationApproved(makeEnv({approved:true,ownerRevoked:true}).env,'owner@example.com'),false);
 assert.equal(await permitCanonicalUserCreationApproved(makeEnv({approved:true,throwDb:true}).env,'owner@example.com'),false);
 assert.equal(await permitCanonicalUserCreationApproved(makeEnv({approved:true,open:false}).env,'owner@example.com'),false);
});
test('V075 auth and request-boundary preserve protected-mailbox OTP recovery',()=>{
 const auth=source('canonical-auth/auth.mjs'),worker=source('canonical-auth/worker.mjs');
 assert.match(auth,/await permitCanonicalUserCreationApproved\(env,email\)/);
 assert.match(auth,/await permitCanonicalUserCreationApproved\(env,user\?\.email\)/);
 assert.match(worker,/await permitCanonicalUserCreationApproved\(env,parsed\.email\)/);
 assert.doesNotMatch(auth,/!permitCanonicalUserCreation\(env,email\)/);
 assert.doesNotMatch(worker,/!permitCanonicalUserCreation\(env,parsed\.email\)/);
});
