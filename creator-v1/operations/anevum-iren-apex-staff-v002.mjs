var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// canonical-auth/request-body.mjs
async function boundedText(request, maxBytes) {
  const size = Number(request.headers.get("content-length") || 0);
  if (!Number.isSafeInteger(size) || size < 0 || size > maxBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let total = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
__name(boundedText, "boundedText");

// canonical-auth/staff-ops.mjs
var STAFF_OPS_PATH = "/api/v1/member/staff-ops";
var HEAD = { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
var json = /* @__PURE__ */ __name((data, status = 200) => Response.json(data, { status, headers: HEAD }), "json");
var fail = /* @__PURE__ */ __name((status, error) => json({ error }, status), "fail");
var ROOMS = /* @__PURE__ */ new Set(["operations", "review", "projects"]);
var STAGES = /* @__PURE__ */ new Set(["invited", "responded", "joined", "staff-candidate", "closed"]);
var TASK_STAGES = /* @__PURE__ */ new Set(["open", "in-progress", "blocked", "done"]);
var PRIORITIES = /* @__PURE__ */ new Set(["routine", "important", "urgent"]);
var CHANNELS = /* @__PURE__ */ new Set(["direct", "email", "social", "other"]);
var COLORS = /* @__PURE__ */ new Set(["#f67c73", "#a99aff", "#f5d2a0", "#a6dece", "#e4e7f5"]);
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
async function staffOpsPermission(env, user) {
  if (!user?.id || user.emailVerified !== true || !env?.MEMBER_DB) return null;
  try {
    const row = await env.MEMBER_DB.prepare("SELECT role FROM staff_access_grants WHERE member_id=? AND revoked_at IS NULL").bind(user.id).first();
    return row && ["owner", "reviewer"].includes(row.role) ? { memberId: user.id, role: row.role } : null;
  } catch {
    return null;
  }
}
__name(staffOpsPermission, "staffOpsPermission");
async function staffRosterIds(db) {
  try {
    const rows = await db.prepare(`SELECT g.member_id AS id FROM staff_access_grants g JOIN "user" u ON u.id=g.member_id WHERE g.revoked_at IS NULL AND u.emailVerified=1 ORDER BY CASE g.role WHEN 'owner' THEN 0 ELSE 1 END,g.created_at LIMIT 40`).all();
    return (rows.results || []).map((x) => x.id);
  } catch {
    return [];
  }
}
__name(staffRosterIds, "staffRosterIds");
function validCanvasStroke(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!exact(value, ["points", "color", "width"]) || !COLORS.has(value.color) || !Number.isInteger(value.width) || value.width < 1 || value.width > 5 || !Array.isArray(value.points) || value.points.length < 2 || value.points.length > 64) return false;
  return value.points.every((p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1));
}
__name(validCanvasStroke, "validCanvasStroke");
var exact = /* @__PURE__ */ __name((obj, keys) => Object.keys(obj).sort().join("|") === keys.slice().sort().join("|"), "exact");
var clean = /* @__PURE__ */ __name((s, min, max) => typeof s === "string" && s.trim().length >= min && s.trim().length <= max && !CONTROL.test(s) ? s.trim() : null, "clean");
var roomOf = /* @__PURE__ */ __name((s) => ROOMS.has(s) ? s : null, "roomOf");
async function ready(db) {
  if (!db || typeof db.prepare !== "function") return false;
  try {
    const rows = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'staff_%'").all();
    const tables = new Set((rows.results || []).map((x) => x.name));
    return [
      "staff_invitation_log",
      "staff_task_log",
      "staff_chat_log",
      "staff_canvas_log",
      "staff_presence",
      "staff_webrtc_signals",
      "staff_ops_audit",
      "staff_ops_limits",
      "staff_access_grants",
      "staff_access_audit"
    ].every((x) => tables.has(x));
  } catch {
    return false;
  }
}
__name(ready, "ready");
async function limited(db, memberId, operation, now, max) {
  const bucket = Math.floor(now / 60);
  const query = db.prepare("INSERT INTO staff_ops_limits(member_id,operation,minute_bucket,attempts) VALUES(?,?,?,1) ON CONFLICT(member_id,operation,minute_bucket) DO UPDATE SET attempts=attempts+1");
  await query.bind(memberId, operation, bucket).run();
  const row = await db.prepare("SELECT attempts FROM staff_ops_limits WHERE member_id=? AND operation=? AND minute_bucket=?").bind(memberId, operation, bucket).first();
  return row?.attempts <= max;
}
__name(limited, "limited");
var audit = /* @__PURE__ */ __name((db, type, id, memberId, now) => db.prepare(
  "INSERT INTO staff_ops_audit(event_type,entity_id,actor_id,created_at) VALUES(?,?,?,?)"
).bind(type, id, memberId, now), "audit");
async function readSnapshot(db, env, permit, room, now) {
  const rosterResult = await db.prepare(
    `SELECT g.member_id AS id,g.role,COALESCE(p.display_name,u.name,'STAFF') AS name,COALESCE(p.handle,'') AS handle FROM staff_access_grants g JOIN "user" u ON u.id=g.member_id LEFT JOIN member_creator_profiles p ON p.user_id=g.member_id WHERE g.revoked_at IS NULL AND u.emailVerified=1 ORDER BY CASE g.role WHEN 'owner' THEN 0 ELSE 1 END,g.created_at LIMIT 40`
  ).all();
  const roster = rosterResult.results || [];
  const rosterIds = roster.map((r) => r.id);
  const [invites, tasks, messages, canvas, history, peers, memberMetrics, eligibleMembers] = await Promise.all([
    db.prepare("SELECT id,alias,channel,stage,note,created_at AS createdAt,updated_at AS updatedAt FROM staff_invitation_log ORDER BY updated_at DESC LIMIT 80").all(),
    db.prepare("SELECT id,title,stage,priority,updated_at AS updatedAt FROM staff_task_log ORDER BY updated_at DESC LIMIT 80").all(),
    db.prepare(`SELECT m.seq,m.id,m.room,m.author_id AS authorId,m.body,m.created_at AS createdAt,COALESCE(p.display_name,u.name,'STAFF') AS author FROM staff_chat_log m JOIN "user" u ON u.id=m.author_id LEFT JOIN member_creator_profiles p ON p.user_id=m.author_id WHERE m.room=? ORDER BY m.seq DESC LIMIT 70`).bind(room).all(),
    db.prepare("SELECT seq,id,actor_id AS authorId,event_type AS eventType,event_data AS eventData,created_at AS createdAt FROM staff_canvas_log WHERE room=? ORDER BY seq DESC LIMIT 240").bind(room).all(),
    db.prepare("SELECT a.seq,a.event_type AS eventType,a.entity_id AS entityId,a.created_at AS createdAt,COALESCE(p.handle,'STAFF') AS actor FROM staff_ops_audit a LEFT JOIN member_creator_profiles p ON p.user_id=a.actor_id ORDER BY a.seq DESC LIMIT 40").all(),
    db.prepare("SELECT member_id AS id,last_seen_at AS lastSeen FROM staff_presence WHERE room='bridge' AND last_seen_at>? ORDER BY last_seen_at DESC").bind(now - 50).all(),
    permit.role === "owner" ? db.prepare(
      `SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN emailVerified=1 THEN 1 ELSE 0 END),0) AS verified,COALESCE(SUM(CASE WHEN julianday(createdAt)>=julianday('now')-1 THEN 1 ELSE 0 END),0) AS new24h,COALESCE(SUM(CASE WHEN julianday(createdAt)>=julianday('now')-7 THEN 1 ELSE 0 END),0) AS new7d,COALESCE(SUM(CASE WHEN julianday(createdAt)>=julianday('now')-30 THEN 1 ELSE 0 END),0) AS new30d,(SELECT COUNT(*) FROM member_creator_profiles) AS profiles FROM "user"`
    ).first() : Promise.resolve(null),
    permit.role === "owner" ? db.prepare(
      `SELECT u.id,COALESCE(p.display_name,u.name,'MEMBER') AS name,COALESCE(p.handle,'') AS handle FROM "user" u LEFT JOIN member_creator_profiles p ON p.user_id=u.id LEFT JOIN staff_access_grants g ON g.member_id=u.id AND g.revoked_at IS NULL WHERE u.emailVerified=1 AND g.member_id IS NULL ORDER BY u.createdAt DESC LIMIT 40`
    ).all() : Promise.resolve({ results: [] })
  ]);
  return {
    role: permit.role,
    memberId: permit.memberId,
    room,
    checkedAt: now,
    memberMetrics: memberMetrics ? { total: memberMetrics.total, verified: memberMetrics.verified, profiles: memberMetrics.profiles, new24h: memberMetrics.new24h, new7d: memberMetrics.new7d, new30d: memberMetrics.new30d } : null,
    eligibleMembers: permit.role === "owner" ? eligibleMembers.results || [] : [],
    invitationMode: "manual-only",
    liveMode: "short-poll",
    callMode: "peer-preview",
    invitations: invites.results || [],
    tasks: tasks.results || [],
    messages: (messages.results || []).reverse(),
    canvas: (canvas.results || []).reverse().map((x) => ({
      seq: x.seq,
      id: x.id,
      authorId: x.authorId,
      eventType: x.eventType,
      data: parseSafe(x.eventData),
      createdAt: x.createdAt
    })),
    history: history.results || [],
    roster,
    peers: (peers.results || []).filter((p) => rosterIds.includes(p.id)),
    limits: { messages: 70, canvas: 240, roster: 40 }
  };
}
__name(readSnapshot, "readSnapshot");
var parseSafe = /* @__PURE__ */ __name((value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}, "parseSafe");
async function postCommand(req, db, env, permit, now) {
  if (new URL(req.url).search) return fail(400, "Unexpected query");
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers.get("content-type") || "")) return fail(415, "JSON required");
  const raw = await boundedText(req, 18e3);
  if (raw === null) return fail(413, "Request too large");
  let v;
  try {
    v = JSON.parse(raw);
  } catch {
    return fail(400, "Invalid JSON");
  }
  if (!v || typeof v !== "object" || Array.isArray(v) || typeof v.kind !== "string") return fail(400, "Invalid command");
  const memberId = permit.memberId;
  const isOwner = permit.role === "owner";
  if (v.kind === "staff-grant" || v.kind === "staff-revoke") {
    if (!isOwner) return fail(403, "Owner authorization required");
    if (!exact(v, ["kind", "memberId"]) || typeof v.memberId !== "string" || v.memberId === memberId || v.memberId.length < 1 || v.memberId.length > 128) return fail(400, "Invalid staff member");
    if (!await limited(db, memberId, "staff-role", now, 12)) return fail(429, "Role change limit reached");
    if (v.kind === "staff-grant") {
      const results2 = await db.batch([
        db.prepare(
          `INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at,revoked_at) SELECT ?,'reviewer',?,?,?,NULL WHERE EXISTS(SELECT 1 FROM "user" WHERE id=? AND emailVerified=1) ON CONFLICT(member_id) DO UPDATE SET role='reviewer',granted_by=excluded.granted_by,updated_at=excluded.updated_at,revoked_at=NULL WHERE staff_access_grants.role='reviewer' AND staff_access_grants.revoked_at IS NOT NULL`
        ).bind(v.memberId, memberId, now, now, v.memberId),
        db.prepare("INSERT INTO staff_access_audit(id,actor_id,member_id,action,created_at) SELECT ?,?,?,'grant-reviewer',? WHERE changes()=1").bind(crypto.randomUUID(), memberId, v.memberId, now)
      ]);
      return results2[0].meta?.changes === 1 ? json({ ok: true, role: "reviewer" }) : fail(409, "Member already authorized, unverified or unavailable");
    }
    const results = await db.batch([
      db.prepare(
        "UPDATE staff_access_grants SET revoked_at=?,updated_at=?,granted_by=? WHERE member_id=? AND role='reviewer' AND revoked_at IS NULL"
      ).bind(now, now, memberId, v.memberId),
      db.prepare("INSERT INTO staff_access_audit(id,actor_id,member_id,action,created_at) SELECT ?,?,?,'revoke-reviewer',? WHERE changes()=1").bind(crypto.randomUUID(), memberId, v.memberId, now)
    ]);
    return results[0].meta?.changes === 1 ? json({ ok: true, revoked: true }) : fail(409, "Reviewer not active or protected role");
  }
  if (v.kind === "invite-create") {
    if (!isOwner) return fail(403, "Owner authorization required");
    if (!exact(v, ["kind", "alias", "channel", "note"]) || !clean(v.alias, 1, 64) || !CHANNELS.has(v.channel) || !clean(v.note, 0, 240) && v.note !== "") return fail(400, "Invalid invitation");
    if (!await limited(db, memberId, "invite", now, 12)) return fail(429, "Invitation limit reached");
    const id = crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO staff_invitation_log(id,alias,channel,stage,note,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,'invited',?,?,?,?,?)").bind(id, v.alias.trim(), v.channel, (v.note || "").trim(), memberId, memberId, now, now),
      audit(db, "invite-created", id, memberId, now)
    ]);
    return json({ ok: true, id, stage: "invited" }, 201);
  }
  if (v.kind === "invite-update") {
    if (!isOwner) return fail(403, "Owner authorization required");
    if (!exact(v, ["kind", "id", "stage"]) || !UUID.test(v.id) || !STAGES.has(v.stage)) return fail(400, "Invalid stage");
    if (!await limited(db, memberId, "invite", now, 20)) return fail(429, "Invitation limit reached");
    const result = await db.prepare("UPDATE staff_invitation_log SET stage=?,updated_at=?,updated_by=? WHERE id=? AND stage<>?").bind(v.stage, now, memberId, v.id, v.stage).run();
    if (result.meta?.changes !== 1) return fail(409, "Invitation already updated or missing");
    await audit(db, "invite-updated", v.id, memberId, now).run();
    return json({ ok: true });
  }
  if (v.kind === "task-create") {
    if (!exact(v, ["kind", "title", "priority"]) || !clean(v.title, 4, 140) || !PRIORITIES.has(v.priority)) return fail(400, "Invalid task");
    if (!await limited(db, memberId, "task", now, 20)) return fail(429, "Task limit reached");
    const id = crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO staff_task_log(id,title,stage,priority,created_by,updated_by,created_at,updated_at) VALUES(?,?,'open',?,?,?,?,?)").bind(id, v.title.trim(), v.priority, memberId, memberId, now, now),
      audit(db, "task-created", id, memberId, now)
    ]);
    return json({ ok: true, id }, 201);
  }
  if (v.kind === "task-update") {
    if (!exact(v, ["kind", "id", "stage"]) || !UUID.test(v.id) || !TASK_STAGES.has(v.stage)) return fail(400, "Invalid task stage");
    if (!await limited(db, memberId, "task", now, 25)) return fail(429, "Task limit reached");
    const result = await db.prepare("UPDATE staff_task_log SET stage=?,updated_at=?,updated_by=? WHERE id=? AND stage<>?").bind(v.stage, now, memberId, v.id, v.stage).run();
    if (result.meta?.changes !== 1) return fail(409, "Task already updated or missing");
    await audit(db, "task-updated", v.id, memberId, now).run();
    return json({ ok: true });
  }
  if (v.kind === "message") {
    const room = roomOf(v.room), body = clean(v.body, 1, 1200);
    if (!exact(v, ["kind", "room", "body"]) || !room || !body) return fail(400, "Invalid message");
    if (!await limited(db, memberId, "message", now, 24)) return fail(429, "Message rate limit reached");
    const id = crypto.randomUUID();
    await db.prepare("INSERT INTO staff_chat_log(id,room,author_id,body,created_at) VALUES(?,?,?,?,?)").bind(id, room, memberId, body, now).run();
    return json({ ok: true, id }, 201);
  }
  if (v.kind === "stroke") {
    const room = roomOf(v.room);
    if (!exact(v, ["kind", "room", "stroke"]) || !room || !validCanvasStroke(v.stroke)) return fail(400, "Invalid stroke");
    if (!await limited(db, memberId, "stroke", now, 90)) return fail(429, "Drawing rate limit reached");
    const id = crypto.randomUUID();
    await db.prepare("INSERT INTO staff_canvas_log(id,room,actor_id,event_type,event_data,created_at) VALUES(?,?,?,'stroke',?,?)").bind(id, room, memberId, JSON.stringify(v.stroke), now).run();
    return json({ ok: true, id }, 201);
  }
  if (v.kind === "clear-canvas") {
    const room = roomOf(v.room);
    if (!exact(v, ["kind", "room"]) || !room) return fail(400, "Invalid room");
    if (!await limited(db, memberId, "clear", now, 3)) return fail(429, "Canvas clear limit reached");
    const id = crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO staff_canvas_log(id,room,actor_id,event_type,event_data,created_at) VALUES(?,?,?,'clear','{}',?)").bind(id, room, memberId, now),
      audit(db, "board-cleared", id, memberId, now)
    ]);
    return json({ ok: true, id }, 201);
  }
  if (v.kind === "presence") {
    if (!exact(v, ["kind", "room"]) || !["bridge", "off"].includes(v.room)) return fail(400, "Invalid presence");
    if (!await limited(db, memberId, "presence", now, 12)) return fail(429, "Presence rate limit reached");
    await db.prepare("INSERT INTO staff_presence(member_id,room,last_seen_at) VALUES(?,?,?) ON CONFLICT(member_id) DO UPDATE SET room=excluded.room,last_seen_at=excluded.last_seen_at").bind(memberId, v.room, now).run();
    return json({ ok: true });
  }
  if (v.kind === "signal") {
    const roster = await staffRosterIds(db);
    if (!exact(v, ["kind", "recipientId", "signalType", "data"]) || typeof v.recipientId !== "string" || v.recipientId === memberId || !roster.includes(v.recipientId) || !["offer", "answer", "candidate", "leave"].includes(v.signalType) || !v.data || typeof v.data !== "object" || Array.isArray(v.data)) return fail(400, "Invalid call signal");
    const serialized = JSON.stringify(v.data);
    if (serialized.length > 16e3) return fail(413, "Signal too large");
    if (!await limited(db, memberId, "signal", now, 120)) return fail(429, "Signaling rate limit reached");
    if (v.signalType === "offer") await db.prepare("DELETE FROM staff_webrtc_signals WHERE created_at<?").bind(now - 600).run();
    await db.prepare("INSERT INTO staff_webrtc_signals(room,sender_id,recipient_id,signal_type,signal_data,created_at) VALUES('bridge',?,?,?,?,?)").bind(memberId, v.recipientId, v.signalType, serialized, now).run();
    return json({ ok: true }, 201);
  }
  return fail(400, "Unsupported staff command");
}
__name(postCommand, "postCommand");
async function canonicalStaffOps(req, env, user, now = Math.floor(Date.now() / 1e3)) {
  if (env?.CANONICAL_STAFF_OPS_ENABLED !== "true") return fail(404, "Not found");
  if (!user?.id || user.emailVerified !== true) return fail(401, "Verified sign-in required");
  const permit = await staffOpsPermission(env, user);
  if (!permit) return fail(403, "Staff authorization required");
  const db = env.MEMBER_DB;
  if (!await ready(db)) return fail(503, "Staff database not prepared");
  try {
    if (req.method === "POST") return postCommand(req, db, env, permit, now);
    if (req.method !== "GET") return fail(405, "Method not allowed");
    const url = new URL(req.url);
    if ([...url.searchParams.keys()].some((k) => !["room", "lane", "after"].includes(k) || url.searchParams.getAll(k).length !== 1)) return fail(400, "Invalid query");
    const lane = url.searchParams.get("lane") || "snapshot";
    if (lane === "signals") {
      if (url.searchParams.has("room")) return fail(400, "Unsupported signal room");
      const after = Number(url.searchParams.get("after") || 0);
      if (!Number.isSafeInteger(after) || after < 0) return fail(400, "Invalid signal cursor");
      const result = await db.prepare("SELECT seq,sender_id AS senderId,signal_type AS signalType,signal_data AS signalData FROM staff_webrtc_signals WHERE recipient_id=? AND seq>? AND created_at>? ORDER BY seq ASC LIMIT 80").bind(permit.memberId, after, now - 120).all();
      return json({ signals: (result.results || []).map((x) => ({
        seq: x.seq,
        senderId: x.senderId,
        signalType: x.signalType,
        data: parseSafe(x.signalData)
      })), checkedAt: now });
    }
    if (lane !== "snapshot" || url.searchParams.has("after")) return fail(400, "Invalid snapshot query");
    const room = roomOf(url.searchParams.get("room") || "operations");
    if (!room) return fail(400, "Invalid room");
    return json(await readSnapshot(db, env, permit, room, now));
  } catch {
    return fail(503, "Staff service unavailable");
  }
}
__name(canonicalStaffOps, "canonicalStaffOps");

