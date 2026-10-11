import { RHEN_LESSON_VERSIONS, knownLessonVersion } from "../data/rhen-lesson-registry.mjs";

// Invoked only after Better Auth verifies the session. Source-only preview pilot:
// neither a flag nor a member account can activate this route on production.
const PREFIX = "/api/member/learning/progress";
const MIGRATION = "0009_member_learning_progress.sql";
const SCHEMA = "anevum.learning-progress.v1";
const SLUG = /^[a-z0-9-]{3,64}$/;
const VERSION = /^\d{1,6}\.\d{1,6}\.\d{1,6}$/;
const COLUMNS = "lesson_slug,lesson_version,completed,revision,updated_at";

function reply(body, status = 200) {
  return Response.json(body, {status, headers:{
    "Cache-Control":"private, no-store", "CDN-Cache-Control":"no-store",
    "Cloudflare-CDN-Cache-Control":"no-store", "X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow, noarchive",
    ...(status === 429 ? {"Retry-After":"60"} : {})
  }});
}
function validMember(id) {
  return typeof id === "string" && id.length > 0 && id.length <= 128 && !/[\x00-\x1f\x7f]/.test(id);
}
export function learningConfigured(env, verifiedOrigin) {
  try {
    const expected = new URL(String(env?.MEMBER_PREVIEW_ORIGIN || ""));
    return env?.ANEVUM_MEMBER_LEARNING_ENABLED === "true" &&
      env?.ANEVUM_MEMBER_PREVIEW_ENABLED === "true" &&
      expected.protocol === "https:" && expected.hostname.endsWith(".workers.dev") &&
      !expected.username && !expected.password && !expected.port && !expected.search &&
      !expected.hash && expected.pathname === "/" && expected.origin === verifiedOrigin;
  } catch { return false; }
}
export function learningExpectedMemberMatches(request, memberId, required = true) {
  return validMember(memberId) && (request.headers.has("X-ANEVUM-EXPECTED-MEMBER-ID")
    ? request.headers.get("X-ANEVUM-EXPECTED-MEMBER-ID") === memberId : !required);
}
export function validateLearningProgressPayload(input, lessonSlug) {
  const version = knownLessonVersion(lessonSlug);
  if (!version || !input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).sort().join(",") !== "completed,expectedRevision,lessonVersion" ||
      input.lessonVersion !== version || typeof input.completed !== "boolean" ||
      !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0 ||
      input.expectedRevision >= 1000000) throw new Error("Invalid or outdated progress.");
  return {lessonVersion:version,completed:input.completed,expectedRevision:input.expectedRevision};
}
export async function boundedLearningJson(request) {
  if (request.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() !== "application/json" ||
      !request.body) throw new Error("JSON body required.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", {fatal:true});
  let bytes = 0, text = "", ended = false, timer;
  const timeout = new Promise((_,reject) => {
    timer = setTimeout(() => reject(new Error("Body deadline exceeded.")), 3000);
  });
  try {
    for (let chunk = 0; chunk < 16; chunk++) {
      const {done,value} = await Promise.race([reader.read(), timeout]);
      if (done) { ended = true; break; }
      if (!(value instanceof Uint8Array)) throw new Error("Invalid stream.");
      bytes += value.byteLength;
      if (bytes > 512) throw new Error("Body too large.");
      text += decoder.decode(value, {stream:true});
    }
    if (!ended || !bytes) throw new Error("Invalid stream size.");
    return JSON.parse(text + decoder.decode());
  } finally {
    clearTimeout(timer);
    // Cancellation is best effort, never an unbounded await on a hostile source.
    void reader.cancel().catch(() => {});
  }
}

