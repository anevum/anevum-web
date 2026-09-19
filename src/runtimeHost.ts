export const ROOT_HOST = "anevum.com";
export const WIKI_HOST = "wiki.anevum.com";
export const LATTICE_HOST = "lattice.anevum.com";
export const COMMAND_HOST = "command.anevum.com";

const KNOWN_RUNTIME_HOSTS = new Set([ROOT_HOST, WIKI_HOST, LATTICE_HOST, COMMAND_HOST]);
const META_ROUTE_PREFIX = "/__meta/";
const META_PUBLIC_ROUTES = new Set([
  "stories",
  "stories-reply",
  "explore",
  "archive",
  "transmissions",
  "search",
  "the-book",
  "the-story",
  "store",
  "rhenlink",
  "about",
  "privacy",
  "terms",
  "contact",
]);

function restoreMetadataRewritePath(pathname: string) {
  if (!pathname.startsWith(META_ROUTE_PREFIX)) return pathname;
  const target = pathname.slice(META_ROUTE_PREFIX.length).replace(/\.html$/i, "").replace(/\/+$/, "");
  return META_PUBLIC_ROUTES.has(target) ? `/${target}` : pathname;
}

export function normalizeRuntimePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return restoreMetadataRewritePath(normalized);
}

export function resolveRuntimeHostname(hostname: string) {
  const normalized = String(hostname || "").trim().toLowerCase();
  return KNOWN_RUNTIME_HOSTS.has(normalized) ? normalized : ROOT_HOST;
}

export function isKnownRuntimeHostname(hostname: string) {
  return KNOWN_RUNTIME_HOSTS.has(String(hostname || "").trim().toLowerCase());
}

export function safeDecodeRouteValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}