// shared/level-artifacts.json
var level_artifacts_default = [
  {
    level: 1,
    name: "Pre-Grain",
    icon: "/evolution/assets/level-01-compact-128.png",
    preview: "/evolution/assets/level-01-256.webp",
    poster: "/evolution/assets/level-01-1024.webp",
    chapter: 1,
    chapterName: "Before Form",
    xp: 0,
    subtitle: "Before there was something",
    motion: "A near-imperceptible angular fluctuation and one slow incipient fissure pulse."
  },
  {
    level: 2,
    name: "Vacuum Whisper",
    icon: "/evolution/assets/level-02-compact-128.png",
    preview: "/evolution/assets/level-02-256.webp",
    poster: "/evolution/assets/level-02-1024.webp",
    chapter: 1,
    chapterName: "Before Form",
    xp: 75,
    subtitle: "The silence is not still",
    motion: "Independent field flutter and traveling interference fringes."
  },
  {
    level: 3,
    name: "Quantum Foam",
    icon: "/evolution/assets/level-03-compact-128.png",
    preview: "/evolution/assets/level-03-256.webp",
    poster: "/evolution/assets/level-03-1024.webp",
    chapter: 1,
    chapterName: "Before Form",
    xp: 300,
    subtitle: "A brief architecture of uncertainty",
    motion: "Cavities swell, contract and fade out of phase."
  },
  {
    level: 4,
    name: "Symmetry Field",
    icon: "/evolution/assets/level-04-compact-128.png",
    preview: "/evolution/assets/level-04-256.webp",
    poster: "/evolution/assets/level-04-1024.webp",
    chapter: 1,
    chapterName: "Before Form",
    xp: 675,
    subtitle: "The first balance",
    motion: "Opposed planes approach alignment around a glowing symmetry axis."
  },
  {
    level: 5,
    name: "First Expansion",
    icon: "/evolution/assets/level-05-compact-128.png",
    preview: "/evolution/assets/level-05-256.webp",
    poster: "/evolution/assets/level-05-1024.webp",
    chapter: 1,
    chapterName: "Before Form",
    xp: 1200,
    subtitle: "The interval widens",
    motion: "The causal membrane and released shards expand and settle."
  },
  {
    level: 6,
    name: "Primordial Plasma",
    icon: "/evolution/assets/level-06-compact-128.png",
    preview: "/evolution/assets/level-06-256.webp",
    poster: "/evolution/assets/level-06-1024.webp",
    chapter: 2,
    chapterName: "First Matter",
    xp: 1875,
    subtitle: "Light trapped in a sea of charge",
    motion: "Charge currents deform while luminous turbulence travels through them."
  },
  {
    level: 7,
    name: "Quark Wake",
    icon: "/evolution/assets/level-07-compact-128.png",
    preview: "/evolution/assets/level-07-256.webp",
    poster: "/evolution/assets/level-07-1024.webp",
    chapter: 2,
    chapterName: "First Matter",
    xp: 2700,
    subtitle: "The smallest bonds begin",
    motion: "Charge knots move independently as binding flux flexes."
  },
  {
    level: 8,
    name: "Proton Seed",
    icon: "/evolution/assets/level-08-compact-128.png",
    preview: "/evolution/assets/level-08-256.webp",
    poster: "/evolution/assets/level-08-1024.webp",
    chapter: 2,
    chapterName: "First Matter",
    xp: 3675,
    subtitle: "A durable center",
    motion: "The bound lobes remain stable while pressure seams change luminosity."
  },
  {
    level: 9,
    name: "Proto-Atom",
    icon: "/evolution/assets/level-09-compact-128.png",
    preview: "/evolution/assets/level-09-256.webp",
    poster: "/evolution/assets/level-09-1024.webp",
    chapter: 2,
    chapterName: "First Matter",
    xp: 4800,
    subtitle: "A new kind of enclosure",
    motion: "Probability lobes and contours precess independently."
  },
  {
    level: 10,
    name: "Ancient Afterglow",
    icon: "/evolution/assets/level-10-compact-128.png",
    preview: "/evolution/assets/level-10-256.webp",
    poster: "/evolution/assets/level-10-1024.webp",
    chapter: 2,
    chapterName: "First Matter",
    xp: 6075,
    subtitle: "The universe leaves a trace",
    motion: "A low-frequency wave passes across a barely moving radiation fossil."
  },
  {
    level: 11,
    name: "Quiet Epoch",
    icon: "/evolution/assets/level-11-compact-128.png",
    preview: "/evolution/assets/level-11-256.webp",
    poster: "/evolution/assets/level-11-1024.webp",
    chapter: 3,
    chapterName: "Stellar Dawn",
    xp: 7500,
    subtitle: "A darkness full of possibility",
    motion: "Cold hydrogen banks gather almost imperceptibly around dim density knots."
  },
  {
    level: 12,
    name: "Gravity Well",
    icon: "/evolution/assets/level-12-compact-128.png",
    preview: "/evolution/assets/level-12-256.webp",
    poster: "/evolution/assets/level-12-1024.webp",
    chapter: 3,
    chapterName: "Stellar Dawn",
    xp: 9075,
    subtitle: "Matter learns to fall together",
    motion: "The curved geodesic funnel rotates around its dark focus."
  },
  {
    level: 13,
    name: "Star Ignition",
    icon: "/evolution/assets/level-13-compact-128.png",
    preview: "/evolution/assets/level-13-256.webp",
    poster: "/evolution/assets/level-13-1024.webp",
    chapter: 3,
    chapterName: "Stellar Dawn",
    xp: 10800,
    subtitle: "The first star catches",
    motion: "An unstable photosphere breathes as coronal arches and streamers deform."
  },
  {
    level: 14,
    name: "Fusion Ember",
    icon: "/evolution/assets/level-14-compact-128.png",
    preview: "/evolution/assets/level-14-256.webp",
    poster: "/evolution/assets/level-14-1024.webp",
    chapter: 3,
    chapterName: "Stellar Dawn",
    xp: 12675,
    subtitle: "A furnace that makes new matter",
    motion: "A stable photosphere rotates beneath independently changing prominences."
  },
  {
    level: 15,
    name: "Nebula Bloom",
    icon: "/evolution/assets/level-15-compact-128.png",
    preview: "/evolution/assets/level-15-256.webp",
    poster: "/evolution/assets/level-15-1024.webp",
    chapter: 3,
    chapterName: "Stellar Dawn",
    xp: 14700,
    subtitle: "The first stellar nursery",
    motion: "Independent density banks drift around an embedded newborn star."
  },
  {
    level: 16,
    name: "Element Forge",
    icon: "/evolution/assets/level-16-compact-128.png",
    preview: "/evolution/assets/level-16-256.webp",
    poster: "/evolution/assets/level-16-1024.webp",
    chapter: 4,
    chapterName: "Cosmic Architecture",
    xp: 16875,
    subtitle: "A star scatters the elements",
    motion: "Elemental ejecta expand from a pulsing stellar crucible."
  },
  {
    level: 17,
    name: "Galactic Seed",
    icon: "/evolution/assets/level-17-compact-128.png",
    preview: "/evolution/assets/level-17-256.webp",
    poster: "/evolution/assets/level-17-1024.webp",
    chapter: 4,
    chapterName: "Cosmic Architecture",
    xp: 19200,
    subtitle: "A hidden structure gathers",
    motion: "Spiral inflows gather while the first stellar population turns."
  },
  {
    level: 18,
    name: "First Galaxy",
    icon: "/evolution/assets/level-18-compact-128.png",
    preview: "/evolution/assets/level-18-256.webp",
    poster: "/evolution/assets/level-18-1024.webp",
    chapter: 4,
    chapterName: "Cosmic Architecture",
    xp: 21675,
    subtitle: "Light becomes a civilization of stars",
    motion: "Thousands of stars rotate with the inclined spiral geometry."
  },
  {
    level: 19,
    name: "Cosmic Web",
    icon: "/evolution/assets/level-19-compact-128.png",
    preview: "/evolution/assets/level-19-256.webp",
    poster: "/evolution/assets/level-19-1024.webp",
    chapter: 4,
    chapterName: "Cosmic Architecture",
    xp: 24300,
    subtitle: "Everything begins to connect",
    motion: "Luminosity propagates along independently deforming filaments."
  },
  {
    level: 20,
    name: "Stellar System",
    icon: "/evolution/assets/level-20-compact-128.png",
    preview: "/evolution/assets/level-20-256.webp",
    poster: "/evolution/assets/level-20-1024.webp",
    chapter: 4,
    chapterName: "Cosmic Architecture",
    xp: 27075,
    subtitle: "A star gains an entourage",
    motion: "Four worlds orbit at different speeds around a stellar primary."
  },
  {
    level: 21,
    name: "Planetary Accretion",
    icon: "/evolution/assets/level-21-compact-128.png",
    preview: "/evolution/assets/level-21-256.webp",
    poster: "/evolution/assets/level-21-1024.webp",
    chapter: 5,
    chapterName: "Worlds & Life",
    xp: 3e4,
    subtitle: "A world starts as collision",
    motion: "Planetesimals drift inward while an accreting world turns."
  },
  {
    level: 22,
    name: "Ocean World",
    icon: "/evolution/assets/level-22-compact-128.png",
    preview: "/evolution/assets/level-22-256.webp",
    poster: "/evolution/assets/level-22-1024.webp",
    chapter: 5,
    chapterName: "Worlds & Life",
    xp: 33075,
    subtitle: "The surface learns to flow",
    motion: "Ocean texture and atmospheric arcs circulate at different rates."
  },
  {
    level: 23,
    name: "Molecular Chorus",
    icon: "/evolution/assets/level-23-compact-128.png",
    preview: "/evolution/assets/level-23-256.webp",
    poster: "/evolution/assets/level-23-1024.webp",
    chapter: 5,
    chapterName: "Worlds & Life",
    xp: 36300,
    subtitle: "Complexity finds a rhythm",
    motion: "A molecular backbone flexes while reactive groups pulse."
  },
  {
    level: 24,
    name: "First Replicator",
    icon: "/evolution/assets/level-24-compact-128.png",
    preview: "/evolution/assets/level-24-256.webp",
    poster: "/evolution/assets/level-24-1024.webp",
    chapter: 5,
    chapterName: "Worlds & Life",
    xp: 39675,
    subtitle: "Matter begins to remember",
    motion: "Twin membranes separate and return while internal strands move."
  },
  {
    level: 25,
    name: "Biosphere",
    icon: "/evolution/assets/level-25-compact-128.png",
    preview: "/evolution/assets/level-25-256.webp",
    poster: "/evolution/assets/level-25-1024.webp",
    chapter: 5,
    chapterName: "Worlds & Life",
    xp: 43200,
    subtitle: "A world becomes alive",
    motion: "Canopy filaments flex around a rotating ocean substrate."
  },
  {
    level: 26,
    name: "Awareness",
    icon: "/evolution/assets/level-26-compact-128.png",
    preview: "/evolution/assets/level-26-256.webp",
    poster: "/evolution/assets/level-26-1024.webp",
    chapter: 6,
    chapterName: "Continuance",
    xp: 46875,
    subtitle: "The universe begins to notice itself",
    motion: "Dendrites flex while traveling electrochemical impulses illuminate terminals."
  },
  {
    level: 27,
    name: "The Signal",
    icon: "/evolution/assets/level-27-compact-128.png",
    preview: "/evolution/assets/level-27-256.webp",
    poster: "/evolution/assets/level-27-1024.webp",
    chapter: 6,
    chapterName: "Continuance",
    xp: 50700,
    subtitle: "Awareness reaches beyond itself",
    motion: "A resonator calibrates and sends distinct expanding transmission waves."
  },
  {
    level: 28,
    name: "Civilization",
    icon: "/evolution/assets/level-28-compact-128.png",
    preview: "/evolution/assets/level-28-256.webp",
    poster: "/evolution/assets/level-28-1024.webp",
    chapter: 6,
    chapterName: "Continuance",
    xp: 54675,
    subtitle: "Many minds begin to build together",
    motion: "Inhabited windows light in groups while skybridges carry moving illumination."
  },
  {
    level: 29,
    name: "Continuance Institute",
    icon: "/evolution/assets/level-29-compact-128.png",
    preview: "/evolution/assets/level-29-256.webp",
    poster: "/evolution/assets/level-29-1024.webp",
    chapter: 6,
    chapterName: "Continuance",
    xp: 58800,
    subtitle: "Discovery becomes an enduring purpose",
    motion: "Optical gimbals calibrate independently above preserved archive leaves."
  },
  {
    level: 30,
    name: "ANEVUM",
    icon: "/evolution/assets/level-30-compact-128.png",
    preview: "/evolution/assets/level-30-256.webp",
    poster: "/evolution/assets/level-30-1024.webp",
    chapter: 6,
    chapterName: "Continuance",
    xp: 63075,
    subtitle: "Creation continues beyond the beginning",
    motion: "Five evolutionary memory streams converge through open orbits; a new outward signal answers."
  }
];

