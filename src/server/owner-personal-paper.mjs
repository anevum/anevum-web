// Developer-owned Alpaca PAPER account observation, never customer OAuth or execution.
// Invoked only AFTER verified Cloudflare Access + exact owner Better Auth member identity.
const PAPER_ACCOUNT_URL = "https://paper-api.alpaca.markets/v2/account";

function response(value,status=200) {
  return Response.json(value,{status,headers:{
    "Cache-Control":"private, no-store",
    "X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow, noarchive"
  }});
}

export function personalPaperConfigured(env) {
  if(env?.ANEVUM_OWNER_PAPER_OBSERVER_ENABLED!=="true" ||
     env?.ANEVUM_MEMBER_PREVIEW_ENABLED!=="true" ||
     env?.ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED!=="true") return false;
  try {
    const origin=new URL(String(env.MEMBER_PREVIEW_ORIGIN||""));
    if(origin.protocol!=="https:" || !origin.hostname.endsWith(".workers.dev") ||
       origin.pathname!=="/" || origin.search || origin.hash || origin.port) return false;
  } catch { return false; }
  return typeof env?.OWNER_PERSONAL_PAPER_API_KEY_ID==="string" &&
    env.OWNER_PERSONAL_PAPER_API_KEY_ID.trim().length>=8 &&
    typeof env?.OWNER_PERSONAL_PAPER_API_SECRET_KEY==="string" &&
    env.OWNER_PERSONAL_PAPER_API_SECRET_KEY.trim().length>=16;
}

export async function observeOwnerPersonalPaper(env,transport=fetch) {
  if(!personalPaperConfigured(env))return response({
    available:false,paper:true,executionEnabled:false,message:"Private paper observation is not configured."
  },503);
  try {
    const upstream=await transport(PAPER_ACCOUNT_URL,{
      method:"GET",
      headers:{
        "Accept":"application/json",
        "APCA-API-KEY-ID":env.OWNER_PERSONAL_PAPER_API_KEY_ID,
        "APCA-API-SECRET-KEY":env.OWNER_PERSONAL_PAPER_API_SECRET_KEY
      },
      redirect:"error",
      cache:"no-store",
      credentials:"omit",
      referrerPolicy:"no-referrer",
      signal:AbortSignal.timeout(5000)
    });
    if(!upstream || !upstream.ok)return response({
      available:false,paper:true,executionEnabled:false,message:"Paper provider access could not be verified."
    },503);
    const raw=await upstream.text();
    if(raw.length>65536)return response({available:false,paper:true,executionEnabled:false,
      message:"Paper provider response could not be verified."},503);
    const data=JSON.parse(raw);
    const number=data?.account_number, status=data?.status;
    if(!data||typeof data!=="object"||Array.isArray(data)||
       typeof number!=="string"||!/^[A-Za-z0-9-]{4,32}$/.test(number)||
       typeof status!=="string"||!/^[A-Z_]{2,32}$/.test(status)||
       (data.currency!==undefined&&data.currency!=="USD")) {
      return response({available:false,paper:true,executionEnabled:false,
        message:"Paper provider response could not be verified."},503);
    }
    // Never expose upstream account ID, full number, balances, email, OAuth tokens or credentials.
    return response({
      available:true,paper:true,executionEnabled:false,
      account:{ending:number.slice(-4),environment:"paper",status}
    });
  } catch {
    return response({available:false,paper:true,executionEnabled:false,
      message:"Paper provider observation is temporarily unavailable."},503);
  }
}
