// Bounded wire input and exact persisted-write acknowledgements for Studio.
// This module grants no privileges; callers must authenticate before using it.
export const STUDIO_BODY_BYTE_LIMIT = 80000;
const TYPES = new Set(["POST", "UPDATE", "AHA"]);
const STATES = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const timestamp = value => Number.isSafeInteger(value) && value >= 0;
function text(value, low, high) {
  return typeof value === "string" && value === value.trim() &&
    value.length >= low && value.length <= high &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
}
export function validSavedEditorialRow(row) {
  return !!row && typeof row === "object" && !Array.isArray(row) &&
    typeof row.id === "string" && UUID.test(row.id) &&
    typeof row.slug === "string" && row.slug.length <= 96 && SLUG.test(row.slug) &&
    TYPES.has(row.kind) && STATES.has(row.status) &&
    text(row.title, 5, 120) && text(row.summary, 15, 280) && text(row.body, 20, 12000) &&
    Number.isSafeInteger(row.revision) && row.revision >= 1 &&
    timestamp(row.created_at) && timestamp(row.updated_at) && row.created_at <= row.updated_at &&
    (row.status === "PUBLISHED"
      ? timestamp(row.published_at) && row.published_at >= row.created_at && row.published_at <= row.updated_at
      : row.published_at === null);
}
export function verifiedEditorialWrite(row, expected) {
  if (!validSavedEditorialRow(row) || !expected) return false;
  const {action, id, revision, memberId, now, draft, slug} = expected;
  const states = {CREATE: "DRAFT", EDIT: "DRAFT", PUBLISH: "PUBLISHED", UNPUBLISH: "DRAFT", ARCHIVE: "ARCHIVED"};
  if (!Object.hasOwn(states, action) || row.id !== id || row.revision !== revision ||
      row.status !== states[action] || row.updated_by_member_id !== memberId ||
      row.updated_at !== now || row.published_at !== (action === "PUBLISH" ? now : null)) return false;
  if (action === "CREATE" && (revision !== 1 || row.created_by_member_id !== memberId ||
      row.created_at !== now || row.slug !== slug)) return false;
  if (action === "CREATE" || action === "EDIT") {
    if (!draft || ["kind", "title", "summary", "body"].some(key => row[key] !== draft[key])) return false;
  }
  return true;
}

export async function readEditorialJson(request, limit = STUDIO_BODY_BYTE_LIMIT) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > STUDIO_BODY_BYTE_LIMIT) return null;
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") return null;
  const length = request.headers.get("Content-Length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > limit)) return null;
  if (!request.body) return null;
  let reader;
  try { reader = request.body.getReader(); } catch { return null; }
  const decoder = new TextDecoder("utf-8", {fatal: true});
  let bytes = 0, raw = "";
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) { await reader.cancel(); return null; }
      raw += decoder.decode(value, {stream: true});
    }
    raw += decoder.decode();
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch {
    try { await reader.cancel(); } catch { /* Preserve the rejected result. */ }
    return null;
  } finally { reader.releaseLock(); }
}
