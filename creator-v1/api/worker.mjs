// ANEVUM V1 read-only public catalogue. No legacy database or broker access.
const API_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const CATEGORIES = new Set(['tools', 'games', 'automation', 'research', 'creative', 'learning', 'libraries', 'other']);
const ID = /^[A-Za-z0-9_-]{1,80}$/;
// Use exactly the same visibility predicate for lists, counts and details.
const PUBLIC_FROM = "FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.status='published' AND c.status='active' AND julianday(p.published_at)<=julianday('now')";
const FIELDS = 'p.id,p.slug,p.title,p.summary,p.category,p.source_url AS sourceUrl,p.demo_url AS demoUrl,p.free_to_use AS freeToUse,p.license_name AS license,p.published_at AS publishedAt,c.handle AS creatorHandle,c.display_name AS creatorName';
function reply(request, data, status = 200, extra = {}) {
  return new Response(request.method === 'HEAD' ? null : JSON.stringify(data), { status, headers: { ...API_HEADERS, ...extra } });
}
export function safePublicUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return null;
    const h = u.hostname.toLowerCase();
    if (!h.includes('.') || /^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(':') || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(h)) return null;
    for (const k of u.searchParams.keys()) if (/^(?:token|access_token|api_key|secret|password)$/i.test(k)) return null;
    return u.href;
  } catch { return null; }
}
// Only public repository metadata is read. This never clones or executes code,
// follows redirects, forwards visitor credentials, or fetches a creator's app.
const repositoryCache = new Map();
function githubSource(value) {
  if (typeof value !== 'string' || value.length > 250 || /[\s\\]/.test(value)) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.hostname !== 'github.com' || u.port || u.username || u.password || u.search || u.hash) return null;
    const m = /^\/([A-Za-z0-9][A-Za-z0-9-]{0,38})\/([A-Za-z0-9_.-]{1,100})\/?$/.exec(u.pathname);
    if (!m) return null;
    const name = m[2].replace(/\.git$/, '');
    if (!name || name === '.' || name === '..') return null;
    return 'https://github.com/' + m[1] + '/' + name;
  } catch { return null; }
}
function repositoryText(value, max) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
}
async function readRepository(source) {
  const key = source.toLowerCase(), now = Date.now(), cached = repositoryCache.get(key);
  if (cached && cached.until > now) {
    if (!cached.metadata) throw new Error('Repository retry cooldown');
    return cached.metadata;
  }
  // Reserve a short cooldown before the fetch: repeated clicks and upstream
  // failures cannot create an unbounded burst from the same Worker isolate.
  repositoryCache.delete(key);
  while (repositoryCache.size >= 128) repositoryCache.delete(repositoryCache.keys().next().value);
  repositoryCache.set(key, { until: now + 60000, metadata: null });
  const response = await fetch('https://api.github.com/repos' + new URL(source).pathname, {
    method: 'GET', redirect: 'error', credentials: 'omit',
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ANEVUM-Creator-V1' },
    signal: AbortSignal.timeout(4500), cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!response.ok) throw new Error('Public repository unavailable');
  const type = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  if (type !== 'application/json' && type !== 'application/vnd.github+json') throw new Error('Unexpected repository content');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty repository response');
  let total = 0, chunks = 0; const parts = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength; chunks++;
      if (total > 32768 || chunks > 1024) { await reader.cancel(); throw new Error('Repository response too large'); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  const repo = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  const expected = new URL(source).pathname.slice(1).toLowerCase();
  if (!repo || typeof repo !== 'object' || Array.isArray(repo) || repo.private !== false ||
    typeof repo.full_name !== 'string' || repo.full_name.toLowerCase() !== expected ||
    String(githubSource(repo.html_url) || '').toLowerCase() !== key) throw new Error('Repository identity mismatch');
  const license = repositoryText(repo.license?.spdx_id, 80);
  const metadata = { provider: 'github', sourceUrl: source, fullName: repositoryText(repo.full_name, 140),
    description: repositoryText(repo.description, 500), language: repositoryText(repo.language, 60) || null,
    license: license && license !== 'NOASSERTION' ? license : null, archived: repo.archived === true,
    observedAt: new Date().toISOString(), ownershipVerified: false,
    notice: 'Public metadata only. This is not a connected GitHub account or proof of publishing rights.' };
  // Bounded, best-effort per-isolate caching. Public visibility is still checked
  // against COMMUNITY_DB on EVERY request, including a cache hit.
  repositoryCache.delete(key);
  while (repositoryCache.size >= 128) repositoryCache.delete(repositoryCache.keys().next().value);
  repositoryCache.set(key, { until: Date.now() + 300000, metadata });
  return metadata;
}

function projectDto(row) {
  const item = {};
  for (const key of ['id', 'slug', 'title', 'summary', 'category', 'license', 'publishedAt', 'creatorHandle', 'creatorName']) item[key] = row[key] ?? null;
  item.sourceUrl = safePublicUrl(row.sourceUrl);
  item.demoUrl = safePublicUrl(row.demoUrl);
  item.freeToUse = row.freeToUse === 1;
  if (Object.hasOwn(row, 'description')) {
    item.description = row.description;
    item.aiDisclosure = row.aiDisclosure;
    item.humanContribution = row.humanContribution;
  }
  return item;
}
async function rows(db, sql, params = []) {
  const statement = db.prepare(sql);
  const result = await (params.length ? statement.bind(...params) : statement).all();
  if (result.success === false || !Array.isArray(result.results)) throw new Error('Query failed');
  return result.results;
}
function parameters(url) {
  const allowed = new Set(['category', 'q', 'cursor', 'limit']);
  for (const key of url.searchParams.keys()) if (!allowed.has(key) || url.searchParams.getAll(key).length !== 1) throw new Error('Invalid or repeated parameter');
  const category = url.searchParams.get('category') || '';
  const q = (url.searchParams.get('q') || '').trim();
  const cursor = url.searchParams.get('cursor') || '';
  const text = url.searchParams.get('limit') ?? '24';
  if (category && !CATEGORIES.has(category)) throw new Error('Invalid category');
  if (q.length > 100 || /[\u0000-\u001f\u007f]/u.test(q)) throw new Error('Invalid search');
  if (cursor && !ID.test(cursor)) throw new Error('Invalid cursor');
  if (!/^[1-9]\d?$/.test(text) || Number(text) > 48) throw new Error('Limit must be 1 through 48');
  return { category, q, cursor, limit: Number(text) };
}
export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url), path = url.pathname;
    if (!['GET', 'HEAD'].includes(request.method)) return reply(request, { error: 'Read-only release. Account and publishing features are not enabled.' }, 405, { Allow: 'GET, HEAD' });
    const detail = /^\/api\/v1\/projects\/([A-Za-z0-9_-]{1,80})$/.exec(path);
    const repository = /^\/api\/v1\/projects\/([A-Za-z0-9_-]{1,80})\/repository$/.exec(path);
    const known = ['/health', '/api/v1/status', '/api/v1/categories', '/api/v1/projects'].includes(path) || detail || repository;
    if (!known) return reply(request, { error: 'Not found' }, 404);
    let filter;
    try {
      if (path === '/api/v1/projects') filter = parameters(url);
      else if (url.search) throw new Error('This endpoint does not accept query parameters');
    } catch (error) { return reply(request, { error: error.message }, 400); }
    if (!env.COMMUNITY_DB) return reply(request, { error: 'Community data is unavailable', status: 'unavailable' }, 503);
    try {
      if (path === '/health') {
        await rows(env.COMMUNITY_DB, 'SELECT 1 AS ready');
        return reply(request, { service: 'anevum-creator-v1', status: 'ok', mode: 'read-only', version: '0.1.0' });
      }
      if (path === '/api/v1/status') {
        const [totals] = await rows(env.COMMUNITY_DB, 'SELECT COUNT(*) AS projects,COUNT(DISTINCT c.member_id) AS creators ' + PUBLIC_FROM);
        return reply(request, { version: '0.1.0', phase: 'read-only-development', counts: { publishedProjects: totals.projects, publishedCreators: totals.creators }, features: { discovery: true, repositoryMetadata: true, accounts: false, publishing: false, voting: false, xp: false, community: false } });
      }
      if (path === '/api/v1/categories') {
        return reply(request, { categories: await rows(env.COMMUNITY_DB, 'SELECT p.category,COUNT(*) AS count ' + PUBLIC_FROM + ' GROUP BY p.category ORDER BY p.category') });
      }
      if (repository) {
        const found = await rows(env.COMMUNITY_DB, 'SELECT p.source_url AS sourceUrl ' + PUBLIC_FROM + ' AND p.id=? LIMIT 1', [repository[1]]);
        if (!found.length) return reply(request, { error: 'Project not found' }, 404);
        const source = githubSource(found[0].sourceUrl);
        if (!source) return reply(request, { error: 'This project does not link a supported public GitHub repository' }, 422);
        try { return reply(request, { repository: await readRepository(source) }); }
        catch { return reply(request, { error: 'GitHub metadata is unavailable. The project listing is still available.' }, 503, { 'Retry-After': '60' }); }
      }
      if (detail) {
        const found = await rows(env.COMMUNITY_DB, 'SELECT ' + FIELDS + ',p.description,p.ai_disclosure AS aiDisclosure,p.human_contribution AS humanContribution ' + PUBLIC_FROM + ' AND p.id=? LIMIT 1', [detail[1]]);
        return found.length ? reply(request, { item: projectDto(found[0]) }) : reply(request, { error: 'Project not found' }, 404);
      }
      let sql = 'SELECT ' + FIELDS + ' ' + PUBLIC_FROM + ' AND p.id>?';
      const args = [filter.cursor];
      if (filter.category) { sql += ' AND p.category=?'; args.push(filter.category); }
      if (filter.q) {
        sql += " AND (p.title LIKE ? ESCAPE '\\' OR p.summary LIKE ? ESCAPE '\\')";
        const pattern = '%' + filter.q.replace(/[\\%_]/g, '\\$&') + '%'; args.push(pattern, pattern);
      }
      sql += ' ORDER BY p.id ASC LIMIT ?'; args.push(filter.limit + 1);
      const found = await rows(env.COMMUNITY_DB, sql, args), items = found.slice(0, filter.limit).map(projectDto);
      return reply(request, { items, nextCursor: found.length > filter.limit ? items.at(-1).id : null, count: items.length });
    } catch { return reply(request, { error: 'Community data is temporarily unavailable', status: 'unavailable' }, 503); }
  }
};
