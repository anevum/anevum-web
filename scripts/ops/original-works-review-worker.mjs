/**
 * Isolated Original Works REVIEW shell.
 * This Worker has no D1, tokens, env secrets, APIs, root routes or permissions.
 * Only route it under the already Access-protected backstage.anevum.com host.
 * Build artifacts are explicitly unpublished reader-review material.
 */
const ROOT = "/design/original-works";
const NOT_FOUND = new Response("Not found", {status: 404, headers: {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff"
}});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    // Fail closed if this script is accidentally exposed on another hostname.
    if (url.hostname !== "backstage.anevum.com") return NOT_FOUND.clone();
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {status: 405, headers: {
        "Allow": "GET, HEAD",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive"
      }});
    }
    if (path !== ROOT && !path.startsWith(ROOT + "/")) return NOT_FOUND.clone();
    if (!env?.ASSETS?.fetch) return new Response("Unavailable", {status: 503});

    // Account-level assets.base_path is unavailable; map the protected
    // review prefix to the artifact's root without changing user-visible URLs.
    const assetUrl = new URL(request.url);
    assetUrl.pathname = path.slice(ROOT.length) || "/";
    const response = await env.ASSETS.fetch(new Request(assetUrl, request));
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("Content-Security-Policy", "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
