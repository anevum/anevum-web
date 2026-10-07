export type Provenance = "OBSERVED" | "DERIVED" | "FORECAST" | "OPERATIONAL";
export type Point = {
  timestamp: string; provenance: Provenance; source: string; quality_state: string;
  value?: number | null; symbol?: string; methodology_version?: string;
  open?: number; high?: number; low?: number; close?: number; volume?: number | null;
  complete?: boolean; feed?: string; session?: string;
};
export type ScannerRow = {
  symbol: string; mid: number | null; bid?: number; ask?: number; spread_bps: number | null;
  quote_source_at?: string | null; quote_age_ms: number | null; candidate_state: string;
  evaluable: boolean; rejection_code: string | null; quality_state: string; signal_reason?: string;
};
export type ExecutionMarker = Point & { event_id: string; event_type: string; price?: number | null; order_ref: string; quantity?: number | null };
export type Forecast = {
  forecast_id: string; symbol: string; issued_at: string; feature_as_of: string;
  expires_at: string; horizon_seconds: number; model_version: string; methodology_version: string;
  central_path: {timestamp: string; value: number}[];
  lower_path: {timestamp: string; value: number}[] | null;
  upper_path: {timestamp: string; value: number}[] | null;
  provenance: "FORECAST"; uncertainty_state: string; quality_state: string;
};
export type LiveState = {
  generation: string | null; sequence: number; stale: boolean; error: string;
  scanner: Record<string, ScannerRow>; series: Record<string, Point[]>;
  executions: ExecutionMarker[]; forecasts: Record<string, Forecast>; system: Record<string, unknown>;
};
export type LiveMessage = {
  schema_version: "command-live.v1"; message_type: string; server_time: string;
  stream_generation: string; sequence: number; payload: Record<string, unknown>;
};

export function emptyLiveState(): LiveState {
  return {generation: null, sequence: -1, stale: true, error: "Awaiting authenticated shadow snapshot",
    scanner: {}, series: {}, executions: [], forecasts: {}, system: {}};
}

function pointValid(point: Point) {
  return ["OBSERVED", "DERIVED", "FORECAST", "OPERATIONAL"].includes(point.provenance)
    && Boolean(point.source && point.quality_state) && Number.isFinite(Date.parse(point.timestamp))
    && (["DERIVED", "FORECAST"].includes(point.provenance) ? Boolean(point.methodology_version) : true)
    && [point.value, point.open, point.high, point.low, point.close, point.volume].every(v => v == null || typeof v === "number" && Number.isFinite(v));
}

export function forecastCurrent(f: Forecast, now: number): boolean {
  const issue = Date.parse(f.issued_at), expiry = Date.parse(f.expires_at), feature = Date.parse(f.feature_as_of);
  if (!f.forecast_id || !f.model_version || !f.methodology_version || f.provenance !== "FORECAST" || f.quality_state !== "LIVE" ||
      !Number.isInteger(f.horizon_seconds) || f.horizon_seconds <= 0 || !(feature <= issue && issue <= now && now < expiry && expiry <= issue + f.horizon_seconds * 1000)) return false;
  const paths = f.central_path;
  if (!Array.isArray(paths) || !paths.length || paths.some((p, i) => !Number.isFinite(p.value) ||
    !(issue <= Date.parse(p.timestamp) && Date.parse(p.timestamp) <= expiry) || i > 0 && Date.parse(p.timestamp) <= Date.parse(paths[i-1].timestamp))) return false;
  if ((f.lower_path == null) !== (f.upper_path == null)) return false;
  if (f.lower_path && f.upper_path) {
    if (f.lower_path.length !== paths.length || f.upper_path.length !== paths.length) return false;
    return paths.every((p,i) => f.lower_path![i].timestamp === p.timestamp && f.upper_path![i].timestamp === p.timestamp &&
      Number.isFinite(f.lower_path![i].value) && Number.isFinite(f.upper_path![i].value) &&
      f.lower_path![i].value <= p.value && p.value <= f.upper_path![i].value);
  }
  return true;
}

