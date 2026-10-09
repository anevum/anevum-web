// Staging-only two-real-member acceptance. Cookies are never logged.
// Run locally with separate disposable Google test accounts, private environment
// variables, and the exact deployed staging Worker. NEVER paste cookies in chat,
// GitHub source/issues, CI logs, or any third-party dashboard.
// ANEVUM_TEST_ORIGIN=https://anevum-member-staging.devonakins.workers.dev
// ANEVUM_TEST_COOKIE_A=... ANEVUM_TEST_COOKIE_B=... node scripts/verify-member-staging.mjs
// Add --exercise-writes for reversible test-account save/draft changes.
// Neither mode can address production or deploy a Worker.
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const STAGING_ORIGIN = "https://anevum-member-staging.devonakins.workers.dev";

export function stagingOrigin(raw) {
  const url = new URL(String(raw || ""));
  if (url.origin !== STAGING_ORIGIN || url.protocol !== "https:" ||
      url.username || url.password || url.port ||
      url.pathname !== "/" || url.search || url.hash ||
      String(raw) !== STAGING_ORIGIN) {
    throw new Error("Only the exact verified ANEVUM staging Worker origin is allowed.");
  }
  return STAGING_ORIGIN;
}

function sameEditableDraft(a, b) {
  if (a === null || b === null) return a === b;
  if (!a || !b) return false;
  return ["label", "maxOpenPositions", "maxPositionPercent",
    "maxTotalExposurePercent"].every(key => a[key] === b[key]);
}

function sameDraft(a, b) {
  if (a === null || b === null) return a === b;
  if (!a || !b) return false;
  return ["label", "marketScope", "direction", "maxOpenPositions",
    "maxPositionPercent", "maxTotalExposurePercent", "updatedAt"]
    .every(key => a[key] === b[key]);
}

function draftWritePayload(draft) {
  if (!draft) return null;
  return {
    label: draft.label,
    maxOpenPositions: draft.maxOpenPositions,
    maxTotalExposurePercent: draft.maxTotalExposurePercent,
    maxPositionPercent: draft.maxPositionPercent
  };
}

