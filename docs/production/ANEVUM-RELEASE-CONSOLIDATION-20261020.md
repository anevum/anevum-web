# ANEVUM release consolidation — 2026-10-20

Session: ANEVUM.OPS.UPDATE.2026-10-20.001.RELEASE-CONSOLIDATION

## Source inventory

| Work | Canonical location | Consolidation |
| --- | --- | --- |
| #554 V091/V094 experience and #568 callback/verification repair | Current approved release branch | #568 merged at 52f34e69; no repeat implementation |
| #549 Observatory V002 | Live Observatory deployment 03b731d4-be7f-480c-80ad-c50683a2dc8f | Exact UI and server compared to #549 source; preserve as a retained deployment |
| #551 profile staff access; #552 staff entry | Existing identity transport Workers | Live hashes match checked-in redirect repairs; historical root deployment ancestry is not imported |
| #558 staff polish | operations/anevum-iren-staff-observatory-v092.mjs | Folded into #564 source; retains aura selection; no permission/backend change or production activation |
| #562 bounded revisions and cleanup | site/alpha/v003/resource-*.mjs | Folded into the hardened V003 controller in #564, rather than activating a second controller |
| #564 canonical package backend, rights receipts, ownership and covers | site/alpha/v003 | Canonical consolidated release candidate |
| #566 / #567 member package wall | CreatorPackageGallery and canonical package-proof module | #566 superseded; #567 folded into #564; gallery and proof issuing gates remain OFF |

The future phone-first Creator Engine and ANEVUM Sites business are outside this release.

## Verified development

- Complete combined Node 22 regression suite: 1,305 tests passed, zero failures, skips or cancellations before final source pinning.
- Package regression suite: 76 tests. Streamed body cap, leases, atomic storage reservations, failed-write cleanup, expiry, submission/discard races, ownership and independent moderation are covered.
- All ten CI workflows passed on the preceding package-only source 9ec54d6d. The consolidated source must pass again; earlier results are not acceptance of the final source.
- Root V5 deployment assertions now require the retired workflow to refuse all dispatches. Runtime, encryption, staging and owner-binding checks remain covered; no old deployment authority was restored.
- Exact 38-route inventory, including request-limit fail-closed settings, is pinned. The old 36-route count was stale after the two isolated V004 routes were installed.
- Four live staff Worker hashes match their checked-in repair source. Observatory V002 UI/server match #549 exactly and its exact source hash/version are retained; the release helper must not downgrade it.
- V003 and V004 staging backups restored successfully in disposable SQLite. The V003 resource migration was applied twice locally; integrity passed and existing data remained intact. These are not backups of the canonical member database.

## Activation order and acceptance

1. Finish CI and responsive synthetic browser QA on the exact consolidated source; update the existing #564 PR and close only PRs whose implementation is fully included.
2. Record real Founder, independent reviewer and second-member sessions against that source. Verify Upload → Preview → Review → Publish → Discover → Play → Member Wall, account switching, private/public visibility, and staff denial for unauthorized accounts. Existing live-founder and synthetic checks do not satisfy these final-source gates.
3. Review and explicitly approve any production database or binding change separately. The checked-in resource migration is additive and gated OFF. The role migration is `creator-v1/canonical-auth/migrations/0012_verified_designations_v093.sql`; it requires a separately backed-up canonical MEMBER_DB and production change approval. It does not auto-grant roles, and independent nomination/review must remain mandatory.
4. Use one canonical package database/controller/runtime and their existing approved rollout procedure. Do not promote the parallel V004 staging controller. Coordinate the resource flag, required migration, cleanup scheduling, ownership proof secret, private runtime, gallery readiness and pilot approval. Never enable only half of the ownership or retention contract.
5. Enable approved capabilities only after authentic acceptance and storage/permission approvals. Preserve published builds, member progression, original media, private visibility and fail-closed staff auth.
6. Release the apex only through `.github/workflows/v084-continuance-production.yml` from its approved branch. The acceptance record stays false until evidence is recorded for the pinned source. Preserve exact live routes, databases, variables, secret names and rollback version.
7. Verify live source assets, desktop/phone interactions, authenticated journeys and deployment/version evidence after rollout.

## Current production boundary

The apex remains version 93cc7f07-cf39-457e-af69-c9f6f4c02d25. This development consolidation does not apply migrations, change roles, provision secrets, change routes, activate flags or deploy production. A merged or green PR alone is not completion on anevum.com.
