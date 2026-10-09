// Private ANEVUM research notebook. Never expose records outside their signed-in owner.
// The caller must verify Better Auth user and exact same-origin mutation first.
const BASE = "/api/member/research/drafts";
const TYPES = new Set(["question", "hypothesis", "experiment", "replication", "review", "correction"]);
const UNCERTAINTY = new Set(["unknown", "low", "moderate", "high"]);
const FIELDS = ["kind", "title", "researchQuestion", "method", "sources", "uncertainty", "result"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECT = "SELECT id, kind, title, research_question AS researchQuestion, method, sources, uncertainty, result, version, created_at AS createdAt, updated_at AS updatedAt FROM commons_private_drafts";

const respond = (value, status = 200) => Response.json(value, { status, headers: {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive"
} });

function bounded(value, min, max, label) {
  if (typeof value !== "string") throw new Error(label + " must be text.");
  const cleaned = value.trim();
  if (cleaned.length < min || cleaned.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(cleaned)) {
    throw new Error(label + " contains invalid characters or length.");
  }
  return cleaned;
}

export function validatePrivateResearch(value, updating = false) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a research record.");
  const keys = Object.keys(value).sort().join(",");
  const required = [...FIELDS, ...(updating ? ["expectedVersion"] : [])].sort().join(",");
  if (keys !== required) throw new Error("Unexpected research fields.");
  if (!TYPES.has(value.kind)) throw new Error("Unsupported research type.");
  if (!UNCERTAINTY.has(value.uncertainty)) throw new Error("Choose a valid uncertainty level.");
  if (updating && (!Number.isSafeInteger(value.expectedVersion) || value.expectedVersion < 1 || value.expectedVersion > 15)) {
    throw new Error("Invalid expected version.");
  }
  return {
    kind: value.kind,
    title: bounded(value.title, 8, 120, "Title"),
    researchQuestion: bounded(value.researchQuestion, 10, 1200, "Research question"),
    method: bounded(value.method, 20, 2000, "Method"),
    sources: bounded(value.sources, 0, 1500, "Sources"),
    uncertainty: value.uncertainty,
    result: bounded(value.result, 0, 1200, "Result"),
    ...(updating ? { expectedVersion: value.expectedVersion } : {})
  };
}

async function boundedJSON(request) {
  if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    throw new Error("JSON content type required.");
  }
  const body = await request.text();
  if (!body || body.length > 9000) throw new Error("Invalid research payload size.");
  return JSON.parse(body);
}

export async function privateResearchSchemaReady(db) {
  if (typeof db?.prepare !== "function") return false;
  try {
    const q = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('commons_private_drafts','commons_private_revisions')").all();
    const names = new Set((q?.results || []).map(x => x.name));
    return names.has("commons_private_drafts") && names.has("commons_private_revisions");
  } catch { return false; }
}

export async function exportPrivateResearch(db, userId) {
  if (!await privateResearchSchemaReady(db)) return { drafts: [], revisions: [] };
  const [drafts, revisions] = await Promise.all([
    db.prepare(SELECT + " WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 12").bind(userId).all(),
    db.prepare("SELECT r.draft_id AS draftId, r.version, r.kind, r.title, r.research_question AS researchQuestion, r.method, r.sources, r.uncertainty, r.result, r.saved_at AS savedAt FROM commons_private_revisions r JOIN commons_private_drafts d ON d.id = r.draft_id WHERE d.user_id = ? ORDER BY r.saved_at DESC, r.version DESC LIMIT 180").bind(userId).all()
  ]);
  return { drafts: drafts.results || [], revisions: revisions.results || [] };
}