export async function runAcceptance({
  origin, cookieA, cookieB, exerciseWrites = false, request = fetch
}) {
  const base = stagingOrigin(origin);
  if (typeof cookieA !== "string" || typeof cookieB !== "string" ||
      !cookieA.trim() || !cookieB.trim() || cookieA === cookieB) {
    throw new Error("Two different real staging session cookies are required.");
  }
  const checks = [];
  const call = (path, cookie, options = {}) => {
    if (!path.startsWith("/api/member/") &&
        !path.startsWith("/api/command/")) {
      throw new Error("Acceptance can only request approved API paths.");
    }
    return request(base + path, {
      method: "GET", redirect: "manual", cache: "no-store",
      ...options,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(options.headers || {})
      }
    });
  };
  const expectStatus = async (label, response, codes) => {
    if (!codes.includes(response.status)) {
      throw new Error(label + " returned HTTP " + response.status +
        ", expected " + codes.join("/"));
    }
    checks.push(label);
  };
  const asJson = async (label, response) => {
    await expectStatus(label, response, [200]);
    if (!(response.headers.get("content-type") || "").includes("application/json")) {
      throw new Error(label + " did not return JSON.");
    }
    return response.json();
  };
  const privateResponse = (label, response) => {
    if (!(response.headers.get("cache-control") || "").includes("no-store")) {
      throw new Error(label + " is missing no-store.");
    }
  };
  const readDraft = async (label, cookie) => {
    const response = await call("/api/member/rhen/draft", cookie);
    privateResponse(label, response);
    const state = await asJson(label, response);
    if (state.available !== true || state.executionEnabled !== false ||
        state.brokerageConnected !== false ||
        (state.draft !== null && (!state.draft ||
          state.draft.direction !== "long_only" ||
          state.draft.marketScope !== "us_equities_etfs"))) {
      throw new Error(label + " has unexpected trading authority or draft state.");
    }
    return state.draft;
  };
  const readExport = async (label, cookie, expectedId, otherId) => {
    const response = await call("/api/member/export", cookie);
    privateResponse(label, response);
    const exported = await asJson(label, response);
    if (exported.identity?.id !== expectedId || exported.identity?.id === otherId) {
      throw new Error(label + " identity mismatch.");
    }
    return exported;
  };

  const available = await asJson("preview availability",
    await call("/api/member/availability"));
  if (available.available !== true || available.provider !== "google") {
    throw new Error("Preview OAuth/D1 readiness is not enabled.");
  }
  const aResponse = await call("/api/member/me", cookieA);
  privateResponse("account A", aResponse);
  const a = await asJson("account A", aResponse);
  const bResponse = await call("/api/member/me", cookieB);
  privateResponse("account B", bResponse);
  const b = await asJson("account B", bResponse);
  if (typeof a?.user?.id !== "string" || typeof b?.user?.id !== "string" ||
      !a.user.id || !b.user.id || a.user.id === b.user.id) {
    throw new Error("Two independent member identities are required.");
  }

  for (const [label, cookie, expectedId] of [
    ["A", cookieA, a.user.id], ["B", cookieB, b.user.id]
  ]) {
    const response = await call("/api/member/session", cookie);
    privateResponse("session " + label, response);
    const state = await asJson("session " + label, response);
    if (state.user?.id !== expectedId || state.authenticated !== true) {
      throw new Error("Session " + label + " returned an unexpected user.");
    }
  }

  const originalA = await readDraft("RHEN draft A", cookieA);
  const originalB = await readDraft("RHEN draft B", cookieB);
  const exportA = await readExport("export A", cookieA, a.user.id, b.user.id);
  const exportB = await readExport("export B", cookieB, b.user.id, a.user.id);
  if (!sameDraft(exportA.rhenDraft, originalA) ||
      !sameDraft(exportB.rhenDraft, originalB)) {
    throw new Error("Account export draft did not match the signed-in account.");
  }
  checks.push("two-account saved draft and export correspondence");

  const rewards = await asJson("rewards disabled",
    await call("/api/member/rewards", cookieA));
  if (rewards.program !== "not_launched" ||
      rewards.earningEnabled !== false || rewards.payoutEnabled !== false ||
      rewards.availableBalanceCents !== null) {
    throw new Error("Unexpected financial rewards authority.");
  }
  const brokerage = await asJson("brokerage disabled",
    await call("/api/member/brokerage", cookieB));
  for (const key of [
    "connectionAvailable", "accountConnected", "paperTradingEnabled",
    "liveTradingEnabled", "depositsEnabled", "withdrawalsEnabled"
  ]) if (brokerage[key] !== false) {
    throw new Error("Unexpected member brokerage capability: " + key);
  }
  if (brokerage.account !== null) {
    throw new Error("Member account has an unexpected brokerage link.");
  }

  for (const [label, cookie] of [["A", cookieA], ["B", cookieB]]) {
    await expectStatus("operator denied " + label,
      await call("/api/command/trader/status", cookie), [401, 403]);
    await expectStatus("forged origin denied " + label,
      await call("/api/member/saved-apps/rhen", cookie, {
        method: "PUT", headers: { Origin: "https://untrusted.example" }
      }), [403]);
    await expectStatus("missing origin denied " + label,
      await call("/api/member/saved-apps/rhen", cookie, { method: "PUT" }), [403]);
  }
  await expectStatus("anonymous member API denied",
    await call("/api/member/me"), [401]);
  await expectStatus("anonymous RHEN draft API denied",
    await call("/api/member/rhen/draft"), [401]);
  await expectStatus("anonymous export API denied",
    await call("/api/member/export"), [401]);

  if (exerciseWrites) {
    // Each write is an explicit --exercise-writes staging operation. Drafts
    // are restored to their exact prior editable values in a finally block.
    const sampleA = {
      label: "Staging tenant A " + randomUUID().slice(0, 8),
      maxOpenPositions: 1, maxTotalExposurePercent: 20, maxPositionPercent: 10
    };
    const sampleB = {
      label: "Staging tenant B " + randomUUID().slice(0, 8),
      maxOpenPositions: 2, maxTotalExposurePercent: 30, maxPositionPercent: 10
    };
    const writeDraft = (cookie, value) => call("/api/member/rhen/draft", cookie, {
      method: "PUT",
      headers: { Origin: base, "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
    const removeDraft = cookie => call("/api/member/rhen/draft", cookie, {
      method: "DELETE", headers: { Origin: base }
    });
    const changed = [false, false];
    let primaryFailure = null;
    try {
      await expectStatus("save draft A", await writeDraft(cookieA, sampleA), [200]);
      changed[0] = true;
      const afterA = await readDraft("read updated draft A", cookieA);
      const unchangedB = await readDraft("read untouched draft B", cookieB);
      if (!sameEditableDraft(afterA, sampleA) || !sameDraft(unchangedB, originalB)) {
        throw new Error("RHEN draft A write leaked into account B.");
      }

      await expectStatus("save draft B", await writeDraft(cookieB, sampleB), [200]);
      changed[1] = true;
      const afterBothA = await readDraft("isolation read A", cookieA);
      const afterBothB = await readDraft("isolation read B", cookieB);
      if (!sameEditableDraft(afterBothA, sampleA) ||
          !sameEditableDraft(afterBothB, sampleB)) {
        throw new Error("RHEN draft cross-account isolation failed.");
      }
      const afterExportA = await readExport("isolation export A", cookieA, a.user.id, b.user.id);
      const afterExportB = await readExport("isolation export B", cookieB, b.user.id, a.user.id);
      if (!sameDraft(afterExportA.rhenDraft, afterBothA) ||
          !sameDraft(afterExportB.rhenDraft, afterBothB)) {
        throw new Error("RHEN draft export leaked across accounts.");
      }
      checks.push("real two-account RHEN draft write, read, and export isolation");
    } catch (error) {
      primaryFailure = error;
    } finally {
      const restoreFailures = [];
      for (const [i, label, cookie, initial] of [
        [0, "A", cookieA, originalA],
        [1, "B", cookieB, originalB]
      ]) {
        if (!changed[i]) continue;
        try {
          const response = initial
            ? await writeDraft(cookie, draftWritePayload(initial))
            : await removeDraft(cookie);
          await expectStatus("restore draft " + label, response, [200]);
          const restored = await readDraft("verify restored draft " + label, cookie);
          // Update timestamps legitimately change on restoration.
          if (!sameEditableDraft(restored, initial)) {
            throw new Error("Restored draft label mismatch " + label);
          }
        } catch {
          restoreFailures.push(label);
        }
      }
      if (restoreFailures.length) {
        throw new Error("Manual draft restoration required for test account(s): " +
          restoreFailures.join(", "));
      }
    }
    if (primaryFailure) throw primaryFailure;

    // Saved-app state is preserved even if the persistence assertion fails.
    for (const [label, cookie, original] of [
      ["A", cookieA, a], ["B", cookieB, b]
    ]) {
      const initiallySaved = original.savedApps?.includes("rhen") || false;
      try {
        await expectStatus("write saved app " + label,
          await call("/api/member/saved-apps/rhen", cookie, {
            method: "PUT", headers: { Origin: base }
          }), [200]);
        const updated = await asJson("read updated app " + label,
          await call("/api/member/me", cookie));
        if (!updated.savedApps?.includes("rhen")) {
          throw new Error("Saved app did not persist for " + label);
        }
      } finally {
        if (!initiallySaved) {
          await expectStatus("restore saved app " + label,
            await call("/api/member/saved-apps/rhen", cookie, {
              method: "DELETE", headers: { Origin: base }
            }), [200]);
        }
      }
    }
  }
  return { ok: true, tested: checks.length, checks, writesExercised: exerciseWrites };
}

const isDirect = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  runAcceptance({
    origin: process.env.ANEVUM_TEST_ORIGIN,
    cookieA: process.env.ANEVUM_TEST_COOKIE_A,
    cookieB: process.env.ANEVUM_TEST_COOKIE_B,
    exerciseWrites: process.argv.includes("--exercise-writes")
  }).then(result => {
    console.log("Member staging acceptance: PASS (" + result.tested +
      " checks; writes: " + (result.writesExercised ? "restored" : "not run") + ")");
    result.checks.forEach(label => console.log("PASS " + label));
  }).catch(error => {
    console.error("Member staging acceptance: FAIL: " + error.message);
    process.exitCode = 1;
  });
}
