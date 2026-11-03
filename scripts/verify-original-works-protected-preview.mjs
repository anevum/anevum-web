/**
 * Negative-access smoke test for an owner-only Anevum Workers Preview.
 *
 * This is intentionally anonymous: it checks the preview is NOT publicly
 * readable. It never authenticates, follows login redirects, reads response
 * bodies, or changes Cloudflare state. It does not establish that the owner
 * can render or approve the site; that review is a separate release gate.
 *
 * Run only after verify-original-works-hosted-access.mjs has checked the
 * exact Worker, Access destination and owner-only policy, and Wrangler has
 * returned a Preview URL. Never substitute a version URL or production URL.
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const HOST_SUFFIX = '-anevum-web-nextgen.devonakins.workers.dev';
const ACCESS_HOST_SUFFIX = '.cloudflareaccess.com';
export const REVIEW_PATHS = Object.freeze([
  '/',
  '/design/original-works',
  '/design/original-works/wiki',
  '/design/original-works/wiki/ovara',
  '/design/original-works/reply/reading-room',
  '/stories/reply',
  '/api/command/trader/status',
  '/sitemap.xml',
]);

/** Only a named Preview for the pinned Anevum website Worker is acceptable. */
export function parsePreviewOrigin(rawUrl) {
  let parsed;
  try { parsed = new URL(rawUrl); } catch { throw new Error('INVALID_OWNER_PREVIEW_ORIGIN'); }
  const host = parsed.hostname.toLowerCase();
  const name = host.endsWith(HOST_SUFFIX) ? host.slice(0, -HOST_SUFFIX.length) : '';
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
      parsed.port || parsed.pathname !== '/' || parsed.search || parsed.hash ||
      name.length < 2 || name.length > 63 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error('INVALID_OWNER_PREVIEW_ORIGIN');
  }
  return parsed.origin;
}

/** An anonymous request must hit Access, not the preview application. */
export function assertAnonymousAccessDenial({ status, location, requestUrl, expectedOrigin }) {
  if (status === 401 || status === 403) return;
  if (![301, 302, 303, 307, 308].includes(status) || !location) {
    throw new Error('PREVIEW_ROUTE_NOT_ACCESS_PROTECTED');
  }
  let target;
  try { target = new URL(location, requestUrl); }
  catch { throw new Error('PREVIEW_ROUTE_NOT_ACCESS_PROTECTED'); }
  const loginPath = target.pathname === '/cdn-cgi/access/login' ||
    target.pathname.startsWith('/cdn-cgi/access/login/');
  const accessHost = target.hostname.endsWith(ACCESS_HOST_SUFFIX);
  const sameOrigin = target.origin === expectedOrigin;
  if (target.protocol !== 'https:' || !loginPath || !(accessHost || sameOrigin)) {
    throw new Error('PREVIEW_ROUTE_NOT_ACCESS_PROTECTED');
  }
}

export async function probeProtectedPreview(rawUrl, fetchImpl = fetch) {
  const origin = parsePreviewOrigin(rawUrl);
  const results = [];
  for (const path of REVIEW_PATHS) {
    const requestUrl = origin + path;
    let response;
    try {
      response = await fetchImpl(requestUrl, {
        method: 'GET',
        redirect: 'manual',
        credentials: 'omit',
        headers: { Accept: 'text/html', 'Cache-Control': 'no-store' },
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error('PREVIEW_ACCESS_CHECK_UNAVAILABLE');
    }
    try {
      assertAnonymousAccessDenial({
        status: response?.status,
        location: response?.headers?.get?.('location'),
        requestUrl,
        expectedOrigin: origin,
      });
    } finally {
      if (response?.body?.cancel) await response.body.cancel();
    }
    results.push({ path, status: response.status });
  }
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const results = await probeProtectedPreview(process.env.BASE_URL || '');
    for (const entry of results) console.log('PROTECTED_PREVIEW ' + entry.path + ': ' + entry.status);
    console.log('OWNER_ONLY_ANONYMOUS_DENIAL_PASS: ' + results.length + ' routes; authenticated visual review remains pending.');
  } catch (e) {
    // Do not disclose a URL, account identifier, Access policy or response body.
    const code = [
      'INVALID_OWNER_PREVIEW_ORIGIN',
      'PREVIEW_ROUTE_NOT_ACCESS_PROTECTED',
      'PREVIEW_ACCESS_CHECK_UNAVAILABLE',
    ].includes(e?.message) ? e.message : 'PREVIEW_ACCESS_CHECK_UNAVAILABLE';
    console.error('Hosted review BLOCKED: ' + code);
    process.exitCode = 1;
  }
}
