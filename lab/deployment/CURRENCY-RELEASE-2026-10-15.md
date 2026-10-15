# RHEN currency sandbox private Lab release

Session: `ANEVUM.RHEN.BUILD.2026-10-15.001.CURRENCY-SANDBOX`
Owner instruction: "Deploy and continue", October 15, 2026, 14:45 EDT.
Deployed: October 15, 2026, 14:48:55 EDT / 18:48:55 UTC.
URL: https://lab.anevum.com/projects/rhen/currency/

## Released source and deployment

Currency source: `e8f34192091c77af5eaa0296e7717cbf9e0afc16` in draft PR #414. Its exact-head CI passed 26 Node tests and desktop/390/320 Chromium interactions, export replay and changed-balance rejection.

The live Lab was newer than the PR parent. Deploying the PR's full older Worker would have replaced existing terminal/Transcosmic/Backstage workspaces. Instead, the reviewed overlay in `currency-overlay.mjs` added one static currency module, narrowly inserted currency routes into the existing Worker, and added a native link beside the terminal's existing research link. All nine other modules were retained byte-for-byte from the deployed multipart source. Existing RHEN observer, research, Fold, Transcosmic and Backstage routes were preserved.

- Worker: `anevum-private-lab`
- Previous version: `346cb0ca-25cb-498a-9639-557da8e5eedf`
- New version: `c891b558-79cb-4df5-9dfa-070895698e48`
- New deployment: `c1fe3c91-546f-44ab-9234-8f8f46360d39`, 100% traffic
- Release marker: `2026-10-15.lab.v5-currency-sandbox`
- Compatibility date retained: `2026-10-13`
- No bindings, new credentials, DNS changes or infrastructure provisioning.

Post-deployment provider read-back confirmed exact currency-snapshot source, release marker, terminal navigation link, all 12 modules, owner-only Access allowlist, the existing Lab custom domain, and disabled workers.dev/preview URLs. Provider evidence does not constitute an authenticated Safari playtest. Do not widen Access to simplify testing.

## Integration and rollback

`live-worker-baseline.mjs` records only the pre-release Worker entrypoint, not an alternative deployable Lab. The integration tests exercise the overlay against this baseline and ensure private host/method boundaries, new asset responses and unrelated module preservation. Combined local suite: 29 tests pass.

Future deployment must use the actual deployed modules or reconcile the current Lab branch. Do not upload the older `lab/worker.mjs` from this stacked PR wholesale. The overlay intentionally rejects repeated application or an unexpected baseline. All future currency updates require preserving current module and access configuration.

If rollback is necessary, after confirming settings and version availability, deploy the previous version above at 100% through the existing Worker's deployment endpoint. No DNS/Access rollback is required. This reverses only this Lab release; public ANEVUM and financial systems were not modified.

## Product status

SIM units have no monetary value. The experience is browser-memory-only and demonstrates issuance, transfer, redemption, goals, reviewed permissions, limits, rejected instructions and replay verification. No AI provider, blockchain, actual issuer/custodian, real deposits, investments or financial accounts are connected. The earlier Reserve/$10 research source remains separately reviewed; no unsupported financial-service claims were activated.
