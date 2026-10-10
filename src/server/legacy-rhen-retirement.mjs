/** Legacy RHEN is retired during ANEVUM V5 rebuild.
 * This module deliberately contains no live upstream hostname, broker secrets,
 * member data or simulated financial measurements.
 */
export const LEGACY_RHEN_RETIRED = true;

const PUBLIC_LEGACY_PATHS = new Set([
  "/api/public/trading/live",
  "/api/public/trading/events",
  "/api/public/research/readiness",
  "/api/public/theory",
]);

export function retiredRhenBoundary(pathname) {
  if (!LEGACY_RHEN_RETIRED) return null;
  if (PUBLIC_LEGACY_PATHS.has(pathname)) return "public";
  if (pathname === "/api/command/session") return null;
  if (pathname.startsWith("/api/command/")) return "operator";
  return null;
}

export function retiredRhenStatus() {
  return {
    ok: false,
    status: "SUSPENDED_FOR_REBUILD",
    project: "RHEN",
    execution_enabled: false,
    broker_workspace_available: false,
    stale: true,
    reason: "The legacy RHEN trading service is retired while RHEN V5 is rebuilt.",
    next: "Member-owned RHEN workspaces and broker linking will follow validation.",
  };
}