// canonical-auth/rewards.mjs
var MILESTONES = Object.freeze([
  { id: "first_signal", name: "First Signal", detail: "Save your first wall entry.", xp: 10, symbol: "\u2726" },
  { id: "world_shaper", name: "World Shaper", detail: "Add an introduction, portrait and banner.", xp: 25, symbol: "\u25C8" }
]);

// canonical-auth/progression.mjs
function levelProgress(raw) {
  const xp = Number.isSafeInteger(raw) && raw >= 0 ? raw : 0;
  const level = Math.min(30, 1 + Math.floor(Math.sqrt(xp / 75)));
  return { xp, level, maxLevel: 30, levelStart: 75 * (level - 1) ** 2, nextLevel: level === 30 ? null : 75 * level ** 2, artifact: level_artifacts_default[level - 1]?.name ?? null };
}
__name(levelProgress, "levelProgress");

// canonical-auth/public-member-card.mjs
var awardIds = new Set(MILESTONES.map((item) => item.id));
var ownerColumns = /* @__PURE__ */ new Set(["t.author_id", "r.author_id", "p.user_id"]);
function publicMemberColumns(owner) {
  if (!ownerColumns.has(owner)) throw Error("Unsafe identity column");
  return `s.featured_json,s.show_stats,
 (COALESCE((SELECT SUM(amount) FROM member_xp_events x WHERE x.user_id=${owner}),0)+
  COALESCE((SELECT SUM(CASE milestone WHEN 'first_signal' THEN 10 WHEN 'world_shaper' THEN 25 ELSE 0 END)
   FROM member_space_milestones z WHERE z.user_id=${owner}),0)) AS member_xp,
 (SELECT GROUP_CONCAT(milestone) FROM member_space_milestones e
  WHERE e.user_id=${owner} AND e.milestone IN ('first_signal','world_shaper')) AS earned_awards`;
}
__name(publicMemberColumns, "publicMemberColumns");
function publicMemberCard(row) {
  let requested = [];
  try {
    const array = JSON.parse(row.featured_json || "[]");
    if (Array.isArray(array)) requested = array;
  } catch {
  }
  const earned = new Set(typeof row.earned_awards === "string" ? row.earned_awards.split(",") : []);
  const featuredAwards = [...new Set(requested.filter((id) => typeof id === "string" && awardIds.has(id) && earned.has(id)))].slice(0, 3);
  const number = Number(row.member_xp);
  const xp = Number.isSafeInteger(number) && number >= 0 ? number : 0;
  return {
    handle: row.handle,
    displayName: row.display_name,
    avatar: Boolean(row.avatar),
    level: row.show_stats === 0 ? null : levelProgress(xp).level,
    featuredAwards
  };
}
__name(publicMemberCard, "publicMemberCard");

