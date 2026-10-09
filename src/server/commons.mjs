// ANEVUM Commons: small, invite-only member research area.
// Never confers brokerage, operator, payment, rewards, or algorithm-promotion authority.
const kinds = new Set(["question", "research_note"]);
const subjects = new Set(["markets", "algorithms", "software", "mathematics"]);
const topicIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function respond(value, status = 200) {
  return Response.json(value, { status, headers: {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive"
  } });
}

async function bodyObject(request, allowedKeys, maxSize = 4096) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new Error("JSON content type required.");
  }
  const text = await request.text();
  if (!text || text.length > maxSize) throw new Error("Invalid request size.");
  const value = JSON.parse(text);
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected an object.");
  }
  const keys = Object.keys(value);
  if (!keys.length || keys.some(key => !allowedKeys.includes(key))) {
    throw new Error("Unexpected fields.");
  }
  return value;
}

function cleanString(value, min, max, label) {
  if (typeof value !== "string") throw new Error(label + " must be text.");
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(trimmed)) {
    throw new Error(label + " length or characters are invalid.");
  }
  return trimmed;
}

export function validateCommonsTopic(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join(",") !== "body,kind,subject,title") {
    throw new Error("Only title, body, kind, and subject are accepted.");
  }
  if (!kinds.has(value.kind) || !subjects.has(value.subject)) {
    throw new Error("Choose a supported research category.");
  }
  return {
    kind: value.kind,
    subject: value.subject,
    title: cleanString(value.title, 8, 120, "Title"),
    body: cleanString(value.body, 30, 3000, "Text")
  };
}

export function validateCommonsComment(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).join(",") !== "body") {
    throw new Error("Only comment text is accepted.");
  }
  return { body: cleanString(value.body, 3, 1500, "Comment") };
}

export function validateCommonsReport(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join(",") !== "itemId,itemType,reason") {
    throw new Error("Only item type, item ID, and report reason are accepted.");
  }
  if (!["topic", "comment"].includes(value.itemType) ||
      typeof value.itemId !== "string" || !topicIdPattern.test(value.itemId) ||
      !["spam", "harassment", "privacy", "misleading_claims", "other"].includes(value.reason)) {
    throw new Error("Invalid report target or reason.");
  }
  return { itemType: value.itemType, itemId: value.itemId, reason: value.reason };
}

export async function commonsSchemaReady(db) {
  if (typeof db?.prepare !== "function") return false;
  try {
    const result = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'commons_%'").all();
    const present = new Set((result?.results || []).map(row => row.name));
    return ["commons_members","commons_topics","commons_comments","commons_moderation_events","commons_reports"].every(table => present.has(table));
  } catch { return false; }
}

export async function exportCommonsData(db, userId) {
  if (!await commonsSchemaReady(db)) return { membership: null, topics: [], comments: [], reports: [] };
  const [membership, topics, comments, reports] = await Promise.all([
    db.prepare("SELECT role, status, joined_at FROM commons_members WHERE user_id = ?").bind(userId).first(),
    db.prepare("SELECT id, kind, subject, title, body, visibility, created_at FROM commons_topics WHERE author_id = ? ORDER BY created_at DESC").bind(userId).all(),
    db.prepare("SELECT id, topic_id, body, visibility, created_at FROM commons_comments WHERE author_id = ? ORDER BY created_at DESC").bind(userId).all(),
    db.prepare("SELECT id, topic_id, comment_id, reason, status, created_at, reviewed_at FROM commons_reports WHERE reporter_id = ? ORDER BY created_at DESC").bind(userId).all()
  ]);
  return { membership: membership || null, topics: topics.results || [], comments: comments.results || [], reports: reports.results || [] };
}

