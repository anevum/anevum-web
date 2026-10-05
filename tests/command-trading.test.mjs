import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Command overview exposes private broker account tracking and executions", () => {
  const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
  const tracker = readFileSync(new URL("../src/components/CommandAccountTracker.tsx", import.meta.url), "utf8");
  const data = readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");

  assert.match(command, /CommandAccountTracker/);
  assert.match(command, /command-view-overview command-view-live command-panel-orders/);
  assert.match(command, /ACTIVE POSITIONS/);
  assert.match(command, /positions\.map/);
  assert.match(tracker, /Equity \+ executions/);
  assert.match(tracker, /B = buy · S = sell/);
  assert.match(tracker, /RECENT FILLS/);
  assert.match(data, /account_history\?: CommandAccountHistory/);
});
