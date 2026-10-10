// OAuth reviewer-only PAPER connection. No broker order, financial transfer, or
// shared founder credential path exists here. This module never runs on production.
const AUTH_URL = "https://app.alpaca.markets/oauth/authorize";
const TOKEN_URL = "https://api.alpaca.markets/oauth/token";
const PAPER_ACCOUNT_URL = "https://paper-api.alpaca.markets/v2/account";
const DISCLOSURE_VERSION = "alpaca-review-paper-v1";
const TTL = 600;
const STATE_RE = /^[A-Za-z0-9_-]{40,128}$/;
const ACCOUNT_RE = /^[A-Za-z0-9_.:-]{8,128}$/;

function response(data, status=200) {
  return Response.json(data, {status, headers:{
    "Cache-Control":"private, no-store", "Pragma":"no-cache",
    "Referrer-Policy":"no-referrer", "X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow, noarchive"
  }});
}
function opaqueBytes(value) {
  if(typeof value!=="string" || value.length < 40 || value.length > 128)throw Error("Invalid encryption binding");
  const bytes=Uint8Array.from(atob(value), c=>c.charCodeAt(0));
  if(bytes.length!==32)throw Error("Invalid encryption binding");
  return bytes;
}
function encode(bytes){return btoa(String.fromCharCode(...bytes));}
async function digest(value){
  const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function newState(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return encode(bytes).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
}
async function sealToken(token,keyBytes,userId,connectionId,brokerId){
  const key=await crypto.subtle.importKey("raw",keyBytes,"AES-GCM",false,["encrypt"]);
  const nonce=crypto.getRandomValues(new Uint8Array(12));
  const associated=new TextEncoder().encode([userId,connectionId,brokerId,"paper"].join("|"));
  const ciphertext=await crypto.subtle.encrypt(
    {name:"AES-GCM",iv:nonce,additionalData:associated,tagLength:128},
    key,new TextEncoder().encode(token)
  );
  return {encrypted:encode(new Uint8Array(ciphertext)),iv:encode(nonce)};
}

export function reviewerConnectConfigured(env, verifiedOrigin) {
  let preview;
  try{preview=new URL(String(env?.MEMBER_PREVIEW_ORIGIN||""));}catch{return false;}
  if(verifiedOrigin==="https://anevum.com" || !verifiedOrigin ||
     preview.protocol!=="https:" || preview.origin!==verifiedOrigin ||
     env?.ANEVUM_MEMBER_PREVIEW_ENABLED!=="true" ||
     env?.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED!=="true" ||
     typeof env?.ALPACA_CONNECT_CLIENT_ID!=="string" || env.ALPACA_CONNECT_CLIENT_ID.length<8 ||
     typeof env?.ALPACA_CONNECT_CLIENT_SECRET!=="string" || env.ALPACA_CONNECT_CLIENT_SECRET.length<16)
    return false;
  try{return opaqueBytes(env.ALPACA_CONNECT_TOKEN_KEY_BASE64).length===32;}catch{return false;}
}

export async function reviewerSchemaReady(db) {
  if(typeof db?.prepare!=="function")return false;
  try{
    const found=await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'member_alpaca_review_%'"
    ).all();
    const names=new Set((found?.results||[]).map(x=>x.name));
    return ["member_alpaca_review_states","member_alpaca_review_consent","member_alpaca_review_connections"]
      .every(name=>names.has(name));
  }catch{return false;}
}

export function buildReviewerAuthorizeUrl(clientId, callback, state) {
  const origin=new URL(callback);
  if(origin.protocol!=="https:" || origin.search || origin.hash ||
    origin.pathname!=="/api/member/alpaca/review/callback" ||
    !STATE_RE.test(state))throw Error("Invalid authorization callback");
  const url=new URL(AUTH_URL);
  url.searchParams.set("response_type","code");
  url.searchParams.set("client_id",clientId);
  url.searchParams.set("redirect_uri",callback);
  url.searchParams.set("state",state);
  url.searchParams.set("env","paper");
  // Alpaca assumes read-only access when scope is omitted. The reviewer flow
  // never requests trading or account:write scopes.
  return url.toString();
}

