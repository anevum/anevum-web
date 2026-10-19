import { PAGE, STYLES, CLIENT } from './ui.mjs';

const ORIGIN = 'https://anevum.com';
const BASE = '/staff/observatory';
const AURAS = new Set(['none', 'aurora', 'eclipse', 'ember', 'nebula', 'transcosmic']);
const HEADERS = Object.freeze({
  'cache-control': 'private, no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'referrer-policy': 'no-referrer',
  'vary': 'Cookie',
});
const CSP = [
  "default-src 'none'", "script-src 'self'", "style-src 'self'",
  "connect-src 'self'", "img-src 'self' data:", "font-src 'self'",
  "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'",
  "object-src 'none'",
].join('; ');

function respond(body, status = 200, contentType = 'application/json; charset=utf-8', isPage = false) {
  const headers = { ...HEADERS, 'content-type': contentType };
  if (isPage) headers['content-security-policy'] = CSP;
  return new Response(body, { status, headers });
}
const json = (value, status = 200) => respond(JSON.stringify(value), status);
const error = (status, message) => json({ error: message }, status);

async function getStaff(request, env) {
  if (!env || !env.APEX_AUTH || !env.MEMBER_DB) return null;
  const cookie = request.headers.get('cookie');
  if (!cookie || cookie.length > 8192) return null;
  try {
    const identity = new Request(`${ORIGIN}/api/v1/member/auth/get-session`, {
      method: 'GET',
      headers: { cookie, accept: 'application/json' },
      redirect: 'manual',
      cache: 'no-store',
    });
    const result = await env.APEX_AUTH.fetch(identity);
    if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) return null;
    const { session, user } = await result.json();
    if (!session || !user || typeof user.id !== 'string' || user.id.length < 1 || user.id.length > 128 ||
        typeof session.id !== 'string' || session.id.length === 0 ||
        session.userId !== user.id || user.emailVerified !== true ||
        typeof session.expiresAt !== 'string' || !Number.isFinite(Date.parse(session.expiresAt)) ||
        Date.parse(session.expiresAt) <= Date.now()) return null;
    const grant = await env.MEMBER_DB.prepare(
      'SELECT g.role FROM staff_access_grants g JOIN "user" u ON u.id=g.member_id ' +
      'WHERE g.member_id=? AND g.revoked_at IS NULL AND u.emailVerified=1 LIMIT 1'
    ).bind(user.id).first();
    if (!grant || !['owner', 'reviewer'].includes(grant.role)) return null;
    return { id: user.id, role: grant.role };
  } catch {
    return null;
  }
}

async function overview(db, staff) {
  const [summary, registrations] = await Promise.all([
    db.prepare(`SELECT
      (SELECT COUNT(*) FROM "user") AS members,
      (SELECT COUNT(*) FROM "user" WHERE emailVerified=1) AS verified,
      (SELECT COUNT(*) FROM "user" WHERE julianday(createdAt)>=julianday('now','-7 days')) AS new7d,
      (SELECT COUNT(DISTINCT userId) FROM session) AS sessionMembers,
      (SELECT COUNT(*) FROM member_xp_events) AS xpEvents,
      (SELECT COUNT(DISTINCT user_id) FROM member_xp_events) AS xpTesters,
      (SELECT COUNT(*) FROM member_forum_threads) AS threads,
      (SELECT COUNT(*) FROM member_forum_replies) AS replies,
      (SELECT COUNT(*) FROM member_wall_posts) AS wallPosts,
      (SELECT COUNT(*) FROM anevum_alpha_project_votes) AS projectVotes,
      (SELECT COUNT(*) FROM anevum_alpha_project_comments) AS projectComments,
      (SELECT COUNT(*) FROM anevum_alpha_project_saves) AS projectSaves,
      (SELECT COUNT(*) FROM member_recognition_grants WHERE revoked_at IS NULL) AS recognitions,
      (SELECT COUNT(*) FROM anevum_alpha_projects WHERE status='published') AS publishedProjects,
      (SELECT COUNT(*) FROM anevum_alpha_projects WHERE status='pending_review') AS pendingProjects,
      (SELECT COUNT(*) FROM member_forum_threads WHERE status='pending_review')+
      (SELECT COUNT(*) FROM member_forum_replies WHERE status='pending_review') AS pendingForum,
      (SELECT COUNT(*) FROM anevum_alpha_project_reports WHERE status='pending') AS projectReports,
      (SELECT COUNT(*) FROM member_forum_reports WHERE resolved_at IS NULL) AS forumReports
    `).first(),
    db.prepare(`SELECT substr(createdAt,1,10) AS day, COUNT(*) AS n
      FROM "user" WHERE julianday(createdAt)>=julianday('now','-7 days')
      GROUP BY day ORDER BY day ASC LIMIT 8`).all(),
  ]);
  const counts = summary || {};
  counts.pendingTotal = (counts.pendingProjects || 0) + (counts.pendingForum || 0) +
    (counts.projectReports || 0) + (counts.forumReports || 0);
  return json({
    role: staff.role,
    counts,
    signups: registrations.results || [],
    checkedAt: new Date().toISOString(),
    visitors: { status: 'unavailable', reason: 'Browser visitor analytics not yet connected to IREN' },
  });
}

