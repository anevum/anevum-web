import { assetMime, safeAssetPath } from "./archive.mjs";
import { verifyPreview } from "./tokens.mjs";

/* Read-only, cookieless runtime. Deploy ONLY on an isolated executable-content
 * hostname. It intentionally has no AUTH binding and cannot call member APIs.
 * All browser documents are CSP-sandboxed into opaque origins even when
 * opened directly outside ANEVUM's <iframe sandbox="allow-scripts">.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const common = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "cross-origin-resource-policy": "cross-origin",
  "access-control-allow-origin": "*",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), clipboard-read=(), clipboard-write=()",
  "x-robots-tag": "noindex, nofollow"
};
// No arbitrary frame-ancestor lists: staging is opt-in and limited to the
// inventory-verified package control Worker under the same managed account.
// Production defaults to https://anevum.com only.
function frameAncestors(env){
  const parents=["https://anevum.com"];
  const expected="anevum-package-alpha-v003-control.devonakins.workers.dev";
  const runtime="anevum-package-alpha-v003-runtime.devonakins.workers.dev";
  if(env.RUNTIME_HOST===runtime && env.STAGING_CONTROL_HOST===expected)
    parents.push("https://"+expected);
  return parents.join(" ");
}
const missing = () => new Response("Build unavailable", {
  status: 404, headers: { ...common, "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" }
});
export default {
  async fetch(request, env) {
    const url = new URL(request.url), origin = url.origin;
    if (!env.RUNTIME_HOST || url.hostname !== env.RUNTIME_HOST || url.protocol !== "https:") return missing();
    if (request.method === "OPTIONS") return new Response(null, {
      status: 204,
      headers: { ...common, "access-control-allow-methods": "GET, HEAD, OPTIONS",
        "access-control-allow-headers": "content-type,range", "access-control-max-age": "600" }
    });
    if (request.method !== "GET" && request.method !== "HEAD") return missing();
    // /r/<release-uuid>/index.html, /p/<release-uuid>/<signed-token>/index.html
    const publicMatch = url.pathname.match(/^\/r\/([0-9a-f-]{36})\/(.+)$/);
    const previewMatch = url.pathname.match(/^\/p\/([0-9a-f-]{36})\/([a-f0-9]{64})\/(.+)$/);
    if (!publicMatch && !previewMatch) return missing();
    const releaseId = (publicMatch || previewMatch)[1];
    if (!UUID.test(releaseId)) return missing();
    let path;
    try { path = decodeURIComponent((publicMatch || previewMatch)[publicMatch ? 2 : 3]); }
    catch { return missing(); }
    if (!safeAssetPath(path) || !assetMime(path)) return missing();
    if (url.search.length > 512) return missing();
    try {
      const release = await env.DB.prepare(
        "SELECT r.id, r.status AS release_status, p.status AS project_status, p.live_release_id " +
        "FROM anevum_package_releases r JOIN anevum_package_projects p ON p.id=r.project_id WHERE r.id=?"
      ).bind(releaseId).first();
      if (!release || ["revoked","failed"].includes(release.release_status) || ["suspended","deleted"].includes(release.project_status)) return missing();
      const isLive = release.project_status === "published"
        && release.release_status === "published" && release.live_release_id === releaseId;
      if (publicMatch && !isLive) return missing();
      if (previewMatch) {
        if (!["ready", "pending_review", "published"].includes(release.release_status)) return missing();
        if (!await verifyPreview(env.DB, releaseId, previewMatch[2])) return missing();
      }
      const asset = await env.DB.prepare(
        "SELECT object_key,mime,bytes,sha256 FROM anevum_package_files WHERE release_id=? AND path=?"
      ).bind(releaseId, path).first();
      if (!asset || assetMime(path) !== asset.mime) return missing();
      const requestedRange = request.method === "GET" ? request.headers.get("range") : null;
      let range = null;
      if (requestedRange) {
        const m = requestedRange.match(/^bytes=(\d*)-(\d*)$/);
        if (!m || (!m[1] && !m[2])) return new Response(null, {
          status: 416, headers: { ...common, "content-range": "bytes */" + asset.bytes, "accept-ranges": "bytes" }
        });
        const suffix = !m[1], a = Number(m[1] || m[2]);
        const b = m[2] && !suffix ? Number(m[2]) : asset.bytes - 1;
        if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) ||
            a < 0 || b < 0 || (!suffix && (a >= asset.bytes || b < a)) || (suffix && a === 0))
          return new Response(null, { status: 416, headers: {
            ...common, "content-range": "bytes */" + asset.bytes, "accept-ranges": "bytes" }
          });
        const start = suffix ? Math.max(0, asset.bytes - a) : a;
        const end = suffix ? asset.bytes - 1 : Math.min(asset.bytes - 1, b);
        range = { offset: start, length: end - start + 1 };
      }
      const object = request.method === "HEAD"
        ? await env.MEDIA.head(asset.object_key)
        : await env.MEDIA.get(asset.object_key, range ? { range } : {});
      if (!object || object.size !== asset.bytes || object.customMetadata?.sha256 !== asset.sha256)
        return missing();
      const headers = new Headers({
        ...common,
        "content-type": asset.mime,
        "content-length": String(range?.length ?? asset.bytes),
        "accept-ranges": "bytes",
        "cache-control": publicMatch ? "public, max-age=30" : "private, no-store"
      });
      if (path.endsWith(".html") || path.endsWith(".htm")) {
        headers.set("content-security-policy",
          "sandbox allow-scripts allow-pointer-lock; default-src 'none'; " +
          "script-src " + origin + " 'unsafe-inline' 'wasm-unsafe-eval' blob:; " +
          "style-src " + origin + " 'unsafe-inline'; " +
          "img-src " + origin + " data: blob:; " +
          "font-src " + origin + " data:; media-src " + origin + " data: blob:; " +
          "connect-src " + origin + "; worker-src 'none'; frame-src 'none'; " +
          "object-src 'none'; form-action 'none'; base-uri 'none'; " +
          "frame-ancestors " + frameAncestors(env));
      } else if (/\.(?:json|js|mjs|css|txt|glsl|wgsl|vert|frag|webmanifest)$/.test(path)) {
        headers.set("content-security-policy", "default-src 'none'");
      }
      if (range) headers.set("content-range", "bytes " + range.offset + "-" + (range.offset + range.length - 1) + "/" + asset.bytes);
      return new Response(request.method === "HEAD" ? null : object.body, { status: range ? 206 : 200, headers });
    } catch {
      return new Response("Runtime temporarily unavailable", {
        status: 503, headers: { ...common, "cache-control": "no-store" }
      });
    }
  }
};
