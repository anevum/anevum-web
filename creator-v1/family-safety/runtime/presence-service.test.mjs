import test from "node:test";
import assert from "node:assert/strict";
import { EphemeralPresenceRoom, MIN_WRITE_INTERVAL_MS } from "./ephemeral-room.mjs";
import { createPresenceService } from "./presence-service.mjs";
import { POSITION_TTL_MS } from "../presence-policy.mjs";

const T=Date.parse("2026-10-17T22:00:00Z");
const ORIGIN="https://family-staging.example.invalid";
const circle={id:"family-1",state:"active"};
const member=id=>({circleId:circle.id,subjectId:id,role:"adult",ageBand:"adult",identityVerified:true,state:"active"});
const session=()=>({
  id:"session-1",circleId:circle.id,subjectId:"alice",state:"active",
  consent:"explicit",revokedAt:null,startedAt:T-60_000,expiresAt:T+60_000
});
const grant=()=>({
  circleId:circle.id,subjectId:"alice",viewerId:"bob",sessionId:"session-1",
  state:"active",scope:"presence:read",consent:"explicit",
  revokedAt:null,issuedAt:T-20_000,expiresAt:T+30_000
});
const point=(at=T)=>({lat:28.2483,lng:-81.2873,accuracyM:12,observedAt:at});

function fixture() {
  const clock={now:T};
  const permissions={
    circle:{...circle}, memberships:[member("alice"),member("bob"),member("carol")],
    session:session(), grant:grant()
  };
  const room=new EphemeralPresenceRoom();
  let reads=0, writes=0, revocations=0;
  const requestFor=(method,path,{actor=null,origin=ORIGIN,action=true,json,headers={},query=""}={})=>{
    const h=new Headers(headers);
    if(actor)h.set("X-TEST-IDENTITY",actor); // mocked TRUSTED provider, NOT worker auth
    let body;
    if(json!==undefined) {
      h.set("Content-Type","application/json");
      body=typeof json==="string"?json:JSON.stringify(json);
    }
    if(method!=="GET" && origin!==null)h.set("Origin",origin);
    if(method!=="GET" && action)h.set("X-Family-Safety-Action","1");
    return new Request(ORIGIN+path+query,{method,headers:h,body});
  };
  const fetch=createPresenceService({
    expectedOrigin:ORIGIN,
    authenticate: async request=>request.headers.get("X-TEST-IDENTITY"),
    loadPolicy: async ({circleId,actorId,subjectId,now})=>{
      reads++;
      return {circleId,actorId,subjectId,now,
        circle:permissions.circle,
        memberships:permissions.memberships,
        session:permissions.session,
        grant:permissions.grant
      };
    },
    presenceForCircle: id=>{
      assert.equal(id,circle.id);
      return {
        read:async (...args)=>room.read(...args),
        write:async (...args)=>{writes++;return room.write(...args);},
        purge:async (...args)=>room.purge(...args)
      };
    },
    revokeShare:async ({circleId,actorId,sessionId,now})=>{
      revocations++;
      if(circleId!==circle.id||actorId!=="alice"||
         sessionId!==permissions.session.id||permissions.session.state!=="active")return false;
      permissions.session={...permissions.session,state:"revoked",revokedAt:now};
      permissions.grant={...permissions.grant,state:"revoked",revokedAt:now};
      return true;
    },
    now:()=>clock.now
  });
  return {fetch,clock,permissions,room,requestFor,
    metrics:()=>({reads,writes,revocations})};
}

