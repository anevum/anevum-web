import test from "node:test";
import assert from "node:assert/strict";
import { validatePreviewD1Ledger, checkPreviewD1Ledger } from "../scripts/verify-preview-d1-ledger.mjs";
import { readFileSync } from "node:fs";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const preview = (...names) => [
  { success: true, results: names.map(name => ({ name })) }
];

const catalog = new Set([
  "0001_member_platform.sql",
  "0002_member_rhen_drafts.sql",
  "0003_member_billing.sql",
  "0004_member_rhen_workspaces.sql"
]);
const knownBilling = "0003_member_billing.sql";

test("missing billing 0003 source still blocks any further preview migration", () => {
  const applied = preview(
    "0001_member_platform.sql",
    "0002_member_rhen_drafts.sql",
    knownBilling
  );
  assert.throws(
    () => validatePreviewD1Ledger(applied, new Set([...catalog].filter(name => name !== knownBilling))),
    /PREVIEW_LINEAGE_BLOCKED.*missing reviewed source for applied 0003_member_billing.sql/
  );
});

test("explicitly reviewed billing SQL source resolves preview applied filename lineage", () => {
  const applied = preview(
    "0001_member_platform.sql",
    "0002_member_rhen_drafts.sql",
    knownBilling
  );
  const accepted = validatePreviewD1Ledger(
    applied, catalog
  );
  assert.deepEqual(accepted, { appliedCount: 3, allSourcesPresent: true });
  assert.equal(Object.isFrozen(accepted), true);
});

test("migration numbered 0004 is accepted only if corresponding local source exists", () => {
  const applied = preview(
    "0001_member_platform.sql",
    "0002_member_rhen_drafts.sql",
    knownBilling,
    "0004_member_rhen_workspaces.sql"
  );
  assert.throws(
    () => validatePreviewD1Ledger(applied, new Set([...catalog].filter(name => name !== "0004_member_rhen_workspaces.sql"))),
    /missing reviewed source for applied 0004_member_rhen_workspaces.sql/
  );
  assert.deepEqual(
    validatePreviewD1Ledger(applied, catalog),
    { appliedCount: 4, allSourcesPresent: true }
  );
});

test("unexpected migration names and path traversal fail closed", () => {
  for (const name of [
    "../secret.sql",
    "/etc/secrets.sql",
    "0003_member_billing.sql/../../private",
    "0003_member_billing.SQL",
    "0003-member-billing.sql",
    "bad.sql",
    null,
    3
  ]) {
    assert.throws(
      () => validatePreviewD1Ledger(preview(name), new Set([...catalog, name])),
      /invalid filename/
    );
  }
});

test("repeated migration filename and number are never accepted", () => {
  for (const entries of [
    ["0001_member_platform.sql", "0001_member_platform.sql"],
    ["0003_member_billing.sql", "0003_member_workspaces.sql"]
  ]) {
    assert.throws(
      () => validatePreviewD1Ledger(
        preview(...entries), new Set([...catalog, ...entries])
      ),
      /repeated filename or migration number/
    );
  }
});

test("malformed, partial, or failed query results cannot authorize an apply", () => {
  for (const bad of [
    undefined,
    null,
    [],
    {},
    [{ success: false, results: [] }],
    [{ success: true }],
    [{ success: true, results: null }],
    [{ success: true, results: [] }, { success: true, results: [] }],
  ]) {
    assert.throws(
      () => validatePreviewD1Ledger(bad, catalog),
      /PREVIEW_LINEAGE_BLOCKED/
    );
  }
});


test("real checked-in reviewed billing 0003 file passes immutable blob check, drift fails closed", async t => {
  const dir = await mkdtemp(join(tmpdir(), "anevum-preview-ledger-"));
  t.after(async () => { await rm(dir, { recursive: true, force: true }); });
  const names = [
    "0001_member_platform.sql",
    "0002_member_rhen_drafts.sql",
    knownBilling,
    "0004_member_rhen_workspaces.sql"
  ];
  for (const name of names) {
    const bytes = readFileSync(new URL("../migrations/" + name, import.meta.url));
    await writeFile(join(dir, name), bytes);
  }
  const ledgerFile = join(dir, "applied.json");
  await writeFile(ledgerFile, JSON.stringify(preview(...names.slice(0,3))));
  assert.deepEqual(
    await checkPreviewD1Ledger(ledgerFile, dir),
    { appliedCount: 3, allSourcesPresent: true }
  );
  await writeFile(join(dir, knownBilling), Buffer.from(
    readFileSync(new URL("../migrations/" + knownBilling, import.meta.url)).toString("utf8")
      .replace("RHEN Cloud commercial billing only", "RHEN Cloud billing drift")
  ));
  await assert.rejects(
    checkPreviewD1Ledger(ledgerFile, dir),
    /PREVIEW_LINEAGE_BLOCKED: reviewed billing 0003 SQL source blob has drifted/
  );
});
