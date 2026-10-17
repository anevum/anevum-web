/**
 * ANEVUM prelaunch preview gate / Cloudflare Access JWT validation.
 * Only the exact Access app audience can authorize this host; identity is
 * additionally checked against a secret server-side email allowlist.
 * Never trust query strings, custom client headers or unsigned cookies.
 */
export const APEX_ORIGIN="https://anevum.com";
export const ACCESS_TEAM_DOMAIN="wispy-tooth-095a.cloudflareaccess.com";
export const ACCESS_ISSUER="https://"+ACCESS_TEAM_DOMAIN;
export const PREVIEW_ENTRY="/__enter";
const CERTS_URL=ACCESS_ISSUER+"/cdn-cgi/access/certs";
const JWT_LIMIT=8192;
const CERTS_TTL_MS=5*60*1000;
let keyCache={until:0,byId:new Map()};
const nowSeconds=()=>Math.floor(Date.now()/1000);
const isRecord=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
function urlBytes(segment){
  if(typeof segment!=="string"||segment.length>JWT_LIMIT||!/^[a-zA-Z0-9_-]+$/.test(segment))return null;
  try {
    const encoded=segment.replace(/-/g,"+").replace(/_/g,"/");
    const raw=atob(encoded+"=".repeat((4-encoded.length%4)%4));
    return Uint8Array.from(raw,character=>character.charCodeAt(0));
  } catch {return null;}
}
function parsePart(segment){
  const raw=urlBytes(segment);
  if(!raw)return null;
  try{return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(raw));}
  catch{return null;}
}
function cookieValue(request,name){
  const raw=request.headers.get("cookie")||"";
  const parts=raw.split(";").map(s=>s.trim());
  let found=null;
  for(const part of parts){
    const separator=part.indexOf("=");
    if(separator<1||part.slice(0,separator)!==name)continue;
    if(found!==null)return null;
    found=part.slice(separator+1);
  }
  return found;
}
const emailList=value=>new Set(typeof value==="string"?
  value.split(",").map(v=>v.trim().toLowerCase()).filter(v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)):[]);
async function accessKey(kid,fetchImpl,nowMs){
  if(typeof kid!=="string"||!kid||kid.length>256)return null;
  if(nowMs>=keyCache.until){
    keyCache={until:0,byId:new Map()};
    let response;
    try{
      response=await fetchImpl(CERTS_URL,{method:"GET",redirect:"error",
        signal:AbortSignal.timeout(4000),headers:{Accept:"application/json"}});
      if(!response.ok||!response.headers.get("content-type")?.includes("application/json"))return null;
      const text=await response.text();
      if(text.length>131072)return null;
      const data=JSON.parse(text);
      if(!Array.isArray(data?.keys)||data.keys.length>24)return null;
      const keys=new Map();
      for(const item of data.keys){
        if(!isRecord(item)||item.kty!=="RSA"||typeof item.kid!=="string"||
          item.kid.length>256||item.alg&&item.alg!=="RS256"||typeof item.n!=="string"||
          typeof item.e!=="string"||!item.n||!item.e)continue;
        const k=await crypto.subtle.importKey("jwk",
          {kty:"RSA",n:item.n,e:item.e,alg:"RS256",ext:true},
          {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
        keys.set(item.kid,k);
      }
      if(!keys.size)return null;
      keyCache={until:nowMs+CERTS_TTL_MS,byId:keys};
    }catch{return null;}
  }
  return keyCache.byId.get(kid)||null;
}

/** Only true after cryptographic verification, audience, time and email checks. */
export async function verifiedPreviewIdentity(request,env,{fetchImpl=fetch,now=nowSeconds()}={}){
  if(typeof env?.ANEVUM_ACCESS_AUD!=="string"||
    !/^[a-f0-9]{64}$/.test(env.ANEVUM_ACCESS_AUD))return null;
  const permitted=emailList(env.ANEVUM_PREVIEW_ALLOWED_EMAILS);
  if(!permitted.size)return null;
  const token=cookieValue(request,"CF_Authorization");
  if(!token||token.length>JWT_LIMIT)return null;
  const pieces=token.split(".");
  if(pieces.length!==3)return null;
  const header=parsePart(pieces[0]);
  const claims=parsePart(pieces[1]);
  if(!isRecord(header)||header.alg!=="RS256"||
    typeof header.kid!=="string"||!isRecord(claims))return null;
  if(claims.iss!==ACCESS_ISSUER)return null;
  const audience=Array.isArray(claims.aud)?claims.aud:[claims.aud];
  if(!audience.includes(env.ANEVUM_ACCESS_AUD))return null;
  if(typeof claims.exp!=="number"||!Number.isFinite(claims.exp)||claims.exp<=now||
    typeof claims.iat!=="number"||claims.iat>now+60||
    claims.nbf!==undefined&&(typeof claims.nbf!=="number"||claims.nbf>now+30))return null;
  const email=typeof claims.email==="string"?claims.email.trim().toLowerCase():"";
  if(!permitted.has(email))return null;
  const signature=urlBytes(pieces[2]);
  if(!signature)return null;
  const key=await accessKey(header.kid,fetchImpl,now*1000);
  if(!key)return null;
  try{
    const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,signature,
      new TextEncoder().encode(pieces[0]+"."+pieces[1]));
    return valid?{email,sub:typeof claims.sub==="string"?claims.sub:""}:null;
  }catch{return null;}
}
export function resetPreviewKeyCacheForTests(){keyCache={until:0,byId:new Map()};}