function delta(state: LiveState, kind: string, payload: Record<string, unknown>): LiveState {
  if (kind === "scanner_patch") {
    const row = payload as ScannerRow;
    if (!row.symbol) throw new Error("Invalid scanner symbol");
    return {...state, scanner: {...state.scanner, [row.symbol]: row}};
  }
  if (["series_append", "series_patch_last", "series_reset"].includes(kind)) {
    const key = String(payload.series_id || "");
    if (!key || Object.keys(state.series).length > 256) throw new Error("Invalid series capacity");
    let points = (state.series[key] || []).slice();
    if (kind === "series_reset") {
      const incoming = payload.points as Point[];
      if (!Array.isArray(incoming) || incoming.length > 5000 || incoming.some((p,i) => !pointValid(p) || i > 0 && Date.parse(p.timestamp) <= Date.parse(incoming[i-1].timestamp))) throw new Error("Invalid visual reset");
      points = incoming.slice(-2400);
    } else {
      const point = payload.point as Point;
      if (!pointValid(point)) throw new Error("Visual provenance missing");
      const last = points.at(-1), timestamp = Date.parse(point.timestamp);
      if (last && timestamp < Date.parse(last.timestamp)) return state;
      if (last && timestamp === Date.parse(last.timestamp)) points[points.length-1] = point;
      else if (kind === "series_patch_last") throw new Error("Patch does not identify current point");
      else points.push(point);
      if (points.length > 2400) points.splice(0, points.length-2400);
    }
    return {...state, series: {...state.series, [key]: points}};
  }
  if (kind === "execution_event") {
    const marker = payload as ExecutionMarker;
    if (!marker.event_id || !marker.order_ref || marker.provenance !== "OBSERVED" || !pointValid(marker)) throw new Error("Broker evidence missing");
    return state.executions.some(p => p.event_id === marker.event_id) ? state : {...state, executions: [...state.executions, marker].slice(-2400)};
  }
  if (kind === "forecast_replace") {
    const forecast = payload as Forecast;
    if (!forecastCurrent(forecast, Date.now())) throw new Error("Invalid or expired forecast");
    return {...state, forecasts: {...state.forecasts, [forecast.symbol]: forecast}};
  }
  if (kind === "system_patch" || kind === "heartbeat" || kind === "critical_event") return {...state, system: {...state.system, ...payload}};
  throw new Error("Unknown live event");
}

export function applyLiveMessage(state: LiveState, message: LiveMessage): LiveState {
  if (message.schema_version !== "command-live.v1" || !message.stream_generation || !Number.isSafeInteger(message.sequence) || message.sequence < 0) throw new Error("Invalid live envelope");
  if (message.stream_generation === state.generation && message.sequence <= state.sequence) return state;
  if (message.message_type === "snapshot") {
    const payload = message.payload;
    if (payload.visual_schema !== "command-visual.v1") throw new Error("Invalid visual snapshot");
    let next: LiveState = {...emptyLiveState(), generation: message.stream_generation, sequence: message.sequence, stale: false, error: ""};
    const scanner = payload.scanner as Record<string, ScannerRow> || {};
    if (Object.keys(scanner).length > 30) throw new Error("Scanner exceeds entitlement capacity");
    for (const row of Object.values(scanner)) next = delta(next, "scanner_patch", row);
    for (const [series_id, points] of Object.entries(payload.series as Record<string, Point[]> || {})) next = delta(next, "series_reset", {series_id, points});
    for (const marker of (payload.execution_events as ExecutionMarker[] || [])) next = delta(next, "execution_event", marker);
    next.system = payload.system as Record<string, unknown> || {};
    return next;
  }
  if (state.generation !== message.stream_generation) return {...state, stale: true, error: "Generation changed; fresh snapshot required"};
  if (state.stale) return {...state, error: "Fresh snapshot required before deltas"};
  let next = state;
  if (message.message_type === "delta_batch") {
    const events = message.payload.events as {message_type: string; payload: Record<string, unknown>}[];
    if (!Array.isArray(events) || events.length > 10000) throw new Error("Invalid live batch");
    for (const event of events) next = delta(next, event.message_type, event.payload);
  } else next = delta(next, message.message_type, message.payload);
  return {...next, sequence: message.sequence, stale: false, error: ""};
}
