import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const command = readFileSync(new URL("../src/pages/Command.tsx", import.meta.url), "utf8");
const customer = readFileSync(new URL("../src/components/CommandCustomer.tsx", import.meta.url), "utf8");
const auth = readFileSync(new URL("../src/lib/auth.ts", import.meta.url), "utf8");
const platform = readFileSync(new URL("../src/lib/command-platform.ts", import.meta.url), "utf8");
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
  assert.match(customer, /Live customer trading remains disabled/);
  assert.match(customer, /cannot authorize live trading, withdrawals, or funding movement/);
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
  assert.match(customer, /LAST RECONCILIATION/);
  assert.match(customer, /What actually happened/);
  assert.match(customer, /No decorative activity/);
  assert.match(customer, /Save allocation/);
  assert.match(customer, /Save risk profile/);
  assert.match(customer, /Pause RHEN/);
});


test("customer Command never equates consent with an active executor", () => {
  assert.match(customer, /tenant_execution_runtime_unavailable/);
  assert.match(customer, /EXECUTOR PENDING/);
  assert.match(customer, /executionReady/);
  assert.match(customer, /orders remain blocked until the tenant executor/);
  assert.doesNotMatch(customer, /botEnabled \? "RHEN PAPER ACTIVE"/);
});


test("operator Command fails closed if its email allowlist is missing", () => {
  assert.match(worker, /Command operator allowlist is not configured/);
  assert.match(worker, /const commandAdmin = allowed\.has\(email\)/);
  assert.doesNotMatch(worker, /allowed\.size === 0 \|\| allowed\.has\(email\)/);
});
