/**
 * ANEVUM V5 -- fail-closed preview D1 migration provenance check.
 * The preview DB has a prior applied billing 0003 whose source is on an
 * independently gated PR. Never apply 0004 until every applied entry has a
 * reviewed local SQL source on the exact migration branch being dispatched.
 *
 * This checks filename lineage only; it does not prove file contents are
 * byte-identical with previously applied SQL. That needs explicit review.
 * No database access or writes occur in this module.
 */
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const VALID_FILE = /^[0-9]{4}_[a-z0-9_]+\.sql$/;

export function validatePreviewD1Ledger(parsed, available) {
  if (!Array.isArray(parsed) || parsed.length !== 1 ||
      parsed[0]?.success !== true ||
      !Array.isArray(parsed[0]?.results) ||
      !(available instanceof Set)) {
    throw new Error("PREVIEW_LINEAGE_BLOCKED: invalid ledger response or local source inventory.");
  }
  const names = new Set();
  const sequence = new Map();
  for (const entry of parsed[0].results) {
    const name = entry?.name;
    if (typeof name !== "string" || !VALID_FILE.test(name)) {
      throw new Error("PREVIEW_LINEAGE_BLOCKED: applied migration has an invalid filename.");
    }
    if (names.has(name) || sequence.has(name.slice(0, 4))) {
      throw new Error("PREVIEW_LINEAGE_BLOCKED: repeated filename or migration number.");
    }
    names.add(name);
    sequence.set(name.slice(0, 4), name);
    if (!available.has(name)) {
      throw new Error("PREVIEW_LINEAGE_BLOCKED: missing reviewed source for applied " + name +
        ". Reconcile the original migration PR before applying any further migrations.");
    }
  }
  return Object.freeze({ appliedCount: names.size, allSourcesPresent: true });
}

export async function checkPreviewD1Ledger(ledgerFile, migrationDirectory) {
  const ledger = JSON.parse(await readFile(ledgerFile, "utf8"));
  const names = await readdir(migrationDirectory);
  return validatePreviewD1Ledger(ledger, new Set(names));
}

if (process.argv[1] &&
    pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const [ledgerFile, migrationDirectory] = process.argv.slice(2);
  if (!ledgerFile || !migrationDirectory) {
    console.error("PREVIEW_LINEAGE_BLOCKED: ledger JSON and migration directory required.");
    process.exitCode = 1;
  } else {
    try {
      const check = await checkPreviewD1Ledger(ledgerFile, migrationDirectory);
      console.log("ANEVUM preview migration history checked: " +
        check.appliedCount + " reviewed source filenames present.");
    } catch (error) {
      console.error(error instanceof Error ? error.message :
        "PREVIEW_LINEAGE_BLOCKED: unknown validation error.");
      process.exitCode = 1;
    }
  }
}