// canonical-auth/forums.mjs
var HEAD2 = { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
var json2 = /* @__PURE__ */ __name((data, status = 200) => Response.json(data, { status, headers: HEAD2 }), "json");
var fail2 = /* @__PURE__ */ __name((status, message) => json2({ error: message }, status), "fail");
var TOPICS = /* @__PURE__ */ new Set(["games", "making", "arts", "community"]);
var UUID2 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
var CTRL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
var permitted = /* @__PURE__ */ __name((v, keys) => Object.keys(v).sort().join("|") === keys.sort().join("|"), "permitted");
function decodeCursor(value) {
  if (value === null) return null;
  if (value.length > 180) return false;
  try {
    const data = JSON.parse(atob(value));
    return Array.isArray(data) && data.length === 2 && Number.isSafeInteger(data[0]) && data[0] > 0 && UUID2.test(data[1]) ? data : false;
  } catch {
    return false;
  }
}
__name(decodeCursor, "decodeCursor");
var encodeCursor = /* @__PURE__ */ __name((at, id) => btoa(JSON.stringify([Number(at), id])), "encodeCursor");
async function payload(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers.get("content-type") || "")) return null;
  const s = await boundedText(req, 7e3);
  try {
    const p = JSON.parse(s);
    return p && typeof p === "object" && !Array.isArray(p) ? p : null;
  } catch {
    return null;
  }
}
__name(payload, "payload");
var card = publicMemberCard;
var authorSql = `JOIN member_creator_profiles p ON p.user_id=t.author_id JOIN "user" u ON u.id=p.user_id
 LEFT JOIN member_space_settings s ON s.user_id=p.user_id
 WHERE p.visibility='public' AND u.emailVerified=1`;
