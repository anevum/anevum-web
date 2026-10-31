// Validate concrete sitemap lessons against the exact authored curriculum and router.
// A generic /products prefix or an unknown slug is never sufficient coverage.
export function coversPublishedRhenLesson(route, appSource, lessonSource) {
  if (typeof route !== "string" || typeof appSource !== "string" || typeof lessonSource !== "string") return false;
  const prefix = "/products/rhen/learn/";
  if (!/^\/products\/rhen\/learn\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route)) return false;
  if (!appSource.includes('path="/products/rhen/learn/:slug"')) return false;
  const slugs = new Set([...lessonSource.matchAll(/^\s*slug:\s*"([a-z0-9]+(?:-[a-z0-9]+)*)"\s*,/gm)].map(match=>match[1]));
  return slugs.has(route.slice(prefix.length));
}