async function members(db, staff, url) {
  if (staff.role !== 'owner') return error(403, 'Owner clearance required');
  const allowed = new Set(['q', 'page']);
  const params = url.searchParams;
  if ([...params.keys()].some(k => !allowed.has(k) || params.getAll(k).length !== 1))
    return error(400, 'Unrecognized member search filters');
  const q = (params.get('q') || '').trim();
  const pageString = params.get('page') || '0';
  if (q.length > 64 || /[\x00-\x1f\x7f]/.test(q) ||
      !/^(0|[1-9][0-9]{0,3})$/.test(pageString) || Number(pageString) > 1000)
    return error(400, 'Invalid member search');
  const page = Number(pageString);
  const pageSize = 50;
  const from = `FROM "user" u LEFT JOIN member_creator_profiles p ON p.user_id=u.id`;
  const where = q ? `WHERE instr(lower(u.name),lower(?))>0 OR
    instr(lower(u.email),lower(?))>0 OR
    instr(lower(COALESCE(p.display_name,'')),lower(?))>0 OR
    instr(lower(COALESCE(p.handle,'')),lower(?))>0` : '';
  const filter = q ? [q,q,q,q] : [];
  const countQuery = db.prepare(`SELECT COUNT(*) AS total ${from} ${where}`);
  const totalResult = q ? await countQuery.bind(...filter).first() : await countQuery.first();
  const total = Number(totalResult?.total || 0);
  const resolvedPage = Math.min(page,Math.max(0,Math.ceil(total/pageSize)-1));
  const result = await db.prepare(`SELECT u.id,u.name,u.email,u.createdAt,u.emailVerified,
    COALESCE(p.display_name,'') AS displayName,COALESCE(p.handle,'') AS handle,
    COALESCE(g.role,'member') AS role,COALESCE(ap.aura,'none') AS aura,
    COALESCE(ap.revision,0) AS auraRevision,
    (SELECT MAX(s.updatedAt) FROM session s WHERE s.userId=u.id) AS lastSessionUpdate,
    (SELECT COUNT(*) FROM session s WHERE s.userId=u.id) AS sessionCount,
    COALESCE(x.testEvents,0) AS testEvents,COALESCE(x.testXp,0) AS testXp,
    COALESCE((SELECT GROUP_CONCAT(r.recognition_id,', ') FROM member_recognition_grants r
      WHERE r.user_id=u.id AND r.revoked_at IS NULL),'') AS recognitions
    FROM "user" u
    LEFT JOIN member_creator_profiles p ON p.user_id=u.id
    LEFT JOIN staff_access_grants g ON g.member_id=u.id AND g.revoked_at IS NULL
    LEFT JOIN member_recognition_preferences ap ON ap.user_id=u.id
    LEFT JOIN (SELECT user_id, COUNT(*) AS testEvents, SUM(amount) AS testXp
      FROM member_xp_events GROUP BY user_id) x ON x.user_id=u.id
    ${where} ORDER BY u.createdAt DESC, u.id DESC LIMIT ? OFFSET ?`)
    .bind(...filter,pageSize,resolvedPage*pageSize).all();
  return json({ members: result.results || [], total, page:resolvedPage, pageSize,
    hasNext: (page+1)*pageSize < total });
}

