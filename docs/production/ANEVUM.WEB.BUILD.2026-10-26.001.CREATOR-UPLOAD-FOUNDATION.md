# ANEVUM - Continuance Institute Creator Upload Foundation

Session: ANEVUM.WEB.BUILD.2026-10-26.001.CREATOR-UPLOAD-FOUNDATION

Date: October 26, 2026
Integration: V136 unified website overhaul / canonical Creator Studio
Status: DRAFT, review/staging development, NOT public or production-deployed.

## Decision

Make creator upload participation broadly available after acceptance tests, without promising infrastructure with infinite resources. The old canonical 20 MiB private vault stays in place. A distinct channel for Godot Web ZIPs and MP4/WebM files between 20 MiB and 1 GiB uses resumable 8 MiB R2 multipart chunks. This solves the immediate storage-size problem but does NOT publish or execute uploaded games.

## Isolation and retained components

- Existing Better Auth verified member sessions, ownership and CSRF/origin guards remain the only upload identity.
- MEMBER_DB D1 staging migration: creator-v1/canonical-auth/migrations/0014_member_creator_large_assets.sql.
- Existing small creator asset storage and V003 archive/player pipelines remain unchanged. Large uploads use a *different* R2 binding named CREATOR_LARGE_ASSETS.
- Separate, already created review-only R2 bucket: anevum-creator-large-assets-review (ENAM Standard). Do not bind an existing small asset bucket to CREATOR_LARGE_ASSETS.
- The inactive config creator-v1/wrangler.a-canonical-large-review.jsonc is explicitly unrouted, all flags disabled. Its existence is not a deployment.
- Large asset bytes remain private in quarantine. There are no public URLs, malware-scan approvals, executable previews, creator self-approval or automatic publication.

## API and safeguards

Existing canonical prefix: /api/v1/member/studio/projects/{projectId}/assets-large.

| Path suffix | Method | Outcome |
| --- | --- | --- |
| / | GET | Owner files, reserved-byte meters, readiness |
| / | POST | Atomic reserve with filename, MIME and size checks |
| /{asset}/start | POST | Start/resume private R2 multipart |
| /{asset}/parts | GET | Authorized completed-part receipts |
| /{asset}/parts/{n} | PUT | Upload exact 8 MiB part except final |
| /{asset}/complete | POST | Validate ordered parts, private quarantine |
| /{asset}/file | GET/HEAD | Owner-only forced attachment; nosniff, no-store |
| /{asset} | DELETE | Remove bytes and invalidate pending review |

Allowed packages: ZIP, MP4, WebM; 20 MiB < file size <= 1 GiB.
A member has 5 GiB of reserved large-file capacity. The new large-file vault uses
a 25 GiB shared reservation ceiling and 40 large-file records per project;
incomplete reservations count against these ceilings. Transfer leases are 24
hours and scheduled cleanup retries stale R2 data. Per-part D1 claim tokens
serialize writes to the same part number. A successful completion records a
SHA-256 digest over ordered part numbers, sizes and SHA-256 values. This is
a part-manifest digest, NOT a SHA-256 hash of the entire original file.

Independent private review receipts now include these large attachment
manifests. Withdrawing one from a submitted review invalidates the pending
review. Account deletion is blocked while recorded private assets exist.

The Studio review desk displays aggregate large-file capacity, active and
quarantined counts, and 80% / 95% thresholds. Those are D1 reservation
figures, NOT actual Cloudflare R2 billing. Existing assets remain available
when the ability to make new uploads is paused.

## Cloudflare pricing and growth (2026-10-26)

R2 Standard storage is $0.015 per GB-month beyond the INCLUDED **10 GB-month
per Cloudflare account**, with 1M Class A operations and 10M Class B
operations included monthly. Above those included operations, Class A is
$4.50/million and Class B $0.36/million. R2 Internet egress is free.
Billing is rounded to applicable units. Workers, D1, security scanning,
streaming/transcoding and other products have separate constraints and charges.

Storage-only worked examples assume no existing R2 usage and full-month
retention; NOT total infrastructure spend:

| Scenario | Retained files | Marginal Standard R2 storage/month |
| --- | ---: | ---: |
| First member's Godot build | 0.5 GB | $0 |
| 2 creators | 4 GB | $0 |
| 10 creators at 2 GB | 20 GB | about $0.15 |
| 50 creators at 5 GB | 250 GB | about $3.60 |
| 100 creators at 5 GB | 500 GB | about $7.35 |

The separate R2 bucket does NOT create a separate free allocation. Existing
ANEVUM buckets consume the same account allowance. This quota ceiling
protects spending but must be deliberately reviewed when creation grows.

Rest of 2026: aim for 10 active members and two active creators. The free
storage allowance may suffice if available after accounting for other R2
buckets; do not buy more storage merely to support a couple of builds.

2027 capacity planning envelopes (assumptions, not predictions):
10-50 creators and 20-250 GB; high growth ~100 creators and 500 GB.
Prioritize retained bytes, downloads/playback, security and creator retention
as observed. Do not infer bill from account registrations or database rows.

Sources:
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/r2/objects/upload-objects/
- https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- https://developers.cloudflare.com/d1/platform/pricing/

## Release and recovery gates

1. Keep the PR draft on top of the V136 overhaul; do not merge or deploy until CI green.
2. Run the new offline multipart tests, old Creator Studio tests,
   account-closure/auth tests, native Creator compatibility, TypeScript and
   full staging website build.
3. Back up canonical staging MEMBER_DB and test a restore, then obtain
   explicit approval before applying migration 0014 to staging.
4. Configure a review Worker using the dedicated CREATOR_LARGE_ASSETS binding.
   NEVER overwrite the active a.anevum.com Worker, its routes or secrets.
5. Test two verified member sessions against real review D1+R2: first build,
   long upload, resume, mismatched part, owner-only read, foreign-account
   refusal, CSRF defense, review receipt, cleanup and deletion.
6. Use CANONICAL_CREATOR_STUDIO_ENABLED=true plus
   CANONICAL_CREATOR_LARGE_UPLOADS_ENABLED=true in approved review only.
   Set CANONICAL_CREATOR_LARGE_ACCESS=pilot with an explicit nonempty
   CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS list. Set to verified for all
   verified members only after acceptance tests and operating budget checks.
7. Build malware ZIP inspection, constrained game runtime, explicit staff
   public approval, CDN delivery, abuse response and rollback before letting
   any untrusted Godot build run or reach a public catalog.
8. Review aggregate account R2 usage and billing alongside the D1 quota meter,
   including other buckets and unfinished multipart storage; wire paid-service
   billing alerts before open enrollment.
9. Verify the exact merged V136 staging build, two-account staging experiences
   and UI motion/theme baseline before considering production.

Implemented in source: multipart backend, additive schema, client and Studio
UI, private review integration, storage metrics, scheduled cleanup, tests and
CI. Provisioned: isolated review R2 bucket.
NOT completed: tested deployment, D1 migration to a live environment,
malware inspection, final public game hosting and open upload activation.
