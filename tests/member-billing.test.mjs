import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  RHEN_CLOUD_PLANS, billingConfigured, billingSchemaReady, paidAccess,
  planFromPrice, normalizeStripeSubscription, verifyStripeSignature,
  readBillingStatus, memberBillingEndpoint, stripeWebhookEndpoint, cancelBillingBeforeAccountDeletion
} from "../src/server/member-billing.mjs";

const stagingOrigin = "https://anevum-member-staging.devonakins.workers.dev";
const stagingEnv = () => ({
  ANEVUM_MEMBERS_ENABLED: "true",
  ANEVUM_MEMBER_PREVIEW_ENABLED: "true",
  MEMBER_PREVIEW_ORIGIN: stagingOrigin,
  ANEVUM_RHEN_BILLING_ENABLED: "true",
  ANEVUM_RHEN_BILLING_CHECKOUT_ENABLED: "false",
  ANEVUM_RHEN_BILLING_WEBHOOKS_ENABLED: "true",
  ANEVUM_STRIPE_MODE: "test",
  STRIPE_SECRET_KEY: "sk_test_local_mock_only",
  STRIPE_WEBHOOK_SECRET: "whsec_local_mock_only",
  STRIPE_FOUNDING_PRICE_ID: "price_Founding123",
  STRIPE_STANDARD_PRICE_ID: "price_Standard456"
});
const tables = ["member_billing_customers", "member_billing_subscriptions", "member_billing_events", "member_billing_checkout_locks"];
function mockDb({customer=true, row=null}={}) {
  const eventIds = new Set();
  const batched = [];
  const db = {
    prepare(sql) {
      const stmt = {
        sql, args: [],
        bind(...args) {this.args=args;return this;},
        async all() {
          if (sql.includes("sqlite_master")) return {results:tables.map(name=>({name}))};
          if (sql.includes("subscriptions")) return {results:[]};
          return {results:[]};
        },
        async first() {
          if (sql.includes("member_billing_events")) {
            return eventIds.has(this.args[0]) ? {stripe_event_id:this.args[0]} : null;
          }
          if (sql.includes("member_billing_customers")) {
            return customer ? (sql.includes("WHERE stripe_customer_id")
              ? {user_id:"user-a"} : {stripe_customer_id:"cus_abc123"}) : null;
          }
          if (sql.includes("member_billing_subscriptions")) return row;
          return null;
        },
        async run() {return {success:true};}
      };
      return stmt;
    },
    async batch(stmts) {
      batched.push(...stmts);
      for (const stmt of stmts) {
        if (stmt.sql.includes("INSERT OR IGNORE INTO member_billing_events")) {
          eventIds.add(stmt.args[0]);
        }
      }
      return stmts.map(()=>({success:true}));
    }
  };
  return { db, eventIds, batched };
}

async function signedRequest(event, secret="whsec_local_mock_only", timestamp=Math.floor(Date.now()/1000)) {
  const raw=JSON.stringify(event);
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),
    {name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const digest=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(timestamp+"."+raw));
  const hmac=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
  return new Request(stagingOrigin+"/api/billing/stripe/webhook",{
    method:"POST",headers:{"stripe-signature":"t="+timestamp+",v1="+hmac,"content-type":"application/json"},body:raw
  });
}

test("production is default-disabled and staging requires valid test keys and exact origin",async()=>{
  const prod=JSON.parse(readFileSync(new URL("../wrangler.jsonc",import.meta.url),"utf8"));
  const stage=JSON.parse(readFileSync(new URL("../wrangler.member-staging.jsonc",import.meta.url),"utf8"));
  for(const vars of [prod.vars,stage.vars]){
    for(const flag of [
      "ANEVUM_RHEN_BILLING_ENABLED","ANEVUM_RHEN_BILLING_CHECKOUT_ENABLED",
      "ANEVUM_RHEN_BILLING_WEBHOOKS_ENABLED","ANEVUM_RHEN_FOUNDING_ENABLED",
      "ANEVUM_RHEN_BILLING_LIVE_APPROVED"
    ]) assert.equal(vars[flag],"false");
    for(const secret of ["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","STRIPE_FOUNDING_PRICE_ID","STRIPE_STANDARD_PRICE_ID"])
      assert.equal(Object.hasOwn(vars,secret),false);
  }
  assert.equal(billingConfigured(stagingEnv(),stagingOrigin),true);
  assert.equal(billingConfigured(stagingEnv(),"https://anevum.com"),false);
  assert.equal(billingConfigured({...stagingEnv(),ANEVUM_STRIPE_MODE:"live"},stagingOrigin),false);
  assert.equal(billingConfigured({...stagingEnv(),STRIPE_WEBHOOK_SECRET:""},stagingOrigin),false);
});

