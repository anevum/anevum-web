# IREN Observatory V002 — integration and guarded release

Session: `ANEVUM.IREN.UPDATE.2026-10-19.002.AURA-ASSIGNMENT-PREVIEW`

This checklist reflects a **read-only live Cloudflare inspection on 2026-10-19**. It does not authorize deployment or account changes. The branch is the existing IREN Observatory release workstream (PR #549); the aura patch was integrated through PR #559. The public Aura Codex belongs to the separate V091 experience candidate (PR #554).

## Confirmed live route ownership

| Path | Live Worker |
| --- | --- |
| `anevum.com/staff/observatory*` | `anevum-iren-staff-observatory-v001` |
| `anevum.com/staff`, `anevum.com/staff/`, `anevum.com/staff*` | `anevum-iren-staff-entry-v003` |
| `anevum.com/api/v1/member/staff-ops*` | `anevum-iren-apex-staff-v002` |
| Canonical member authentication service | `anevum-apex-prelaunch-gateway` |
| Active member D1 binding | `anevum-canonical-member-staging` (this is the active canonical DB, despite its name) |

The currently deployed Observatory Worker contains the existing session transport hotfix:
`redirect:"manual"` for `APEX_AUTH.fetch(new Request(.../get-session))`.
The checked-in Worker is now semantically identical in server logic; minor whitespace/quote normalization is not significant.

**Snapshot only:** observed live Observatory deployment version `9b478e0f-8424-4afe-8d83-9fc5b3082042`; the staff entry version was `9b6c5c64-6281-4067-a6a9-eec108845073`. **Re-read the live deployments immediately before any release** and refuse a deployment if they have changed unexpectedly.

## Release boundaries

1. Confirm exact candidate commit and passing `IREN V002 / Owner Aura Preview and Mobile QA` workflow (including 320/390/1440 synthetic Chromium captures and service-auth regressions).
2. Build *only* `deploy/iren-observatory/wrangler.jsonc` in dry-run. Never deploy the repository root config, old navigation adapter, public V091 branch or another staff Worker as part of this patch.
3. Reconfirm Cloudflare route map, service binding `APEX_AUTH`, D1 binding `MEMBER_DB`, current Worker version and previous version for rollback. Do not mutate routes, D1 schema, grants, saved preferences, member XP or earned artifacts.
4. Complete **signed-in browser verification**: founder/owner opens the Observatory, can view Members and Rewards, sees the chosen aura description and UNSAVED PREVIEW on a dropdown change, can cancel a change without a POST; reviewer sees only permitted sections and gets 403 for owner-only APIs. Check iPhone Safari and desktop.
5. Have an approved release operator deploy the Observatory Worker through the guarded staff-only workflow. No retroactive claim of release based on synthetic screenshots; don't publish without real authenticated acceptance.
6. Immediately verify authenticated owner + reviewer again, inspect Worker errors and D1 audit behavior, and confirm project moderation, staff entry links, and `/member` founder navigation remain intact.

## Rollback and incident containment

Before deployment, record the actual deployed Observatory version ID and retain its build/metadata. If the aura UI fails after release, restore **only the Observatory Worker** to its prior known-good version. Keep `anevum.com/staff/observatory*` mapped to the protected Worker, preserve the current `anevum-iren-staff-entry-v003` routes, and do not downgrade the V091 `redirect:"manual"` auth transport. Never reset or delete member data, audit records, awards, reputation, staff grants, or project reviews to roll back a cosmetic UI patch.

## Known independent CI issue

The parent PR (#549) also runs the generic, legacy root `ANEVUM Verify` workflow. As inspected 2026-10-19, its `tests/single-production-deploy.test.mjs` asserts the old V5 production deployment structure and fails against the retired V5 deployment manifest. That failure predates the V002 aura changes and does **not** justify relaxing the production deployment guard. The isolated V002 workflow tests the actual Observatory, but generic CI must be reconciled separately before a full repository-wide release claim.
