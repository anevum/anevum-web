# ANEVUM V037 — Supporter transparency and impact dashboard
Status: DRAFT SOURCE ONLY. Based on V036 PR #441. No deploy, live charges, schema migration or public site change.
Verified: 2026-10-16 (manual provider audit; not real-time telemetry).

## Purpose
The public `/support` page should explain why the independent network needs support, what a supporter receives, what remains free, where funds would go, and which improvements support could unlock. It must not invent revenue, operational invoices, fundraising totals or capacity.

## Verified baseline
- Cloudflare D1 canonical member staging database: 475,136 bytes (read-only database metadata).
- Cloudflare D1 creator staging database: 278,528 bytes.
- Canonical member image blob aggregate: 285,792 bytes across two image rows. **Already inside** the canonical member database file; not an extra bill.
- R2 profile-media staging bucket: 0 objects at the snapshot; bucket exists but current profile images are held in D1.
- Canonical member profile image limits in source: avatar and banner, max 262,144 bytes per JPEG; this is **not** a creator upload quota.
- Canonical staging: 2 member rows, 1 creator profile, 1 wall post. Do not call these public community totals.
- Railway ANEVUM Core staging evidence probe: 0 recorded CPU/memory/disk/network for 24-hour window. Not an invoice, cost estimate or indication of total workspace usage.
- No verified Railway invoice, Cloudflare invoice, support revenue ledger, monthly expense total, fundraising target or active supporter count. All remain `null` and appear as **NOT VERIFIED**.
- Stripe supporter proposal: $5/month or $36/year; checkout remains inactive and benefits are not for sale yet.

## Page sections
1. Current founding supporter plan, benefits, terms and test-only status (existing V032-V034).
2. Financial transparency: actual operating expenses, net supporter receipts, active members and goal coverage; disabled/unknown meters until verified.
3. Storage and capacity: scoped D1/R2 snapshot, image limits, transparent future upload capacity.
4. Staging activity and infrastructure signal with honest scope.
5. Four proposed support outcomes: foundation, storage, publishing, community.
6. Launch readiness matrix differentiating tested source from live functionality.
7. Financial reporting principles, privacy and expandable provenance.

## Operational follow-up before live release
- Reconcile Railway/Cloudflare and email/other service invoices to a monthly cost baseline; choose whether to disclose line items or ranges.
- Implement aggregate-only, public-safe telemetry with caching, timestamps and source metadata; do not expose private tables, individual member records, internal provider IDs or API keys.
- Agree on funding allocation and update cadence, and define what gross, net and reserves mean.
- Approve actual goal amounts only after invoices and roadmap cost estimates exist.
- Verify real Stripe sandbox lifecycle, recurring payment policies, refunds and cancellation.
- Approve merge, migration and staging deployment separately. Do not promote staging to `anevum.com` before launch authorization.