test("room writes only valid current positions, never maintains history",()=>{
  const room=new EphemeralPresenceRoom();
  assert.equal(room.read("alice",T,"session-1"),null);
  assert.equal(room.write("alice",point(),T,"session-1"),"ok");
  assert.equal(room.size,1);
  assert.deepEqual(room.read("alice",T,"session-1"),point());
  assert.equal(room.read("alice",T,"wrong-session"),null);
  assert.equal(room.write("alice",point(),T+1,"session-1"),"throttled");
  assert.equal(room.write("alice",point(T+MIN_WRITE_INTERVAL_MS),T+MIN_WRITE_INTERVAL_MS,"session-1"),"ok");
  assert.equal(room.size,1);
  assert.equal(room.read("alice",T+MIN_WRITE_INTERVAL_MS,"session-1").observedAt,T+MIN_WRITE_INTERVAL_MS);
  room.prune(T+MIN_WRITE_INTERVAL_MS+POSITION_TTL_MS);
  assert.equal(room.read("alice",T+MIN_WRITE_INTERVAL_MS+POSITION_TTL_MS,"session-1"),null);
  assert.equal(room.size,0);
});

test("room purge bans late writes by old share session, but permits new session",()=>{
  const room=new EphemeralPresenceRoom();
  assert.equal(room.write("alice",point(),T,"session-1"),"ok");
  assert.equal(room.purge("alice","session-1",T+1000),true);
  assert.equal(room.size,0);
  assert.equal(room.write("alice",point(T+1001),T+1001,"session-1"),"revoked");
  assert.equal(room.write("alice",point(T+1100),T+1100,"session-2"),"ok");
  assert.equal(room.read("alice",T+1100,"session-1"),null);
  assert.equal(room.read("alice",T+1100,"session-2")?.observedAt,T+1100);
  assert.equal(room.purge("alice","session-1",T+1200),true);
  assert.equal(room.read("alice",T+1200,"session-2")?.observedAt,T+1100);
  assert.equal(room.purge("alice","session-2",T+1200),true);
  assert.equal(room.size,0);
});

test("room rejects corrupt GPS input and caps entries",()=>{
  const room=new EphemeralPresenceRoom();
  for(const candidate of [
    point(T-POSITION_TTL_MS),
    {...point(),lat:Infinity},
    {...point(),lng:181},
    {...point(),accuracyM:3000},
    {...point(),observedAt:T+5001}
  ])assert.equal(room.write("alice",candidate,T,"session-1"),"invalid");
  for(let i=0;i<128;i++) assert.equal(room.write("member-"+i,point(),T,"s-"+i),"ok");
  assert.equal(room.size,128);
  assert.equal(room.write("over",point(),T,"over-session"),"capacity");
});

test("HTTP boundary never uses caller's claimed actor from JSON",async()=>{
  const app=fixture();
  const bogus=app.requestFor("PUT","/v1/circles/family-1/presence/me",{
    json:point(), actor:null
  });
  const unauth=await app.fetch(bogus);
  assert.equal(unauth.status,401);
  assert.equal(app.metrics().writes,0);
  const missing=await app.fetch(app.requestFor("GET","/v1/circles/family-1/presence/alice"));
  assert.equal(missing.status,401);
});

test("authorized adult writes, explicit grantee reads, outsider gets no location",async()=>{
  const app=fixture();
  const put=await app.fetch(app.requestFor("PUT","/v1/circles/family-1/presence/me",{
    actor:"alice",json:point()
  }));
  assert.equal(put.status,204);
  assert.match(put.headers.get("cache-control"),/no-store/);
  const seen=await app.fetch(app.requestFor("GET","/v1/circles/family-1/presence/alice",{actor:"bob"}));
  assert.equal(seen.status,200);
  assert.match(seen.headers.get("cache-control"),/no-store/);
  assert.deepEqual(await seen.json(),{
    state:"recent",position:{lat:28.2483,lng:-81.2873},
    updatedAt:T,accuracyM:12
  });
  const outsider=await app.fetch(app.requestFor("GET","/v1/circles/family-1/presence/alice",{actor:"carol"}));
  assert.equal(outsider.status,200);
  assert.deepEqual(await outsider.json(),{
    state:"unavailable",position:null,updatedAt:null,accuracyM:null
  });
  assert.equal(app.metrics().writes,1);
});

