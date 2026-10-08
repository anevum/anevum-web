// Preview-only two-member release acceptance. No user tokens are logged.
// Requires two REAL independent test accounts signed in via the configured Google OAuth callback.
// Usage: ANEVUM_TEST_ORIGIN=https://members-test.anevum.com \
//   ANEVUM_TEST_COOKIE_A=... ANEVUM_TEST_COOKIE_B=... \
//   node scripts/verify-member-staging.mjs
// Mutating the two test accounts requires explicit --exercise-writes.
// No production origin is accepted. Cookies must be supplied as environment variables.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function stagingOrigin(raw) {
  const url = new URL(String(raw || ""));
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" || url.username || url.password ||
    url.port || url.pathname !== "/" || url.search || url.hash ||
    host === "anevum.com" ||
    !(host.endsWith(".anevum.com") || host.endsWith(".workers.dev"))
  ) throw new Error("A dedicated HTTPS staging origin is required; production is forbidden.");
  return url.origin;
}

export async function runAcceptance({
  origin, cookieA, cookieB, exerciseWrites = false, request = fetch
}) {
  const base = stagingOrigin(origin);
  if (!cookieA || !cookieB || cookieA === cookieB) {
    throw new Error("Two different real staging session cookies are required.");
  }
  const checks = [];
  const call = async (path, cookie, options = {}) => {
    const response = await request(base + path, {
      redirect: "manual",
      cache: "no-store",
      ...options,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(options.headers || {})
      }
    });
    return response;
  };
  const expectStatus = async (label, response, codes) => {
    if (!codes.includes(response.status)) {
      throw new Error(label + " returned HTTP " + response.status + ", expected " + codes.join("/"));
    }
    checks.push(label);
  };
  const asJson = async (label, response) => {
    await expectStatus(label, response, [200]);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(label + " did not return JSON.");
    }
    return response.json();
  };
  const availability = await asJson("preview availability", await call("/api/member/availability"));
  if (availability.available !== true || availability.provider !== "google") {
    throw new Error("Preview OAuth/D1 readiness is not enabled.");
  }
  const a = await asJson("account A", await call("/api/member/me", cookieA));
  const b = await asJson("account B", await call("/api/member/me", cookieB));
  if (!a?.user?.id || !b?.user?.id || a.user.id === b.user.id) {
    throw new Error("Session isolation failed: both sessions resolved to the same member.");
  }
  for (const [label, cookie] of [["A", cookieA], ["B", cookieB]]) {
    const session = await asJson("session " + label, await call("/api/member/session", cookie));
    if (session.user?.id !== (label === "A" ? a.user.id : b.user.id)) {
      throw new Error("Session " + label + " returned an unexpected user.");
    }
    const exportResponse = await call("/api/member/export", cookie);
    const exported = await asJson("export " + label, exportResponse);
    if (exported.identity?.id !== session.user.id ||
        exported.identity?.id === (label === "A" ? b.user.id : a.user.id)) {
      throw new Error("Member export ownership mismatch.");
    }
    if (exportResponse.headers.get("cache-control") !== "private, no-store") {
      throw new Error("Member export is missing private no-store.");
    }
  }
  await expectStatus("anonymous member API denial", await call("/api/member/me"), [401]);
  await expectStatus("anonymous member export denial", await call("/api/member/export"), [401]);
  await expectStatus("anonymous operator API denial",
    await call("/api/command/trader/status", cookieA), [401, 403]);
  await expectStatus("anonymous operator API denial B",
    await call("/api/command/trader/status", cookieB), [401, 403]);

  const invalidOriginWrite = await call("/api/member/saved-apps/rhen", cookieA, {
    method: "PUT", headers: { Origin: "https://untrusted.example" }
  });
  await expectStatus("cross-site mutation denial", invalidOriginWrite, [403]);
  if (exerciseWrites) {
    // Only operate on dedicated staging member accounts. Save/follow state is
    // restored in finally, preserving the initial boolean for each test user.
    for (const [label, cookie, original] of [["A", cookieA, a], ["B", cookieB, b]]) {
      const initial = original.savedApps?.includes("rhen") || false;
      try {
        await expectStatus("write saved app " + label, await call("/api/member/saved-apps/rhen", cookie, {
          method: "PUT", headers: { Origin: base }
        }), [200]);
        const updated = await asJson("read updated " + label, await call("/api/member/me", cookie));
        if (!updated.savedApps?.includes("rhen")) {
          throw new Error("Saved app was not persisted for " + label);
        }
      } finally {
        if (!initial) {
          await expectStatus("restore saved app " + label, await call("/api/member/saved-apps/rhen", cookie, {
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
  }).then((result) => {
    console.log("Member staging acceptance: PASS (" + result.tested +
      " checks; writes: " + (result.writesExercised ? "restored" : "not run") + ")");
    result.checks.forEach((label) => console.log("PASS " + label));
  }).catch((error) => {
    console.error("Member staging acceptance: FAIL: " + error.message);
    process.exitCode = 1;
  });
}
