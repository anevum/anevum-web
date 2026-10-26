import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createHouseServer } from "../server.mjs";
import { validateAccessConfiguration } from "../src/identity.mjs";

async function withServer(env, fn) {
  const server = createHouseServer({ env });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + server.address().port;
  try { await fn(base); } finally { await new Promise((resolve) => server.close(resolve)); }
}

test("hosted mode denies access without identity configuration", async () => {
  await withServer({ NODE_ENV: "production" }, async (base) => {
    const health = await fetch(base + "/healthz");
    assert.equal(health.status, 200);
    const denied = await fetch(base + "/");
    assert.equal(denied.status, 503);
    const api = await fetch(base + "/api/session");
    assert.equal(api.status, 503);
  });
});
test("local synthetic access works only in explicit development mode", async () => {
  await withServer({ HOUSE_LOCAL_DEMO: "1", NODE_ENV: "test" }, async (base) => {
    const response = await fetch(base + "/api/session");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.identity.mode, "synthetic");
    const page = await fetch(base + "/");
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-security-policy"), /script-src 'self'/);
  });
});
test("commands require same-origin and never execute external work", async () => {
  await withServer({ HOUSE_LOCAL_DEMO: "1", NODE_ENV: "test" }, async (base) => {
    const denied = await fetch(base + "/api/command", {
      method: "POST", headers: { Origin: "https://attacker.example", "Content-Type": "application/json" },
      body: JSON.stringify({ command: "show status" })
    });
    assert.equal(denied.status, 403);
    const allowed = await fetch(base + "/api/command", {
      method: "POST", headers: { Origin: base, "Content-Type": "application/json" },
      body: JSON.stringify({ command: "deploy now" })
    });
    assert.equal(allowed.status, 200);
    const result = await allowed.json();
    assert.equal(result.kind, "restricted");
    assert.equal(result.execution, "read-only");
    const write = await fetch(base + "/api/family-preview", {
      method: "POST", headers: { Origin: base }, body: "{}"
    });
    assert.equal(write.status, 405);
  });
});
test("Access configuration requires valid restricted fields", () => {
  assert.equal(validateAccessConfiguration({}), false);
  assert.equal(validateAccessConfiguration({
    HOUSE_CF_TEAM_DOMAIN: "unit.cloudflareaccess.com",
    HOUSE_CF_AUD: "audience12345678",
    HOUSE_OWNER_EMAIL: "owner@example.org",
    HOUSE_PUBLIC_ORIGIN: "https://house.example.org"
  }), true);
  assert.equal(validateAccessConfiguration({
    HOUSE_CF_TEAM_DOMAIN: "attacker.example",
    HOUSE_CF_AUD: "audience12345678",
    HOUSE_OWNER_EMAIL: "owner@example.org",
    HOUSE_PUBLIC_ORIGIN: "https://house.example.org"
  }), false);
});
test("family preview is explicitly nonpersistent and synthetic", async () => {
  await withServer({ HOUSE_LOCAL_DEMO: "1", NODE_ENV: "test" }, async (base) => {
    const result = await (await fetch(base + "/api/family-preview")).json();
    assert.equal(result.synthetic, true);
    assert.equal(result.persistent, false);
    assert.equal(result.synchronized, false);
    assert.equal(result.explorers.length, 2);
  });
});
