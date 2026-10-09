import { test } from "node:test";
import assert from "node:assert/strict";
import { significantRuntimeHistory } from "../src/lib/reconciliation-visibility.ts";

function notice(at, kind, action) {
  return { at: new Date(at).toISOString(), kind, action };
}

test("reconciliation status heartbeats do not flood the operator timeline", () => {
  const t = Date.parse("2026-10-08T18:00:00Z");
  const events = [
    notice(t + 0, "reconciliation", "safe"),
    notice(t + 1000, "reconciliation", "safe"),
    notice(t + 2000, "order", "buy"),
    notice(t + 3000, "reconciliation", "blocked"),
    notice(t + 4000, "reconciliation", "blocked"),
    notice(t + 5000, "reconciliation", "safe"),
    notice(t + 6000, "reconciliation", "safe"),
    notice(t + 7000, "reconciliation", "error"),
    notice(t + 8000, "reconciliation", "error"),
    notice(t + 9000, "reconciliation", "safe"),
  ].reverse();
  const kept = significantRuntimeHistory(events);
  assert.deepEqual(
    kept.filter(event => event.kind === "reconciliation").map(event => event.action),
    ["blocked", "safe", "error", "safe"]
  );
  assert.equal(kept.filter(event => event.kind === "order").length, 1);
});

test("standalone successful checks are private operational evidence, not public news", () => {
  const t = Date.parse("2026-10-08T18:00:00Z");
  const kept = significantRuntimeHistory([
    notice(t + 3000, "reconciliation", "safe"),
    notice(t + 2000, "reconciliation", "safe"),
    notice(t + 1000, "execution", "sell"),
  ]);
  assert.deepEqual(kept.map(event => event.kind), ["execution"]);
});

test("first visible broker failure always appears", () => {
  const t = Date.parse("2026-10-08T18:00:00Z");
  const kept = significantRuntimeHistory([
    notice(t + 1000, "reconciliation", "blocked"),
    notice(t, "reconciliation", "blocked"),
  ]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].action, "blocked");
});
