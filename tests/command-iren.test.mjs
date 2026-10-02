import test from "node:test";
import assert from "node:assert/strict";
import { proxyIren } from "../command-iren.mjs";

const credential = {
  token: "access-jwt",
  source: "cloudflare_access"
};

test("IREN GET forwards the Access assertion to Foundation", async () => {
  const request = new Request("https://anevum.com/api/command/iren/status");
  const response = await proxyIren(
    request,
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
      credential,
      foundationUrl: "https://foundation.example/v1/command/iren"
    }
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).state, "HEALTHY");
});

test("IREN POST forwards operator command", async () => {
  const request = new Request("https://anevum.com/api/command/iren/command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command: "what's next?" })
  });
  const response = await proxyIren(
    request,
    async (_url, init) => {
      assert.equal(init.method, "POST");
      assert.equal(init.headers["cf-access-jwt-assertion"], "access-jwt");
      assert.match(String(init.body), /what's next/);
      return Response.json({
        schema_version: "iren_command.v2",
        accepted: true,
        command: { command_id: "1", status: "QUEUED" }
      }, { status: 202 });
    },
    {
      credential,
      foundationUrl: "https://foundation.example/v1/command/iren"
    }
  );
  assert.equal(response.status, 202);
  assert.equal((await response.json()).accepted, true);
});

test("IREN rejects missing Access credential", async () => {
  const response = await proxyIren(
    new Request("https://anevum.com/api/command/iren/status"),
    async () => {
      throw new Error("must not call upstream");
    },
    { foundationUrl: "https://foundation.example/v1/command/iren" }
  );
  assert.equal(response.status, 401);
});

test("IREN rejects legacy credential source", async () => {
  const response = await proxyIren(
    new Request("https://anevum.com/api/command/iren/status"),
    async () => {
      throw new Error("must not call upstream");
    },
    {
      credential: { token: "legacy", source: "supabase" },
      foundationUrl: "https://foundation.example/v1/command/iren"
    }
  );
  assert.equal(response.status, 401);
});

test("IREN rejects unsupported verb", async () => {
  const response = await proxyIren(
    new Request("https://anevum.com/api/command/iren/status", { method: "DELETE" }),
    async () => {
      throw new Error("must not call upstream");
    },
    {
      credential,
      foundationUrl: "https://foundation.example/v1/command/iren"
    }
  );
  assert.equal(response.status, 405);
});

test("IREN fails closed on invalid upstream contract", async () => {
  const response = await proxyIren(
    new Request("https://anevum.com/api/command/iren/status"),
    async () => Response.json({ schema_version: "wrong" }),
    {
      credential,
      foundationUrl: "https://foundation.example/v1/command/iren"
    }
  );
  assert.equal(response.status, 503);
});


test("completed command result contract uses canonical result field", async () => {
  const body = {
    schema_version: "iren_command.v2",
    state: "DEGRADED",
    stale: false,
    work: {
      commands: [{
        command_id: "cmd-1",
        command_text: "status",
        status: "SUCCEEDED",
        result: { message: "Current IREN status." }
      }]
    }
  };
  const response = await proxyIren(
    new Request("https://anevum.com/api/command/iren/status"),
    async () => Response.json(body),
    {
      credential,
      foundationUrl: "https://foundation.example/v1/command/iren"
    }
  );
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.work.commands[0].result.message, "Current IREN status.");
});

test("canonical handoff prompt and verification blockers survive the existing proxy", async () => {
  const prompt = "Inspect CURRENT main.\nObjective: implement the scoped capability.\nNo expanded authority.";
  const handoff = {handoff_id:"h-1",objective_key:"iren.example",handoff_status:"VERIFYING",
    package:{prompt,base_sha:"a".repeat(40)},verification:{verified:false,blockers:["deployment_not_verified:IREN"]}};
  const response = await proxyIren(new Request("https://anevum.com/api/command/iren/status"),
    async () => Response.json({schema_version:"iren_command.v2",work:{handoffs:[handoff],execution_mode:"codex/manual software"}}),
    {credential,foundationUrl:"https://foundation.example/v1/command/iren"});
  const body = await response.json();
  assert.deepEqual(body.work.handoffs[0], handoff);
  assert.equal(body.work.handoffs[0].package.prompt, prompt);
});
