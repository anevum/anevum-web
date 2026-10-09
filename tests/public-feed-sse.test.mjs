import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL(name, import.meta.url), "utf8");

test("Cloudflare relays only RHEN aggregate SSE as an unbuffered no-store stream", () => {
  const worker = read("../worker.mjs");
  const start = worker.indexOf("async function publicTradingEvents()");
  const end = worker.indexOf("async function commandApi(", start);
  assert.ok(start >= 0 && end > start);
  const proxy = worker.slice(start, end);
  assert.match(worker, /pathname === "\/api\/public\/trading\/events"/);
  assert.match(proxy, /fetch\(TRADER_BASE \+ "\/v1\/trading-public-events"/);
  assert.match(proxy, /new Response\(response\.body/);
  assert.match(proxy, /text\/event-stream/);
  assert.match(proxy, /no-store, no-transform/);
  assert.doesNotMatch(proxy, /response\.text\(|response\.json\(|Authorization|broker|APCA-API/);
  assert.doesNotMatch(proxy, /AbortSignal\.timeout/);
});

test("the browser uses verified SSE snapshots and safely retries REST when disconnected", () => {
  const hook = read("../src/hooks/useLiveTrading.ts");
  assert.match(hook, /new EventSource\("\/api\/public\/trading\/events"\)/);
  assert.match(hook, /addEventListener\("snapshot"/);
  assert.match(hook, /source !== stream/);
  assert.match(hook, /next\.disclosure\?\.level !== "aggregate_only"/);
  assert.match(hook, /next\.source !== "rhen-core-sqlite"/);
  assert.match(hook, /failStream\(stream\)/);
  assert.match(hook, /fetchLiveTradingFeed\(\)/);
  assert.match(hook, /clearPoll\(\)/);
  assert.match(hook, /source\?\.close\(\)/);
  assert.match(hook, /Date\.now\(\) - lastEventAt > 90000/);
});

test("public RHEN monitoring explicitly distinguishes actual event push from HTTP snapshots", () => {
  const page = read("../src/pages/Live.tsx");
  const terminal = read("../src/pages/RhenTerminal.tsx");
  assert.match(page, /CANONICAL EVENT STREAM/);
  assert.match(page, /PERIODIC HTTP SNAPSHOT/);
  assert.match(page, /LAST SCAN/);
  assert.match(terminal, /publicTransport === "STREAM"/);
  assert.match(terminal, /PUBLIC FEED/);
});
