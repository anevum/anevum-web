# ANEVUM release consolidation — 2026-10-20

Session: ANEVUM.OPS.UPDATE.2026-10-20.001.RELEASE-CONSOLIDATION

Continuation: ANEVUM.OPS.UPDATE.2026-10-20.002.RELEASE-CONSOLIDATION

## Approved controlled pilot — 20 October, 09:09 EDT

Session: `ANEVUM.OPS.UPDATE.2026-10-20.003.CONTROLLED-V003-PILOT`

The user approved the concrete V003 pilot, including the package migration,
proof and service bindings, existing reviewer access, genuine account
acceptance and the subsequent guarded release. This approval does not turn
unobserved acceptance checks into passing evidence.

### Completed infrastructure and identity preparation

- Exported the package-only D1 database and retained a private rollback bundle.
  Backup SHA-256: `7a82508cc0188905c53fa83a88eeda31110252b3159965254bdf1beddf04e599`.
  The export restored locally, migration 0004 applied twice, integrity and
  foreign-key checks passed, and all seven original package tables retained
  their rows. The database contained zero projects, releases, files and creator
  links at this checkpoint.
- Applied the exact additive `0004_resource_protection.sql` to the existing
  package D1 database. All 12 statements succeeded. The database now has 12
  package tables; live quick-check returned `ok`, foreign-key checks were empty,
  and original project/release/file/link counts remained zero. Canonical member
  data was not migrated.
- Activated identity-preflight version
  `f06f3ca7-f684-4028-bc99-e40e080ae6a1` on the existing creation-route owner,
  preserving canonical DB, legacy UPSTREAM and the route inventory. The new
  private PACKAGE_CONTROL service and preflight are active. Both normal bridge
  flags remain false. Exact rollback: `3cef3fe8-bb67-4edf-a7f6-9b5ccecb3b7a`.
- Live unauthenticated checks passed: guest 401, foreign-origin/cross-site 403,
  invalid preflight query 404, POST 405, normal bridge/API paths 404, and legacy
  uploader/home 200. An initial Python HTTP harness was not usable in this
  environment; the verified results use the working curl transport.
- The existing browser's real founder session passed the new preflight with
  authenticated/pilot/reviewer all true and both bridge guards false. The
  separate safe staff diagnostic reported canonical session verified, owner
  grant and staff API HTTP 200. The user then completed the existing
  Cloudflare Access email verification through the secure browser sign-in
  flow. The retained Observatory loaded with OWNER CLEARANCE and live data
  at 09:23 EDT.
  These observations are partial pilot evidence, not complete final-source
  authenticated acceptance.

### Controlled candidate acceptance path

A version upload must not replace the current apex deployment. The prepared
pilot builds the exact refreshed source with
`VITE_PACKAGE_CREATOR_GALLERY_V010=true` and uploads its assets and a distinct
canonical proof secret into an inactive version. Only after refreshed source CI
passes may the pilot include that version at exactly 0% alongside the recorded
old version at 100%. Never substitute a nonzero public traffic percentage.

Cloudflare's documented version override can select this candidate for the
consented browser on the canonical origin. A short-lived routing cookie and
bounded Transform Rules may select the candidate without changing sign-in,
roles or the 38 Worker routes. The package controller's optional
`PACKAGE_CANONICAL_AUTH_VERSION` constructs a fixed internal apex override from
server configuration, so private session/profile and public proof checks use
the candidate issuer without trusting caller-supplied version headers. Invalid
configuration fails closed; absent configuration preserves normal routing.
Cloudflare only honors an override for a version in the active deployment, so
its actual presence and proof response must be checked during acceptance.

The pilot routing cookie is omitted by intentionally anonymous frontend
requests using `credentials: "omit"`. Such requests must not be described as
candidate responses without separate evidence. The package public feed still
uses the controlled V003 service, and its public canonical proof call uses the
server-configured candidate. Other anonymous canonical APIs need direct
candidate read-only checks in addition to browser UI acceptance.

The final production build must explicitly keep the tested gallery-ON variant.
The existing guarded release remains mandatory, with all four authenticated
flags false until genuine founder/reviewer, publishing and cross-account
acceptance is complete. Update its exact infrastructure baseline only from the
observed, reviewed pilot deployment; preserve the previous production version,
all bindings/routes and the optional public role/reputation flags OFF.

## Prior continuation — final application completion

The continuation resumes existing PR #564. The starting combined source was
`97bd61b078dea7bfe96c8c81b550729a3cbb8d9e`; all ten workflows, including the
complete regression suite and responsive Chromium checks, passed on that
source. Later source changes require fresh results.

Three functional omissions are addressed in this continuation:

- The staff package workspace now retains published and suspended releases.
  Suspension requires a recorded reason and confirmation; restoration returns
  the existing approved build and preserves its original independent review.
  Failed actions remain visible and retryable in the existing dialog.
- A separately opted-in `GET /upload/v3/preflight` resolves the caller's
  existing canonical session through the package controller without enabling
  the uploader. It reports only existing pilot/reviewer capabilities. It cannot
  write package records, R2 objects, permissions or publication state. Normal
  canonical authentication session refresh/expiry handling still applies.
  `PACKAGE_IDENTITY_PREFLIGHT_ENABLED` defaults OFF, and both original bridge
  activation gates remain mandatory for all normal package paths.
