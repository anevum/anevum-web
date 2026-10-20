# ANEVUM V1 foundation release 0.1.0

Session: `ANEVUM.WEB.BUILD.2026-10-11.003.CREATOR-V1-ARCHIVE-CUTOVER`
Local date: 2026-10-11, America/New_York.

## Shipped

- The `anevum.com/*` route now targets `anevum-creator-v1`, replacing the V5 public homepage.
- `next.anevum.com` remains a separately deployable preview using `anevum-community-preview`.
- Both serve the approved cinematic design with the real read-only community API, not the former fictional project/member data.
- Live public catalogue, categories, counts and detail share the same publication/active-owner/date visibility rule. Search uses bound literal patterns, and pagination has a capped page size and exclusive cursor.
- Accounts, publishing, voting, XP and discussion are clearly labeled not open yet. The empty catalogue is genuine; no first-party or community listings were fabricated.

## Artifact and deployment

The tested frontend/API artifact was reproduced inside the deployment tool and its SHA-256 matched the local artifact before upload:

`dfe346a578a1eb13a1a38ab36e3265f7ef64e3b2adebbad15b4cdd5033ce033d`

Size: 450,750 bytes. Approved artwork assets: 14.
Production Worker version: `3d26a4b9-70b3-4a95-8cb5-d104913b255c`.
Production deployment: `daf1dc5f-36a6-4ba0-86d6-085c7abf812d`.
The only production data binding is `COMMUNITY_DB`; no legacy account or broker binding is present.

## Verified

- 34 Node tests passed: 24 real-SQL catalogue/site checks and 10 signed-assertion/archive tests.
- Local in-memory Chromium rendering passed 28 page/viewport checks, plus literal search, injection handling, mobile navigation, outage and retry checks. These are not described as live network tests.
- Independent Cloudflare Browser Rendering loaded the actual preview and the actual `anevum.com` mobile homepage. Both showed the V1 marker and the real no-projects state, without catalogue failure or a fictional creator.
- Unauthenticated live Backstage browsing showed Cloudflare Access before and after gateway routing.
- GitHub Actions run `38194768968` completed successfully on source commit `b3562cf3f1e4ac8a81283db47e9386c4d61e7cfe`, running the new Creator V1 verification workflow.

## Archive and retirement

`backstage.anevum.com/*` now runs through an owner-only read-only gateway before the retained V5 origin. It validates a signed Access assertion and allows historical public pages/assets only; account/admin/trading routes and mutations are unavailable. A real owner-authenticated browser session has not yet been tested.

The legacy production membership database was snapshotted consistently, encrypted in R2, fetched and decrypted, and restored into a separate temporary D1. All 13 application tables and 10 rows compared equal; SQLite integrity and foreign-key checks passed. The temporary database was deleted and the original database was not modified. Preview/beta databases and other historical artifacts were retained but are not included in this recovery certification.

The backup bucket has r2.dev access disabled and no custom public domain. Encryption keys remain in a non-public keyring Worker secret, not in source or this report. This is same-provider recovery, not a complete off-provider backup.

Legacy production, member-staging and beta generated Workers URLs and preview URLs are disabled. The legacy production-deployment workflow is now a refusal-only stub on both `main` and the V1 branch; the original workflow remains preserved on the archive branch. This prevents accidentally using that old workflow to reclaim the apex domain.

Existing RHEN code, broker settings and Railway services were not changed. Legacy source and production data were not deleted. Remaining historical surfaces, including old Pages deployments, still require a separate archival inventory before any deletion.

## Rollback and next objective

The old apex route/Worker version and recovery inventory are retained privately in R2. Routing back to the retained V5 Worker does not require overwriting the legacy database.

The next product objective is real member accounts and creator profiles, followed by authenticated project drafts and moderation. Introduce separate preview data before enabling writes. Preserve the approved visual identity and the new company direction; do not resume the old RHEN-centered V5 roadmap.