const authorName = "COALESCE(NULLIF(TRIM(p.display_name), ''), u.name)";
const topicSelect = `SELECT t.id, t.kind, t.subject, t.title, t.body, t.created_at AS createdAt,
  t.visibility, ${authorName} AS author,
  (SELECT COUNT(*) FROM commons_comments c WHERE c.topic_id = t.id AND c.visibility = 'members') AS commentCount
  FROM commons_topics t
  JOIN "user" u ON u.id = t.author_id
  LEFT JOIN member_profiles p ON p.user_id = t.author_id`;

async function listTopics(db) {
  const rows = await db.prepare(topicSelect + " WHERE t.visibility = 'members' ORDER BY t.created_at DESC, t.id DESC LIMIT ?").bind(30).all();
  return (rows.results || []).map(({ visibility, ...row }) => row);
}

async function readTopic(db, id, isModerator) {
  return db.prepare(topicSelect + " WHERE t.id = ? AND (t.visibility = 'members' OR ? = 1)").bind(id, isModerator ? 1 : 0).first();
}

async function listComments(db, topicId, isModerator) {
  const rows = await db.prepare(`SELECT c.id, c.body, c.created_at AS createdAt, c.visibility,
     ${authorName} AS author FROM commons_comments c
     JOIN "user" u ON u.id = c.author_id
     LEFT JOIN member_profiles p ON p.user_id = c.author_id
     WHERE c.topic_id = ? AND (c.visibility = 'members' OR ? = 1)
     ORDER BY c.created_at ASC LIMIT 100`).bind(topicId, isModerator ? 1 : 0).all();
  return (rows.results || []).map(({ visibility, ...row }) =>
    ({ ...row, hidden: visibility === "hidden" }));
}