- Approved public packages join the existing Discover results and search/category
  filtering through their canonical package catalogue and player URLs. The
  integration preserves existing legacy results, rejects unsafe links and
  duplicate IDs/URLs, makes no cross-database project writes, and stays behind
  the existing default-OFF gallery UI flag. Synthetic flag-ON and ordinary
  flag-OFF builds are tested separately.

The final application commit is pinned by the separate release-configuration
commit in `.github/release-evidence/v091-authenticated.json`. Read-only CI
compares the actual Git changes against the exact static scope and verifies
that only the five approved release-metadata files differ from that application.
Updating the source pin and changed-file scope does not mark any authenticated
acceptance gate as passed. The production guard derives preserved bindings
from the exact active Worker version and rejects mismatched inactive settings.

### Verified infrastructure distinctions

Cloudflare `/settings` can describe a newer uploaded version. Check the
**active deployment's exact version** before describing a binding as live.
The active creation-route owner `3cef3fe8-bb67-4edf-a7f6-9b5ccecb3b7a` has only
its original `DB` and `UPSTREAM` bindings. The package service binding and two
bridge guards belong to the inactive V009 candidate; they are not evidence
that live `/upload` is connected to the package controller.

The canonical staff system has one verified owner and one verified reviewer.
The V003 package controller's separate allowlists currently include only the
owner. The existing reviewer must be deliberately included in the package
pilot before an independent package review can succeed. Do not create a new
account, fabricate a session, or grant a role to make a test pass.

There is no deployed same-origin full-candidate acceptance path in the current
38-route inventory. The historical `next.anevum.com/creator/` build and the
separate `a.anevum.com` identity are not acceptance of this candidate against
canonical apex accounts. The old "unrouted" apex build workflow now names the
live apex Worker and must not be used as a preview deployment.

### Remaining activation boundary

Final CI and synthetic browser results establish application regression
coverage. Actual Founder, independent reviewer, second-account and phone
acceptance still require a controlled authenticated candidate/pilot rollout.
The read-only preflight removes the identity-verification circularity without
turning publication on or self-certifying the release.

Any approved pilot activation must coordinate the canonical proof issuer and
its separate secret, the existing package controller and isolated runtime,
package-only migration `0004_resource_protection.sql`, bounded cleanup,
reviewer allowlist, and public/gallery flags. Preserve the existing legacy
uploader, published releases and exact rollback versions.

The optional verified-insignia migration on canonical `MEMBER_DB` is distinct
from the package migration. It is not a prerequisite to releasing the apex
application with verified-role/reputation display disabled. New public role
designations still require their existing nomination and independent review.

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

## Prior development evidence

- Complete combined Node 22 regression suite: 1,305 tests passed, zero failures, skips or cancellations before final source pinning.
- Package regression suite: 76 tests. Streamed body cap, leases, atomic storage reservations, failed-write cleanup, expiry, submission/discard races, ownership and independent moderation are covered.
- All ten CI workflows passed on the preceding package-only source 9ec54d6d. The consolidated source must pass again; earlier results are not acceptance of the final source.
- Root V5 deployment assertions now require the retired workflow to refuse all dispatches. Runtime, encryption, staging and owner-binding checks remain covered; no old deployment authority was restored.
- Exact 38-route inventory, including request-limit fail-closed settings, is pinned. The old 36-route count was stale after the two isolated V004 routes were installed.
- Four live staff Worker hashes match their checked-in repair source. Observatory V002 UI/server match #549 exactly and its exact source hash/version are retained; the release helper must not downgrade it.
- V003 and V004 staging backups restored successfully in disposable SQLite. The V003 resource migration was applied twice locally; integrity passed and existing data remained intact. These are not backups of the canonical member database.

## Activation order and acceptance

1. Finish CI and responsive synthetic browser QA on the exact consolidated source; update the existing #564 PR and close only PRs whose implementation is fully included.
2. Review and explicitly approve the controlled acceptance pilot and any database, permission or binding change separately. Establish the consented canonical sessions through the separately opted-in identity preflight before enabling normal package routes.
3. Record real Founder, independent reviewer and second-member sessions against that source in the controlled pilot. Verify Upload → Preview → Review → Publish → Discover → Play → Member Wall, account switching, private/public visibility, and staff denial for unauthorized accounts. Existing live-founder and synthetic checks do not satisfy these final-source gates. The checked-in resource migration is additive and gated OFF. The role migration is `creator-v1/canonical-auth/migrations/0012_verified_designations_v093.sql`; it requires a separately backed-up canonical MEMBER_DB and production change approval. It does not auto-grant roles, and independent nomination/review must remain mandatory.
4. Use one canonical package database/controller/runtime and their existing approved rollout procedure. Do not promote the parallel V004 staging controller. Coordinate the resource flag, required migration, cleanup scheduling, ownership proof secret, private runtime, gallery readiness and pilot approval. Never enable only half of the ownership or retention contract.
5. Enable approved capabilities only after authentic acceptance and storage/permission approvals. Preserve published builds, member progression, original media, private visibility and fail-closed staff auth.
6. Release the apex only through `.github/workflows/v084-continuance-production.yml` from its approved branch. The acceptance record stays false until evidence is recorded for the pinned source. Preserve exact live routes, databases, variables, secret names and rollback version.
7. Verify live source assets, desktop/phone interactions, authenticated journeys and deployment/version evidence after rollout.

## Production boundary at the end of continuation 002

The apex remained version 93cc7f07-cf39-457e-af69-c9f6f4c02d25. This development consolidation does not apply migrations, change roles, provision secrets, change routes, activate flags or deploy production. A merged or green PR alone is not completion on anevum.com.
