export type RuntimeRow = {
  service_id: string; runtime_kind: string; independent_runtime: boolean;
  status: string; service_name?: string; deployment?: string; revision?: string;
  last_heartbeat_at?: string; scope: string; observation_source?: string;
};
export type IrenSnapshot = {
  schema_version: string; revision: string | number | null; observed_at: string | null;
  stale: boolean; state: string; action_required: boolean;
  topology: { services: RuntimeRow[]; dependencies: Record<string, { status: string; basis?: string; last_success?: string; dropped_count?: number }> } | null;
  incidents: { key: string; severity: string; reason: string; opened_at?: string }[];
  scheduler?: { next_expected_runs?: Record<string, string> };
};
export function isStale(value: IrenSnapshot | null, now: number, unavailable = false) {
  const stamp = value?.observed_at;
  if (unavailable || !stamp || !/(Z|[+-]\d{2}:\d{2})$/.test(stamp)) return true;
  const age = now - Date.parse(stamp);
  return value?.stale !== false || !Number.isFinite(age) || age < 0 || age > 180000;
}
export function runtimeStatus(row: RuntimeRow, stale: boolean) {
  return stale && row.independent_runtime ? "STALE" : row.status;
}
