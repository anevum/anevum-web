# ANEVUM Creator Uploads — Staging Security and Release Gates

## No deployment is authorized

1. Require a green exact-head Creator V1 CI for draft PR #375, plus an independent inspection of the route and database changes.
2. Verify a backup AND restore of isolated Creator V1 staging D1; compare existing schema and apply only migration 0007 there. Do not use the RHEN database or production site.
3. Create a separate private R2 quarantine bucket with NO public custom domain, no public r2.dev, and bounded lifecycle/cost alerts. Do not share R2 namespaces with unrelated ANEVUM workstreams.
4. Bind CREATOR_ASSETS only to the existing staging member Worker. Initially leave CREATOR_UPLOADS_ENABLED absent/false. Confirm HTTP 503 on all unauthorised storage paths and zero public asset URLs.
5. Only after security review, enable the flag for invited independent staging testers. No public registration or public creator uploading.
6. Exercise member A draft creation and private PNG/MP3/PDF/ZIP uploads. Verify size/content validation, server-owned access, listing/download/deletion, refresh/cancellation, concurrency, quota and lease recovery. Unrelated member B must receive 404 and guests 401.
7. Verify existing member/staff division and external demo link handling. The staff moderation queue must not auto-approve uploaded files; current release lacks asset-scanning and asset-publication.
8. Audit actual mobile/desktop interaction, keyboard/reduced-motion, staging R2 storage bills, error telemetry, restored D1 and R2 deletion behavior.
9. Integrate privacy export/account erasure for R2 files and legal rights claims before any general availability.

## Invariants and blockers

Basic extension checks and magic bytes are NOT malware scanning, PDF sanitization, ZIP bomb detection or license verification. Never extract archives or run arbitrary uploaded code on a privileged authenticated host. Serve quarantined files only as owner-authenticated attachment downloads with octet-stream and no-sniff. For future games, use a separate registrable domain and strict sandbox/CSP with no session bridge.

The current 20-MiB upload is buffered with bounded reads, not a resumable transfer. Scheduled cleanup processes at most 25 stale objects per run. Rare lease races and incomplete retention, reporting, deletion-fulfillment and malware scanning remain blockers for broad deployment. A published project must have a reviewed release, not merely an uploaded asset.

## Rollback

Disable CREATOR_UPLOADS_ENABLED before any staged Worker revert. Retain private R2 and D1 records pending the approved erasure/retention plan. Never drop the asset table while unresolved account deletion, takedown or data export requests may refer to these objects. No production cutover is part of this PR.
