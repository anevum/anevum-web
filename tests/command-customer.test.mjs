import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
const customer = readFileSync(new URL("../src/components/CommandCustomer.tsx", import.meta.url), "utf8");
const auth = readFileSync(new URL("../src/lib/auth.ts", import.meta.url), "utf8");
const platform = readFileSync(new URL("../src/lib/command-platform.ts", import.meta.url), "utf8");
const customerApi = readFileSync(new URL("../src/lib/command-customer.ts", import.meta.url), "utf8");
const worker = readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");

test("tenant identities render a dedicated customer Command", () => {
  assert.match(command, /CommandCustomer/);
  assert.match(command, /if \(!commandAdmin\)/);
  assert.match(command, /<CommandCustomer session=\{session\}/);
  assert.doesNotMatch(customer, /CommandIrenDock/);
  assert.doesNotMatch(customer, /IREN Command/);
  assert.doesNotMatch(customer, /position\/close/);
  assert.doesNotMatch(customer, /orders\/cancel/);
});

test("session model separates operator and customer authority", () => {
  assert.match(auth, /surface: "operator" \| "customer"/);
  assert.match(auth, /command_admin: boolean/);
  assert.match(auth, /tenants: CommandTenant\[\]/);
  assert.match(auth, /if \(!admin && tenants\.length === 0\) return null/);
});

test("customer API is paper-only and does not expose withdrawals", () => {
  assert.match(platform, /startCustomerAlpacaPaperOauth/);
  assert.match(platform, /https:\/\/anevum\.com\/api\/command\/platform\/alpaca\/callback/);
  assert.match(customer, /Live authority/);
  assert.match(customer, /cannot bypass IREN, broker, release, risk, or tenant-executor gates/);
  assert.doesNotMatch(platform, /\/withdraw/);
  assert.doesNotMatch(platform, /\/deposit/);
  assert.doesNotMatch(platform, /withdrawCustomer/);
  assert.doesNotMatch(platform, /depositCustomer/);
});

test("worker preserves admin routes while allowing tenant platform sessions", () => {
  assert.match(worker, /allowTenant/);
  assert.match(worker, /FOUNDATION_PLATFORM_BASE/);
  assert.match(worker, /\/api\/command\/platform\/alpaca\/callback/);
  assert.match(worker, /Customer Command mutations are disabled outside production/);
  assert.match(worker, /command_admin: true/);
  assert.match(worker, /surface: "operator"/);
});

test("customer console reports real onboarding, reconciliation and activity", () => {
  assert.match(customer, /Paper onboarding/);
  assert.match(customer, /Reconciliation/);
  assert.match(customer, /What actually happened/);
  assert.match(customer, /Save allocation/);
  assert.match(customer, /Save guardrails/);
  assert.match(customer, /Pause RHEN/);
});


test("customer Command never equates consent with an active executor", () => {
  assert.match(customer, /executionReady/);
  assert.match(customer, /No active execution is implied by setup state/);
  assert.match(customer, /ENABLED \/ WAITING/);
  assert.match(customer, /EXECUTION GATES/);
  assert.doesNotMatch(customer, /botEnabled \? "RHEN PAPER ACTIVE"/);
});


test("operator Command fails closed if its email allowlist is missing", () => {
  assert.match(worker, /Command operator allowlist is not configured/);
  assert.match(worker, /const commandAdmin = allowed\.has\(email\)/);
  assert.doesNotMatch(worker, /allowed\.size === 0 \|\| allowed\.has\(email\)/);
});


test("customer Command consumes derived lifecycle and broker funding", () => {
  assert.match(platform, /command_customer\.v2/);
  assert.match(platform, /lifecycle\?:/);
  assert.match(platform, /funding\?:/);
  assert.match(customer, /lifecycleState/);
  assert.match(customer, /Crypto capacity/);
  assert.match(customer, /Alpaca source of truth/);
  assert.match(customer, /not a competing customer balance/);
  assert.match(customer, /nextAction/);
});


test("worker proxies stable customer read surfaces", () => {
  assert.match(worker, /FOUNDATION_COMMAND_BASE/);
  for (const route of [
    "/api/command/account",
    "/api/command/overview",
    "/api/command/trading",
    "/api/command/money",
    "/api/command/activity"
  ]) {
    assert.match(worker, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.match(worker, /proxyCustomerProjection/);
  assert.match(worker, /allowTenant: true/);
});


test("customer read client uses stable product surfaces only", () => {
  for (const surface of ["account", "overview", "trading", "money", "activity"]) {
    assert.match(customerApi, new RegExp('"' + surface + '"'));
  }
  assert.match(customerApi, /\/api\/command\/"/);
  assert.doesNotMatch(customerApi, /\/platform\/allocation/);
  assert.doesNotMatch(customerApi, /control\/resume/);
  assert.doesNotMatch(customerApi, /control\/pause/);
});


test("customer product uses the simplified routed navigation", () => {
  for (const route of ["overview", "trading", "money", "activity", "settings", "system"]) {
    assert.match(customer, new RegExp('page: "' + route + '"'));
  }
  assert.match(customer, /to=\{"\/command\/" \+ item\.page\}/);
  assert.match(customer, /Overview/);
  assert.match(customer, /Trading/);
  assert.match(customer, /Money/);
  assert.match(customer, /Activity/);
  assert.match(customer, /Settings/);
  assert.match(customer, /Advanced transparency/);
});
