"""Build the isolated existing Cloudflare portfolio Worker from exact static assets."""
import base64
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
types = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8"}
files = {}
for path in sorted(DIST.rglob("*")):
    if not path.is_file():
        continue
    payload = path.read_bytes()
    files["/" + path.relative_to(DIST).as_posix()] = {"data": base64.b64encode(payload).decode(), "mime": types[path.suffix], "etag": '"' + hashlib.sha256(payload).hexdigest()[:24] + '"'}

worker = "const FILES=" + json.dumps(files, separators=(",", ":")) + ";\n" + r'''
const HOST = 'portfolio.anevum.com';
const VERSION = 'portfolio-cinematic-2026-10-13-v2';
const SECURITY = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; upgrade-insecure-requests",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'X-Portfolio-Version': VERSION,
  'Strict-Transport-Security': 'max-age=31536000'
};
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if(url.hostname !== HOST) return new Response('Not found', {status:404, headers:SECURITY});
    if(!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed', {status:405, headers:{...SECURITY, Allow:'GET, HEAD'}});
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    if(path === '/robots.txt') return new Response(request.method === 'HEAD' ? null : 'User-agent: *\nAllow: /\nSitemap: https://portfolio.anevum.com/sitemap.xml\n', {headers:{...SECURITY,'Content-Type':'text/plain; charset=utf-8'}});
    if(path === '/sitemap.xml') return new Response(request.method === 'HEAD' ? null : '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://portfolio.anevum.com/</loc></url></urlset>', {headers:{...SECURITY,'Content-Type':'application/xml; charset=utf-8'}});
    const file = FILES[path];
    if(!file) return new Response('Not found', {status:404, headers:SECURITY});
    const headers = {...SECURITY,'Content-Type':file.mime,ETag:file.etag,'Cache-Control':path === '/index.html' ? 'no-cache' : 'public, max-age=3600'};
    if(request.headers.get('If-None-Match')===file.etag) return new Response(null,{status:304,headers});
    if(request.method==='HEAD') return new Response(null,{headers});
    const bytes = Uint8Array.from(atob(file.data), char=>char.charCodeAt(0));
    return new Response(bytes, {headers});
  }
};
'''
(ROOT / "worker.mjs").write_text(worker)
print(json.dumps({"files": len(files), "worker_bytes": len(worker.encode()), "worker_sha256": hashlib.sha256(worker.encode()).hexdigest()}))