test("price, subscription status, and period gate paid entitlement without order authority",()=>{
  const env=stagingEnv();
  assert.equal(RHEN_CLOUD_PLANS.founding.amountCents,999);
  assert.equal(RHEN_CLOUD_PLANS.standard.amountCents,1999);
  assert.equal(planFromPrice(env,env.STRIPE_FOUNDING_PRICE_ID),"founding");
  assert.equal(planFromPrice(env,"price_Unrecognized"),"unknown");
  const now=Math.floor(Date.now()/1000);
  assert.equal(paidAccess({plan_code:"founding",status:"active",current_period_end:now+3600}),true);
  for(const status of ["trialing","past_due","unpaid","incomplete","canceled","paused"])
    assert.equal(paidAccess({plan_code:"founding",status,current_period_end:now+3600}),false);
  assert.equal(paidAccess({plan_code:"unknown",status:"active",current_period_end:now+3600}),false);
  assert.equal(paidAccess({plan_code:"standard",status:"active",current_period_end:now-10}),false);
  const normalized=normalizeStripeSubscription({
    id:"sub_valid01",customer:"cus_valid01",status:"active",
    items:{data:[{price:{id:env.STRIPE_FOUNDING_PRICE_ID},current_period_end:now+7200}]}
  },env);
  assert.equal(normalized.plan,"founding");
  assert.equal(normalized.periodEnd,now+7200);
  assert.equal(normalized.customerId,"cus_valid01");
});

test("billing status fails closed without migrated schema and never enables member trading",async()=>{
  assert.equal(await billingSchemaReady({}),false);
  const unavailable=await readBillingStatus({}, "user-a", stagingEnv(),stagingOrigin);
  assert.equal(unavailable.available,false);
  assert.equal(unavailable.checkoutEnabled,false);
  assert.equal(unavailable.paperExecutionEnabled,false);
  assert.equal(unavailable.liveExecutionEnabled,false);
  const row={plan_code:"standard",status:"active",current_period_end:Math.floor(Date.now()/1000)+10000,cancel_at_period_end:0};
  const state=await readBillingStatus(mockDb({row}).db,"user-a",stagingEnv(),stagingOrigin);
  assert.equal(state.available,true);
  assert.equal(state.checkoutEnabled,false);
  assert.equal(state.paidAccess,true);
  assert.equal(state.liveExecutionEnabled,false);
});