export async function commonsEndpoint(request, env, user, pathname) {
  const home = pathname === "/api/member/commons";
  if (env?.ANEVUM_COMMONS_ENABLED !== "true") {
    return home && request.method === "GET"
      ? respond({ available: false, status: "preparing", role: null, topics: [] })
      : respond({ message: "Commons participation is not enabled." }, 503);
  }
  const db = env.MEMBER_DB;
  if (!await commonsSchemaReady(db)) {
    return home && request.method === "GET"
      ? respond({ available: false, status: "preparing", role: null, topics: [] })
      : respond({ message: "Commons storage is not ready." }, 503);
  }

  // Every request must pass Better Auth before reaching this handler.
  // Never accept a tenant ID, role, or member identity from query parameters.
  const member = await db.prepare("SELECT role, status FROM commons_members WHERE user_id = ?").bind(user.id).first();
  if (!member || member.status !== "active") {
    return home && request.method === "GET"
      ? respond({ available: false, status: "invite_only", role: null, topics: [] })
      : respond({ message: "Commons invitation required." }, 403);
  }
  const moderator = member.role === "moderator";

  if (home) {
    if (request.method !== "GET") return respond({ message: "Read-only overview." }, 405);
    return respond({ available: true, status: "active", role: member.role, topics: await listTopics(db) });
  }
  if (pathname === "/api/member/commons/topics") {
    if (request.method !== "POST") return respond({ message: "Method not allowed." }, 405);
    let input;
    try { input = validateCommonsTopic(await bodyObject(request, ["title","body","kind","subject"])); }
    catch (error) { return respond({ message: error instanceof Error ? error.message : "Invalid submission." }, 400); }
    const id = crypto.randomUUID();
    const result = await db.prepare(`INSERT INTO commons_topics (id, author_id, kind, subject, title, body)
      SELECT ?,?,?,?,?,?
      WHERE (SELECT COUNT(*) FROM commons_topics WHERE author_id = ? AND created_at >= datetime('now','-1 day')) < 3`)
      .bind(id, user.id, input.kind, input.subject, input.title, input.body, user.id).run();
    if (result.meta?.changes !== 1) return respond({ message: "Daily research contribution limit reached." }, 429);
    return respond({ id, created: true }, 201);
  }


  // Reports are bound to server-authenticated contributors; reporter identity is
  // never exposed in moderator responses. Content stays in the original thread.
  if (pathname === "/api/member/commons/reports") {
    if (request.method === "GET") {
      if (!moderator) return respond({ message: "Moderator access required." }, 403);
      const results = await db.prepare(`SELECT r.id, r.reason, r.created_at AS createdAt,
        CASE WHEN r.topic_id IS NULL THEN 'comment' ELSE 'topic' END AS itemType,
        COALESCE(r.topic_id, c.topic_id) AS topicId, t.title AS topicTitle
        FROM commons_reports r
        LEFT JOIN commons_comments c ON c.id = r.comment_id
        JOIN commons_topics t ON t.id = COALESCE(r.topic_id, c.topic_id)
        WHERE r.status = 'open'
        ORDER BY r.created_at ASC, r.id ASC LIMIT 50`).all();
      return respond({ reports: results.results || [] });
    }
    if (request.method !== "POST") return respond({ message: "Method not allowed." }, 405);
    let input;
    try { input = validateCommonsReport(await bodyObject(request, ["itemType","itemId","reason"], 256)); }
    catch (error) { return respond({ message: error instanceof Error ? error.message : "Invalid report." }, 400); }
    const target = input.itemType === "topic" ? "t.id" : "c.id";
    const from = input.itemType === "topic"
      ? "commons_topics t"
      : "commons_comments c JOIN commons_topics t ON t.id = c.topic_id";
    const visible = input.itemType === "topic"
      ? "t.visibility = 'members'"
      : "t.visibility = 'members' AND c.visibility = 'members'";
    const column = input.itemType === "topic" ? "topic_id" : "comment_id";
    const statement = `INSERT OR IGNORE INTO commons_reports(id, reporter_id, ${column}, reason)
      SELECT ?, ?, ${target}, ? FROM ${from}
      WHERE ${target} = ? AND ${visible}
        AND (SELECT COUNT(*) FROM commons_reports
             WHERE reporter_id = ? AND created_at >= datetime('now','-1 day')) < 10`;
    try {
      const result = await db.prepare(statement).bind(crypto.randomUUID(), user.id, input.reason, input.itemId, user.id).run();
      if (result.meta?.changes !== 1) return respond({ message: "Report already received, limited, or item unavailable." }, 409);
      return respond({ created: true }, 201);
    } catch {
      return respond({ message: "Report could not be saved." }, 503);
    }
  }
  const reportReview = /^\\/api\\/member\\/commons\\/reports\\/([^/]+)$/.exec(pathname);
  if (reportReview) {
    if (!moderator) return respond({ message: "Moderator access required." }, 403);
    if (request.method !== "PATCH") return respond({ message: "Method not allowed." }, 405);
    const id = reportReview[1];
    if (!topicIdPattern.test(id)) return respond({ message: "Report not found." }, 404);
    let input;
    try { input = await bodyObject(request, ["reviewed"], 128); }
    catch { return respond({ message: "Invalid review action." }, 400); }
    if (Object.keys(input).length !== 1 || input.reviewed !== true) return respond({ message: "Invalid review action." }, 400);
    const result = await db.prepare(`UPDATE commons_reports
      SET status = 'reviewed', reviewed_by = ?, reviewed_at = datetime('now')
      WHERE id = ? AND status = 'open'`).bind(user.id, id).run();
    if (result.meta?.changes !== 1) return respond({ message: "Report not found or already reviewed." }, 404);
    return respond({ reviewed: true });
  }

  const topicMatch = /^\/api\/member\/commons\/topics\/([^/]+)$/.exec(pathname);
  if (topicMatch) {
    const id = topicMatch[1];
    if (!topicIdPattern.test(id)) return respond({ message: "Topic not found." }, 404);
    if (request.method === "GET") {
      const topic = await readTopic(db, id, moderator);
      if (!topic) return respond({ message: "Topic not found." }, 404);
      const { visibility, ...record } = topic;
      return respond({ topic: { ...record, hidden: visibility === "hidden" },
        comments: await listComments(db, id, moderator), canModerate: moderator });
    }
    if (request.method === "PATCH" && moderator) {
      let data;
      try { data = await bodyObject(request, ["hidden"]); }
      catch { return respond({ message: "Invalid moderation instruction." }, 400); }
      if (Object.keys(data).length !== 1 || typeof data.hidden !== "boolean") return respond({ message: "Invalid moderation instruction." }, 400);
      const exists = await db.prepare("SELECT id FROM commons_topics WHERE id = ?").bind(id).first();
      if (!exists) return respond({ message: "Topic not found." }, 404);
      const next = data.hidden ? "hidden" : "members";
      await db.batch([
        db.prepare("UPDATE commons_topics SET visibility = ? WHERE id = ?").bind(next, id),
        db.prepare("INSERT INTO commons_moderation_events (id, moderator_id, item_type, item_id, action) VALUES (?, ?, 'topic', ?, ?)")
          .bind(crypto.randomUUID(), user.id, id, data.hidden ? "hide" : "restore")
      ]);
      return respond({ updated: true });
    }
    return respond({ message: "Method not allowed or insufficient permissions." }, 405);
  }

  const commentsRoute = /^\/api\/member\/commons\/topics\/([^/]+)\/comments$/.exec(pathname);
  if (commentsRoute) {
    const id = commentsRoute[1];
    if (!topicIdPattern.test(id)) return respond({ message: "Topic not found." }, 404);
    if (request.method !== "POST") return respond({ message: "Method not allowed." }, 405);
    const topic = await readTopic(db, id, false);
    if (!topic) return respond({ message: "Topic not found." }, 404);
    let input;
    try { input = validateCommonsComment(await bodyObject(request, ["body"])); }
    catch (error) { return respond({ message: error instanceof Error ? error.message : "Invalid comment." }, 400); }
    const commentId = crypto.randomUUID();
    const result = await db.prepare(`INSERT INTO commons_comments (id, topic_id, author_id, body)
      SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM commons_topics WHERE id = ? AND visibility = 'members')
      AND (SELECT COUNT(*) FROM commons_comments WHERE author_id = ? AND created_at >= datetime('now','-1 day')) < 20`)
      .bind(commentId, id, user.id, input.body, id, user.id).run();
    if (result.meta?.changes !== 1) return respond({ message: "Comment limit reached or topic unavailable." }, 429);
    return respond({ id: commentId, created: true }, 201);
  }

  const commentModeration = /^\/api\/member\/commons\/comments\/([^/]+)$/.exec(pathname);
  if (commentModeration && moderator && request.method === "PATCH") {
    const id = commentModeration[1];
    if (!topicIdPattern.test(id)) return respond({ message: "Comment not found." }, 404);
    let data;
    try { data = await bodyObject(request, ["hidden"]); }
    catch { return respond({ message: "Invalid moderation instruction." }, 400); }
    if (Object.keys(data).length !== 1 || typeof data.hidden !== "boolean") return respond({ message: "Invalid moderation instruction." }, 400);
    const exists = await db.prepare("SELECT id FROM commons_comments WHERE id = ?").bind(id).first();
    if (!exists) return respond({ message: "Comment not found." }, 404);
    await db.batch([
      db.prepare("UPDATE commons_comments SET visibility = ? WHERE id = ?").bind(data.hidden ? "hidden" : "members", id),
      db.prepare("INSERT INTO commons_moderation_events (id, moderator_id, item_type, item_id, action) VALUES (?, ?, 'comment', ?, ?)")
        .bind(crypto.randomUUID(), user.id, id, data.hidden ? "hide" : "restore")
    ]);
    return respond({ updated: true });
  }
  return respond({ message: "Commons endpoint not found." }, 404);
}
