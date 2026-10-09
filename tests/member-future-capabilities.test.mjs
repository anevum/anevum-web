import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { memberRewardsStatus, memberBrokerageStatus } from "../src/server/member-capabilities.mjs";
import { memberEndpoint } from "../src/server/member.mjs";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("unlaunched rewards contract cannot invent monetary credit or payout authority", () => {
  const status = memberRewardsStatus();
  assert.equal(status.program, "not_launched");
  assert.equal(status.earningEnabled, false);
  assert.equal(status.payoutEnabled, false);
  assert.equal(status.availableBalanceCents, null);
  assert.deepEqual(status.history, []);
  assert.equal(Object.isFrozen(status), true);
});

test("member brokerage contract never grants paper, live, or transfer authority", () => {
  const status = memberBrokerageStatus();
  for (const key of [
    "connectionAvailable", "accountConnected", "paperTradingEnabled",
    "liveTradingEnabled", "depositsEnabled", "withdrawalsEnabled"
  ]) assert.equal(status[key], false, key);
  assert.equal(status.account, null);
  assert.equal(Object.isFrozen(status), true);
});

test("future member money and brokerage endpoints fail closed before member launch", async () => {
  for (const path of ["/api/member/rewards", "/api/member/brokerage"]) {
    for (const method of ["GET", "POST", "DELETE"]) {
      const response = await memberEndpoint(
        new Request("https://anevum.com" + path, { method }),
        { ANEVUM_MEMBERS_ENABLED: "false" },
        path
      );
      assert.equal(response.status, 503, path + " " + method);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
    }
  }
});

test("backend protects member financial status with authenticated session and read-only methods", () => {
  const members = source("src/server/member.mjs");
  assert.ok(members.indexOf("if (!user?.id)") < members.indexOf('pathname === "/api/member/rewards"'));
  assert.ok(members.indexOf("if (!user?.id)") < members.indexOf('pathname === "/api/member/brokerage"'));
  assert.match(members, /memberRewardsStatus\(\)/);
  assert.match(members, /memberBrokerageStatus\(\)/);
  assert.doesNotMatch(members, /member_reward_ledger|brokerage_order|createTransfer/);
});

test("member money UI is inert, separates operator terminal and preserves launch gates", () => {
  const app = source("src/App.tsx");
  const page = source("src/pages/MemberRewards.tsx");
  const rhen = source("src/pages/RhenApp.tsx");
  const config = JSON.parse(source("wrangler.jsonc"));
  assert.match(app, /path="\/me\/rewards"/);
  assert.match(rhen, /path: "\/apps\/rhen\/account"/);
  assert.match(page, /No credits are accruing/);
  assert.match(page, /not a return on investment/i);
  assert.doesNotMatch(page, /\$100|guaranteed|Connect Alpaca|Deposit now/);
  assert.equal(config.vars.ANEVUM_MEMBERS_ENABLED, "false");
  assert.match(app, /path="\/command\/rhen\/\*"/);
});
