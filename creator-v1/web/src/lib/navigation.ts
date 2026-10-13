// Project return links are restricted to public routes, never arbitrary URLs.
const base = "https://anevum.invalid";
const handle = /^\/creators\/[a-z][a-z0-9_]{2,29}$/i;
const cursorPattern = /^[A-Za-z0-9_-]{1,80}$/;

export function safeReturnPath(raw: string | null | undefined): string {
  if (!raw || raw.length > 512 || !raw.startsWith("/") || raw.startsWith("//") ||
      /[\\\u0000-\u001f\u007f]/.test(raw)) return "/discover";
  let url: URL;
  try { url = new URL(raw, base); } catch { return "/discover"; }
  if (url.origin !== base || url.hash) return "/discover";
  const route = url.pathname;
  if (!(route === "/" || route === "/start" || route === "/discover" || route === "/creators" || route === "/community" || handle.test(route)))
    return "/discover";
  const params = new URLSearchParams();
  if (route === "/discover" || route === "/creators") {
    const q = url.searchParams.get("q") || "";
    if (q && q.length <= (route === "/creators" ? 80 : 100) && !/[\u0000-\u001f\u007f]/.test(q))
      params.set("q", q);
  }
  if (route === "/discover") {
    const category = url.searchParams.get("category") || "";
    if (/^[a-z]{2,24}$/.test(category)) params.set("category", category);
    if (url.searchParams.get("free") === "1") params.set("free", "1");
  }
  if (route !== "/") {
    const cursor = url.searchParams.get("cursor") || "";
    if (cursorPattern.test(cursor)) params.set("cursor", cursor);
  }
  return route + (params.size ? "?" + params.toString() : "");
}

export function projectDetailPath(id: string, returnTo: string): string {
  return "/projects/" + encodeURIComponent(id) + "?" +
    new URLSearchParams({from:safeReturnPath(returnTo)}).toString();
}

export function cursorRoute(pathname: string, current: URLSearchParams, cursor: string | null): string {
  const params = new URLSearchParams(current);
  if (cursor) params.set("cursor",cursor);
  else params.delete("cursor");
  return pathname + (params.size ? "?" + params.toString() : "");
}
