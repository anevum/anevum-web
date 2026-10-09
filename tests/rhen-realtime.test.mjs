import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyLiveMessage, emptyLiveState
} from "../src/lib/command-live-events.ts";

const file = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("private RHEN observer uses authenticated Cloudflare Access WebSocket with no URL credentials", () => {
  const worker = file("../worker.mjs");
  const hook = file("../src/hooks/useRhenLiveObserver.ts");
  const terminal = file("../src/pages/RhenTerminal.tsx");
  assert.match(worker, /async function proxyOwnerReadOnlyStream/);
  assert.match(worker, /commandCredential\(request, env\)/);
  assert.match(worker, /RHEN_OBSERVER_ENABLED/);
  assert.match(worker, /url\.search/);
  assert.match(worker, /\/v1\/command\/live/);
  assert.match(worker, /if \(pathname === "\/api\/command\/live"\)/);
  assert.match(hook, /new WebSocket\(url\)/);
  assert.match(hook, /applyLiveMessage/);
  assert.match(hook, /Source heartbeat timeout/);
  assert.match(terminal, /Boolean\(commandAdmin && session\)/);
  assert.match(terminal, /<RhenRealtimePanel state=\{observerState\} \/>/);
  assert.doesNotMatch(hook, /fetch\(|api\/command\/shadow\/bootstrap/);
  assert.doesNotMatch(worker.slice(worker.indexOf("async function proxyOwnerReadOnlyStream"), worker.indexOf("async function proxyCommandHistory")), /APCA-API-SECRET-KEY|client_order_id|api_key/);
});

test("real-time panel labels IEX midquotes, sampled account truth and disconnected source", () => {
  const panel = file("../src/components/RhenRealtimePanel.tsx");
  assert.match(panel, /QUOTE MIDPOINT/);
  assert.match(panel, /ALPACA|Alpaca/);
  assert.match(panel, /account:equity/);
  assert.match(panel, /observedRecently/);
  assert.match(panel, /gaps preserved/);
  assert.match(panel, /not canonical until reconciled/);
  assert.match(panel, /not a tick-by-tick equity calculation/);
  assert.match(panel, /state\.stale/);
  assert.doesNotMatch(panel, /Math\.random|setInterval|invented|mock/);
});

test("canonical live reducer requires snapshot and rejects discontinuous generation", () => {
  const ts = "2026-10-08T16:00:00Z";
  const frame = (type, payload, generation, sequence) => ({
    schema_version: "command-live.v1",
    message_type: type, server_time: ts,
    stream_generation: generation, sequence, payload
  });
  let state = applyLiveMessage(emptyLiveState(), frame(
    "snapshot",
    {visual_schema: "command-visual.v1", scanner: {}, series:{}, execution_events:[], forecasts:{}, system:{broker_orders_possible:false}},
    "owner-session-1", 1
  ));
  assert.equal(state.stale, false);
  assert.equal(state.system.broker_orders_possible, false);
  state = applyLiveMessage(state, frame("system_patch", {connection_state:"HEALTHY"}, "owner-session-1", 2));
  assert.equal(state.system.connection_state, "HEALTHY");
  state = applyLiveMessage(state, frame("system_patch", {connection_state:"FAKE"}, "new-session-2", 3));
  assert.equal(state.stale, true);
  assert.equal(state.system.connection_state, "HEALTHY");
});
