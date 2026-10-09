// Voluntary, free RHEN Cloud beta interest registration. Never connects a
// brokerage account, grants orders, or creates a Stripe subscription.
function betaReply(data, status=200) {
  return Response.json(data, {status,headers:{
    "Cache-Control":"private, no-store",
    "X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow, noarchive"
  }});
}
export async function memberBetaSchemaReady(db) {
  if (!db || typeof db.prepare !== "function") return false;
  try {
    const data=await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='member_rhen_beta_waitlist'"
    ).first();
    return data?.name === "member_rhen_beta_waitlist";
  } catch {return false;}
}
export async function memberBetaEndpoint(request,env,user) {
  if (!["GET","POST","DELETE"].includes(request.method)) {
    return betaReply({message:"Method not allowed."},405);
  }
  if (env?.ANEVUM_RHEN_BETA_WAITLIST_ENABLED !== "true") {
    return betaReply({available:false,joined:false,message:"The free beta waitlist is not open."},503);
  }
  if (!await memberBetaSchemaReady(env?.MEMBER_DB)) {
    return betaReply({available:false,joined:false,message:"Beta registration is unavailable."},503);
  }
  const db=env.MEMBER_DB;
  if (request.method === "POST") {
    if (user.emailVerified !== true) {
      return betaReply({message:"Verify your member email first."},403);
    }
    try {
      if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
        throw Error("JSON required.");
      }
      const raw=await request.text();
      if (raw.length>128) throw Error("Body too large.");
      const body=JSON.parse(raw);
      if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length) {
        throw Error("Unexpected fields.");
      }
    } catch {return betaReply({message:"Submit an empty JSON object to join."},400);}
  }
  try {
    if (request.method === "POST") {
      await db.prepare(
        "INSERT OR IGNORE INTO member_rhen_beta_waitlist (user_id) VALUES (?)"
      ).bind(user.id).run();
    }
    if (request.method === "DELETE") {
      await db.prepare(
        "DELETE FROM member_rhen_beta_waitlist WHERE user_id=?"
      ).bind(user.id).run();
    }
    const result=await db.prepare(
      "SELECT joined_at FROM member_rhen_beta_waitlist WHERE user_id=?"
    ).bind(user.id).first();
    return betaReply({
      available:true,joined:Boolean(result),
      joinedAt:result?.joined_at||null,
      priceCents:0,charged:false,
      brokerageConnected:false,executionEnabled:false,
      notice:"Waitlist registration only. An invitation is not guaranteed."
    });
  } catch {
    return betaReply({message:"Beta registration storage is unavailable."},503);
  }
}