test("checkout refuses wrong prices and duplicate provider sessions, with per-user lock",async()=>{
  const env={...stagingEnv(),
    ANEVUM_RHEN_BILLING_CHECKOUT_ENABLED:"true",
    ANEVUM_RHEN_FOUNDING_ENABLED:"true"
  };
  const user={id:"user-a",email:"member@example.test",emailVerified:true};
  const calls=[];
  let pending=false;
  let wrongPrice=false;
  let lockActive=false;
  const db={prepare(sql){
    return {
      args:[],bind(...args){this.args=args;return this;},
      async all(){return {results:tables.map(name=>({name}))};},
      async first(){
        if(sql.includes("SELECT status FROM member_billing_subscriptions"))return null;
        if(sql.includes("member_billing_customers"))return {stripe_customer_id:"cus_abc123"};
        return null;
      },
      async run(){
        if(sql.includes("INSERT INTO member_billing_checkout_locks")){
          if(lockActive)return {success:true,meta:{changes:0}};
          lockActive=true;
          return {success:true,meta:{changes:1}};
        }
        if(sql.includes("DELETE FROM member_billing_checkout_locks"))lockActive=false;
        return {success:true,meta:{changes:1}};
      }
    };
  }};
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async(url,init)=>{
    const u=new URL(url);
    calls.push(init.method+" "+u.pathname);
    if(u.pathname==="/v1/prices/price_Founding123")
      return Response.json({id:"price_Founding123",active:true,currency:"usd",type:"recurring",
        recurring:{interval:"month",interval_count:1},unit_amount:wrongPrice?1999:999});
    if(u.pathname==="/v1/checkout/sessions" && init.method==="GET")
      return Response.json({has_more:false,data:pending?[{status:"open",mode:"subscription"}]:[]});
    if(u.pathname==="/v1/subscriptions" && init.method==="GET")
      return Response.json({has_more:false,data:[]});
    if(u.pathname==="/v1/checkout/sessions" && init.method==="POST")
      return Response.json({url:"https://checkout.stripe.com/c/pay/cs_test_abc"});
    throw Error("Unexpected mocked Stripe API "+init.method+" "+u.pathname);
  };
  const checkout=()=>new Request(stagingOrigin+"/api/member/billing/checkout",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({plan:"founding"})
  });
  try{
    let res=await memberBillingEndpoint(checkout(),{...env,MEMBER_DB:db},user,stagingOrigin,
      "/api/member/billing/checkout");
    assert.equal(res.status,200);
    assert.equal((await res.json()).url,"https://checkout.stripe.com/c/pay/cs_test_abc");
    assert.equal(lockActive,false);
    assert.ok(calls.includes("POST /v1/checkout/sessions"));
    pending=true;
    calls.length=0;
    res=await memberBillingEndpoint(checkout(),{...env,MEMBER_DB:db},user,stagingOrigin,
      "/api/member/billing/checkout");
    assert.equal(res.status,409);
    assert.equal(calls.includes("POST /v1/checkout/sessions"),false);
    assert.equal(lockActive,false);
    pending=false;
    wrongPrice=true;
    calls.length=0;
    res=await memberBillingEndpoint(checkout(),{...env,MEMBER_DB:db},user,stagingOrigin,
      "/api/member/billing/checkout");
    assert.equal(res.status,503);
    assert.equal(calls.includes("POST /v1/checkout/sessions"),false);
    assert.equal(lockActive,false);
  }finally{globalThis.fetch=oldFetch;}
});

test("Stripe webhook signature validates raw body, timestamp, and all v1 candidates",async()=>{
  const evt={id:"evt_abc123",created:Math.floor(Date.now()/1000),livemode:false};
  const req=await signedRequest(evt);
  const payload=await req.text();
  const signature=req.headers.get("stripe-signature");
  assert.equal(await verifyStripeSignature(payload,signature,"whsec_local_mock_only"),true);
  assert.equal(await verifyStripeSignature(payload+" ",signature,"whsec_local_mock_only"),false);
  assert.equal(await verifyStripeSignature(payload,signature,"whsec_different"),false);
  assert.equal(await verifyStripeSignature(payload,signature,"whsec_local_mock_only",evt.created+301),false);
  assert.equal(await verifyStripeSignature(payload,"t=1,v1=nope","whsec_local_mock_only"),false);
  assert.equal(await verifyStripeSignature(payload,"t=1,v0=anything","whsec_local_mock_only"),false);
  assert.equal(await verifyStripeSignature(payload,signature.replace("v1=","v1=wrong,v1="),"whsec_local_mock_only"),true);
});

test("webhooks remain disabled and reject spoofed signatures",async()=>{
  const evt={id:"evt_abc123",created:Math.floor(Date.now()/1000),livemode:false};
  const db=mockDb().db;
  const req=await signedRequest(evt);
  assert.equal((await stripeWebhookEndpoint(req.clone(),{...stagingEnv(),MEMBER_DB:db,ANEVUM_RHEN_BILLING_WEBHOOKS_ENABLED:"false"})).status,503);
  const forged=new Request(stagingOrigin+"/api/billing/stripe/webhook",{
    method:"POST",headers:{"stripe-signature":"t=123,v1=fake"},body:"{}"
  });
  assert.equal((await stripeWebhookEndpoint(forged,{...stagingEnv(),MEMBER_DB:db})).status,400);
});

