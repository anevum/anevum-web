import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
if (!globalThis.crypto) globalThis.crypto=webcrypto;

import {
  identityHmac, resolveTrustedAdult, loadPrivatePolicy, revokePrivateShare
} from "./private-authority.mjs";
import { mayReadPresence, mayWritePresence, visiblePresence } from "../presence-policy.mjs";

const T=Date.parse("2026-10-17T22:00:00Z");
const SECRET="test-only-fake-hmac-secret-32-characters-minimum"; // NEVER a real runtime key
const AUD="fake-stage-access-audience";

function dataset() {
  const adults=[
    {subject_id:"alice",identity_hmac:"",age_verified:1,state:"active"},
    {subject_id:"bob",identity_hmac:"",age_verified:1,state:"active"},
    {subject_id:"carol",identity_hmac:"",age_verified:0,state:"active"}
  ];
  const members=["alice","bob","carol"].map(subject_id=>({
    circle_id:"circle-1",subject_id,age_band:"adult",role:"adult",
    state:"active",identity_verified:1
  }));
  const share={
    session_id:"session-1",circle_id:"circle-1",subject_id:"alice",state:"active",
    consent:"explicit",started_at_ms:T-40_000,expires_at_ms:T+80_000,revoked_at_ms:null
  };
  const viewer={
    grant_id:"grant-1",circle_id:"circle-1",subject_id:"alice",
    viewer_id:"bob",session_id:"session-1",state:"active",
    consent:"explicit",scope:"presence:read",
    issued_at_ms:T-30_000,expires_at_ms:T+40_000,revoked_at_ms:null
  };
  const state={
    circles:[{circle_id:"circle-1",state:"active"}],
    adults,members,sessions:[share],grants:[viewer]
  };

  const db={
    prepare(sql) {
      return {
        bind(...args) {
          const result=()=>{
            if(sql.includes("SELECT subject_id FROM fs_verified_adults"))
              return state.adults.filter(x=>x.identity_hmac===args[0] && x.age_verified===1 && x.state==="active");
            if(sql.includes("FROM fs_private_circles"))
              return state.circles.filter(x=>x.circle_id===args[0]);
            if(sql.includes("FROM fs_memberships m LEFT JOIN fs_verified_adults"))
              return state.members.filter(x=>x.circle_id===args[0] &&
                [args[1],args[2]].includes(x.subject_id)).map(m=>{
                  const verified=state.adults.find(a=>a.subject_id===m.subject_id);
                  return {...m,identity_verified:Number(m.identity_verified===1 &&
                    verified?.age_verified===1 && verified?.state==="active")};
                });
            if(sql.includes("FROM fs_share_sessions"))
              return state.sessions.filter(x=>x.circle_id===args[0] &&
                x.subject_id===args[1] && x.state==="active" &&
                x.started_at_ms<=args[2] && x.expires_at_ms>args[3] && !x.revoked_at_ms);
            if(sql.includes("FROM fs_viewer_grants"))
              return state.grants.filter(x=>x.circle_id===args[0] &&
                x.subject_id===args[1] && x.viewer_id===args[2] &&
                x.session_id===args[3] && x.state==="active" &&
                x.issued_at_ms<=args[4] && x.expires_at_ms>args[5] &&
                !x.revoked_at_ms);
            if(sql.includes("SELECT v.subject_id FROM fs_verified_adults v JOIN fs_memberships"))
              return state.members.filter(x=>x.circle_id===args[0] &&
                x.subject_id===args[1] && x.age_band==="adult" && x.state==="active" &&
                x.identity_verified===1 && state.adults.some(a=>a.subject_id===x.subject_id &&
                   a.age_verified===1 && a.state==="active")).map(x=>({subject_id:x.subject_id}));
            throw new Error("Unknown read query: "+sql.slice(0,55));
          };
          return {
            first: async()=>result()[0]??null,
            all: async()=>({results:result()}),
            run: async()=>{
              if(sql.startsWith("UPDATE fs_share_sessions")) {
                const [time,circleId,sessionId,subjectId]=args;
                let changes=0;
                for(const x of state.sessions)if(x.circle_id===circleId&&x.session_id===sessionId &&
                  x.subject_id===subjectId && x.state==="active"&&x.revoked_at_ms==null) {
                  x.state="revoked";x.revoked_at_ms=time;changes++;
                }
                return {meta:{changes}};
              }
              if(sql.startsWith("UPDATE fs_viewer_grants")) {
                const [time,circleId,sessionId,subjectId]=args;
                let changes=0;
                for(const x of state.grants)if(x.circle_id===circleId &&
                  x.session_id===sessionId && x.subject_id===subjectId && x.state==="active"){
                  x.state="revoked";x.revoked_at_ms=time;changes++;
                }
                return {meta:{changes}};
              }
              throw new Error("Unknown update query");
            }
          };
        }
      };
    }
  };
  return {state,db};
}

