export const ROOT_HOST = "anevum.com";
export const WIKI_HOST = "wiki.anevum.com";
export const LATTICE_HOST = "lattice.anevum.com";
export const COMMAND_HOST = "command.anevum.com";

const KNOWN_RUNTIME_HOSTS = new Set([ROOT_HOST, WIKI_HOST, LATTICE_HOST, COMMAND_HOST]);

export function normalizeRuntimePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
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
