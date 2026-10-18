/**
 * Porchlight V004 retention — maintenance-only, no HTTP route, no Cron schedule.
 * Source review and tests only. Never run using ANEVUM member/Creator V1 databases.
 */
const MS_DAY = 86400_000;
function requireUtc(value) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new TypeError("UTC millisecond ISO timestamp required");
  }
  if (new Date(value).toISOString() !== value) throw new TypeError("Noncanonical UTC timestamp");
}
export async function runPorchlightRetention({db, at, allowDelete=false, maxEvents=10}={}) {
  requireUtc(at);
  if (!db || typeof db.prepare !== "function" || typeof db.batch !== "function") {
    throw new Error("Isolated transactional Porchlight D1 adapter required");
  }
  if (!Number.isSafeInteger(maxEvents) || maxEvents < 1 || maxEvents > 25) throw new RangeError("maxEvents out of range");
  const threshold = new Date(Date.parse(at) - 7 * MS_DAY).toISOString();
  const scan = await db.prepare(
    "SELECT id FROM porchlight_events WHERE ends_at <= ? ORDER BY ends_at, id LIMIT ?"
  ).bind(threshold,maxEvents).all();
  const rows = scan?.results || [];
  const safe = {eligibleEvents: rows.length, deletedEvents:0, retentionDays:7};
  if (!allowDelete || !rows.length) return safe;

  // D1 batch executes as one atomic transaction. Every step also guards expiry
  // so an event reconfigured since the dry-run scan is not partially deleted.
  const statements=[];
  const guard = "AND EXISTS (SELECT 1 FROM porchlight_events e WHERE e.id=? AND e.ends_at<=?)";
  for (const event of rows) {
    if (!event || typeof event.id !== "string") throw new Error("Invalid event from D1");
    const id=event.id;
    const tables=[
      ["porchlight_report_audit","event_id"],
      ["porchlight_reports","event_id"],
      ["porchlight_audit","event_id"],
      ["porchlight_host_submissions","event_id"],
      ["porchlight_event_blocks","event_id"],
      ["porchlight_organizer_grants","event_id"],
    ];
    for (const [table,key] of tables) {
      statements.push(db.prepare('DELETE FROM '+table+' WHERE '+key+'=? '+guard).bind(id,id,threshold));
    }
    statements.push(db.prepare("DELETE FROM porchlight_events WHERE id=? AND ends_at<=?").bind(id,threshold));
  }
  const result = await db.batch(statements);
  if (!Array.isArray(result) || result.length!==statements.length || result.some(r=>r?.success===false)) {
    throw new Error("Atomic retention batch not confirmed");
  }
  let deleted=0;
  for(let i=6;i<result.length;i+=7) deleted+=Number(result[i]?.meta?.changes||0);
  // Expected 1 event deletion per eligible row; surfaces partial/race cases.
  if(deleted!==rows.length)throw new Error("Retention commit needs event-count reconciliation");
  return {...safe,deletedEvents:deleted};
}