export async function privateResearchEndpoint(request, env, user, pathname) {
  if (env?.ANEVUM_PRIVATE_RESEARCH_ENABLED !== "true") {
    return respond({ message: "Private research notebook is not yet enabled." }, 503);
  }
  const db = env?.MEMBER_DB;
  if (!await privateResearchSchemaReady(db)) {
    return respond({ message: "Private notebook storage is unavailable." }, 503);
  }
  const collection = pathname === BASE;
  const item = /^\/api\/member\/research\/drafts\/([0-9a-f-]+)(\/revisions)?$/i.exec(pathname);
  if (!collection && !item) return respond({ message: "Research path not found." }, 404);

  if (collection && request.method === "GET") {
    try {
      const rows = await db.prepare(SELECT + " WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 12").bind(user.id).all();
      return respond({ drafts: rows.results || [], private: true, publishingEnabled: false, executionEnabled: false });
    } catch { return respond({ message: "Notebook unavailable." }, 503); }
  }
  if (collection && request.method === "POST") {
    let input;
    try { input = validatePrivateResearch(await boundedJSON(request)); }
    catch (error) { return respond({ message: error instanceof Error ? error.message : "Invalid research record." }, 400); }
    const id = crypto.randomUUID();
    try {
      const write = await db.prepare("INSERT INTO commons_private_drafts (id,user_id,kind,title,research_question,method,sources,uncertainty,result) SELECT ?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM commons_private_drafts WHERE user_id=?) < 12")
        .bind(id, user.id, input.kind, input.title, input.researchQuestion, input.method, input.sources, input.uncertainty, input.result, user.id).run();
      if (write.meta?.changes !== 1) return respond({ message: "Notebook capacity reached (12 records)." }, 429);
      return respond({ created: true, id, version: 1, private: true }, 201);
    } catch { return respond({ message: "Could not save research record." }, 503); }
  }
  if (collection) return respond({ message: "Method not allowed." }, 405);

  const [, id, suffix] = item;
  if (!UUID.test(id)) return respond({ message: "Research record not found." }, 404);
  if (suffix === "/revisions") {
    if (request.method !== "GET") return respond({ message: "Method not allowed." }, 405);
    try {
      const rows = await db.prepare("SELECT r.version, r.kind, r.title, r.research_question AS researchQuestion, r.method, r.sources, r.uncertainty, r.result, r.saved_at AS savedAt FROM commons_private_revisions r JOIN commons_private_drafts d ON d.id = r.draft_id WHERE d.id = ? AND d.user_id = ? ORDER BY r.version DESC LIMIT 15").bind(id, user.id).all();
      return respond({ revisions: rows.results || [], private: true });
    } catch { return respond({ message: "Revision history unavailable." }, 503); }
  }

  if (request.method === "GET") {
    try {
      const draft = await db.prepare(SELECT + " WHERE id = ? AND user_id = ?").bind(id, user.id).first();
      return draft ? respond({ draft, private: true, publishingEnabled: false }) :
        respond({ message: "Research record not found." }, 404);
    } catch { return respond({ message: "Research record unavailable." }, 503); }
  }

  if (request.method === "DELETE") {
    try {
      const write = await db.prepare("DELETE FROM commons_private_drafts WHERE id = ? AND user_id = ?").bind(id, user.id).run();
      return write.meta?.changes === 1 ? respond({ deleted: true }) :
        respond({ message: "Research record not found." }, 404);
    } catch { return respond({ message: "Could not delete record." }, 503); }
  }

  if (request.method === "PATCH") {
    let input;
    try { input = validatePrivateResearch(await boundedJSON(request), true); }
    catch (error) { return respond({ message: error instanceof Error ? error.message : "Invalid research record." }, 400); }
    try {
      // D1 batch is transactionally atomic; archive old version + compare-and-swap update.
      // Revision cap blocks old snapshots from being silently discarded.
      const q = await db.batch([
        db.prepare("INSERT INTO commons_private_revisions (draft_id,version,kind,title,research_question,method,sources,uncertainty,result) SELECT id,version,kind,title,research_question,method,sources,uncertainty,result FROM commons_private_drafts WHERE id=? AND user_id=? AND version=? AND version<16").bind(id, user.id, input.expectedVersion),
        db.prepare("UPDATE commons_private_drafts SET kind=?,title=?,research_question=?,method=?,sources=?,uncertainty=?,result=?,version=version+1,updated_at=datetime('now') WHERE id=? AND user_id=? AND version=? AND version<16")
          .bind(input.kind, input.title, input.researchQuestion, input.method, input.sources, input.uncertainty, input.result, id, user.id, input.expectedVersion)
      ]);
      if (q?.[0]?.meta?.changes !== 1 || q?.[1]?.meta?.changes !== 1) {
        return respond({ message: "Record changed elsewhere, was not found, or reached its revision limit. Reload first." }, 409);
      }
      return respond({ updated: true, version: input.expectedVersion + 1, private: true });
    } catch { return respond({ message: "Could not revise research record." }, 503); }
  }
  return respond({ message: "Method not allowed." }, 405);
}
