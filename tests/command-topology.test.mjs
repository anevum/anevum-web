import { test } from "node:test";
import assert from "node:assert/strict";
import { isStale, runtimeStatus } from "../src/lib/runtime-topology.ts";

const now = Date.parse("2026-09-30T15:00:00Z");

test("browser independently expires stale, missing, malformed and future observations", () => {
  for (const stamp of [null, "bad", "2026-09-30T14:56:59Z", "2026-09-30T15:01:00Z", "2026-09-30T15:00:00"]) {
    assert.equal(isStale({ observed_at: stamp, stale: false }, now), true);
  }
  assert.equal(isStale({ observed_at: "2026-09-30T15:00:00Z", stale: false }, now), false);
  assert.equal(isStale({ observed_at: "2026-09-30T15:00:00Z", stale: false }, now, true), true);
});

test("internal modules do not become offline services merely because the control envelope is stale", () => {
  assert.equal(runtimeStatus({ independent_runtime: false, status: "UNKNOWN" }, true), "UNKNOWN");
  assert.equal(runtimeStatus({ independent_runtime: true, status: "RUNNING" }, true), "STALE");
});


test("canonical runtime health is not overridden by stale auxiliary runtimes", async () => {
  const mod = await import("../src/lib/system-display.ts");
  const now = Date.parse("2026-10-05T22:30:00Z");
  const snapshot = {
    schema_version: "iren_command.v2",
    revision: 10,
    observed_at: "2026-10-05T22:29:50Z",
    stale: false,
    state: "HEALTHY",
    action_required: false,
    incidents: [],
    topology: {
      services: [
        {
          service_id: "RHEN",
          runtime_kind: "SERVICE",
          independent_runtime: true,
          status: "IDLE",
          observed_at: "2026-10-05T22:29:50Z",
          last_heartbeat_at: "2026-10-05T22:29:50Z",
          liveness: true,
          readiness: true,
          scope: "canonical"
        },
        {
          service_id: "PREOPEN",
          runtime_kind: "WORKER",
          independent_runtime: true,
          status: "OFFLINE",
          observed_at: "2026-10-05T22:00:00Z",
          last_heartbeat_at: null,
          liveness: false,
          readiness: false,
          scope: "auxiliary"
        },
        {
          service_id: "IREN",
          runtime_kind: "SERVICE",
          independent_runtime: true,
          status: "IDLE",
          observed_at: "2026-10-05T22:29:50Z",
          last_heartbeat_at: "2026-10-05T22:29:50Z",
          liveness: true,
          readiness: true,
          scope: "canonical"
        },
        {
          service_id: "IREN_EXECUTOR",
          runtime_kind: "SERVICE",
          independent_runtime: true,
          status: "OFFLINE",
          observed_at: "2026-10-05T22:00:00Z",
          last_heartbeat_at: null,
          liveness: false,
          readiness: false,
          scope: "auxiliary"
        }
      ],
      dependencies: {}
    }
  };

  assert.equal(mod.commandSystem("RHEN", snapshot, null, now).health, "HEALTHY");
  assert.equal(mod.commandSystem("IREN", snapshot, null, now).health, "HEALTHY");
});
