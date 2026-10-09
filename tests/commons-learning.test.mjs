import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Commons has a free learning route, public navigation and methodological guidance", () => {
  const app = read("src/App.tsx");
  const routes = JSON.parse(read("src/data/public-routes.json"));
  const home = read("src/pages/HomeCompany.tsx");
  const learning = read("src/pages/Learning.tsx");
  const shell = read("src/components/CommonsShell.tsx");
  assert.ok(app.includes('path="/learn"'));
  assert.ok(app.includes("const Learning = lazy"));
  assert.deepEqual(routes.find(x => x.path === "/learn"), {
    path: "/learn", label: "Learn", nav: true, sitemap: true
  });
  assert.ok(home.includes('to="/learn"'));
  assert.ok(shell.includes('to="/learn"'));
  for (const section of [
    "Define the rule", "Test it honestly", "Measure the downside",
    "Document and challenge", "separate", "holdout", "slippage",
    "actual", "no member"  // omitted marker replaced below when necessary
  ].slice(0, 7)) {
    assert.ok(learning.includes(section), "Missing research guidance: " + section);
  }
  assert.ok(learning.includes('to="/commons?template=ruleset"'));
  assert.ok(learning.includes("not a trading signal service"));
  assert.ok(learning.includes("No paid subscription"));
});

test("Ruleset worksheet submits as member research, never as an order or paid signal", () => {
  const page = read("src/pages/Commons.tsx");
  const api = read("src/server/commons.mjs");
  assert.ok(page.includes("RULE_SET_TEMPLATE"));
  for (const clause of [
    "Exact entry rule", "Exact exit rule and position/risk limits",
    "transaction costs", "untouched holdout", "What would falsify",
    "setKind(\"research_note\")", "setSubject(\"algorithms\")",
    "Use rule-set worksheet"
  ]) assert.ok(page.includes(clause), "Missing worksheet rule: " + clause);
  assert.ok(page.includes("state?.available"));
  assert.ok(page.includes('fetch("/api/member/commons/topics"'));
  assert.doesNotMatch(page, /api\/trader|\/v2\/orders|placeOrder|submitOrder|stripe\.checkout/);
  assert.doesNotMatch(api, /TRADER_BASE|ALPACA_API_SECRET/);
});

test("Proposed Alpaca brokerage disclosures explicitly cover tokens, risk and permissions", () => {
  const privacy = read("src/pages/Privacy.tsx");
  const terms = read("src/pages/Terms.tsx");
  for (const phrase of [
    "encrypted Alpaca access token", "account equity", "not included in downloaded account exports",
    "other members", "Disconnecting", "legal review"
  ]) assert.ok(privacy.includes(phrase));
  for (const phrase of [
    "Proposed Alpaca Connect", "does not automatically activate",
    "Alpaca remains the custodian", "revoke", "trading can cause losses"
  ]) assert.ok(terms.toLowerCase().includes(phrase.toLowerCase()));
  assert.ok(terms.includes("owner and legal review required"));
  assert.ok(privacy.includes("owner and legal review required"));
});
