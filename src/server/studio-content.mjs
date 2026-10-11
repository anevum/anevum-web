// First-party editorial control. Never derive privileges from client roles.
import {studioOperationsOverview} from "./studio-operations.mjs";
const OWNER_EMAIL = "anevum.studio@gmail.com";
const ADMIN_EMAIL = "devon@anevum.com";
const VERSION = "anevum.studio.v1";
const TYPES = new Set(["POST", "UPDATE", "AHA"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MEMBER_ID = /^[A-Za-z0-9_-]{8,128}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function json(value, status = 200, publicRead = false) {
  return Response.json(value, {status, headers: {
    "Cache-Control": publicRead ? "public,max-age=30" : "private,no-store",
    "X-Content-Type-Options": "nosniff",
    ...(publicRead ? {} : {"X-Robots-Tag": "noindex,nofollow,noarchive"})
  }});
}
function configured(env) { return env?.ANEVUM_STUDIO_ENABLED === "true"; }

export function studioRole(env, user, verifiedAccessEmail) {
  if (!configured(env) || user?.emailVerified !== true || !MEMBER_ID.test(String(user?.id || ""))) return null;
  const email = String(user.email || "").trim().toLowerCase();
  const accessEmail = String(verifiedAccessEmail || "").trim().toLowerCase();
  const allowed = String(env?.ANEVUM_STUDIO_ACCESS_EMAILS || "").split(",")
    .map(x => x.trim().toLowerCase()).filter(Boolean);
  // Access assertion must have been independently verified in worker.mjs.
  if (!email || email !== accessEmail || !allowed.includes(email)) return null;
  if (email === OWNER_EMAIL && user.id === String(env?.ANEVUM_STUDIO_OWNER_MEMBER_ID || "")) return "owner";
  if (email === ADMIN_EMAIL && user.id === String(env?.ANEVUM_STUDIO_ADMIN_MEMBER_ID || "")) return "admin";
  return null;
}
export async function studioSchemaReady(db) {
  if (typeof db?.prepare !== "function") return false;
  try {
    const found = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('studio_entries','studio_entry_events')"
    ).all();
    const names = new Set((found.results || []).map(x=>x.name));
    return names.has("studio_entries") && names.has("studio_entry_events");
  } catch { return false; }
}
function validateText(value, low, high) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length >= low && text.length <= high &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text) ? text : null;
}
export function validateEditorialEntry(data, updating = false) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const keys = Object.keys(data).sort().join(",");
  if (keys !== (updating ? "body,expectedRevision,kind,summary,title" : "body,kind,summary,title")) return null;
  const kind = data.kind;
  const title = validateText(data.title,5,120);
  const summary = validateText(data.summary,15,280);
  const body = validateText(data.body,20,12000);
  if (!TYPES.has(kind) || !title || !summary || !body) return null;
  if (updating && (!Number.isSafeInteger(data.expectedRevision) || data.expectedRevision < 1)) return null;
  return {kind,title,summary,body,...(updating ? {expectedRevision:data.expectedRevision} : {})};
}
async function readBody(request, limit=15000) {
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") return null;
  const raw = await request.text();
  if (!raw || raw.length > limit) return null;
  try {
    const data = JSON.parse(raw);
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch { return null; }
}
function currentMember(request, user) {
  const expected = request.headers.get("X-ANEVUM-EXPECTED-MEMBER-ID");
  return expected === null || expected === user.id; // compare-only; never selects account
}
function newSlug(title,id) {
  const prefix = title.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g,"-")
    .replace(/^-|-$/g,"").slice(0,70).replace(/-$/,"");
  return (prefix || "entry") + "-" + id.slice(0,8);
}
function record(row) {
  return {id:row.id,slug:row.slug,kind:row.kind,title:row.title,summary:row.summary,
    body:row.body,status:row.status,revision:row.revision,createdAt:row.created_at,
    updatedAt:row.updated_at,publishedAt:row.published_at};
}
function publicRecord(row,detail=false) {
  return {slug:row.slug,kind:row.kind,title:row.title,summary:row.summary,publishedAt:row.published_at,
    ...(detail ? {body:row.body} : {})};
}
export async function studioPublicEndpoint(request, env, pathname) {
  if (request.method !== "GET") return json({message:"Read-only publications."},405,true);
  if (!configured(env) || !await studioSchemaReady(env.MEMBER_DB))
    return json({available:false,message:"Studio publications unavailable."},503,true);
  const url = new URL(request.url);
  const db = env.MEMBER_DB;
  if (pathname === "/api/public/studio/entries") {
    if ([...url.searchParams.keys()].some(key => key !== "kind") || url.searchParams.getAll("kind").length > 1)
      return json({message:"Unknown filter."},400,true);
    const kind = url.searchParams.get("kind");
    if (kind !== null && !TYPES.has(kind)) return json({message:"Unknown content type."},400,true);
    try {
      const rows = await db.prepare(
        "SELECT slug,kind,title,summary,published_at FROM studio_entries WHERE status='PUBLISHED' " +
        "AND (? IS NULL OR kind=?) ORDER BY published_at DESC,id DESC LIMIT 40"
      ).bind(kind,kind).all();
      return json({schemaVersion:VERSION,available:true,
        entries:(rows.results||[]).map(row=>publicRecord(row))},200,true);
    } catch { return json({available:false,message:"Publications unavailable."},503,true); }
  }
  const match=pathname.match(/^\/api\/public\/studio\/entries\/([a-z0-9-]{1,96})$/);
  if (!match || !SLUG.test(match[1]) || url.search)
    return json({message:"Publication not found."},404,true);
  try {
    const row = await db.prepare(
      "SELECT slug,kind,title,summary,body,published_at FROM studio_entries " +
      "WHERE slug=? AND status='PUBLISHED'"
    ).bind(match[1]).first();
    return row ? json({schemaVersion:VERSION,entry:publicRecord(row,true)},200,true)
      : json({message:"Publication not found."},404,true);
  } catch { return json({message:"Publication unavailable."},503,true); }
}
export async function studioEndpoint(request, env, user, origin, pathname, verifiedAccessEmail) {
  const role = studioRole(env,user,verifiedAccessEmail);
  if (!role) return json({message:"Studio authorization required."},403);
  const url = new URL(request.url);
  if (url.origin !== origin || url.search) return json({message:"Unsupported Studio query."},400);
  const db = env.MEMBER_DB, ready = await studioSchemaReady(db);
  if (pathname === "/api/member/studio/status") return request.method === "GET"
    ? json({schemaVersion:VERSION,viewerMemberId:user.id,role,contentReady:ready,
      publishingEnabled:ready && env?.ANEVUM_STUDIO_PUBLISH_ENABLED === "true",
      contentKinds:[...TYPES]})
    : json({message:"Method not allowed."},405);
  if (!ready) return json({message:"Studio migration not yet applied."},503);
  if (pathname === "/api/member/studio/overview")
    return studioOperationsOverview(request,env,user,origin);
  if (pathname === "/api/member/studio/entries") {
    if (request.method === "GET") {
      try {
        const result = await db.prepare(
          "SELECT * FROM studio_entries ORDER BY updated_at DESC,id DESC LIMIT 101"
        ).all();
        return json({schemaVersion:VERSION,viewerMemberId:user.id,
          entries:(result.results||[]).slice(0,100).map(record),
          olderEntriesMayExist:(result.results||[]).length>100});
      } catch { return json({message:"Studio entries unavailable."},503); }
    }
    if (request.method !== "POST") return json({message:"Method not allowed."},405);
    if (!currentMember(request,user)) return json({message:"Session changed."},409);
    const draft=validateEditorialEntry(await readBody(request));
    if (!draft) return json({message:"Invalid editorial draft."},400);
    const id=crypto.randomUUID(), slug=newSlug(draft.title,id), now=Math.floor(Date.now()/1000);
    try {
      const result=await db.batch([
        db.prepare("INSERT INTO studio_entries(id,slug,kind,title,summary,body,status,revision,"+
          "created_by_member_id,updated_by_member_id,created_at,updated_at,published_at) "+
          "VALUES(?,?,?,?,?,?,'DRAFT',1,?,?,?,?,NULL)")
          .bind(id,slug,draft.kind,draft.title,draft.summary,draft.body,user.id,user.id,now,now),
        db.prepare("INSERT INTO studio_entry_events(id,entry_id,actor_member_id,action,revision,created_at) "+
          "VALUES(?,?,?,'CREATE',1,?)").bind(crypto.randomUUID(),id,user.id,now)
      ]);
      if (result[0]?.meta?.changes!==1 || result[1]?.meta?.changes!==1)
        return json({message:"Draft commit unconfirmed. Reload Studio."},503);
      return json({schemaVersion:VERSION,viewerMemberId:user.id,
        entry:record(await db.prepare("SELECT * FROM studio_entries WHERE id=?").bind(id).first()),
        saved:true,action:"CREATE",auditRecorded:true},201);
    } catch { return json({message:"Draft save unconfirmed. Reload Studio."},503); }
  }
  // Staff-only, bounded and independently verified publication history.
  // Audit records are immutable; no public API can read them.
  const history=pathname.match(/^\/api\/member\/studio\/entries\/([0-9a-f-]{36})\/history$/i);
  if(history && UUID.test(history[1])) {
    if(request.method!=="GET") return json({message:"Read-only Studio audit history."},405);
    try {
      const row=await db.prepare("SELECT id,revision FROM studio_entries WHERE id=?")
        .bind(history[1]).first();
      if(!row) return json({message:"Studio entry not found."},404);
      const found=await db.prepare(
        "SELECT action,revision,actor_member_id,created_at FROM studio_entry_events "+
        "WHERE entry_id=? ORDER BY revision DESC LIMIT 101"
      ).bind(row.id).all();
      const events=(found.results||[]);
      return json({schemaVersion:VERSION,viewerMemberId:user.id,entryId:row.id,
        entryRevision:row.revision,events:events.slice(0,100).map(item=>({
          action:item.action,revision:item.revision,actorMemberId:item.actor_member_id,
          createdAt:item.created_at
        })),olderEventsMayExist:events.length>100});
    } catch {return json({message:"Studio history unavailable."},503);}
  }
  const match=pathname.match(/^\/api\/member\/studio\/entries\/([0-9a-f-]{36})(?:\/(publish|unpublish|archive))?$/i);
  if (!match || !UUID.test(match[1])) return json({message:"Studio endpoint not found."},404);
  if (!currentMember(request,user)) return json({message:"Session changed."},409);
  const action=match[2] || "edit", id=match[1];
  if (action === "edit" ? request.method !== "PATCH" : request.method !== "POST")
    return json({message:"Method not allowed."},405);
  const data=await readBody(request);
  const payload=action==="edit" ? validateEditorialEntry(data,true) : data;
  if (!payload) return json({message:"Invalid editorial operation."},400);
  if (action!=="edit" && (Object.keys(payload).sort().join(",")!=="confirm,expectedRevision" ||
      payload.confirm!==action.toUpperCase() || !Number.isSafeInteger(payload.expectedRevision) ||
      payload.expectedRevision<1))
    return json({message:"Explicit confirmation and current revision required."},400);
  if (action==="publish" && env?.ANEVUM_STUDIO_PUBLISH_ENABLED!=="true")
    return json({message:"Publication disabled until approved."},403);
  const now=Math.floor(Date.now()/1000),revision=payload.expectedRevision;
  const state=action==="publish" ? "PUBLISHED" : action==="archive" ? "ARCHIVED" : "DRAFT";
  const before=action==="unpublish" ? "PUBLISHED" : "DRAFT";
  const query=action==="edit"
    ? "UPDATE studio_entries SET kind=?,title=?,summary=?,body=?,revision=revision+1,"+
      "updated_by_member_id=?,updated_at=? WHERE id=? AND revision=? AND status='DRAFT'"
    : "UPDATE studio_entries SET status=?,published_at=?,revision=revision+1,"+
      "updated_by_member_id=?,updated_at=? WHERE id=? AND revision=? AND status=?";
  const update=action==="edit"
    ? db.prepare(query).bind(payload.kind,payload.title,payload.summary,payload.body,user.id,now,id,revision)
    : db.prepare(query).bind(state,action==="publish"?now:null,user.id,now,id,revision,before);
  try {
    const result=await db.batch([
      update,
      db.prepare("INSERT INTO studio_entry_events(id,entry_id,actor_member_id,action,revision,created_at) "+
        "SELECT ?,id,?,?,revision,? FROM studio_entries "+
        "WHERE id=? AND revision=? AND status=?")
        .bind(crypto.randomUUID(),user.id,action.toUpperCase(),now,id,revision+1,state)
    ]);
    if (result[0]?.meta?.changes!==1 || result[1]?.meta?.changes!==1)
      return json({message:"Entry has changed. Reload Studio before retrying."},409);
    return json({schemaVersion:VERSION,viewerMemberId:user.id,action:action.toUpperCase(),
      entry:record(await db.prepare("SELECT * FROM studio_entries WHERE id=?").bind(id).first()),
      saved:true,auditRecorded:true});
  } catch { return json({message:"Editorial action unconfirmed. Reload Studio."},503); }
}