test("subscription webhook reconciles live Stripe source and safely ignores duplicate events",async()=>{
  const state=mockDb();
  const evt={id:"evt_order01",type:"customer.subscription.updated",created:Math.floor(Date.now()/1000),livemode:false,
    data:{object:{id:"sub_test123",status:"active"}}};
  const previous=globalThis.fetch;
  let fetchCount=0;
  globalThis.fetch=async (url)=>{
    fetchCount++;
    assert.equal(new URL(url).pathname,"/v1/subscriptions/sub_test123");
    return Response.json({
      id:"sub_test123",customer:"cus_abc123",status:"canceled",livemode:false,
      items:{data:[{price:{id:"price_Standard456"},current_period_end:1999999999}]},
      metadata:{anevum_member_id:"user-a",anevum_product:"rhen_cloud"}
    });
  };
  try {
    const env={...stagingEnv(),MEMBER_DB:state.db};
    let result=await stripeWebhookEndpoint(await signedRequest(evt),env);
    assert.equal(result.status,200);
    assert.equal((await result.json()).handled,true);
    assert.equal(state.batched.length,2);
    assert.equal(state.batched[1].args[5],"canceled");
    result=await stripeWebhookEndpoint(await signedRequest(evt),env);
    assert.equal(result.status,200);
    assert.equal((await result.json()).duplicate,true);
    assert.equal(fetchCount,1);
  } finally {globalThis.fetch=previous;}
});

test("account deletion expires checkout, cancels subscriptions and refuses unsafe provider state",async()=>{
  const state=mockDb();
  const previous=globalThis.fetch;
  const operations=[];
  globalThis.fetch=async (url,init)=>{
    const u=new URL(url);
    operations.push(init.method+" "+u.pathname);
    if(u.pathname==="/v1/checkout/sessions" && init.method==="GET")
      return Response.json({has_more:false,data:[{id:"cs_test_Abc123",status:"open"}]});
    if(u.pathname==="/v1/checkout/sessions/cs_test_Abc123/expire")
      return Response.json({id:"cs_test_Abc123",status:"expired"});
    if(u.pathname==="/v1/subscriptions" && init.method==="GET")
      return Response.json({has_more:false,data:[{id:"sub_test123",status:"active"}]});
    if(u.pathname==="/v1/subscriptions/sub_test123" && init.method==="DELETE")
      return Response.json({id:"sub_test123",status:"canceled"});
    throw new Error("unexpected Stripe call "+u.pathname);
  };
  try {
    await cancelBillingBeforeAccountDeletion({...stagingEnv(),MEMBER_DB:state.db},"user-a");
    assert.deepEqual(operations,[
      "GET /v1/checkout/sessions",
      "POST /v1/checkout/sessions/cs_test_Abc123/expire",
      "GET /v1/subscriptions",
      "DELETE /v1/subscriptions/sub_test123"
    ]);
    await assert.rejects(cancelBillingBeforeAccountDeletion({...stagingEnv(),MEMBER_DB:state.db,STRIPE_SECRET_KEY:""},"user-a"));
  } finally {globalThis.fetch=previous;}
});

test("member routes, export/delete, and protected operator boundary remain distinct",()=>{
  const member=readFileSync(new URL("../src/server/member.mjs",import.meta.url),"utf8");
  const worker=readFileSync(new URL("../worker.mjs",import.meta.url),"utf8");
  const page=readFileSync(new URL("../src/pages/MemberBilling.tsx",import.meta.url),"utf8");
  assert.match(member,/beforeDelete: async \(user\)/);
  assert.match(member,/cancelBillingBeforeAccountDeletion\(env, user.id\)/);
  assert.match(member,/billing: \{ customer:/);
  assert.ok(member.indexOf("if (!user?.id)") < member.indexOf('pathname === "/api/member/billing"'));
  assert.match(worker,/pathname === "\/api\/billing\/stripe\/webhook"/);
  assert.match(worker,/stripeWebhookEndpoint\(request, env\)/);
  assert.match(worker,/commandCredential\(request, env\)/);
  assert.doesNotMatch(page,/api\/command|brokerToken|alpacaKey|api\/trader/);
});
