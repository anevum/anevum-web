# IREN communications: source-only review

Session: ANEVUM.IREN.BUILD.2026-10-24.001.TESTER-COMMUNICATIONS

This service is NOT deployed. The review config has no routes or D1 binding. It is not wired into the protected V131 Worker. The email frontend flag is off by default.

- The public updates archive contains human-approved release records only.
- Optional email topics are releases and weekly published creations. Authentication never implies marketing consent.
- The isolated COMMUNICATIONS_DB migration is source only; never run it against MEMBER_DB or COMMUNITY_DB.
- Confirmation and preference tokens are one-use, expiring, and hashed at rest.
- Database triggers log consent and suppression atomically with subscriber changes.
- No newsletter sending, app selection pipeline, creator upload ingestion, admin console, or production API route exists.

## Release gates (not completed)

1. Audit SQL and token lifecycle against a disposable isolated D1 database, including concurrency, re-subscription and suppression.
2. Test provider errors, quotas, IP provenance, deliverability and sender domain verification.
3. Complete independent preference link request UI and production unsubscribe compliance, including one-click support where required.
4. Only use verified, published, moderated projects in weekly digests; never include drafts or private material.
5. Review privacy policy, data retention, consent, abuse controls, isolated secrets and database bindings.
6. Explicitly approve audited apex routing and rollback.
7. Pass checks, verify desktop/mobile layouts, then authorize publication.

No deployment, migration execution, real email, or production flag change is authorized by this PR.

## Weekly published-creations preview (source-only)

`weekly-discovery-preview.mjs` reads the existing read-only `/api/v1/boards` response. It checks the `approved-public-projects` source marker, selects only verifiable publications in a seven-day window, and rotates among distinct creators before filling up to five slots. It returns an explicitly *preview-only* candidate list with `shouldSend:false` regardless of content. A lack of published projects produces no newsletter. No scheduler, subscriber lookup, message send, or marketing analytics are implemented here.
