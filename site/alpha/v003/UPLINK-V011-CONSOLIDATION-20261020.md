# Canonical Creator Uplink: resource consolidation

Session: ANEVUM.OPS.UPDATE.2026-10-20.001.RELEASE-CONSOLIDATION

The existing V003 controller is the canonical controller. V010 ownership proof,
PNG covers, rights receipts, independent review, hashed preview capabilities,
moderation and the member-wall API remain in place. V004's resource modules
are integrated here; the separate V004 staging controller is not a primary
route replacement.

`PACKAGE_RESOURCE_PROTECTION_ENABLED=true` enables this integration on both
controller and isolated runtime. It is absent/OFF by default. Before enabling,
restore and rehearse the target package database backup and apply additive
`migrations/0004_resource_protection.sql` to the package database only. This is
not a migration for canonical MEMBER_DB. Configure bounded scheduled cleanup
on the controller and preserve its existing AUTH, DB and MEDIA identities.
No migration, flag, cron, secret, binding or production route is applied by
this source change. Public publishing, issuer proof and namespace activation
retain their separate existing gates.

The combined controller enforces per-member upload leases, hourly/daily
attempt and byte budgets, atomic per-member/global storage reservations,
48-hour temporary builds, explicit Save draft, confirmed private replacement,
and bounded retryable cleanup. PNG bytes count once in physical storage.
A maximum 25 MiB multipart body retains room for a 20 MiB ZIP, 3 MiB cover and
form overhead. Archive extraction remains bounded to 180 files, 48 MiB total
and 12 MiB per file. No source archive or file is stored before admission.

A repeated build is a no-op only when source bytes, title, description,
category and cover match. A changed cover or description creates a real
private revision. The old build is revoked only in the same D1 transaction
that commits the complete replacement. Failed R2 writes leave its old pointer
and assets intact; uncommitted new prefixes stay charged until verified erasure.

Expiry is enforced at save, submit, cover access, preview minting and the
isolated execution runtime. Saving cannot revive an expired build. Discard
cannot detach a build that entered independent review concurrently. Published
releases and any current draft are excluded from automatic erasure. Rejected
private builds wait seven days; erased private history waits thirty days
before bounded metadata pruning, including rights-receipt foreign keys.

The owner UI shows storage use, temporary/saved/expired state, Save draft and
replacement controls. Expired builds expose replacement instead of an invalid
preview. No additional creator identity, Creator Studio or player is introduced.

Verification uses the existing Node 22 package suites and Chromium capture
workflow, extended with resource-enabled uploader views at 320, 390 and 1440
pixels. Synthetic test cases include metadata/cover revisions, actual physical
accounting, failed writes, orphan erasure, expiry and submit/discard races,
independent review, default-OFF publication, approved gallery attribution,
rollback preservation and additive/idempotent migration. Real authenticated
creator/reviewer/member acceptance is still required before activation.