export async function exportReviewerConnection(db,userId) {
  if(!await reviewerSchemaReady(db))return null;
  const row=await db.prepare(
    "SELECT broker_account_id,connected_at FROM member_alpaca_review_connections WHERE user_id=?"
  ).bind(userId).first();
  return row ? {provider:"alpaca",environment:"paper",ending:String(row.broker_account_id).slice(-4),
    connectedAt:row.connected_at,executionPermission:"NONE"} : null;
}

export async function reviewerEndpoint(request, env, user, verifiedOrigin, pathname, fetcher=fetch) {
  if(!user?.id || !verifiedOrigin || new URL(request.url).origin!==verifiedOrigin)
    return response({message:"Authenticated account required."},403);
  const db=env?.MEMBER_DB;
  const ready=await reviewerSchemaReady(db);
  const enabled=ready && reviewerConnectConfigured(env,verifiedOrigin);
  const now=Math.floor(Date.now()/1000);
  const callback=verifiedOrigin+"/api/member/alpaca/review/callback";

  if(pathname==="/api/member/brokerage") {
    if(request.method!=="GET")return response({message:"Read-only capability."},405);
    let connected=null;
    if(ready){
      try{
        connected=await db.prepare(
          "SELECT broker_account_id,connected_at FROM member_alpaca_review_connections WHERE user_id=?"
        ).bind(user.id).first();
      }catch{return response({message:"Broker connection unavailable."},503);}
    }
    return response({
      integration:"alpaca_connect",connectionAvailable:enabled,accountConnected:!!connected,
      paperTradingEnabled:false,liveTradingEnabled:false,brokerWriteEnabled:false,
      depositsEnabled:false,withdrawalsEnabled:false,
      account:connected ? {provider:"Alpaca",environment:"paper",ending:String(connected.broker_account_id).slice(-4),
        connectedAt:connected.connected_at} : null
    });
  }

  if(pathname==="/api/member/alpaca/review/disconnect"){
    if(request.method!=="POST")return response({message:"Method not allowed."},405);
    if(!ready)return response({message:"Review connection storage unavailable."},503);
    try{
      await db.prepare("DELETE FROM member_alpaca_review_connections WHERE user_id=?").bind(user.id).run();
      return response({disconnected:true,executionEnabled:false,
        message:"Removed this connection from ANEVUM. Revoke the app separately in your brokerage's authorized-app settings."});
    }catch{return response({message:"Connection removal unavailable."},503);}
  }

  if(!enabled)return response({message:"Reviewer-only brokerage connection is not enabled."},503);

  if(pathname==="/api/member/alpaca/review/start"){
    if(request.method!=="POST")return response({message:"Method not allowed."},405);
    if(user.emailVerified!==true)return response({message:"Verified member account required."},403);
    let body;
    try{
      if(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json")
        throw Error("Invalid body");
      const raw=await request.text();
      if(raw.length>256)throw Error("Invalid body");
      body=JSON.parse(raw);
    }catch{return response({message:"Disclosure acknowledgement required."},400);}
    if(!body || Array.isArray(body) || Object.keys(body).sort().join(",")!=="acknowledged,disclosureVersion" ||
      body.acknowledged!==true || body.disclosureVersion!==DISCLOSURE_VERSION)
      return response({message:"Disclosure acknowledgement required."},400);
    const exists=await db.prepare(
      "SELECT broker_account_id FROM member_alpaca_review_connections WHERE user_id=?"
    ).bind(user.id).first();
    if(exists)return response({message:"Disconnect the existing paper connection first."},409);
    try{
      await db.prepare(
        "INSERT INTO member_alpaca_review_consent(user_id,disclosure_version,accepted_at) VALUES(?,?,?) "+
        "ON CONFLICT(user_id,disclosure_version) DO UPDATE SET accepted_at=excluded.accepted_at"
      ).bind(user.id,DISCLOSURE_VERSION,now).run();
      const state=newState();
      const hash=await digest(state);
      const stored=await db.prepare(
        "INSERT INTO member_alpaca_review_states(state_hash,user_id,expires_at,created_at) "+
        "SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM member_alpaca_review_states "+
        "WHERE user_id=? AND created_at>=?) < 5"
      ).bind(hash,user.id,now+TTL,now,user.id,now-3600).run();
      if(stored.meta?.changes!==1)return response({message:"Too many connection attempts."},429);
      return response({authorizeUrl:buildReviewerAuthorizeUrl(env.ALPACA_CONNECT_CLIENT_ID,callback,state),
        accountConnected:false,executionEnabled:false});
    }catch{return response({message:"Review connection could not be started."},503);}
  }

  if(pathname==="/api/member/alpaca/review/callback"){
    if(request.method!=="GET")return response({message:"Method not allowed."},405);
    const url=new URL(request.url);
    const state=url.searchParams.get("state");
    const code=url.searchParams.get("code");
    if(url.searchParams.getAll("state").length!==1 || url.searchParams.getAll("code").length!==1 ||
       [...url.searchParams.keys()].some(key=>key!=="state" && key!=="code") ||
       !STATE_RE.test(state||"") || !code || code.length>1024)
      return response({message:"Authorization response invalid."},400);
    const claimed=await db.prepare(
      "UPDATE member_alpaca_review_states SET consumed_at=? "+
      "WHERE state_hash=? AND user_id=? AND consumed_at IS NULL AND expires_at>=?"
    ).bind(now,await digest(state),user.id,now).run();
    if(claimed.meta?.changes!==1)return response({message:"Authorization expired or already used."},403);
    try{
      const tokenRes=await fetcher(TOKEN_URL,{method:"POST",redirect:"error",
        headers:{"Content-Type":"application/x-www-form-urlencoded","Accept":"application/json"},
        body:new URLSearchParams({grant_type:"authorization_code",code,
          client_id:env.ALPACA_CONNECT_CLIENT_ID,client_secret:env.ALPACA_CONNECT_CLIENT_SECRET,
          redirect_uri:callback}),signal:AbortSignal.timeout(8000)});
      if(!tokenRes.ok)throw Error("Provider rejected authorization");
      const tokenRaw=await tokenRes.text();
      if(tokenRaw.length>8192)throw Error("Unexpected provider response");
      const grant=JSON.parse(tokenRaw);
      const scopes=String(grant.scope||"").trim().split(/\s+/).filter(Boolean);
      if(grant.token_type?.toLowerCase()!=="bearer" ||
        typeof grant.access_token!=="string" || grant.access_token.length<16 ||
        grant.access_token.length>4096 || /\s/.test(grant.access_token) ||
        scopes.includes("trading") || scopes.includes("account:write"))
        throw Error("Unexpected provider grant permissions");
      const accountRes=await fetcher(PAPER_ACCOUNT_URL,{
        method:"GET",headers:{"Authorization":"Bearer "+grant.access_token,"Accept":"application/json"},
        cache:"no-store",redirect:"error",signal:AbortSignal.timeout(8000)
      });
      if(!accountRes.ok)throw Error("Paper account read rejected");
      const accountRaw=await accountRes.text();
      if(accountRaw.length>16384)throw Error("Unexpected paper account response");
      const account=JSON.parse(accountRaw);
      if(!ACCOUNT_RE.test(account?.id||"") || account.status!=="ACTIVE" ||
        account.account_blocked!==false)throw Error("Unverified paper account");
      const connectionId=crypto.randomUUID();
      const sealed=await sealToken(grant.access_token,opaqueBytes(env.ALPACA_CONNECT_TOKEN_KEY_BASE64),
        user.id,connectionId,account.id);
      await db.prepare(
        "INSERT INTO member_alpaca_review_connections "+
        "(user_id,connection_id,broker_account_id,encrypted_token,token_iv,granted_scopes,connected_at) "+
        "VALUES(?,?,?,?,?,?,?)"
      ).bind(user.id,connectionId,account.id,sealed.encrypted,sealed.iv,scopes.join(" "),now).run();
      return new Response(null,{status:303,headers:{"Location":verifiedOrigin+"/apps/rhen/account?connection=linked",
        "Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
        "X-Robots-Tag":"noindex, nofollow, noarchive"}});
    }catch{
      // Never expose the grant, callback code, broker ID, remote response, or
      // request headers to errors, logs, frontend, or exported account data.
      return response({message:"Paper brokerage connection could not be verified."},409);
    }
  }
  return response({message:"Reviewer-only endpoint not found."},404);
}
