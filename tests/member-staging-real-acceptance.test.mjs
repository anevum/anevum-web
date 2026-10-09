import test from "node:test";
import assert from "node:assert/strict";
import { runAcceptance, STAGING_ORIGIN } from "../scripts/verify-member-staging.mjs";

const privateHeaders = {
  "cache-control": "private, no-store",
  "content-type": "application/json",
  "x-robots-tag": "noindex, nofollow"
};
const reply = (body, status = 200) => Response.json(body, {
  status, headers: privateHeaders
});
const draft = (label, count = 1) => ({
  label, marketScope: "us_equities_etfs", direction: "long_only",
  maxOpenPositions: count, maxTotalExposurePercent: 30,
  maxPositionPercent: 10, updatedAt: "2026-10-08"
});

function fakeStaging({ brokenExport = false, sharedDrafts = false } = {}) {
  const members = {
    "private-A": { user: { id: "member-A", email: "a@example.test" }, draft: null, saved: false },
    "private-B": { user: { id: "member-B", email: "b@example.test" }, draft: draft("My existing B draft", 3), saved: true }
  };
  let sharedDraft = null;
  const requests = [];
  const fetcher = async (url, options) => {
    requests.push({ url, options });
    assert.ok(url.startsWith(STAGING_ORIGIN + "/api/"));
    assert.equal(options.redirect, "manual");
    assert.equal(options.cache, "no-store");
    const path = url.slice(STAGING_ORIGIN.length);
    if (path === "/api/member/availability")
      return reply({ available: true, provider: "google" });

    const cookie = options.headers.Cookie;
    const member = members[cookie];
    if (path === "/api/command/trader/status") return reply({ message: "Denied" }, 401);
    if (!member) return reply({ message: "Sign in required" }, 401);
    if (path === "/api/member/saved-apps/rhen") {
      if (options.headers.Origin !== STAGING_ORIGIN) return reply({ message: "Denied" }, 403);
      member.saved = options.method === "PUT";
      return reply({ saved: member.saved });
    }
    if (path === "/api/member/rhen/draft") {
      if (options.method === "PUT" || options.method === "DELETE") {
        if (options.headers.Origin !== STAGING_ORIGIN) return reply({ message: "Denied" }, 403);
        const change = options.method === "PUT"
          ? JSON.parse(options.body) : null;
        const next = change ? draft(change.label, change.maxOpenPositions) : null;
        if (sharedDrafts) sharedDraft = next;
        else member.draft = next;
      }
      return reply({
        available: true, executionEnabled: false,
        brokerageConnected: false,
        draft: sharedDrafts ? sharedDraft : member.draft
      });
    }
    if (path === "/api/member/me") return reply({
      user: member.user, savedApps: member.saved ? ["rhen"] : []
    });
    if (path === "/api/member/session") return reply({
      authenticated: true, user: member.user
    });
    if (path === "/api/member/export") return reply({
      identity: brokenExport && cookie === "private-B"
        ? members["private-A"].user : member.user,
      rhenDraft: sharedDrafts ? sharedDraft : member.draft
    });
    if (path === "/api/member/rewards") return reply({
      program: "not_launched", earningEnabled: false,
      payoutEnabled: false, availableBalanceCents: null
    });
    if (path === "/api/member/brokerage") return reply({
      integration: "unavailable",
      connectionAvailable: false, accountConnected: false,
      paperTradingEnabled: false, liveTradingEnabled: false,
      depositsEnabled: false, withdrawalsEnabled: false, account: null
    });
    return reply({ error: "missing route" }, 404);
  };
  return { members, requests, fetcher };
}

const credentials = {
  origin: STAGING_ORIGIN,
  cookieA: "private-A",
  cookieB: "private-B"
};

test("two distinct signed-in sessions pass read-only acceptance without leaked identifiers", async () => {
  const stage = fakeStaging();
  const report = await runAcceptance({ ...credentials, request: stage.fetcher });
  assert.equal(report.ok, true);
  assert.equal(report.writesExercised, false);
  assert.ok(report.tested > 15);
  assert.equal(stage.members["private-A"].draft, null);
  assert.equal(stage.members["private-B"].draft.label, "My existing B draft");
  assert.equal(stage.members["private-A"].saved, false);
  assert.equal(stage.members["private-B"].saved, true);
  assert.equal(stage.requests.filter(x => x.options.method === "PUT").length, 4);
  assert.equal(stage.requests.filter(x => x.options.method === "DELETE").length, 0);
  assert.equal(stage.requests.every(x => x.url.startsWith(STAGING_ORIGIN)), true);
  for (const secret of ["private-A", "private-B", "member-A", "member-B", "example.test"]) {
    assert.equal(JSON.stringify(report).includes(secret), false);
  }
});

test("explicit reversible write run proves draft and saved-app isolation then restores both accounts", async () => {
  const stage = fakeStaging();
  const report = await runAcceptance({
    ...credentials, exerciseWrites: true, request: stage.fetcher
  });
  assert.equal(report.ok, true);
  assert.equal(report.writesExercised, true);
  assert.equal(stage.members["private-A"].draft, null);
  assert.equal(stage.members["private-B"].draft.label, "My existing B draft");
  assert.equal(stage.members["private-B"].draft.maxOpenPositions, 3);
  assert.equal(stage.members["private-A"].saved, false);
  assert.equal(stage.members["private-B"].saved, true);
  assert.ok(report.checks.includes("real two-account RHEN draft write, read, and export isolation"));
  assert.ok(report.checks.includes("restore draft A"));
  assert.ok(report.checks.includes("restore draft B"));
  const writes = stage.requests.filter(x => ["PUT", "DELETE"].includes(x.options.method)
    && x.options.headers.Origin === STAGING_ORIGIN);
  assert.ok(writes.length >= 6);
});

test("a cross-account export or shared draft backend fails isolation acceptance", async () => {
  for (const fixture of [{ brokenExport: true }, { sharedDrafts: true }]) {
    const stage = fakeStaging(fixture);
    await assert.rejects(
      runAcceptance({ ...credentials, exerciseWrites: true, request: stage.fetcher }),
      /identity mismatch|leaked into account B|cross-account isolation failed/
    );
  }
});

test("refuses duplicate session cookies and unverified staging hosts before requesting data", async () => {
  let hits = 0;
  const request = async () => { hits += 1; throw new Error("must not call"); };
  await assert.rejects(
    runAcceptance({ ...credentials, cookieB: "private-A", request }),
    /Two different real staging session cookies/
  );
  await assert.rejects(
    runAcceptance({ ...credentials, origin: "https://attacker.workers.dev", request }),
    /exact verified ANEVUM staging Worker origin/
  );
  assert.equal(hits, 0);
});
