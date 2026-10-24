# ANEVUM V132 — Immutable Inactive Version Upload

Session: ANEVUM.WEB.RELEASE.2026-10-23.004.V132-INACTIVE-CANDIDATE
State: **DRAFT / NOT AUTHORIZED TO ACTIVATE**. No public traffic changes.

This is a separate, fail-closed operations lane for the V131-backed, UI-only V132 release candidate in PR #694. Do not use it to rebuild code or change Cloudflare routes, account registration, databases, upload permissions, XP or earned media.

## Preconditions
1. Exact V132 PR source is reviewed and 100% CI green.
2. The source-bound V132 complete offline artifact is sealed with 152 original V131 earned models, all compiled static assets, and SHA-256 `1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99` for the **unchanged** V131 Worker gateway.
3. Hard-pin the approved GitHub run ID, immutable artifact ID and artifact SHA-256 in operations source. Any zero, expired, changed or mismatching artifact MUST block.
4. Review this PR's get-only provider verification, 26 bindings/five secrets/two D1 identities, 40 routes, disabled direct Worker preview exposure and current production version allocation.
5. Only a follow-up GitHub push whose **sole diff** is the owner-authorized immutable marker `.github/release-approvals/v132-collections-inactive-upload.json`, with exact message `release(v132): upload sealed collections candidate inactive only`, may reach the actual upload job.
6. Immediately before upload: perform credentialed read-only snapshot of actual Cloudflare apex and controller and refuse on drift from V131.
7. Upload one immutable version using `wrangler versions upload --no-bundle --no-upload-source-maps --keep-vars --strict`; DO NOT use `wrangler deploy` or `versions deploy`.
8. After upload: independent readback must show original V131 apex version `44f5971b...` 100%, controller `b3043430...` 100%, identical routes, settings, bindings and preview exposure, and exactly one new version not selected for traffic. Save a receipt.

The completed inactive upload is **not production publication**. Protected account acceptance, physical Safari/VoiceOver, owner visual acceptance and a separate rollback-aware public traffic approval remain required. If any gate fails, keep V131 at 100%. No account or database mutation is part of this operations lane.


Verified candidate: source `baa92c0cbdcce71bd0ae5862e574c90ac53d84a9`, exact CI run `40060370329` success; immutable package artifact `12547361119`, ZIP digest SHA-256 `55ae566dfc7c12d1c55d4b58e27b133cdbc157c9b0b5083b4c26459bece4cc03`, backend and 152 artworks retained. Stage only under parent ops commit and sole-file marker.