async function rewards(db, staff) {
  if (staff.role !== 'owner') return error(403, 'Owner clearance required');
  const [awards, auras] = await Promise.all([
    db.prepare(`SELECT kind, recognition_id AS id, COUNT(*) AS earned
      FROM member_recognition_grants WHERE revoked_at IS NULL
      GROUP BY kind,recognition_id ORDER BY earned DESC,kind,id LIMIT 60`).all(),
    db.prepare(`SELECT aura,COUNT(*) AS members FROM member_recognition_preferences
      GROUP BY aura ORDER BY members DESC,aura`).all(),
  ]);
  return json({ awards: awards.results || [], auras: auras.results || [] });
}

async function audits(db, staff) {
  if (staff.role !== 'owner') return error(403, 'Owner clearance required');
  const result = await db.prepare(`SELECT x.action,x.actor,x.target,x.createdAt FROM (
    SELECT a.action,COALESCE(actor.name,'STAFF') AS actor,
      COALESCE(target.name,'MEMBER') AS target,a.created_at AS createdAt
      FROM staff_access_audit a LEFT JOIN "user" actor ON actor.id=a.actor_id
      LEFT JOIN "user" target ON target.id=a.member_id
    UNION ALL
    SELECT b.action,COALESCE(actor.name,'STAFF'),
      COALESCE(target.name,'MEMBER'),b.created_at
      FROM anevum_staff_management_audit b LEFT JOIN "user" actor ON actor.id=b.actor_id
      LEFT JOIN "user" target ON target.id=b.member_id
  ) x ORDER BY createdAt DESC LIMIT 60`).all();
  return json({ entries: result.results || [] });
}

async function readBoundedBody(request, maxBytes) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(total);
    let cursor = 0;
    for (const chunk of chunks) { merged.set(chunk,cursor); cursor += chunk.byteLength; }
    return new TextDecoder('utf-8',{fatal:true}).decode(merged);
  } catch { return null; }
  finally { reader.releaseLock(); }
}

