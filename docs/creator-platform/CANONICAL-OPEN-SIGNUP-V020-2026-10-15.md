# Canonical member open registration — V020

Session: `ANEVUM.WEB.BUILD.2026-10-15.004.OPEN-SIGNUP-RELEASE-GATES`

## Product decision
ANEVUM accounts are intended to support **open, free registration**, not a permanent invitation requirement. Invited A/B pilots are a verification method, not product policy. Existing `policy.mjs` already supports `CANONICAL_PUBLIC_SIGNUP_ENABLED=true` while protected founder identities remain denied. Existing `test/canonical-real-session-v019.test.mjs` exercises both open and invitation modes using a real Better Auth engine and synthetic in-memory D1 adapter.

## Implementation
`creator-v1/ops/canonical-open-signup-gate.mjs` defines a standalone **member-account-only** release assessment and explicit blocker codes. It is not wired to any runtime, deployment or external secrets and cannot authorize a change. It demands evidence of actual isolated D1 and 0001–0003 migrations, stage composition, separate protected credentials, retained verified backup/restore, genuine email sessions, negative auth tests, cross-account privacy, data deletion/export, mobile/visual acceptance and owner go/no-go. Each attestation requires an independently verifiable reference; the assessor only checks shape, not source authenticity.

## Gate separation
Do not wait for an entire creator publishing, moderation, XP, projects, DMs, or legacy member bridge before preparing first canonical **account-only** staged signup. Equally, do not infer those privileges from verified canonical identity. Member-to-Creator linking requires independent authorization and an explicit dual-session association ceremony; never link on email, handle or cookie matching alone.

## Verified current blockers
As documented by the V019 read-only audit, `a.anevum.com` has only legacy `COMMUNITY_DB` and `ASSETS` bindings, so no canonical member signup. Dedicated D1 still lacks migration 0003. No retained and independently restored actual remote D1 export, scoped secrets, completed privacy/age/deletion policies, or real pilot OTP sessions are attested. Neither the public `anevum.com` countdown nor private Lab may be changed by this work. The configuration `wrangler.a-signup-staging.jsonc` deliberately leaves `CANONICAL_PUBLIC_SIGNUP_ENABLED=false` until acceptance.

## Test status
Five isolated release-gate tests pass locally in Node 22; the existing runtime open/invited behavior was already covered by V019. Full repository CI must test the exact resulting PR head after inclusion. **No staging deployment, D1 migrations or secret changes are performed in V020.**

## Suggested next execution
Finish the isolated D1 export and destructive restore rehearsal against a disposable copy; approve privacy/age/deletion terms; add isolated secret bindings; conduct two independent real OTP sessions on authorized staging; verify code abuse, owner access exclusion, profile private/public toggles, account exports and deletion; then owner review for **staging only** open enrollment. Preserve the already approved V006 cinematic UI and the January 1 launch countdown.

## V021 — CI enrollment (October 15)

Commit `58e283733583f5ce17f07c16d4b81433a92fce2e` adds the V020 fail-closed registration gate tests to both `creator-v1/package.json` `test` and `test:signup-activation` scripts. This ensures the tests run under the normal GitHub Creator V1 workflow, which executes `npm test` under `creator-v1`. Before this change, the gate source tests existed but were not part of that standard command; the prior successful PR workflow therefore did not independently prove those new tests passed. Do not report the updated test suite as passing until the exact-head run completes successfully.

The recovery test from V019 is a disposable local SQLite `VACUUM INTO` rehearsal. It is **not** a real Cloudflare D1 export and restore. The next remote recovery operation must require separate backup/restore authorization and must never run against production or silently migrate the existing isolated canonical D1.