var selectThread = `SELECT t.id,t.topic,t.title,t.body,t.status,t.created_at,t.published_at,t.updated_at,
 p.handle,p.display_name,${publicMemberColumns("t.author_id")},
 EXISTS(SELECT 1 FROM member_space_media m WHERE m.user_id=p.user_id AND m.slot='avatar') AS avatar,

 (SELECT COUNT(*) FROM member_forum_replies r JOIN member_creator_profiles rp ON rp.user_id=r.author_id
 JOIN "user" ru ON ru.id=rp.user_id WHERE r.thread_id=t.id AND r.status='published'
 AND rp.visibility='public' AND ru.emailVerified=1) AS reply_count,
 (SELECT COUNT(*) FROM member_forum_reactions v WHERE v.thread_id=t.id) AS reactions
 FROM member_forum_threads t ${authorSql} AND t.status='published'`;
var threadRow = /* @__PURE__ */ __name((r) => ({ id: r.id, topic: r.topic, title: r.title, body: r.body, createdAt: r.created_at, publishedAt: r.published_at, updatedAt: r.updated_at, author: card(r), replyCount: r.reply_count, reactions: r.reactions }), "threadRow");
async function dbReady(db) {
  try {
    const r = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_forum_threads','member_forum_replies','member_forum_reactions','member_forum_reports','member_forum_review_log')").all();
    return r.results.length === 5;
  } catch {
    return false;
  }
}
__name(dbReady, "dbReady");
async function canonicalForums(req, env, user = null, now = Math.floor(Date.now() / 1e3)) {
  if (env.CANONICAL_FORUM_ENABLED !== "true") return fail2(404, "Forums are not enabled");
  const db = env.MEMBER_DB;
  if (!await dbReady(db)) return fail2(503, "Forum database is not prepared");
  const url = new URL(req.url), path = url.pathname;
  if ([...url.searchParams.keys()].some((x) => !["topic", "after"].includes(x)) || [...url.searchParams.keys()].some((x) => url.searchParams.getAll(x).length !== 1)) return fail2(400, "Invalid filters");
  const topic = url.searchParams.get("topic");
  if (topic && !TOPICS.has(topic)) return fail2(400, "Invalid topic");
  const after = decodeCursor(url.searchParams.get("after"));
  if (after === false) return fail2(400, "Invalid cursor");
  const item = path.match(/^\/api\/v1\/community\/threads\/([a-f0-9-]{36})$/);
  const reply = path.match(/^\/api\/v1\/community\/threads\/([a-f0-9-]{36})\/replies$/);
  const react = path.match(/^\/api\/v1\/community\/threads\/([a-f0-9-]{36})\/reaction$/);
  const report = path === "/api/v1/community/reports";
  const mine = path === "/api/v1/member/forum-submissions";
  const mineId = path.match(/^\/api\/v1\/member\/forum-submissions\/([a-f0-9-]{36})$/);
  const review = path === "/api/v1/member/forum-review";
  if (!item && !reply && !react && !report && !mine && !mineId && !review && path !== "/api/v1/community/threads") return fail2(404, "Not found");
  if (item && !UUID2.test(item[1]) || reply && !UUID2.test(reply[1]) || react && !UUID2.test(react[1]) || mineId && !UUID2.test(mineId[1])) return fail2(404, "Not found");
  const publicRead = req.method === "GET" && !mine && !mineId && !react && !report && !review;
  if (!publicRead && (!user?.id || user.emailVerified !== true)) return fail2(401, "Sign in with a verified account");
  try {
    if (publicRead) {
      if (topic && path !== "/api/v1/community/threads" || after && path !== "/api/v1/community/threads" && !reply)
        return fail2(400, "Unexpected filters");
      if (!item && !reply && path === "/api/v1/community/threads") {
        const a = [...topic ? [topic] : [], ...after ? [after[0], after[0], after[1]] : []];
        const sql = selectThread + (topic ? " AND t.topic=?" : "") + (after ? " AND (t.published_at<? OR (t.published_at=? AND t.id<?))" : "") + " ORDER BY t.published_at DESC,t.id DESC LIMIT 21";
        const result = await db.prepare(sql).bind(...a).all();
        const rows = result.results.slice(0, 20), last = rows.at(-1);
        return json2({ items: rows.map(threadRow), nextCursor: result.results.length > 20 && last ? encodeCursor(last.published_at, last.id) : null });
      }
      if (item) {
        const row = await db.prepare(selectThread + " AND t.id=?").bind(item[1]).first();
        return row ? json2({ thread: threadRow(row) }) : fail2(404, "Thread is not public");
      }
      if (reply) {
        const parent = await db.prepare(selectThread + " AND t.id=?").bind(reply[1]).first();
        if (!parent) return fail2(404, "Thread is not public");
        const r = await db.prepare(`SELECT r.id,r.body,r.published_at,p.handle,p.display_name,${publicMemberColumns("r.author_id")},
      EXISTS(SELECT 1 FROM member_space_media m WHERE m.user_id=p.user_id AND m.slot='avatar') AS avatar
 FROM member_forum_replies r JOIN member_creator_profiles p ON r.author_id=p.user_id JOIN "user" u ON u.id=p.user_id
      LEFT JOIN member_space_settings s ON s.user_id=p.user_id
      WHERE r.thread_id=? AND r.status='published' AND p.visibility='public' AND u.emailVerified=1
      ${after ? "AND (r.published_at>? OR (r.published_at=? AND r.id>?))" : ""}
      ORDER BY r.published_at ASC,r.id ASC LIMIT 26`).bind(reply[1], ...after ? [after[0], after[0], after[1]] : []).all();
        const visible = r.results.slice(0, 25), last = visible.at(-1);
        return json2({
          items: visible.map((v2) => ({ id: v2.id, body: v2.body, publishedAt: v2.published_at, author: card(v2) })),
          nextCursor: r.results.length > 25 && last ? encodeCursor(last.published_at, last.id) : null
        });
      }
    }
    if (review) {
      const reviewers = [env.CANONICAL_FORUM_REVIEWER_IDS || "", env.CANONICAL_FORUM_ADDITIONAL_REVIEWER_IDS || ""].flatMap((value) => value.split(",").map((x) => x.trim()).filter(Boolean));
      const staff = env.CANONICAL_STAFF_OPS_ENABLED === "true" ? await staffOpsPermission(env, user) : null;
      if (!reviewers.includes(user.id) && !staff) return fail2(403, "Reviewer access required");
      if (req.method === "GET") {
        if (url.search) return fail2(400, "Unexpected filters");
        const [threads, replies, reports] = await Promise.all([
          db.prepare("SELECT t.id,t.topic,t.title,t.body,t.created_at,p.handle,p.display_name FROM member_forum_threads t JOIN member_creator_profiles p ON p.user_id=t.author_id WHERE t.status='pending_review' ORDER BY t.created_at ASC LIMIT 50").all(),
          db.prepare("SELECT r.id,r.thread_id,r.body,r.created_at,p.handle,p.display_name FROM member_forum_replies r JOIN member_creator_profiles p ON p.user_id=r.author_id WHERE r.status='pending_review' ORDER BY r.created_at ASC LIMIT 50").all(),
          db.prepare("SELECT id,target_kind,target_id,reason,created_at FROM member_forum_reports WHERE resolved_at IS NULL ORDER BY created_at ASC LIMIT 50").all()
        ]);
        return json2({ threads: threads.results, replies: replies.results, reports: reports.results });
      }
      if (req.method !== "POST" || url.search) return fail2(405, "Method not allowed");
      const v2 = await payload(req);
      if (!v2 || !permitted(v2, ["targetKind", "targetId", "action"]) || !UUID2.test(v2.targetId) || !["thread", "reply", "report"].includes(v2.targetKind) || !["publish", "reject", "hide", "dismiss_report"].includes(v2.action) || v2.targetKind === "report" !== (v2.action === "dismiss_report"))
        return fail2(400, "Invalid review");
      const auditId = crypto.randomUUID();
      if (v2.targetKind === "report") {
        const results2 = await db.batch([
          db.prepare("UPDATE member_forum_reports SET resolved_at=?,resolution='dismissed',resolved_by=? WHERE id=? AND resolved_at IS NULL").bind(now, user.id, v2.targetId),
          db.prepare("INSERT INTO member_forum_review_log(id,reviewer_id,target_kind,target_id,action,created_at) SELECT ?,?,'report',?,'dismiss_report',? WHERE changes()=1").bind(auditId, user.id, v2.targetId, now)
        ]);
        return results2[0].meta?.changes === 1 ? json2({ ok: true, status: "dismissed" }) : fail2(409, "Report already reviewed");
      }
      const table2 = v2.targetKind === "thread" ? "member_forum_threads" : "member_forum_replies";
      const target = await db.prepare(`SELECT status,author_id FROM ${table2} WHERE id=?`).bind(v2.targetId).first();
      if (!target) return fail2(404, "Not found");
      if (v2.action === "hide" ? target.status !== "published" : target.status !== "pending_review")
        return fail2(409, "Review state changed");
      if (v2.action === "publish") {
        if (target.author_id === user.id) return fail2(403, "Independent review is required");
        const author = await db.prepare("SELECT visibility FROM member_creator_profiles WHERE user_id=?").bind(target.author_id).first();
        if (author?.visibility !== "public") return fail2(409, "Author is not public");
        if (v2.targetKind === "reply") {
          const parent = await db.prepare("SELECT t.status,p.visibility FROM member_forum_replies r JOIN member_forum_threads t ON t.id=r.thread_id JOIN member_creator_profiles p ON p.user_id=t.author_id WHERE r.id=?").bind(v2.targetId).first();
          if (parent?.status !== "published" || parent?.visibility !== "public") return fail2(409, "Parent thread is not public");
        }
      }
      const next = v2.action === "publish" ? "published" : v2.action === "reject" ? "rejected" : "hidden";
      const statements = [
        db.prepare(`UPDATE ${table2} SET status=?,published_at=CASE WHEN ?='published' THEN ? ELSE published_at END,updated_at=?,revision=revision+1 WHERE id=? AND status=?`).bind(next, next, now, now, v2.targetId, target.status),
        db.prepare("INSERT INTO member_forum_review_log(id,reviewer_id,target_kind,target_id,action,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1").bind(auditId, user.id, v2.targetKind, v2.targetId, v2.action, now)
      ];
      if (v2.action === "hide") statements.push(
        db.prepare("UPDATE member_forum_reports SET resolved_at=?,resolution='hidden',resolved_by=? WHERE target_kind=? AND target_id=? AND resolved_at IS NULL AND EXISTS(SELECT 1 FROM member_forum_review_log WHERE id=?)").bind(now, user.id, v2.targetKind, v2.targetId, auditId)
      );
      const results = await db.batch(statements);
      return results[0].meta?.changes === 1 ? json2({ ok: true, status: next }) : fail2(409, "Review state changed");
    }
    if (mine && req.method === "GET") {
      const r = await db.prepare("SELECT id,topic,title,body,status,created_at FROM member_forum_threads WHERE author_id=? ORDER BY created_at DESC LIMIT 30").bind(user.id).all();
      return json2({ items: r.results });
    }
    if (mineId) {
      if (req.method !== "DELETE") return fail2(405, "Method not allowed");
      if (url.search) return fail2(400, "Unexpected filters");
      const withdrawn = await db.prepare("UPDATE member_forum_threads SET status='hidden',updated_at=?,revision=revision+1 WHERE id=? AND author_id=? AND status IN ('pending_review','published') RETURNING id").bind(now, mineId[1], user.id).all();
      if (withdrawn.results?.length === 1) return json2({ ok: true, status: "hidden" });
      const existing2 = await db.prepare("SELECT status FROM member_forum_threads WHERE id=? AND author_id=?").bind(mineId[1], user.id).first();
      return existing2 ? fail2(409, "Thread is already closed") : fail2(404, "Submission not found");
    }
    if (req.method !== "POST" && req.method !== "DELETE" && !(react && req.method === "GET")) return fail2(405, "Method not allowed");
    if (url.search) return fail2(400, "Query unsupported for writes");
    if (report && req.method === "POST") {
      const v2 = await payload(req);
      if (!v2 || !permitted(v2, ["targetKind", "targetId", "reason"]) || !["thread", "reply"].includes(v2.targetKind) || !UUID2.test(v2.targetId) || !["spam", "harassment", "unsafe", "other"].includes(v2.reason)) return fail2(400, "Invalid report");
      const publicTarget = v2.targetKind === "thread" ? await db.prepare(selectThread + " AND t.id=?").bind(v2.targetId).first() : await db.prepare(`SELECT r.id FROM member_forum_replies r
      JOIN member_forum_threads t ON t.id=r.thread_id
      JOIN member_creator_profiles author ON author.user_id=r.author_id
      JOIN member_creator_profiles parent ON parent.user_id=t.author_id
      JOIN "user" a ON a.id=author.user_id JOIN "user" b ON b.id=parent.user_id
      WHERE r.id=? AND r.status='published' AND t.status='published'
      AND author.visibility='public' AND parent.visibility='public'
      AND a.emailVerified=1 AND b.emailVerified=1`).bind(v2.targetId).first();
      if (!publicTarget) return fail2(404, "Content is not public");
      const result = await db.prepare(`INSERT OR IGNORE INTO member_forum_reports
     (id,reporter_id,target_kind,target_id,reason,created_at)
     SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM member_forum_reports
     WHERE reporter_id=? AND created_at>?)<10`).bind(crypto.randomUUID(), user.id, v2.targetKind, v2.targetId, v2.reason, now, user.id, now - 86400).run();
      if (result.meta?.changes === 1) return json2({ ok: true }, 201);
      const old = await db.prepare("SELECT id FROM member_forum_reports WHERE reporter_id=? AND target_kind=? AND target_id=?").bind(user.id, v2.targetKind, v2.targetId).first();
      return old ? json2({ ok: true, previouslyReported: true }) : fail2(429, "Daily report limit reached");
    }
    if (react && ["GET", "POST", "DELETE"].includes(req.method)) {
      if (!await db.prepare(selectThread + " AND t.id=?").bind(react[1]).first()) return fail2(404, "Thread is not public");
      if (req.method === "GET") {
        const mine2 = await db.prepare("SELECT 1 AS found FROM member_forum_reactions WHERE thread_id=? AND user_id=?").bind(react[1], user.id).first();
        return json2({ reacted: Boolean(mine2) });
      }
      if (req.method === "POST") await db.prepare("INSERT OR IGNORE INTO member_forum_reactions(thread_id,user_id,created_at) VALUES(?,?,?)").bind(react[1], user.id, now).run();
      else await db.prepare("DELETE FROM member_forum_reactions WHERE thread_id=? AND user_id=?").bind(react[1], user.id).run();
      return json2({ ok: true });
    }
    if (req.method !== "POST") return fail2(405, "Method not allowed");
    const profile = await db.prepare("SELECT handle,visibility FROM member_creator_profiles WHERE user_id=?").bind(user.id).first();
    if (!profile || profile.visibility !== "public") return fail2(403, "Enable your public member profile before posting");
    const v = await payload(req);
    if (!v || !permitted(v, reply ? ["body", "requestId"] : ["title", "body", "topic", "requestId"]) || !UUID2.test(v.requestId) || typeof v.body !== "string" || CTRL.test(v.body)) return fail2(400, "Invalid submission");
    const body = v.body.trim(), isReply = Boolean(reply);
    if (body.length < (isReply ? 10 : 20) || body.length > (isReply ? 2e3 : 5e3)) return fail2(400, "Invalid message length");
    if (!isReply && (typeof v.title !== "string" || v.title.trim().length < 8 || v.title.trim().length > 120 || CTRL.test(v.title) || !TOPICS.has(v.topic))) return fail2(400, "Invalid thread");
    if (isReply && !await db.prepare(selectThread + " AND t.id=?").bind(reply[1]).first()) return fail2(404, "Thread is not public");
    const table = isReply ? "member_forum_replies" : "member_forum_threads";
    const existing = await db.prepare(`SELECT id,status FROM ${table} WHERE author_id=? AND client_request_id=?`).bind(user.id, v.requestId).first();
    if (existing) return json2({ id: existing.id, status: existing.status, replayed: true });
    const id = crypto.randomUUID(), limit = isReply ? 12 : 4;
    const saved = isReply ? await db.prepare(`INSERT INTO member_forum_replies
    (id,thread_id,author_id,client_request_id,body,created_at,updated_at)
    SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM member_forum_replies WHERE author_id=? AND created_at>?)<?
    ON CONFLICT(author_id,client_request_id) DO NOTHING RETURNING id,status`).bind(id, reply[1], user.id, v.requestId, body, now, now, user.id, now - 3600, limit).all() : await db.prepare(`INSERT INTO member_forum_threads
    (id,author_id,client_request_id,topic,title,body,created_at,updated_at)
    SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM member_forum_threads WHERE author_id=? AND created_at>?)<?
    ON CONFLICT(author_id,client_request_id) DO NOTHING RETURNING id,status`).bind(id, user.id, v.requestId, v.topic, v.title.trim(), body, now, now, user.id, now - 3600, limit).all();
    const inserted = saved.results?.[0];
    if (inserted) return json2({ id: inserted.id, status: inserted.status }, 201);
    const replay = await db.prepare(`SELECT id,status FROM ${table} WHERE author_id=? AND client_request_id=?`).bind(user.id, v.requestId).first();
    return replay ? json2({ id: replay.id, status: replay.status, replayed: true }) : fail2(429, "Community posting limit reached. Try again later");
  } catch {
    return fail2(503, "Community service unavailable");
  }
}
__name(canonicalForums, "canonicalForums");