// ABSENT is different from an unavailable/partial database. Exports must not
// silently omit previously saved learning merely because a DB read failed.
export async function learningSchemaState(db) {
  if (typeof db?.prepare !== "function") throw new Error("Database unavailable.");
  const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_learning_progress','member_learning_write_limits')").all();
  if (!Array.isArray(tables?.results)) throw new Error("Schema unavailable.");
  if (tables.results.length === 0) return "absent";
  if (tables.results.length !== 2) throw new Error("Incomplete learning migration.");
  const ledger = await db.prepare("SELECT name FROM d1_migrations WHERE name = ?").bind(MIGRATION).first();
  if (ledger?.name !== MIGRATION) throw new Error("Learning migration not registered.");
  await db.prepare("SELECT user_id," + COLUMNS + " FROM member_learning_progress LIMIT 0").all();
  await db.prepare("SELECT user_id,window_start,mutations FROM member_learning_write_limits LIMIT 0").all();
  return "ready";
}
function projection(row) {
  if (!row || typeof row.lesson_slug !== "string" || !SLUG.test(row.lesson_slug) ||
      typeof row.lesson_version !== "string" || !VERSION.test(row.lesson_version) ||
      ![0,1].includes(row.completed) || !Number.isSafeInteger(row.revision) ||
      row.revision < 1 || row.revision > 1000000 ||
      !Number.isSafeInteger(row.updated_at) || row.updated_at <= 0) throw new Error("Invalid saved progress.");
  return {lessonSlug:row.lesson_slug,lessonVersion:row.lesson_version,completed:row.completed === 1,
    revision:row.revision,updatedAt:row.updated_at};
}
export async function readLearningProgress(db, memberId) {
  if (!validMember(memberId)) throw new Error("Verified member required.");
  const rows = await db.prepare("SELECT " + COLUMNS + " FROM member_learning_progress WHERE user_id = ? ORDER BY lesson_slug LIMIT 129").bind(memberId).all();
  if (!Array.isArray(rows?.results) || rows.results.length > 128) throw new Error("Progress is incomplete.");
  const progress = rows.results.map(projection);
  if (new Set(progress.map(p => p.lessonSlug)).size !== progress.length) throw new Error("Duplicate progress.");
  return progress;
}
export async function exportLearningProgress(db, memberId) {
  if (!validMember(memberId)) throw new Error("Verified member required.");
  return await learningSchemaState(db) === "absent" ? [] : readLearningProgress(db,memberId);
}
export async function deleteLearningProgress(db, memberId) {
  if (!validMember(memberId)) throw new Error("Verified member required.");
  if (await learningSchemaState(db) === "absent") return;
  await db.batch([
    db.prepare("DELETE FROM member_learning_progress WHERE user_id = ?").bind(memberId),
    db.prepare("DELETE FROM member_learning_write_limits WHERE user_id = ?").bind(memberId)
  ]);
}
export async function spendLearningMutation(db, memberId, now = Date.now()) {
  if (!validMember(memberId) || !Number.isSafeInteger(now) || now <= 0) throw new Error("Invalid mutation scope.");
  const row = await db.prepare(
    "INSERT INTO member_learning_write_limits(user_id,window_start,mutations) VALUES(?,?,1) " +
    "ON CONFLICT(user_id) DO UPDATE SET window_start=excluded.window_start, " +
    "mutations=CASE WHEN member_learning_write_limits.window_start=excluded.window_start " +
    "THEN member_learning_write_limits.mutations+1 ELSE 1 END " +
    "WHERE member_learning_write_limits.window_start<excluded.window_start OR " +
    "(member_learning_write_limits.window_start=excluded.window_start AND member_learning_write_limits.mutations<12) " +
    "RETURNING mutations"
  ).bind(memberId,Math.floor(now/60000)).first();
  return Number.isSafeInteger(row?.mutations) && row.mutations >= 1 && row.mutations <= 12;
}
export async function writeLearningProgress(db, memberId, lessonSlug, input, now = Date.now()) {
  if (!validMember(memberId) || !Number.isSafeInteger(now) || now <= 0) throw new Error("Invalid write scope.");
  const value = validateLearningProgressPayload(input,lessonSlug);
  let row;
  if (value.expectedRevision === 0) {
    row = await db.prepare("INSERT INTO member_learning_progress(user_id,lesson_slug,lesson_version,completed,revision,updated_at) " +
      "VALUES(?,?,?,?,1,?) ON CONFLICT(user_id,lesson_slug) DO NOTHING RETURNING " + COLUMNS)
      .bind(memberId,lessonSlug,value.lessonVersion,value.completed ? 1 : 0,now).first();
  } else {
    row = await db.prepare("UPDATE member_learning_progress SET lesson_version=?,completed=?,revision=revision+1,updated_at=? " +
      "WHERE user_id=? AND lesson_slug=? AND revision=? RETURNING " + COLUMNS)
      .bind(value.lessonVersion,value.completed ? 1 : 0,now,memberId,lessonSlug,value.expectedRevision).first();
  }
  return row ? projection(row) : null;
}
export async function learningProgressEndpoint(request, env, user, verifiedOrigin, pathname) {
  const memberId = user?.id;
  if (!validMember(memberId)) return reply({message:"Sign in required."},401);
  const url = new URL(request.url);
  if (!verifiedOrigin || url.origin !== verifiedOrigin || url.pathname !== pathname || url.protocol !== "https:")
    return reply({message:"Origin not authorized."},403);
  if (!learningConfigured(env,verifiedOrigin)) return reply({message:"Saving lesson progress is not enabled."},503);
  if (user.emailVerified !== true) return reply({message:"Verified member email required."},403);
  if (url.search) return reply({message:"Query-selected progress is not supported."},400);
  const match = pathname.match(/^\/api\/member\/learning\/progress\/([a-z0-9-]{3,64})$/);
  const list = pathname === PREFIX;
  if (!list && (!match || !knownLessonVersion(match[1]))) return reply({message:"Lesson not found."},404);
  if (request.method !== (list ? "GET" : "PUT")) return reply({message:"Method not allowed."},405);
  if (!list && request.headers.get("Origin") !== verifiedOrigin) return reply({message:"Same-origin request required."},403);
  // The hint can only REJECT stale tabs; it never supplies the SQL tenant key.
  if (!learningExpectedMemberMatches(request,memberId,!list)) return reply({message:"Your account changed. Reload your learning page."},409);
  let input;
  if (!list) {
    try { input = validateLearningProgressPayload(await boundedLearningJson(request),match[1]); }
    catch { return reply({message:"Invalid or outdated lesson progress."},400); }
  }
  try {
    if (await learningSchemaState(env.MEMBER_DB) !== "ready") return reply({message:"Learning storage is not ready."},503);
    if (list) return reply({schema:SCHEMA,available:true,memberId,lessonVersions:RHEN_LESSON_VERSIONS,
      progress:await readLearningProgress(env.MEMBER_DB,memberId)});
    if (!await spendLearningMutation(env.MEMBER_DB,memberId)) return reply({message:"Update limit reached. Retry later."},429);
    const progress = await writeLearningProgress(env.MEMBER_DB,memberId,match[1],input);
    if (!progress || progress.revision !== input.expectedRevision+1 || progress.lessonSlug !== match[1] ||
        progress.lessonVersion !== input.lessonVersion || progress.completed !== input.completed)
      return reply({message:"Saved revision changed. Reload before trying again."},409);
    return reply({schema:SCHEMA,available:true,memberId,progress});
  } catch { return reply({message:"Progress could not be verified. Reload your saved state."},503); }
}