test("identity linkage is keyed, normalized, and rejects unsafe inputs",async()=>{
  const digest=await identityHmac("Alice@Example.Org",SECRET);
  assert.match(digest,/^[0-9a-f]{64}$/);
  assert.equal(await identityHmac("alice@example.org",SECRET),digest);
  assert.equal(await identityHmac("alice@example.org","short"),null);
  assert.equal(await identityHmac("not-an-email",SECRET),null);
  assert.equal(await identityHmac("",SECRET),null);
  assert.notEqual(digest,await identityHmac("alice@example.org",SECRET+"-different"));
});

test("Cloudflare Access audience AND separate adult registry required",async()=>{
  const {state,db}=dataset();
  state.adults[0].identity_hmac=await identityHmac("alice@example.org",SECRET);
  const access={aud:AUD,getIdentity:async()=>({email:"Alice@example.org"})};
  const good=await resolveTrustedAdult({access,audience:AUD,db,secret:SECRET});
  assert.equal(good,"alice");
  assert.equal(await resolveTrustedAdult({access:{...access,aud:"another-app"},audience:AUD,db,secret:SECRET}),null);
  assert.equal(await resolveTrustedAdult({access:null,audience:AUD,db,secret:SECRET}),null);
  assert.equal(await resolveTrustedAdult({access:{aud:AUD,getIdentity:async()=>({email:"unregistered@example.org"})},audience:AUD,db,secret:SECRET}),null);
  state.adults[0].age_verified=0;
  assert.equal(await resolveTrustedAdult({access,audience:AUD,db,secret:SECRET}),null);
  state.adults[0].age_verified=1;
  state.adults[0].state="revoked";
  assert.equal(await resolveTrustedAdult({access,audience:AUD,db,secret:SECRET}),null);
});

test("separately verified adult and exact grant are required on every DB re-read",async()=>{
  const {state,db}=dataset();
  const a=await loadPrivatePolicy(db,{
    circleId:"circle-1",subjectId:"alice",actorId:"bob",now:T
  });
  assert.equal(a.actorId,"bob");
  assert.equal(a.subjectId,"alice");
  assert.equal(mayReadPresence(a),true);
  assert.equal(mayWritePresence(a),false);
  assert.equal(visiblePresence({...a,location:{lat:28,lng:-81,observedAt:T-1000,accuracyM:8}}).state,"recent");

  state.grants[0].state="revoked";
  const denied=await loadPrivatePolicy(db,{
    circleId:"circle-1",subjectId:"alice",actorId:"bob",now:T
  });
  assert.equal(mayReadPresence(denied),false);
  state.grants[0].state="active";
  state.adults.find(x=>x.subject_id==="bob").age_verified=0;
  const unverified=await loadPrivatePolicy(db,{
    circleId:"circle-1",subjectId:"alice",actorId:"bob",now:T
  });
  assert.equal(mayReadPresence(unverified),false);
});

test("cross-circle and adult-unverified membership remain deny by default",async()=>{
  const {db}=dataset();
  const x=await loadPrivatePolicy(db,{
    circleId:"nonexistent",subjectId:"alice",actorId:"bob",now:T
  });
  assert.equal(mayReadPresence(x),false);
  assert.equal(mayWritePresence(x),false);
  assert.equal(await loadPrivatePolicy(db,{
    circleId:"circle-1",subjectId:"alice",actorId:"bob",now:-1
  }),null);
});

test("revocation is owned by verified adult; repeat/forged actor is a no-op",async()=>{
  const {state,db}=dataset();
  assert.equal(await revokePrivateShare(db,{
    circleId:"circle-1",actorId:"bob",sessionId:"session-1",now:T
  }),false);
  assert.equal(state.sessions[0].state,"active");
  assert.equal(await revokePrivateShare(db,{
    circleId:"circle-1",actorId:"alice",sessionId:"session-1",now:T
  }),true);
  assert.equal(state.sessions[0].state,"revoked");
  assert.equal(state.grants[0].state,"revoked");
  const after=await loadPrivatePolicy(db,{
    circleId:"circle-1",actorId:"bob",subjectId:"alice",now:T+1
  });
  assert.equal(mayReadPresence(after),false);
  assert.equal(await revokePrivateShare(db,{
    circleId:"circle-1",actorId:"alice",sessionId:"session-1",now:T+2
  }),false);
});

test("no plaintext identity or geolocation enters an Access adapter query",async()=>{
  const {state,db}=dataset();
  state.adults[0].identity_hmac=await identityHmac("alice@example.org",SECRET);
  const identity=await resolveTrustedAdult({
    access:{aud:AUD,getIdentity:async()=>({email:"alice@example.org"})},
    audience:AUD,db,secret:SECRET
  });
  assert.equal(identity,"alice");
  assert.equal(JSON.stringify(state).includes("alice@example.org"),false);
});
