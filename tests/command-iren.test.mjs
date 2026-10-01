import test from "node:test";
import assert from "node:assert/strict";
import { proxyIren } from "../command-iren.mjs";

const admin = async () => {};

test("IREN GET preserves legacy Supabase session path during transition", async () => {
  const request = new Request("https://anevum.com/api/command/iren/status", {
    headers: { authorization: "Bearer abc" }
  });
  let checked = false;
  const response = await proxyIren(request, async (token) => {
    checked = true;
    assert.equal(token, "abc");
  }, async (url, init) => {
    assert.match(String(url), /supabase\.co\/functions\/v1\/iren-command$/);
    assert.equal(init.method, "GET");
    assert.equal(init.headers.authorization, "Bearer abc");
    return new Response(JSON.stringify({ schema_version: "iren_command.v2", state: "HEALTHY" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });
  assert.equal(checked, true);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).state, "HEALTHY");
});

test("IREN Access GET routes to Railway without Supabase admin call", async () => {
  const request = new Request("https://anevum.com/api/command/iren/status", {
    headers: { "Cf-Access-Jwt-Assertion": "access.jwt.value" }
  });
  let adminCalls = 0;
  const response = await proxyIren(request, async () => {
    adminCalls += 1;
  }, async (url, init) => {
    assert.equal(
      url,
      "https://foundation-ingest-staging.up.railway.app/v1/command/iren"
    );
    assert.equal(init.method, "GET");
    assert.equal(init.headers["Cf-Access-Jwt-Assertion"], "access.jwt.value");
    assert.equal(init.headers.authorization, undefined);
    return new Response(JSON.stringify({ schema_version: "iren_command.v2", state: "HEALTHY" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });
  assert.equal(adminCalls, 0);
  assert.equal(response.status, 200);
});

test("IREN Access POST forwards operator command to Railway", async () => {
  const request = new Request("https://anevum.com/api/command/iren/command", {
    method: "POST",
    headers: {
      "Cf-Access-Jwt-Assertion": "access.jwt.value",
      "content-type": "application/json"
    },
    body: JSON.stringify({ command: "what's next?" })
  });
  const response = await proxyIren(request, admin, async (url, init) => {
    assert.equal(
      url,
      "https://foundation-ingest-staging.up.railway.app/v1/command/iren"
    );
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

test("IREN rejects missing authentication", async () => {
  const response = await proxyIren(
    new Request("https://anevum.com/api/command/iren/status"),
    admin
  );
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
