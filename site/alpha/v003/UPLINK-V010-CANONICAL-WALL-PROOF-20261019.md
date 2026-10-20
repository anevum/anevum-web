# ANEVUM Creator Uplink V010 — Verified Canonical Release Attribution

Session: `ANEVUM.WEB.BUILD.2026-10-19.007.CANONICAL-PROOF-RELEASE-GALLERIES`
PR: https://github.com/anevum/anevum-web/pull/564
Base: merged V009 alpha `alpha/player-uploader-20261018`
Companion V091 UI: https://github.com/anevum/anevum-web/pull/567
Status: **DRAFT / NO PRODUCTION DEPLOYMENT / PUBLIC GALLERY DISABLED**

## What the source changes

An uploaded ZIP/HTML release is first attributed to the **server-confirmed canonical member ID**, retrieved from the verified session via the existing internal `AUTH` Worker service. It is never bound to a username, email or member ID entered into the upload form.

At upload, the package controller fetches `/api/v1/member/creator-profile` through its internal `AUTH` service binding, confirms the returned `memberId` matches the authenticated account, and records the verified profile handle, profile creation timestamp and optional issuer-generated `packageProof` in `anevum_package_creator_links`. The mapping table is additive and lives solely inside the dedicated package D1 database.

A public `GET /api/v1/packages/creators/:handle/projects` is **OFF by default** unless `PACKAGE_CREATOR_GALLERY_ENABLED=true`. When enabled, it must revalidate the handle as an actually visible canonical public profile *on that request*, obtain the HMAC account proof and require a database match on handle, creation timestamp **and** issuer proof. It includes only releases currently approved as published and bound to the current live release. Suspended, deleted, rejected and private drafts never appear. If a handle is reused, even by an account created in the same second, the HMAC no longer matches and the old member's work is not attributed to the new one.

The proof is generated only by the **canonical issuer** using HMAC-SHA-256 over the stable authenticated user ID, current handle and profile creation time. Canonical issuer sources are in the V091 companion PR, never in the package service. No user-controlled request header or uploaded file can assert this proof. The `CANONICAL_PACKAGE_PROOF_KEY` secret and `CANONICAL_PACKAGE_PROOF_ENABLED=true` flag must exist only in the canonical service when separately approved. They are NOT configured by this PR. Disabled/missing proof leaves uploads possible but **public gallery attribution unavailable**, not insecurely based on timestamp alone.

Private authenticated `GET /api/v1/packages/mine` returns only the currently signed-in owner’s projects and their draft/review statuses without sharing session tokens or unpublished executable files with public profile visitors.

## Data and routes

- Additive isolated migration: `site/alpha/v003/migrations/0003_canonical_creator_links.sql`. Apply only after isolated D1 backup, schema inspection, rollback rehearsal and explicit stage approval.
- New table columns `owner_id`, `handle`, `profile_created_at`, nullable hex `creator_proof`, and `verified_at`, with unique handle and owner constraints.
- No writes to canonical member D1, profile tables, staff roles, published legacy catalogue or XP.
- Existing V009 bridge rewrites gallery JSON and owner library URLs into the `/upload/v3/` namespace on the pre-existing Worker route owner, without intercepting the old player.

## Tests

Automated tests verify verified owner-only mapping, required canonical member profile, no R2 writes on failed attribution, private gallery exclusion, visibility changes, independent staff review, safe public version updates and handle-reuse collision with identical timestamps but differing issuer HMACs. Browser and earlier ZIP safety acceptance remain part of the V009 inherited test suite. Exact-head CI must be reviewed before merge.

## Release gates

1. Review, merge and compile the companion canonical profile proof implementation from V091 PR #567 without changing the current auth issuer or secrets prematurely.
2. Provision a **new distinct** canonical HMAC secret (never reuse the auth session signing key) and enable it only on an isolated, verified stage.
3. Apply the package table migration only to the isolated package stage D1 after backup; existing proof-null rows do not become public until safely relinked by the verified owner.
4. Complete real creator A upload, independent reviewer B approval, anonymous C play and visibility/closure/handle-reassignment tests on the exact staged source.
5. Keep `PACKAGE_CREATOR_GALLERY_ENABLED`, `PACKAGE_PUBLIC_PUBLISH_ENABLED`, `PACKAGE_CANONICAL_BRIDGE_ENABLED` and `PACKAGE_IDENTITY_BRIDGE_VERIFIED` disabled until separate approvals and rollback checks.

This draft is an attribution and discovery bridge, not a new Creator Engine, a new account system or a production publishing launch.
