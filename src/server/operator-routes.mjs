// Legacy operator URLs have exactly one safe destination: the Access-protected
// RHEN Terminal. Redirect on the server before the member Command shell loads.
// Public member Command, personal /apps/rhen/terminal/*, and actual /command/rhen/* are excluded.
const OPERATOR_HOME = "/command/rhen/operate";
const LEGACY_OPERATOR_HOMES = new Set(["/private", "/iren", "/rhenlink"]);

export function legacyOperatorTarget(pathname) {
  if (LEGACY_OPERATOR_HOMES.has(pathname)) return OPERATOR_HOME;

  if (pathname.startsWith("/command/")) {
    if (pathname === "/command/rhen" || pathname.startsWith("/command/rhen/")) return null;
    const tail = pathname.slice("/command/".length);
    if (!tail) return null;
    return "/command/rhen/" + tail;
  }

  // Only the old operator *command* alias redirects. /apps/rhen/terminal
  // now belongs to each signed-in member and must reach its own SPA route.
  for (const prefix of ["/apps/rhen/command"]) {
    if (pathname === prefix) return OPERATOR_HOME;
    if (pathname.startsWith(prefix + "/")) {
      const tail = pathname.slice(prefix.length + 1);
      return tail ? "/command/rhen/" + tail : OPERATOR_HOME;
    }
  }
  return null;
}
