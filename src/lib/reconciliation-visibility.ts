/**
 * Only expose meaningful broker reconciliation transitions in operator activity.
 * The underlying RHEN safety checks, ledger and private telemetry are unchanged.
 * Runtime history arrives newest-first, but transitions must be evaluated oldest-first.
 */
export function significantRuntimeHistory<T extends { kind?: unknown; action?: unknown; at?: unknown }>(
  history: readonly T[]
): T[] {
  let previous: string | null = null;
  return [...history]
    .sort((a, b) => {
      const left = typeof a.at === "string" ? Date.parse(a.at) : 0;
      const right = typeof b.at === "string" ? Date.parse(b.at) : 0;
      return (Number.isFinite(left) ? left : 0) - (Number.isFinite(right) ? right : 0);
    })
    .filter(event => {
      if (event.kind !== "reconciliation") return true;
      const action = String(event.action || "").toLowerCase();
      if (!["safe", "blocked", "error"].includes(action)) return true;
      const isTransition = action !== previous;
      const recovering = action === "safe" && (previous === "blocked" || previous === "error");
      previous = action;
      return isTransition && (action !== "safe" || recovering);
    });
}
