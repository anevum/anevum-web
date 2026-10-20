/* ANEVUM PACKAGE ALPHA v003 — standalone controller.
 * New routes do not replace or mutate the v002 alpha experience.
 * Dependencies: AUTH service, DB D1, MEDIA R2, PACKAGE_PREVIEW_KEY secret,
 * RUNTIME_HOST (isolated executable-code hostname without scheme), PILOT_IDS,
 * STAFF_IDS. Preview capabilities are short-lived and stored hashed in D1.
 */
import { inspectZip, extractEntry, sha256Hex, assetMime, ZIP_LIMITS, PackageError } from "./archive.mjs";
import { mintPreview } from "./tokens.mjs";
import { prepareCover, COVER_PATH, COVER_LIMIT } from "./cover.mjs";
import { layout, uploadScreen, catalogScreen, playerScreen, queueScreen, helpScreen } from "./ui.mjs";

const A = "https://anevum.com";
const MiB = 1048576;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const kinds = new Set(["game","app","simulation","story"]);
const json = (value,status=200) => Response.json(value,{status,headers:{
  "cache-control":"private,no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex"}});
const fail = (status,message) => json({error:message},status);
const a404 = () => layout("Unavailable",'<h1>Project unavailable.</h1><p>The requested package or release could not be found.</p>');
const query = (db, sql, ...values) => db.prepare(sql).bind(...values).first();
const run = (db, sql, ...values) => db.prepare(sql).bind(...values).run();
function listAllowed(value, id) { return !!id && String(value||"").split(",").map(s=>s.trim()).includes(id); }
function pilot(env,id) { return listAllowed(env.PILOT_IDS,id); }
function staff(env,id) { return listAllowed(env.STAFF_IDS,id); }
function isolatedHost(env) {
  const h=String(env.RUNTIME_HOST||"").toLowerCase();
  return /^[a-z0-9][a-z0-9.-]{4,252}$/.test(h)
    && h!=="anevum.com" && !h.endsWith(".anevum.com") ? h : "";
}
async function packageSchemaReady(db){
  if(!db?.prepare)return false;
  try{
    const x=await db.prepare(
      "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN (" +
      "'anevum_package_projects','anevum_package_releases','anevum_package_files'," +
      "'anevum_package_preview_tokens','anevum_package_upload_limits','anevum_package_rights_receipts')"
    ).first();
    return Number(x?.n)===6;
  }catch{return false;}
}