async function changeAura(request, db, staff) {
  if (staff.role !== 'owner') return error(403, 'Owner clearance required');
  if (request.headers.get('origin') !== ORIGIN ||
      ![null, 'same-origin', 'none'].includes(request.headers.get('sec-fetch-site')))
    return error(403, 'Same-origin request required');
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || ''))
    return error(415, 'JSON required');
  const declaredSize = Number(request.headers.get('content-length') || '0');
  if (!Number.isSafeInteger(declaredSize) || declaredSize < 0 || declaredSize > 1400)
    return error(413, 'Request too large');
  const raw = await readBoundedBody(request, 1200);
  if (raw === null) return error(413, 'Request too large');
  let data;
  try { data = JSON.parse(raw); } catch { return error(400, 'Invalid JSON'); }
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      Object.keys(data).sort().join(',') !== 'aura,memberId,revision' ||
      typeof data.memberId !== 'string' || !data.memberId || data.memberId.length > 128 ||
      !AURAS.has(data.aura) || !Number.isInteger(data.revision) ||
      data.revision < 0 || data.revision > 100000)
    return error(400, 'Invalid aura change');

  const recent = await db.prepare(`SELECT COUNT(*) AS n FROM anevum_staff_management_audit
    WHERE actor_id=? AND created_at>=unixepoch('now')-3600`).bind(staff.id).first();
  if (Number(recent?.n || 0) >= 20) return error(429, 'Hourly management limit reached');
  const previous = await db.prepare(`SELECT u.id,COALESCE(p.aura,'none') AS aura,
    COALESCE(p.revision,0) AS revision,
    CASE WHEN p.user_id IS NULL THEN 0 ELSE 1 END AS hasPreferences
    FROM "user" u LEFT JOIN member_recognition_preferences p ON p.user_id=u.id
    WHERE u.id=?`).bind(data.memberId).first();
  if (!previous) return error(404, 'Unknown member');
  if (Number(previous.revision) !== data.revision) return error(409, 'Member changed. Refresh first');
  if (previous.aura === data.aura) return json({ ok: true, unchanged: true });

  const now = Math.floor(Date.now() / 1000);
  const change = previous.hasPreferences
    ? db.prepare(`UPDATE member_recognition_preferences SET aura=?,revision=revision+1
       WHERE user_id=? AND revision=? AND aura<>?`)
       .bind(data.aura,data.memberId,data.revision,data.aura)
    : db.prepare(`INSERT INTO member_recognition_preferences(user_id,aura,revision)
       SELECT ?,?,1 WHERE EXISTS(SELECT 1 FROM "user" WHERE id=?)`)
       .bind(data.memberId,data.aura,data.memberId);
  const record = db.prepare(`INSERT INTO anevum_staff_management_audit
    (id,actor_id,member_id,action,old_value,new_value,created_at)
    SELECT ?,?,?,'aura-set',?,?,? WHERE changes()=1`)
    .bind(crypto.randomUUID(),staff.id,data.memberId,previous.aura,data.aura,now);
  const outcome = await db.batch([change,record]);
  if (outcome[0]?.meta?.changes !== 1 || outcome[1]?.meta?.changes !== 1)
    return error(409, 'Aura change not applied');
  return json({ ok: true, aura: data.aura });
}

export default {
  async fetch(request, env) {
    let url;
    try { url = new URL(request.url); } catch { return error(404, 'Not found'); }
    if (url.origin !== ORIGIN || url.protocol !== 'https:' || url.username || url.password ||
        ![BASE,`${BASE}/`,`${BASE}/app.js`,`${BASE}/styles.css`,
          `${BASE}/api/overview`,`${BASE}/api/members`,`${BASE}/api/rewards`,
          `${BASE}/api/audit`,`${BASE}/api/aura`].includes(url.pathname))
      return error(404, 'Not found');
    if (url.search && !(request.method === 'GET' && url.pathname === `${BASE}/api/members`))
      return error(400, 'Unexpected query');
    if (!['GET', 'POST'].includes(request.method)) return error(405, 'Method not allowed');
    const staff = await getStaff(request, env);
    if (!staff) return error(401, 'Valid staff session required');
    if (request.method === 'GET') {
      if (url.pathname === BASE || url.pathname === `${BASE}/`)
        return respond(PAGE, 200, 'text/html; charset=utf-8', true);
      if (url.pathname === `${BASE}/app.js`)
        return respond(CLIENT, 200, 'application/javascript; charset=utf-8');
      if (url.pathname === `${BASE}/styles.css`)
        return respond(STYLES, 200, 'text/css; charset=utf-8');
      try {
        switch(url.pathname) {
          case `${BASE}/api/overview`: return await overview(env.MEMBER_DB, staff);
          case `${BASE}/api/members`: return await members(env.MEMBER_DB, staff, url);
          case `${BASE}/api/rewards`: return await rewards(env.MEMBER_DB, staff);
          case `${BASE}/api/audit`: return await audits(env.MEMBER_DB, staff);
          default: return error(405, 'Method not allowed');
        }
      } catch { return error(503, 'Observatory data unavailable'); }
    }
    if (url.pathname !== `${BASE}/api/aura`) return error(405, 'Method not allowed');
    try { return await changeAura(request, env.MEMBER_DB, staff); }
    catch { return error(503, 'Management action unavailable'); }
  },
};