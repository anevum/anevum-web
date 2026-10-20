# ANEVUM Creator V1 — V012 canonical identity boundary and release evidence

**Session:** ANEVUM.WEB.BUILD.2026-10-14.008.CANONICAL-IDENTITY-GATES  
**Review stack:** cinematic #388 → community #392 → member desk #395 → recognition #396 → featured award #398 → invited signup #399 → V012.  
**Status:** source-only proposal and offline staging evidence; no schema change, identity connection, email, OAuth provider or production deployment.

## Read-only live Cloudflare audit — 2026-10-14

A direct GET of zone Worker routes and existing Worker settings, combined with D1 **SELECT-only** table names, migration versions and aggregate counts, established:

| Area | Observed deployed state |
| --- | --- |
| a.anevum.com/* | anevum-creator-v1-a-staging |
| anevum.com/* | anevum-construction-terminal, January 1, 2027 launch page |
| next.anevum.com/api/v1/member/* | anevum-member-auth-staging |
| a.anevum.com/api/v1/member/* | **no dedicated route** |
| a.anevum.com Worker | only ASSETS + COMMUNITY_DB; Creator V1 staging D1 |
| next Member Worker | same Creator V1 staging D1; separate legacy-stage login secrets/Turnstile |
| Creator V1 staging D1 | 1 member account, 2 creator profiles, 1 session |
| V5 Better Auth preview D1 | 1 user, 1 account, 1 session; **different database** |
| Creator V1 applied migrations | 0001, 0002, 0003, 0004, 0005, 0006 only |
| Community V007–V010/V012 migrations | 0007, 0008, 0013, 0014, 0015 **not applied** |

Counts are not member-account equality proof. A second creator profile may be an official/test profile. No email addresses, IDs of individuals, cookies, secrets, OTPs or database rows were retrieved or written. The pinned sanitized snapshot is in test/fixtures/identity-stage-inventory-2026-10-14.json and must be refreshed from Cloudflare before release; source files are not authoritative for *future* provider state.

## Working implementation on V012 branch

1. auth/migrations/0015_creator_canonical_identity_links.sql proposes **one revocable mapping per legacy member**, and a unique canonical subject, with single allowlisted staging issuer, foreign-key delete cascade, opaque identifier and 64-character proof digest constraints. No automatic mapping by email/handle/display name, no XP change, no privileges migrated.
2. auth/canonical-identity-read.mjs is an **internal read-only** lookup that accepts an authenticated legacy member context, uses a parameterized query, returns only linked/unlinked availability, checks still-active account and verified unrevoked link, and fails closed if schema or D1 unavailable. It has no Worker HTTP route and no write capability.
3. ops/identity-release-gate.mjs is a **pure offline assessor** of route isolation, canonical D1 isolation, approved issuer/origin, migration coverage, real-member count, backup/recovery and independent account/role acceptance. It reports blocked or review_candidate; it NEVER authorizes deployment. It does not call Cloudflare or write DB itself.
4. test/canonical-identity-gates-v012.test.mjs executes the actual proposed SQL in an in-memory SQLite DB, confirms uniqueness, conflicting owners/subjects, proof digest constraints, revocation, status gating and deletion cascade, and verifies the read-only Cloudflare snapshot is blocked. It also checks that the public/membership Workers have no linking endpoint and preserve V011 login security.

## Canonical Better Auth proposal (not activated)

Choose a **separately reviewed, dedicated staging Better Auth environment** on a.anevum.com as the future canonical login engine. It requires its own exact-origin callbacks and keys, its own isolated D1 and least-privilege binding, deliberate Google/email/GitHub provider activation, anti-abuse controls, recovery, export/deletion and a tested rollback. Preserve prior verified founder/Studio/RHEN role bindings; no generic account may inherit staff, broker or administrative access.

The separate V5 preview account is NOT imported just because its email/handle resembles a Creator V1 member. Draft #318 is historical, not a deployable identity merger. Keep V011's intentionally closed provider cards unchanged until the SAME canonical backend attests availability.

A future explicit dual-session linking ceremony MUST obtain:
- independent valid existing Creator V1 session on its original exact origin
- independent valid canonical Better Auth session on its exact origin
- short-lived, one-use server-signed challenge bound to **both** verified member identifiers, origin, provider issuer, nonce, timestamp and purpose
- server-side replay protection, anti-CSRF/state and concurrency checks, verified data ownership and one-to-one conflict rejection
- separate privileged-owner verification and support recovery for members who cannot authenticate to both accounts
- audit record containing only safe proof digest, time and reviewer verification; never store or log raw tokens/PII in public reports

No such ceremony is implemented by V012. The mere existence of schema 0015 or a linked status reader does NOT assert a user has been verified or linked. No code in this branch accepts caller-supplied canonical member IDs for an identity write.

## Staging deployment acceptance — all still gated

1. Obtain written owner approval of the exact canonical identity design, data migration and privileged-account isolation. Document production's preserved launch route.
2. Take a verified isolated Creator V1 D1 backup and prove restoration off the live D1. Inspect the planned **0007, 0008, 0013, 0014, 0015** schema compatibility and transactional migration. No apply until independently accepted.
3. Provision isolated canonical Better Auth staging with dedicated D1/secrets and a dedicated, more-specific a.anevum.com/api/v1/member/* route **only after authorization**. Do not forward next.anevum.com cookies or host-scoped tokens.
4. Test new member A and unrelated member B, wrong-host callbacks, invite/verified email, same-email collisions, signout, recovery, replay/rate limits, blocked accounts, deletion/export and owner role isolation.
5. Verify genuine member A draft → independently verified moderator → guest public view → unrelated member B rate/save/review → earned XP, revocation, visible chosen award, no cross-account leakage. Use rights-cleared work and no synthetic production users.
6. Capture 1440/1024/390/320 visual/accessibility proof and conduct real browser E2E plus moderation/backup rollback drill. Keep private RHEN, Studio, Command and Lab data outside public member traffic.
7. Refresh Cloudflare live inventory, attach source SHA and independent evidence IDs, obtain explicit owner signoff; then and only then consider deployment via the reviewed staging-only workflow. Public anevum.com remains separate until Jan 1, 2027 authorization.

**No migration was executed, no identity was linked, and no public registration was opened during this work session.**
