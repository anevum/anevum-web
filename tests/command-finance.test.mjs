import test from "node:test";
import assert from "node:assert/strict";
import { proxyFinance } from "../command-finance.mjs";

const credential = {
  token: "access-jwt",
  source: "cloudflare_access"
};

test("Finance GET forwards Cloudflare Access to Foundation", async () => {
  const request = new Request("https://anevum.com/api/command/finance");
  const response = await proxyFinance(
    request,
    async (url, init) => {
      assert.equal(url, "https://foundation.example/v1/command/finance");
      assert.equal(init.method, "GET");
      assert.equal(init.headers["cf-access-jwt-assertion"], "access-jwt");
      return Response.json({
        schema_version: "anevum-finance.v1",
        initialized: true,
        external_money_movement_enabled: false,
        live_execution_authorized: false
      });
    },
    {
      credential,
      foundationUrl: "https://foundation.example/v1/command/finance"
    }
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).initialized, true);
});

test("Finance POST forwards sandbox mutation body", async () => {
  const request = new Request("https://anevum.com/api/command/finance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "sandbox_deposit", amount: "10" })
  });
  const response = await proxyFinance(
    request,
    async (_url, init) => {
      assert.equal(init.method, "POST");
      assert.match(String(init.body), /sandbox_deposit/);
      return Response.json({
        schema_version: "anevum-finance.v1",
        initialized: true,
        external_money_movement_enabled: false,
        live_execution_authorized: false
      });
    },
    {
      credential,
      foundationUrl: "https://foundation.example/v1/command/finance"
    }
  );
  assert.equal(response.status, 200);
});

test("Finance fails closed if upstream claims live authority", async () => {
  const response = await proxyFinance(
    new Request("https://anevum.com/api/command/finance"),
    async () => Response.json({
      schema_version: "anevum-finance.v1",
      external_money_movement_enabled: false,
      live_execution_authorized: true
    }),
    {
      credential,
      foundationUrl: "https://foundation.example/v1/command/finance"
    }
  );
  assert.equal(response.status, 503);
});

test("Finance rejects non-Access credential source", async () => {
  const response = await proxyFinance(
    new Request("https://anevum.com/api/command/finance"),
    async () => { throw new Error("must not call"); },
    {
      credential: { token: "legacy", source: "supabase" },
      foundationUrl: "https://foundation.example/v1/command/finance"
    }
  );
  assert.equal(response.status, 401);
});
