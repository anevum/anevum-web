import test from "node:test";
import assert from "node:assert/strict";
import { proxyIren } from "../command-iren.mjs";

const access = {
  credential: { token: "access-jwt", source: "cloudflare_access" },
  foundationUrl: "https://foundation.example/v1/command/iren"
};

test("IREN GET forwards Cloudflare Access assertion to Foundation", async () => {
  const request = new Request("https://anevum.com/api/command/iren/status");
  const response = await proxyIren(request, async (url, init) => {
    assert.equal(url, access.foundationUrl);
    assert.equal(init.method, "GET");
    assert.equal(init.headers["cf-access-jwt-assertion"], "access-jwt");
    assert.equal(init.headers.authorization, undefined);
    return Response.json({
      schema_version: "iren_command.v2",
      state: "HEALTHY",
      stale: false
    });
  }, access);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).state, "HEALTHY");
});

test("IREN POST forwards operator command through Access", async () => {
  const request = new Request("https://anevum.com/api/command/iren/command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command: "what's next?" })
  });
  const response = await proxyIren(request, async (_url, init) => {
    assert.equal(init.method, "POST");
    assert.equal(init.headers["cf-access-jwt-assertion"], "access-jwt");
    assert.match(String(init.body), /what's next/);
    return Response.json({
      schema_version: "iren_command.v2",
      accepted: true,
      command: { command_id: "1", status: "QUEUED" }
    }, { status: 202 });
  }, access);
  assert.equal(response.status, 202);
  assert.equal((await response.json()).accepted, true);
});

test("IREN rejects missing Access credential", async () => {
  const response = await proxyIren(
    new Request("https://anevum.com/api/command/iren/status")
  );
  assert.equal(response.status, 401);
});

test("IREN rejects unsupported verb", async () => {
  const response = await proxyIren(
    new Request("https://anevum.com/api/command/iren/status", { method: "DELETE" }),
    fetch,
    access
  );
  assert.equal(response.status, 405);
});

test("IREN fails closed on invalid upstream contract", async () => {
  const request = new Request("https://anevum.com/api/command/iren/status");
  const response = await proxyIren(
    request,
    async () => Response.json({ schema_version: "wrong" }),
    access
  );
  assert.equal(response.status, 503);
});

test("IREN rejects non-Access credential sources", async () => {
  const response = await proxyIren(
    new Request("https://anevum.com/api/command/iren/status"),
    fetch,
    {
      credential: { token: "legacy-token", source: "legacy" },
      foundationUrl: access.foundationUrl
    }
  );
  assert.equal(response.status, 401);
});