test("revocation hides position and bans writes through the retired session",async()=>{
  const app=fixture();
  const url="/v1/circles/family-1/presence/me";
  assert.equal((await app.fetch(app.requestFor("PUT",url,{actor:"alice",json:point()}))).status,204);
  assert.equal((await app.fetch(app.requestFor("DELETE",
    "/v1/circles/family-1/shares/session-1",{actor:"bob"}))).status,404);
  assert.equal((await app.fetch(app.requestFor("DELETE",
    "/v1/circles/family-1/shares/session-1",{actor:"alice"}))).status,204);
  assert.equal(app.room.size,0);
  const read=await app.fetch(app.requestFor("GET","/v1/circles/family-1/presence/alice",{actor:"bob"}));
  assert.equal((await read.json()).state,"unavailable");
  assert.equal((await app.fetch(app.requestFor("PUT",url,{actor:"alice",json:point()}))).status,403);
  assert.equal(app.room.write("alice",point(T+1),T+1,"session-1"),"revoked");
  assert.equal((await app.fetch(app.requestFor("DELETE",
    "/v1/circles/family-1/shares/session-1",{actor:"alice"}))).status,404);
});

test("HTTP mutations require expected origin, action header, correct content type, and 1 KB cap",async()=>{
  const app=fixture();
  const path="/v1/circles/family-1/presence/me";
  for(const overrides of [
    {origin:"https://evil.example"},
    {origin:null},
    {action:false},
    {headers:{"Content-Type":"application/x-www-form-urlencoded"}}
  ]) {
    const req=app.requestFor("PUT",path,{
      actor:"alice",json:point(),...overrides
    });
    if(overrides.headers)req.headers.set("Content-Type","application/x-www-form-urlencoded");
    assert.equal((await app.fetch(req)).status,403);
  }
  const oversized={lat:1,lng:2,accuracyM:3,observedAt:T,space:"x".repeat(1400)};
  assert.equal((await app.fetch(app.requestFor("PUT",path,{actor:"alice",json:oversized}))).status,422);
  assert.equal((await app.fetch(app.requestFor("PUT",path,{
    actor:"alice",json:{...point(),subjectId:"bob"}
  }))).status,422);
  assert.equal((await app.fetch(app.requestFor("GET",path,{actor:"alice"}))).status,404);
  assert.equal((await app.fetch(app.requestFor("GET",
    "/v1/circles/family-1/presence/alice",{actor:"alice",query:"?debug=1"}))).status,404);
  assert.equal(app.metrics().writes,0);
});

test("stale and expired presence is reported correctly with no stale leak after grant expiry",async()=>{
  const app=fixture();
  const path="/v1/circles/family-1/presence/me";
  assert.equal((await app.fetch(app.requestFor("PUT",path,{actor:"alice",json:point()}))).status,204);
  app.clock.now=T+45_000;
  assert.equal((await (await app.fetch(app.requestFor("GET",
    "/v1/circles/family-1/presence/alice",{actor:"bob"}))).json()).state,"unavailable");
  app.permissions.grant.expiresAt=T+55_000;
  assert.equal((await (await app.fetch(app.requestFor("GET",
    "/v1/circles/family-1/presence/alice",{actor:"bob"}))).json()).state,"stale");
  app.clock.now=T+60_000;
  assert.equal((await (await app.fetch(app.requestFor("GET",
    "/v1/circles/family-1/presence/alice",{actor:"bob"}))).json()).state,"unavailable");
});

test("malformed untrusted policy shapes fail closed",async()=>{
  const app=fixture();
  app.permissions.circle.state="disabled";
  const result=await app.fetch(app.requestFor("PUT","/v1/circles/family-1/presence/me",{
    actor:"alice",json:point()
  }));
  assert.equal(result.status,403);
  assert.equal(app.room.size,0);
});

test("response does not include coordinate data on unauthenticated or denied access",async()=>{
  const app=fixture();
  const res=await app.fetch(app.requestFor("GET",
    "/v1/circles/family-1/presence/alice",{actor:"carol"}));
  assert.equal(JSON.stringify(await res.json()).includes("28.2483"),false);
  assert.equal(res.headers.get("content-security-policy"),"default-src 'none'; frame-ancestors 'none'");
});
