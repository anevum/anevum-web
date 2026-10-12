import api from '../api/worker.mjs';
import { PAGE, STYLES, CLIENT, ASSETS, BRAND_FAVICON } from './generated.mjs';
const BASE = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };
const CSP = "default-src 'none'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; font-src 'self'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests";
function output(request, body, type, status = 200, extra = {}) {
  return new Response(request.method === 'HEAD' ? null : body, { status, headers: { ...BASE, 'Content-Type': type, ...extra } });
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/health' || path.startsWith('/api/')) return api.fetch(request, env);
    if (!['GET', 'HEAD'].includes(request.method)) return output(request, 'Read-only release', 'text/plain; charset=utf-8', 405, { Allow: 'GET, HEAD' });
    const shellRoute = path === '/' || path === '/index.html' || ['/discover','/creators','/create','/community','/library','/account','/about','/status'].includes(path) || /^\/projects\/[A-Za-z0-9_-]{1,80}$/.test(path) || /^\/creators\/[A-Za-z][A-Za-z0-9_]{2,29}$/.test(path);
    if (shellRoute) return output(request, PAGE, 'text/html; charset=utf-8', 200, { 'Content-Security-Policy': CSP });
    if (path === '/favicon.svg') return output(request, BRAND_FAVICON, 'image/svg+xml; charset=utf-8');
    if (path === '/styles.css') return output(request, STYLES, 'text/css; charset=utf-8');
    if (path === '/client.mjs') return output(request, CLIENT, 'text/javascript; charset=utf-8');
    if (path === '/robots.txt') return output(request, 'User-agent: *\nDisallow: /\n', 'text/plain; charset=utf-8');
    const asset = /^\/assets\/([a-z0-9-]+\.webp)$/.exec(path);
    if (asset && Object.hasOwn(ASSETS, asset[1])) return output(request, Uint8Array.from(atob(ASSETS[asset[1]]), c => c.charCodeAt(0)), 'image/webp', 200, { 'Cache-Control': 'public, max-age=3600' });
    return output(request, 'Not found', 'text/plain; charset=utf-8', 404);
  }
};
