// Per-member configuration drafts. Absolutely no execution/broker permissions.
// The authenticated user identifier is supplied by memberEndpoint, never input.
const FIELDS = ["label", "maxOpenPositions", "maxPositionPercent", "maxTotalExposurePercent"];

export function validateRhenDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a draft object.");
  }
  const keys = Object.keys(value).sort();
  if (keys.length !== FIELDS.length || keys.some((key, i) => key !== FIELDS[i])) {
    throw new Error("Only draft label and position-limit fields are accepted.");
  }
  if (typeof value.label !== "string") throw new Error("A draft label is required.");
  const label = value.label.trim();
  if (!label || label.length > 48) throw new Error("Draft label must be 1–48 characters.");

  const limits = [
    ["maxOpenPositions", 1, 10],
    ["maxTotalExposurePercent", 1, 100],
    ["maxPositionPercent", 1, 100]
  ];
  for (const [key, min, max] of limits) {
    if (!Number.isSafeInteger(value[key]) || value[key] < min || value[key] > max) {
      throw new Error("Invalid draft limit: " + key);
    }
  }
  if (value.maxPositionPercent > value.maxTotalExposurePercent) {
    throw new Error("A single-position limit cannot exceed the total allocation limit.");
  }
  return {
    label,
    maxOpenPositions: value.maxOpenPositions,
    maxTotalExposurePercent: value.maxTotalExposurePercent,
    maxPositionPercent: value.maxPositionPercent
  };
}

export async function memberRhenDraftSchemaReady(db) {
  if (!db || typeof db.prepare !== "function") return false;
  try {
    const row = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='member_rhen_drafts'"
    ).first();
    return row?.name === "member_rhen_drafts";
  } catch {
    return false;
  }
}

export async function readMemberRhenDraft(db, userId) {
  return await db.prepare(
    "SELECT label, market_scope AS marketScope, direction, " +
    "max_open_positions AS maxOpenPositions, " +
    "max_total_exposure_percent AS maxTotalExposurePercent, " +
    "max_position_percent AS maxPositionPercent, updated_at AS updatedAt " +
    "FROM member_rhen_drafts WHERE user_id = ?"
  ).bind(userId).first() || null;
}

export async function saveMemberRhenDraft(db, userId, value) {
  const draft = validateRhenDraft(value);
  await db.prepare(
    "INSERT INTO member_rhen_drafts (" +
    "user_id, label, market_scope, direction, max_open_positions, " +
    "max_total_exposure_percent, max_position_percent" +
    ") VALUES (?, ?, 'us_equities_etfs', 'long_only', ?, ?, ?) " +
    "ON CONFLICT(user_id) DO UPDATE SET " +
    "label=excluded.label, max_open_positions=excluded.max_open_positions, " +
    "max_total_exposure_percent=excluded.max_total_exposure_percent, " +
    "max_position_percent=excluded.max_position_percent, updated_at=datetime('now')"
  ).bind(
    userId, draft.label, draft.maxOpenPositions,
    draft.maxTotalExposurePercent, draft.maxPositionPercent
  ).run();
  return readMemberRhenDraft(db, userId);
}

export async function deleteMemberRhenDraft(db, userId) {
  await db.prepare("DELETE FROM member_rhen_drafts WHERE user_id = ?").bind(userId).run();
}
