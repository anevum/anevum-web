# ANEVUM V5 - Conservative source reachability

Session: ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL
Master board: WEB #259; sitewide reconstruction: WEB #265
Parent draft: WEB #290 at b17742a391b414857a9b8e846933eb8a9c185139

## Purpose and methodology

The script scripts/audit-v5-source-reachability.mjs inspects the actual checked-out
TypeScript, JavaScript and CSS import graph. Runtime roots are src/main.tsx and
worker.mjs. Standalone scripts and tests form auxiliary roots. Each historical
src/pages/*.tsx file is labeled RUNTIME_REACHABLE, NON_RUNTIME_REFERENCE or
UNREACHED_REVIEW; unresolved literal runtime imports are also detected.

Run: node scripts/audit-v5-source-reachability.mjs --json

The Foundation suite tests actual RHEN, legal, private staging and archived
page classifications, plus synthetic TSX/CSS and test-only dependency cases.

## Limits and next actions

No files are removed by the script. A file marked UNREACHED_REVIEW must not
be deleted without manually checking non-import filesystem reads, static HTML
or CSS references, public backlinks, Git history and rollback retention.
Review exact-head CI first, then a separate deletion-specific PR with owner
approval and a restore path. The CSS route split experiment remains unmerged.

This audit makes no production, OAuth, D1, Railway, Stripe, account, broker
or deployment change.
