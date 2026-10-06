import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isRegularEquityMarketTime,
  projectEquityMarketTimeline,
  EQUITY_MARKET_DISPLAY
} from "../src/lib/equity-market-time.ts";

function stamp(value) {
  return Date.parse(value);
}

test("equity market time accepts regular session and rejects closed intervals", () => {
  assert.equal(isRegularEquityMarketTime(stamp("2026-10-05T13:30:00Z")), true);
  assert.equal(isRegularEquityMarketTime(stamp("2026-10-05T20:00:00Z")), true);
  assert.equal(isRegularEquityMarketTime(stamp("2026-10-05T20:05:00Z")), false);
  assert.equal(isRegularEquityMarketTime(stamp("2026-10-04T15:00:00Z")), false);
});

test("equity timeline removes overnight flatline space but preserves session order", () => {
  const rows = [
    { at: "2026-10-02T19:55:00Z", time: stamp("2026-10-02T19:55:00Z"), equity: 100 },
    { at: "2026-10-02T20:00:00Z", time: stamp("2026-10-02T20:00:00Z"), equity: 101 },
    { at: "2026-10-02T23:00:00Z", time: stamp("2026-10-02T23:00:00Z"), equity: 101 },
    { at: "2026-10-05T13:30:00Z", time: stamp("2026-10-05T13:30:00Z"), equity: 102 },
    { at: "2026-10-05T13:35:00Z", time: stamp("2026-10-05T13:35:00Z"), equity: 103 }
  ];

  const projected = projectEquityMarketTimeline(rows);
  assert.equal(projected.length, 4);
  assert.deepEqual(projected.map((row) => row.equity), [100, 101, 102, 103]);

  const fridayClose = projected[1].displayTime;
  const mondayOpen = projected[2].displayTime;
  assert.equal(
    mondayOpen - fridayClose,
    EQUITY_MARKET_DISPLAY.compressedSessionGapMinutes * 60_000
  );
});

test("equity timeline preserves intraday spacing inside an active session", () => {
  const rows = [
    { at: "2026-10-05T13:30:00Z", time: stamp("2026-10-05T13:30:00Z") },
    { at: "2026-10-05T13:35:00Z", time: stamp("2026-10-05T13:35:00Z") },
    { at: "2026-10-05T14:00:00Z", time: stamp("2026-10-05T14:00:00Z") }
  ];
  const projected = projectEquityMarketTimeline(rows);
  assert.equal(projected[1].displayTime - projected[0].displayTime, 5 * 60_000);
  assert.equal(projected[2].displayTime - projected[1].displayTime, 25 * 60_000);
});