// staff-portal/worker.mjs
var ORIGIN = "https://anevum.com";
var AUTH_PATH = "/api/v1/member/auth/get-session";
var REVIEW = "/api/v1/member/forum-review";
var HEADERS = {
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow, noarchive",
  "x-frame-options": "DENY",
  "vary": "Cookie"
};
var CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";
var fail3 = /* @__PURE__ */ __name((status, message) => Response.json({ error: message }, { status, headers: { ...HEADERS, "content-type": "application/json" } }), "fail");
var denied = /* @__PURE__ */ __name((req) => {
  const origin = req.headers.get("origin"), site = req.headers.get("sec-fetch-site");
  return origin !== ORIGIN || ![null, "same-origin", "none"].includes(site);
}, "denied");
var safeResponse = /* @__PURE__ */ __name((original) => {
  const headers = new Headers(original.headers);
  for (const [k, v] of Object.entries(HEADERS)) headers.set(k, v);
  headers.delete("access-control-allow-origin");
  headers.delete("access-control-allow-credentials");
  headers.delete("set-cookie");
  return new Response(original.body, { status: original.status, statusText: original.statusText, headers });
}, "safeResponse");
async function getVerifiedUser(request, env) {
  if (!env?.APEX_AUTH || typeof env.APEX_AUTH.fetch !== "function") return null;
  const cookie = request.headers.get("cookie");
  if (!cookie || cookie.length > 8192) return null;
  try {
    const identityRequest = new Request(ORIGIN + AUTH_PATH, {
      method: "GET",
      headers: { cookie, accept: "application/json" },
      redirect:"manual",
      cache: "no-store"
    });
    const response = await env.APEX_AUTH.fetch(identityRequest);
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return null;
    const data = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const session = data.session;
    if (!session || typeof session !== "object" || Array.isArray(session) || typeof session.id !== "string" || session.id.length < 1 || typeof session.expiresAt !== "string") return null;
    const expires = Date.parse(session.expiresAt);
    if (!Number.isFinite(expires) || expires <= Date.now()) return null;
    const user = data.user;
    if (!user || typeof user.id !== "string" || user.id.length < 1 || user.id.length > 128 || user.emailVerified !== true || session.userId !== user.id) return null;
    return { id: user.id, emailVerified: true };
  } catch {
    return null;
  }
}
__name(getVerifiedUser, "getVerifiedUser");
async function apiRequest(request, env, path) {
  if (env?.CANONICAL_STAFF_OPS_ENABLED !== "true") return fail3(404, "Not found");
  if (!["GET", "POST"].includes(request.method)) return fail3(405, "Method not allowed");
  if (request.method === "POST" && denied(request)) return fail3(403, "Same-origin request required");
  const user = await getVerifiedUser(request, env);
  if (!user) return fail3(401, "Verified apex session required");
  try {
    if (path === STAFF_OPS_PATH) return safeResponse(await canonicalStaffOps(request, env, user));
    if (path === REVIEW && env.CANONICAL_FORUM_ENABLED === "true") return safeResponse(await canonicalForums(request, env, user));
    return fail3(404, "Not found");
  } catch {
    return fail3(503, "Staff operation unavailable");
  }
}
__name(apiRequest, "apiRequest");
async function staticRequest(request, env, url) {
  if (!["GET", "HEAD"].includes(request.method)) return fail3(405, "Method not allowed");
  if (env?.CANONICAL_STAFF_OPS_ENABLED !== "true") return fail3(404, "Not found");
  if (!env?.ASSETS?.fetch) return fail3(503, "Staff assets unavailable");
  const path = url.pathname;
  let internal = "/index.html";
  if (path.startsWith("/staff/assets/")) {
    internal = path.slice("/staff".length);
    if (!/^\/assets\/[a-zA-Z0-9_.-]+$/.test(internal)) return fail3(404, "Not found");
  } else if (path !== "/staff" && path !== "/staff/") return fail3(404, "Not found");
  const assetURL = new URL(request.url);
  assetURL.pathname = internal;
  assetURL.search = "";
  const response = await env.ASSETS.fetch(new Request(assetURL, {
    method: request.method,
    headers: { accept: request.headers.get("accept") || "*/*" }
  }));
  if (!response.ok) return fail3(404, "Not found");
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  headers.set("x-frame-options", "DENY");
  if (internal === "/index.html") {
    headers.set("content-security-policy", CSP);
    headers.set("permissions-policy", "camera=(self), microphone=(self), geolocation=(), payment=()");
    headers.set("cache-control", "private, no-store");
    headers.set("vary", "Cookie");
  } else headers.set("cache-control", "public, max-age=86400, immutable");
  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(staticRequest, "staticRequest");
function createIrenApexStaffWorker() {
  return { async fetch(request, env) {
    let url;
    try {
      url = new URL(request.url);
    } catch {
      return fail3(404, "Not found");
    }
    if (url.origin !== ORIGIN || url.protocol !== "https:" || url.username || url.password)
      return fail3(404, "Not found");
    if (url.pathname === STAFF_OPS_PATH || url.pathname === REVIEW) return apiRequest(request, env, url.pathname);
    return staticRequest(request, env, url);
  } };
}
__name(createIrenApexStaffWorker, "createIrenApexStaffWorker");
var worker_default = createIrenApexStaffWorker();
export {
  createIrenApexStaffWorker,
  worker_default as default
};
//# sourceMappingURL=worker.js.map

