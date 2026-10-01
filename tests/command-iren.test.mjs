import test from "node:test";
import assert from "node:assert/strict";
import { proxyIren } from "../command-iren.mjs";

const admin = async () => {};

test("IREN GET proxies authenticated v2 state", async () => {
  const request = new Request("https://anevum.com/api/command/iren/status", {
    headers: { authorization: "Bearer abc" }
  });
  const response = await proxyIren(request, admin, async (_url, init) => {
    assert.equal(init.method, "GET");
    assert.equal(init.headers.authorization, "Bearer abc");
    return new Response(JSON.stringify({ schema_version: "iren_command.v2", state: "HEALTHY" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).state, "HEALTHY");
});

test("IREN POST forwards operator command", async () => {
  const request = new Request("https://anevum.com/api/command/iren/command", {
    method: "POST",
    headers: { authorization: "Bearer abc", "content-type": "application/json" },
    body: JSON.stringify({ command: "what's next?" })
  });
  const response = await proxyIren(request, admin, async (_url, init) => {
    assert.equal(init.method, "POST");
    assert.match(String(init.body), /what's next/);
    return new Response(JSON.stringify({
      schema_version: "iren_command.v2",
      accepted: true,
      command: { command_id: "1", status: "QUEUED" }
    }), {
      status: 202,
      headers: { "content-type": "application/json" }
    });
  });
  assert.equal(response.status, 202);
  assert.equal((await response.json()).accepted, true);
});

test("IREN rejects missing token", async () => {
  const response = await proxyIren(new Request("https://anevum.com/api/command/iren/status"), admin);
  assert.equal(response.status, 401);
});

test("IREN rejects unsupported verb", async () => {
  const response = await proxyIren(new Request("https://anevum.com/api/command/iren/status", {
    method: "DELETE",
    headers: { authorization: "Bearer abc" }
  }), admin);
  assert.equal(response.status, 405);
});

test("IREN fails closed on invalid upstream contract", async () => {
  const request = new Request("https://anevum.com/api/command/iren/status", {
    headers: { authorization: "Bearer abc" }
  });
  const response = await proxyIren(request, admin, async () =>
    new Response(JSON.stringify({ schema_version: "wrong" }), { status: 200 })
  );
  assert.equal(response.status, 503);
});


test("Cloudflare Access IREN requests use Foundation and forward the assertion", async () => {
  const request = new Request("https://anevum.com/api/command/iren/status");
  const response = await proxyIren(
    request,
    async () => { throw new Error("legacy auth must not run"); },
    async (url, init) => {
      assert.equal(url, "https://foundation.example/v1/command/iren");
      assert.equal(init.method, "GET");
      assert.equal(init.headers["cf-access-jwt-assertion"], "access-jwt");
      assert.equal(init.headers.authorization, undefined);
      return Response.json({
        schema_version: "iren_command.v2",
        state: "HEALTHY",
        stale: false
      });
    },
    {
      credential: { token: "access-jwt", source: "cloudflare_access" },
      foundationUrl: "https://foundation.example/v1/command/iren"
    }
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).state, "HEALTHY");
});