async function member(req,env) {
  const cookie=req.headers.get("cookie");
  if (!cookie || !env.AUTH) return null;
  const headers=new Headers({cookie,accept:"application/json"});
  if(req.headers.get("user-agent")) headers.set("user-agent",req.headers.get("user-agent"));
  try {
    const r=await env.AUTH.fetch(new Request(A+"/api/v1/member/auth/get-session",{headers,redirect:"manual"}));
    const x=r.ok?await r.json():null;
    return x?.user?.emailVerified===true && x?.session && typeof x.user.id==="string" ? {id:x.user.id} : null;
  } catch { return null; }
}
function csrf(req) {
  const sec=req.headers.get("sec-fetch-site");
  return req.headers.get("origin")===A && req.headers.get("x-anevum-package")==="v003" &&
    (sec===null || sec==="same-origin" || sec==="none");
}
async function ownerList(db,id) {
  return (await db.prepare(
    "SELECT p.*, (SELECT version FROM anevum_package_releases WHERE id=COALESCE(p.draft_release_id,p.live_release_id)) AS release_version, " +
    "(SELECT status FROM anevum_package_releases WHERE id=p.draft_release_id) AS draft_status, " +
    "(SELECT f.release_id FROM anevum_package_files f WHERE f.release_id=COALESCE(p.draft_release_id,p.live_release_id) AND f.path='"+COVER_PATH+"' LIMIT 1) AS cover_release_id " +
    "FROM anevum_package_projects p WHERE p.owner_id=? AND p.status!='deleted' ORDER BY p.updated_at DESC LIMIT 50"
  ).bind(id).all()).results;
}
async function publicList(db) {
  return (await db.prepare(
    "SELECT p.id,p.title,p.summary,p.category,p.status,p.updated_at,p.published_at,p.live_release_id,p.draft_release_id, " +
    "r.version AS release_version, " +
    "(SELECT f.release_id FROM anevum_package_files f WHERE f.release_id=r.id AND f.path='"+COVER_PATH+"' LIMIT 1) AS cover_release_id " +
    "FROM anevum_package_projects p " +
    "JOIN anevum_package_releases r ON r.id=p.live_release_id AND r.status='published' " +
    "WHERE p.status='published' ORDER BY p.published_at DESC LIMIT 100"
  ).all()).results;
}
async function reviewList(db) {
  return (await db.prepare(
    "SELECT p.id,p.title,p.summary,p.category,p.status,p.updated_at,p.published_at,p.live_release_id,p.draft_release_id," +
    "r.version AS release_version,r.status AS draft_status, " +
    "(SELECT f.release_id FROM anevum_package_files f WHERE f.release_id=r.id AND f.path='"+COVER_PATH+"' LIMIT 1) AS cover_release_id " +
    "FROM anevum_package_projects p JOIN anevum_package_releases r ON r.id=p.draft_release_id " +
    "WHERE r.status='pending_review' AND p.status NOT IN ('suspended','deleted') ORDER BY r.submitted_at ASC LIMIT 100"
  ).all()).results;
}
async function moderationList(db) {
  return (await db.prepare(
    "SELECT p.id,p.title,p.summary,p.category,p.status,p.updated_at,p.published_at,p.live_release_id,p.draft_release_id,p.review_reason," +
    "r.version AS release_version FROM anevum_package_projects p " +
    "JOIN anevum_package_releases r ON r.id=p.live_release_id " +
    "WHERE p.status IN ('published','suspended') ORDER BY p.updated_at DESC LIMIT 75"
  ).all()).results;
}
async function getProject(db,id) {
  return query(db,"SELECT * FROM anevum_package_projects WHERE id=? AND status!='deleted'",id);
}
async function getDraft(db,p) {
  return p.draft_release_id?query(db,"SELECT * FROM anevum_package_releases WHERE id=? AND project_id=?",p.draft_release_id,p.id):null;
}
function validatedText(form) {
  const title=form.get("title"),summary=form.get("summary"),category=form.get("category");
  if(typeof title!=="string"||typeof summary!=="string"||typeof category!=="string"
    ||title.trim().length<3||title.trim().length>100||summary.trim().length<10||summary.trim().length>500
    ||/[\x00-\x1f\x7f]/.test(title+summary)||!kinds.has(category)) throw new PackageError("Check the project name, description, and category");
  if(form.get("rights_ack")!=="yes") throw new PackageError(
    "Confirm that you own this project or have permission to publish all included code and media");
  return { title:title.trim(), summary:summary.trim(), category };
}
function validateHtml(b) {
  try {
    const html=new TextDecoder("utf-8",{fatal:true}).decode(b);
    if(!/<(?:!doctype\s+html|html\b|head\b|body\b|script\b|div\b)/i.test(html.slice(0,4096)))
      throw new Error("not html");
  } catch { throw new PackageError("The standalone HTML file is not a valid UTF-8 web document"); }
}
async function prepareFile(file) {
  if(!file || typeof file.arrayBuffer!=="function" || typeof file.name!=="string" ||
    !/^[^\\/\x00-\x1f]{3,160}$/.test(file.name) || file.name.includes(".."))
    throw new PackageError("Choose a ZIP or HTML build with a valid filename");
  const extension=file.name.split(".").at(-1).toLowerCase();
  if(extension!=="zip"&&extension!=="html") throw new PackageError("Upload a .zip package or .html file");
  if(file.size<1||file.size>ZIP_LIMITS.archive) throw new PackageError("The file must be at most 20 MiB",413);
  if(extension==="zip"&&!["application/zip","application/x-zip-compressed","application/octet-stream",""].includes(file.type))
    throw new PackageError("The selected file does not have a ZIP media type");
  if(extension==="html"&&!["text/html","application/octet-stream",""].includes(file.type))
    throw new PackageError("The selected file does not have an HTML media type");
  const bytes=new Uint8Array(await file.arrayBuffer());
  let entries, extractor, expandedBytes;
  if(extension==="zip") {
    const info=inspectZip(bytes);entries=info.entries;expandedBytes=info.expandedBytes;
    if(entries.some(entry=>entry.path.startsWith("_anevum/")))
      throw new PackageError("The _anevum folder is reserved for reviewed project artwork");
    const index=entries.find(x=>x.path==="index.html");
    validateHtml(await extractEntry(bytes,index));
    extractor=e=>extractEntry(bytes,e);
    const manifest=entries.find(e=>e.path==="anevum.json");
    if(manifest) {
      if(manifest.unpacked>16384) throw new PackageError("anevum.json manifest exceeds 16 KiB");
      let m;try{m=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(await extractEntry(bytes,manifest)));}
      catch {throw new PackageError("anevum.json must contain valid JSON");}
      if(!m||typeof m!=="object"||Array.isArray(m)||
        (m.entrypoint!==undefined&&m.entrypoint!=="index.html")||
        (m.permissions!==undefined&&(!Array.isArray(m.permissions)||m.permissions.length!==0))||
        (m.runtime!==undefined&&m.runtime!=="browser"))
        throw new PackageError("Manifest requests an unsupported runtime, entry point, or permission");
    }
  } else {
    validateHtml(bytes);
    if(bytes.length>5*MiB) throw new PackageError("Single HTML files are limited to 5 MiB");
    entries=[{path:"index.html",mime:assetMime("index.html"),unpacked:bytes.length}];
    expandedBytes=bytes.length;
    extractor=async()=>bytes;
  }
  return {bytes,entries,expandedBytes,extractor};
}
async function upload(req,env,u) {
  if(!pilot(env,u.id)) return fail(403,"Creator alpha access required");
  if(!await packageSchemaReady(env.DB))
    return fail(503,"Package stage schema is not ready; upload is paused before storing any files");
  if(!env.MEDIA?.put||!env.MEDIA?.get||!env.MEDIA?.head)
    return fail(503,"Package storage is not configured; upload is paused");
  const headerSize=Number(req.headers.get("content-length")||0);
  if(headerSize>25*MiB) return fail(413,"Upload exceeds the 20 MiB ZIP plus 3 MiB cover allowance");
  if(!String(req.headers.get("content-type")||"").startsWith("multipart/form-data;"))
    return fail(415,"Upload a multipart form");
  let body;
  try{body=await req.formData();}catch{return fail(400,"Invalid upload form");}
  const details=validatedText(body);
  const file=body.get("file"), coverInput=body.get("cover");
  const projectParam=body.get("project_id");
  const existingId=typeof projectParam==="string"?projectParam.trim():"";
  if(existingId&&!UUID.test(existingId)) return fail(422,"Invalid project ID");
  const project=existingId?await getProject(env.DB,existingId):null;
  if(existingId&&(!project||project.owner_id!==u.id)) return fail(404,"Project unavailable");
  if(project&&(project.status==="suspended"||project.draft_release_id)) return fail(409,"Finish or remove the current draft before uploading an update");
  if(project && !["published","rejected","draft"].includes(project.status)) return fail(409,"This project cannot accept a revised build");
  if(!project) {
    const count=await query(env.DB,"SELECT COUNT(*) AS n FROM anevum_package_projects WHERE owner_id=? AND status!='deleted'",u.id);
    if(count.n>=20) return fail(409,"Creator alpha allows up to 20 active projects");
  }
  const usage=await query(env.DB,
    "SELECT COALESCE(SUM(r.archive_bytes),0) AS bytes FROM anevum_package_releases r JOIN anevum_package_projects p ON r.project_id=p.id WHERE p.owner_id=? " +
    "AND (r.status NOT IN ('failed','revoked') OR (r.status='revoked' AND r.source_key IS NOT NULL)) " +
    "AND (p.status!='deleted' OR (r.status='revoked' AND r.source_key IS NOT NULL))",u.id);
  if(!file || typeof file.size !== "number") return fail(422,"Upload a ZIP or HTML project");
  if(coverInput && typeof coverInput.size==="number" && coverInput.size>COVER_LIMIT)
    return fail(413,"Project artwork is limited to a 3 MiB PNG");
  if(usage.bytes+file.size+(coverInput?.size||0)>100*MiB)
    return fail(409,"Creator alpha has a 100 MiB compressed upload allowance");
  const now=Math.floor(Date.now()/1000);
  const attempts=await query(env.DB,
    "INSERT INTO anevum_package_upload_limits(owner_id,window_start,attempts) VALUES(?,?,1) " +
    "ON CONFLICT(owner_id) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END," +
    "window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END RETURNING attempts",u.id,now,now-3600,now-3600);
  if(attempts.attempts>10) return fail(429,"Too many upload attempts. Try again in an hour");
  const plan=await prepareFile(file);
  const cover=await prepareCover(coverInput);
  const id=project?.id||crypto.randomUUID(),releaseId=crypto.randomUUID();
  const last=project?await query(env.DB,
    "SELECT MAX(version) AS last FROM anevum_package_releases WHERE project_id=?",id):null;
  const version=(last?.last||0)+1;
  const root="package-alpha/v003/"+u.id+"/"+id+"/"+releaseId;
  const sourceKey=root+"/source/"+file.name;
  const touched=[];
  const fileStatements=[];
  const archiveSHA=await sha256Hex(plan.bytes);
  try {
    await env.MEDIA.put(sourceKey,plan.bytes,{httpMetadata:{contentType:"application/octet-stream"},
      customMetadata:{sha256:archiveSHA}});touched.push(sourceKey);
    for(const entry of plan.entries) {
      const contents=await plan.extractor(entry);
      const sha=await sha256Hex(contents);
      const objectKey=root+"/assets/"+entry.path;
      await env.MEDIA.put(objectKey,contents,{httpMetadata:{contentType:entry.mime},customMetadata:{sha256:sha}});
      touched.push(objectKey);
      fileStatements.push(env.DB.prepare(
        "INSERT INTO anevum_package_files(release_id,path,object_key,mime,bytes,sha256) VALUES(?,?,?,?,?,?)"
      ).bind(releaseId,entry.path,objectKey,entry.mime,contents.length,sha));
    }
    if(cover) {
      const sha=await sha256Hex(cover.bytes);
      const objectKey=root+"/metadata/"+COVER_PATH;
      await env.MEDIA.put(objectKey,cover.bytes,{
        httpMetadata:{contentType:cover.mime},
        customMetadata:{sha256:sha,width:String(cover.width),height:String(cover.height)}
      });
      touched.push(objectKey);
      fileStatements.push(env.DB.prepare(
        "INSERT INTO anevum_package_files(release_id,path,object_key,mime,bytes,sha256) VALUES(?,?,?,?,?,?)"
      ).bind(releaseId,COVER_PATH,objectKey,cover.mime,cover.bytes.length,sha));
    }
    const statements=[];
    if(!project) statements.push(env.DB.prepare(
      "INSERT INTO anevum_package_projects(id,owner_id,title,summary,category,status,created_at,updated_at,draft_release_id) " +
      "VALUES(?,?,?,?,?,'draft',?,?,?)"
    ).bind(id,u.id,details.title,details.summary,details.category,now,now,releaseId));
    else statements.push(env.DB.prepare(
      "UPDATE anevum_package_projects SET draft_release_id=?,review_reason=NULL,updated_at=? " +
      "WHERE id=? AND owner_id=? AND draft_release_id IS NULL"
    ).bind(releaseId,now,id,u.id));
    statements.push(env.DB.prepare(
      "INSERT INTO anevum_package_releases(id,project_id,version,status,source_name,proposed_title,proposed_summary,proposed_category," +
      "archive_sha256,archive_bytes,expanded_bytes,file_count,source_key,created_at) " +
      "SELECT ?,p.id,?,'ready',?,?,?,?,?,?,?,?,?,? FROM anevum_package_projects p " +
      "WHERE p.id=? AND p.owner_id=? AND p.draft_release_id=?"
    ).bind(releaseId,version,file.name,details.title,details.summary,details.category,
      archiveSHA,plan.bytes.byteLength+(cover?.bytes.length||0),
      plan.expandedBytes+(cover?.bytes.length||0),
      plan.entries.length+(cover?1:0),sourceKey,now,id,u.id,releaseId));
    statements.push(env.DB.prepare(
      "INSERT INTO anevum_package_rights_receipts(release_id,owner_id,attested_at,statement) VALUES(?,?,?,'creator_has_publication_rights_v1')"
    ).bind(releaseId,u.id,now));
    // Atomic D1 batch: a lost optimistic-update race inserts no release.
    // Dependent asset inserts then fail foreign-key validation and roll back.
    const results=await env.DB.batch([...statements,...fileStatements]);
    if(results[0]?.meta?.changes!==1 || results[1]?.meta?.changes!==1)
      throw new PackageError("Another upload updated this project. Refresh and try again",409);
    return json({id,release_id:releaseId,version,status:"ready",play_url:"/play/v3/"+id+"?preview=1"},201);
  } catch(e) {
    await env.MEDIA.delete(touched).catch(()=>{});
    if(e instanceof PackageError) throw e;
    if(/UNIQUE constraint failed|FOREIGN KEY constraint failed/i.test(String(e?.message||"")))
      return fail(409,"Another upload updated this project. Refresh and retry");
    return fail(503,"Package storage failed; no project was published");
  }
}
async function submit(env,u,id) {
  // Never queue an executable that staff cannot actually preview in the isolated runner.
  if(!isolatedHost(env)) return fail(503,"Private playback is not configured; submission is paused");
  const p=await getProject(env.DB,id);
  if(!p||p.owner_id!==u.id||!pilot(env,u.id)) return fail(404,"Project unavailable");
  const release=await getDraft(env.DB,p);
  if(!release||release.status!=="ready") return fail(409,"This project has no ready build to submit");
  const entry=await query(env.DB,"SELECT object_key,bytes,sha256 FROM anevum_package_files WHERE release_id=? AND path='index.html'",release.id);
  const object=entry?await env.MEDIA.head(entry.object_key):null;
  if(!object||object.size!==entry.bytes||object.customMetadata?.sha256!==entry.sha256)
    return fail(503,"Build entry point is unavailable");
  const now=Math.floor(Date.now()/1000);
  const changes=await env.DB.batch([
    env.DB.prepare("UPDATE anevum_package_releases SET status='pending_review',submitted_at=? WHERE id=? AND status='ready'").bind(now,release.id),
    env.DB.prepare("UPDATE anevum_package_projects SET status=CASE WHEN live_release_id IS NULL THEN 'pending_review' ELSE status END,updated_at=?,review_reason=NULL " +
    "WHERE id=? AND draft_release_id=? AND EXISTS(SELECT 1 FROM anevum_package_releases WHERE id=? AND status='pending_review')").bind(now,id,release.id,release.id)
  ]);
  return changes[0]?.meta?.changes===1&&changes[1]?.meta?.changes===1
    ?json({status:"pending_review"}):fail(409,"Release state changed");
}
async function review(req,env,u,id) {
  if(!staff(env,u.id)) return fail(403,"Staff review permission required");
  const p=await getProject(env.DB,id);
  const release=p?await getDraft(env.DB,p):null;
  if(!p||!release||release.status!=="pending_review") return fail(409,"Project not awaiting review");
  // A creator must never independently approve their own executable package.
  if(p.owner_id===u.id) return fail(403,"An independent reviewer must approve this project");
  const input=await req.json().catch(()=>null);
  if(!["publish","reject"].includes(input?.action)) return fail(422,"Choose publish or reject");
  if(input.action==="reject"&&(typeof input.reason!=="string"||input.reason.trim().length<10||input.reason.length>1000))
    return fail(422,"A rejection reason of 10–1000 characters is required");
  if(input.action==="publish") {
    // Fail closed by default: content execution needs separate platform/security acceptance.
    if(env.PACKAGE_PUBLIC_PUBLISH_ENABLED!=="true")
      return fail(503,"Executable publication is disabled until the security and release gates pass");
    if(!isolatedHost(env)) return fail(503,"Isolated player is not configured; publication is paused");
    const rights=await query(env.DB,
      "SELECT release_id FROM anevum_package_rights_receipts WHERE release_id=? AND owner_id=?",
      release.id,p.owner_id);
    if(!rights) return fail(422,"A creator rights declaration is required before publication");
    const asset=await query(env.DB,"SELECT object_key,bytes,sha256 FROM anevum_package_files WHERE release_id=? AND path='index.html'",release.id);
    const file=asset?await env.MEDIA.head(asset.object_key):null;
    if(!file||file.size!==asset.bytes||file.customMetadata?.sha256!==asset.sha256)
      return fail(503,"Entry point integrity failed");
    const count=await query(env.DB,"SELECT COUNT(*) AS n FROM anevum_package_files WHERE release_id=?",release.id);
    if(count.n!==release.file_count) return fail(503,"Build asset inventory is incomplete");
  }
  const now=Math.floor(Date.now()/1000),publish=input.action==="publish",reason=publish?null:input.reason.trim();
  const changes=await env.DB.batch([
    env.DB.prepare(
      "UPDATE anevum_package_releases SET status=?,review_reason=?,reviewed_by=?,reviewed_at=? " +
      "WHERE id=? AND status='pending_review'"
    ).bind(publish?"published":"rejected",reason,u.id,now,release.id),
    env.DB.prepare(
      publish?
        "UPDATE anevum_package_projects SET title=?,summary=?,category=?,status='published'," +
        "live_release_id=?,draft_release_id=NULL,review_reason=NULL,updated_at=?,published_at=? " +
        "WHERE id=? AND draft_release_id=?":
        "UPDATE anevum_package_projects SET status=CASE WHEN live_release_id IS NULL THEN 'rejected' ELSE status END," +
        "draft_release_id=NULL,review_reason=?,updated_at=? WHERE id=? AND draft_release_id=?"
    ).bind(...(publish?
      [release.proposed_title,release.proposed_summary,release.proposed_category,release.id,now,now,p.id,release.id]:
      [reason,now,p.id,release.id]))
  ]);
  return changes[0]?.meta?.changes===1&&changes[1]?.meta?.changes===1
    ?json({status:publish?"published":"rejected"}):fail(409,"Review state changed");
}
async function moderate(req,env,u,id) {
  if(!staff(env,u.id)) return fail(403,"Staff moderation permission required");
  const p=await getProject(env.DB,id);
  if(!p || !p.live_release_id) return fail(404,"Published project not found");
  const body=await req.json().catch(()=>null);
  const action=body?.action;
  if(action!=="suspend" && action!=="restore") return fail(422,"Choose suspend or restore");
  if(action==="suspend" && p.status!=="published") return fail(409,"Project is not published");
  if(action==="restore" && p.status!=="suspended") return fail(409,"Project is not suspended");
  const reason=action==="suspend"?body.reason?.trim():null;
  if(action==="suspend" && (typeof reason!=="string" || reason.length<10 || reason.length>1000))
    return fail(422,"Explain the moderation action in 10–1000 characters");
  const updated=await run(env.DB,
    "UPDATE anevum_package_projects SET status=?,review_reason=?,updated_at=? WHERE id=? AND status=?",
    action==="suspend"?"suspended":"published",reason,Math.floor(Date.now()/1000),id,p.status);
  return updated.meta?.changes===1?json({status:action==="suspend"?"suspended":"published"}):fail(409,"Project status changed");
}
async function discardReadyDraft(env,u,id) {
  const p=await getProject(env.DB,id);
  if(!p||p.owner_id!==u.id||!pilot(env,u.id))return fail(404,"Project unavailable");
  const release=await getDraft(env.DB,p);
  if(!release||release.status!=="ready")return fail(409,"Only an unsubmitted private build can be discarded");
  // Keep the asset inventory as a retryable cleanup record until R2 deletion succeeds.
  // Revocation is committed first: an old signed preview stops executing immediately.
  const assets=(await env.DB.prepare(
    "SELECT object_key FROM anevum_package_files WHERE release_id=?"
  ).bind(release.id).all()).results;
  const now=Math.floor(Date.now()/1000);
  const changes=await env.DB.batch([
    env.DB.prepare(
      "UPDATE anevum_package_releases SET status='revoked' WHERE id=? AND status='ready'"
    ).bind(release.id),
    env.DB.prepare(
      "UPDATE anevum_package_projects SET draft_release_id=NULL,review_reason=NULL," +
      "status=CASE WHEN live_release_id IS NULL THEN 'deleted' ELSE 'published' END,updated_at=? " +
      "WHERE id=? AND owner_id=? AND draft_release_id=? " +
      "AND EXISTS(SELECT 1 FROM anevum_package_releases WHERE id=? AND status='revoked')"
    ).bind(now,id,u.id,release.id,release.id),
    env.DB.prepare(
      "DELETE FROM anevum_package_preview_tokens WHERE release_id=? " +
      "AND EXISTS(SELECT 1 FROM anevum_package_releases WHERE id=? AND status='revoked')"
    ).bind(release.id,release.id)
  ]);
  if(changes[0]?.meta?.changes!==1||changes[1]?.meta?.changes!==1)
    return fail(409,"Private build state changed. Refresh your project before editing");
  const objects=[release.source_key,...assets.map(x=>x.object_key)].filter(Boolean);
  let cleanupPending=false;
  try{
    for(let n=0;n<objects.length;n+=100)
      await env.MEDIA.delete(objects.slice(n,n+100));
    await env.DB.batch([
      env.DB.prepare(
        "DELETE FROM anevum_package_files WHERE release_id=? " +
        "AND EXISTS(SELECT 1 FROM anevum_package_releases WHERE id=? AND status='revoked')"
      ).bind(release.id,release.id),
      env.DB.prepare(
        "UPDATE anevum_package_releases SET source_key=NULL WHERE id=? AND status='revoked'"
      ).bind(release.id)
    ]);
  }catch{
    // No public or private playback is possible: only physical asset reclamation
    // remains pending. Preserve the R2 object keys in D1 for a later GC retry.
    cleanupPending=true;
  }
  return json({discarded:true,project_id:id,live_release_preserved:!!p.live_release_id,cleanup_pending:cleanupPending});
}
async function deleteUnpublished(env,u,id) {
  const p=await getProject(env.DB,id);
  if(!p||p.owner_id!==u.id||!pilot(env,u.id)) return fail(404,"Project unavailable");
  if(p.live_release_id||p.status==="pending_review"||p.status==="suspended")
    return fail(409,"Published or pending releases cannot be deleted here");
  const r=await env.DB.prepare(
    "SELECT f.object_key FROM anevum_package_files f JOIN anevum_package_releases r ON f.release_id=r.id WHERE r.project_id=?"
  ).bind(id).all();
  const sources=await env.DB.prepare("SELECT source_key FROM anevum_package_releases WHERE project_id=?").bind(id).all();
  await run(env.DB,"UPDATE anevum_package_projects SET status='deleted',draft_release_id=NULL,updated_at=? WHERE id=? AND owner_id=?",
    Math.floor(Date.now()/1000),id,u.id);
  const objects=[...r.results.map(x=>x.object_key),...sources.results.map(x=>x.source_key)].filter(Boolean);
  for(let i=0;i<objects.length;i+=100) await env.MEDIA.delete(objects.slice(i,i+100)).catch(()=>{});
  return json({deleted:true});
}
async function coverImage(req,env,releaseId) {
  const unavailable=()=>new Response("Cover unavailable",{status:404,headers:{
    "cache-control":"private,no-store","x-content-type-options":"nosniff",
    "referrer-policy":"no-referrer","content-type":"text/plain; charset=utf-8"
  }});
  const release=await query(env.DB,
    "SELECT r.status AS release_status,p.status AS project_status,p.owner_id,p.live_release_id " +
    "FROM anevum_package_releases r JOIN anevum_package_projects p ON p.id=r.project_id WHERE r.id=?",
    releaseId);
  if(!release || ["deleted","suspended"].includes(release.project_status))return unavailable();
  const live=release.project_status==="published"&&release.release_status==="published"&&release.live_release_id===releaseId;
  if(!live){
    if(!["ready","pending_review"].includes(release.release_status))return unavailable();
    const u=await member(req,env);
    if(!u||(u.id!==release.owner_id&&!staff(env,u.id)))return unavailable();
  }
  const asset=await query(env.DB,
    "SELECT object_key,mime,bytes,sha256 FROM anevum_package_files WHERE release_id=? AND path=?",
    releaseId,COVER_PATH);
  if(!asset||asset.mime!=="image/png")return unavailable();
  const file=await env.MEDIA.get(asset.object_key);
  if(!file||file.size!==asset.bytes||file.customMetadata?.sha256!==asset.sha256)return unavailable();
  return new Response(file.body,{headers:{
    "content-type":"image/png","content-length":String(asset.bytes),
    "cache-control":"private,no-store","x-content-type-options":"nosniff",
    "referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; sandbox",
    "x-robots-tag":"noindex"
  }});
}
async function reclaimRevokedAssets(req,env,u) {
  if(!staff(env,u.id))return fail(403,"Staff operations permission required");
  const body=await req.json().catch(()=>null);
  if(body?.confirm!=="reclaim_revoked_v1")return fail(422,"Explicit revoked-asset cleanup confirmation required");
  const items=(await env.DB.prepare(
    "SELECT r.id,r.source_key FROM anevum_package_releases r " +
    "JOIN anevum_package_projects p ON p.id=r.project_id " +
    "WHERE r.status='revoked' AND r.source_key IS NOT NULL " +
    "AND COALESCE(p.live_release_id,'')!=r.id AND COALESCE(p.draft_release_id,'')!=r.id " +
    "ORDER BY r.created_at ASC LIMIT 2"
  ).all()).results;
  let reclaimed=0,pending=0;
  for(const item of items){
    const assets=(await env.DB.prepare(
      "SELECT object_key FROM anevum_package_files WHERE release_id=?"
    ).bind(item.id).all()).results;
    const keys=[item.source_key,...assets.map(x=>x.object_key)].filter(Boolean);
    try{
      for(let n=0;n<keys.length;n+=100)await env.MEDIA.delete(keys.slice(n,n+100));
      await env.DB.batch([
        env.DB.prepare(
          "DELETE FROM anevum_package_files WHERE release_id=? " +
          "AND EXISTS(SELECT 1 FROM anevum_package_releases WHERE id=? AND status='revoked')"
        ).bind(item.id,item.id),
        env.DB.prepare(
          "UPDATE anevum_package_releases SET source_key=NULL WHERE id=? AND status='revoked'"
        ).bind(item.id)
      ]);
      reclaimed++;
    }catch{pending++;}
  }
  return json({scanned:items.length,reclaimed,pending,limited_to:2});
}
async function api(req,env,path) {
  const coverRoute=path.match(/^\/api\/v1\/packages\/covers\/([0-9a-f-]{36})$/);
  if(coverRoute&&req.method==="GET"&&UUID.test(coverRoute[1]))
    return coverImage(req,env,coverRoute[1]);
  if(path==="/api/v1/packages/health"&&req.method==="GET") {
    const db=!!env.DB?.prepare,storage=!!env.MEDIA?.put&&!!env.MEDIA?.get&&!!env.MEDIA?.head;
    const schemaReady=db&&await packageSchemaReady(env.DB);
    const runnerConfigured=!!isolatedHost(env);
    return json({
      ok:true,version:"003",stageContract:"uplink-v007-readiness",db,storage,runnerConfigured,schemaReady,
      uploadReady:!!(schemaReady&&storage),
      publicPublishingEnabled:env.PACKAGE_PUBLIC_PUBLISH_ENABLED==="true",
      runtimeLiveVerified:false
    });
  }
  if(path==="/api/v1/packages/projects"&&req.method==="GET") {
    const projects=await publicList(env.DB);
    return json({projects:projects.map(p=>({
      id:p.id,title:p.title,summary:p.summary,category:p.category,version:p.release_version,
      cover_url:p.cover_release_id?"/api/v1/packages/covers/"+p.cover_release_id:null
    }))});
  }
  if(path==="/api/v1/packages/me"&&req.method==="GET") {
    const u=await member(req,env);
    return json({authenticated:!!u,pilot:!!u&&pilot(env,u.id),reviewer:!!u&&staff(env,u.id)});
  }
  if(req.method!=="POST"||!csrf(req))return fail(403,"Origin or method not authorized");
  const u=await member(req,env);
  if(!u)return fail(401,"A verified ANEVUM session is required");
  if(path==="/api/v1/packages/maintenance/reclaim")return reclaimRevokedAssets(req,env,u);
  if(path==="/api/v1/packages/upload")return upload(req,env,u);
  const m=path.match(/^\/api\/v1\/packages\/projects\/([0-9a-f-]{36})\/(submit|review|delete|discard|moderate)$/);
  if(!m||!UUID.test(m[1]))return fail(404,"Unknown API route");
  if(m[2]==="submit")return submit(env,u,m[1]);
  if(m[2]==="review")return review(req,env,u,m[1]);
  if(m[2]==="moderate")return moderate(req,env,u,m[1]);
  if(m[2]==="discard")return discardReadyDraft(env,u,m[1]);
  return deleteUnpublished(env,u,m[1]);
}
async function player(req,env,id) {
  const p=await getProject(env.DB,id);
  if(!p)return a404();
  const url=new URL(req.url),wantsPreview=url.searchParams.get("preview")==="1";
  let u=null,release=null,isPreview=false;
  if(wantsPreview) {
    u=await member(req,env);
    if(!u||(p.owner_id!==u.id&&!staff(env,u.id)))return a404();
    release=await getDraft(env.DB,p);
    if(release&&!["ready","pending_review","published"].includes(release.status))release=null;
    if(release)isPreview=true;
  }
  if(!release&&p.status==="published"&&p.live_release_id)
    release=await query(env.DB,"SELECT * FROM anevum_package_releases WHERE id=? AND project_id=? AND status='published'",p.live_release_id,p.id);
  if(!release&&wantsPreview&&u) {
    // Show rejection reason on creator workspace; rejected builds are not executable.
    return layout("Build unavailable",'<h1>No playable preview.</h1><p>The draft was rejected or removed. Upload a revised build from the creator workspace.</p><div class="actions"><a class="button primary" href="/upload/v3">Back to uploader</a></div>');
  }
  if(!release)return a404();
  if(!isPreview&&p.status!=="published")return a404();
  const host=isolatedHost(env);
  let runtime="";
  if(host) {
    if(isPreview) {
      const token=await mintPreview(env.DB,release.id,u.id);
      runtime="https://"+host+"/p/"+release.id+"/"+token+"/index.html";
    } else runtime="https://"+host+"/r/"+release.id+"/index.html";
  }
  const cover=await query(env.DB,
    "SELECT release_id FROM anevum_package_files WHERE release_id=? AND path=?",
    release.id,COVER_PATH);
  release.cover_release_id=cover?.release_id||null;
  return playerScreen(p,release,runtime,isPreview,!!u&&p.owner_id===u.id,!!u&&staff(env,u.id));
}
export default {
  async fetch(req,env) {
    const url=new URL(req.url),path=url.pathname;
    const stagingRead = req.method==="GET" && url.protocol==="https:" && url.hostname===env.STAGING_CONTROL_HOST && env.STAGING_CONTROL_HOST?.endsWith(".devonakins.workers.dev");
    if(url.origin!==A && !stagingRead)return fail(404,"Unknown host");
    try {
      if(path.startsWith("/api/v1/packages/"))return await api(req,env,path);
      if(req.method!=="GET")return fail(405,"Method not allowed");
      if(path==="/upload/v3"||path==="/upload/v3/") {
        const u=await member(req,env);
        const owner=!!u&&pilot(env,u.id);
        const projects=owner?await ownerList(env.DB,u.id):[];
        const chosen=url.searchParams.get("update");
        const updateId=owner&&projects.some(x=>x.id===chosen&&["published","rejected"].includes(x.status)&&!x.draft_release_id)?chosen:"";
        // Do not show an uploader that cannot persist release rights or media.
        const ready=!!env.MEDIA?.put&&!!env.MEDIA?.get&&!!env.MEDIA?.head&&await packageSchemaReady(env.DB);
        return uploadScreen(projects,!!u,owner,updateId,ready);
      }
      if(path==="/packages"||path==="/packages/")return catalogScreen(await publicList(env.DB));
      if(path==="/help/packages"||path==="/help/packages/")return helpScreen();
      if(path==="/staff/packages"||path==="/staff/packages/"||path==="/review/packages") {
        const u=await member(req,env);
        return u&&staff(env,u.id)?queueScreen(await reviewList(env.DB)):a404();
      }
      const m=path.match(/^\/play\/v3\/([0-9a-f-]{36})\/?$/);
      if(m&&UUID.test(m[1]))return player(req,env,m[1]);
      return a404();
    } catch(e) {
      if(e instanceof PackageError)return path.startsWith("/api/")?fail(e.status,e.message):a404();
      return path.startsWith("/api/")?fail(503,"Package service temporarily unavailable"):layout("Unavailable",'<h1>Temporarily unavailable.</h1><p>Try again later. No public release has been changed.</p>');
    }
  }
};
