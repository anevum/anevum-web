import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isConfiguredOwnerMember, hasBoundOwnerTerminalAccess,
  ownerDualAuthEnabled, isCompanyTerminalPath, memberTerminalStatus
} from "../src/server/member-terminal.mjs";

const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const env = {
  ANEVUM_OWNER_MEMBER_ID: "owner-id-immutable-123",
  ANEVUM_OWNER_ACCESS_EMAIL: "owner@example.org",
  ANEVUM_OWNER_TERMINAL_DUAL_AUTH: "true"
};
const owner = { id: "owner-id-immutable-123", emailVerified: true, email: "owner@example.org" };
const memberB = { id: "member-b-123", emailVerified: true, email: "member@example.org" };
const access = { email: "owner@example.org", source: "cloudflare_access" };

test("only immutable verified member ID is the owner; email or name do not grant it", () => {
  assert.equal(isConfiguredOwnerMember(owner, env), true);
  assert.equal(isConfiguredOwnerMember(memberB, env), false);
  assert.equal(isConfiguredOwnerMember({ ...memberB, email: owner.email, name: "Owner" }, env), false);
  assert.equal(isConfiguredOwnerMember({ ...owner, emailVerified: false }, env), false);
  assert.equal(isConfiguredOwnerMember(owner, { ...env, ANEVUM_OWNER_MEMBER_ID: "" }), false);
  assert.equal(isConfiguredOwnerMember(owner, { ...env, ANEVUM_OWNER_MEMBER_ID: " other " }), false);
});

test("cached owner Access does not elevate a different ANEVUM member", () => {
  assert.equal(hasBoundOwnerTerminalAccess(owner, access, env), true);
  assert.equal(hasBoundOwnerTerminalAccess(memberB, access, env), false);
  assert.equal(hasBoundOwnerTerminalAccess(null, access, env), false);
  assert.equal(hasBoundOwnerTerminalAccess(owner, null, env), false);
  assert.equal(hasBoundOwnerTerminalAccess(owner, { ...access, email: "other@example.org" }, env), false);
  assert.equal(hasBoundOwnerTerminalAccess(owner, { ...access, source: "forged" }, env), false);
  assert.equal(hasBoundOwnerTerminalAccess(owner, access, { ...env, ANEVUM_OWNER_ACCESS_EMAIL: "" }), false);
});

test("strict operator cutover is opt-in only", () => {
  assert.equal(ownerDualAuthEnabled({}), false);
  assert.equal(ownerDualAuthEnabled({ ANEVUM_OWNER_TERMINAL_DUAL_AUTH: "false" }), false);
  assert.equal(ownerDualAuthEnabled({ ANEVUM_OWNER_TERMINAL_DUAL_AUTH: "true" }), true);
  for (const path of ["/command/rhen", "/command/rhen/operate", "/api/command", "/api/command/session", "/api/command/trader/status", "/api/command/stream"]) {
    assert.equal(isCompanyTerminalPath(path), true, path);
  }
  for (const path of ["/command", "/me", "/apps/rhen/terminal", "/api/member/rhen/terminal", "/api/public/trading/live"]) {
    assert.equal(isCompanyTerminalPath(path), false, path);
  }
});

test("personal terminal status has no company broker credentials, P/L, orders, or execution authority", () => {
  const statusB = memberTerminalStatus(memberB, env);
  assert.equal(statusB.terminalScope, "personal");
  assert.equal(statusB.ownerMember, false);
  assert.equal(statusB.connectionAvailable, false);
  assert.equal(statusB.brokerageConnected, false);
  assert.equal(statusB.paperTradingEnabled, false);
  assert.equal(statusB.liveTradingEnabled, false);
  assert.equal(statusB.personalBotRunning, false);
  assert.equal(statusB.account, null);
  assert.equal(statusB.portfolio, null);
  assert.equal(statusB.orders, null);
  assert.equal(statusB.positions, null);
  assert.ok(!("alpacaApiKey" in statusB));
  assert.equal(memberTerminalStatus(owner, env).ownerMember, true);
  assert.throws(() => memberTerminalStatus(null, env), /Authenticated member required/);
});

test("the Worker applies the same bound-owner check to all private API credential paths", () => {
  const worker = source("worker.mjs");
  const members = source("src/server/member.mjs");
  assert.match(worker, /async function commandCredential\(request, env\)/);
  assert.match(worker, /const memberSession = await resolveAuthenticatedMemberSession\(request, env\)/);
  assert.match(worker, /hasBoundOwnerTerminalAccess\(memberSession\?\.user, identity, env\)/);
  assert.match(worker, /if \(ownerDualAuthEnabled\(env\) && !bound\)/);
  assert.match(worker, /if \(!ownerDualAuthEnabled\(env\) && memberSession\?\.user && !bound\)/);
  assert.match(worker, /async function proxyTrader[\s\S]*?await commandCredential\(request, env\)/);
  assert.match(worker, /async function proxyCommandStream[\s\S]*?await commandCredential\(request, env\)/);
  assert.match(worker, /async function proxyCommandHistory[\s\S]*?await commandCredential\(request,env\)/);
  assert.match(worker, /async function proxyCommandBootstrap[\s\S]*?await commandCredential\(request,env\)/);
  assert.match(worker, /if \(pathname === "\/api\/command\/session"\)[\s\S]*?await commandCredential\(request, env\)/);
  assert.match(worker, /ownerDualAuthEnabled\(env\)[\s\S]*?pathname\.startsWith\("\/command\/rhen\/"\)/);
  assert.ok(members.indexOf("if (!user?.id)") < members.indexOf('pathname === "/api/member/rhen/terminal"'));
  assert.match(members, /memberTerminalStatus\(user, env\)/);
});

test("member terminal never redirects to protected owner RHEN Terminal", () => {
  const routes = source("src/App.tsx");
  const app = source("src/pages/RhenApp.tsx");
  const terminal = source("src/pages/MemberRhenTerminal.tsx");
  const home = source("src/pages/MemberHome.tsx");
  assert.match(routes, /path="\/apps\/rhen\/terminal\/\*" element=\{<Suspense fallback=\{<Loader \/>\}><RhenApp \/><\/Suspense>\}/);
  assert.doesNotMatch(routes, /path="\/apps\/rhen\/terminal\/\*" element=\{<LegacyRhenOperatorRoute \/>\}/);
  assert.match(app, /<MemberRhenTerminal key=\{session\.user\.id\} \/>/);
  assert.match(app, /member\?\.ownerMember !== true/);
  assert.match(home, /member\?\.ownerMember !== true/);
  assert.match(terminal, /\/api\/member\/rhen\/terminal/);
  assert.match(terminal, /next\.portfolio !== null/);
  assert.doesNotMatch(terminal, /fetchCommandStatus|fetchCommandEvidence|useCommandLiveStream|TRADER_BASE/);
  assert.match(terminal, /No brokerage linked/);
});

test("both production and preview keep dual-auth cutover off until verified", () => {
  for (const path of ["wrangler.jsonc", "wrangler.member-staging.jsonc"]) {
    const config = JSON.parse(source(path));
    assert.equal(config.vars.ANEVUM_OWNER_TERMINAL_DUAL_AUTH, "false");
    assert.ok(!("ANEVUM_OWNER_MEMBER_ID" in config.vars));
    assert.ok(!("ANEVUM_OWNER_ACCESS_EMAIL" in config.vars));
  }
});
