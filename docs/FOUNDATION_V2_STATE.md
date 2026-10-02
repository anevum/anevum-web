# Foundation v2 website verification — 2026-10-02

Required flow: GitHub main -> Cloudflare Worker / Access -> Railway APIs -> canonical Railway PostgreSQL.

Access protects only `anevum.com/command*` and `anevum.com/api/command*`. The sole attached allow policy includes exact email `devon@anevum.com`; the previous reusable staff policy was detached from this app and preserved at account scope.

- App ID: `ea5ecc36-b828-4030-aaf7-c2a7799f6085`
- AUD: `3fabe3c703b4cc972136d2292fda39783c11903c3c6cf5ac0e42c4738f2ee800`
- Issuer: `https://wispy-tooth-095a.cloudflareaccess.com`
- Owner policy ID: `266c244d-1d51-4da8-8a46-4996d4517190`

[Production boundary and 13 contract tests passed](https://github.com/anevum/anevum-web/actions/runs/36947417138). Public pages return 200; private edge paths redirect to Access; direct Railway Command origins deny unauthenticated reads/writes with 401. Public telemetry is restored through the sanitized Foundation `/v1/trading-public-feed` projection. Worker/browser runtime uses Access assertions and no Supabase bearer.

Required owner-browser confirmation, safe IREN enqueue verification, Foundation report latency repair and actual Railway variable-value inventory remain open. Public trading telemetry now reads from canonical Railway PostgreSQL through Foundation; the rebuild-era hard-coded 503 gate is obsolete. See [backend current state](https://github.com/anevum/alpaca-trader/blob/main/docs/foundation-v2/CURRENT_STATE.md). Passing anonymous probes is not authenticated end-to-end proof.

## Remaining reference classification

- ACTIVE: `worker.mjs`, `command-iren.mjs`, browser auth use Access and Railway only.
- MIGRATED/OBSOLETE: old current-stack labels and README claims corrected in this change; obsolete native release/build workflows retired.
- archival: `site/`, `native/iren-ios/`, `database/` historical SQL, founder experience and release artifacts. Retain provenance; do not deploy these old clients.
- archival/test: `source: "supabase"` in negative IREN/topology tests explicitly verifies rejection of legacy credentials.
- migration status: homepage copy describes the ongoing rebuild; it does not invoke the retired service.

No Supabase project deletion is authorized by these checks.
