# ANEVUM Porchlight V004 — private listing incidents and retention

**Session:** ANEVUM.ANEVUM.BUILD.2026-10-18.001.PORCHLIGHT-INCIDENT-RETENTION
**Owner program:** https://github.com/anevum/anevum-web/issues/489
**Stack:** V001 #494 -> V002 #500 -> V003 #502 -> V004 (this branch). A separate synthetic navigable 3D map lives in #495 and is not merged into this service.
**Status:** DRAFT SOURCE ONLY. No production API, no real adult identity verifier, no actual house pin or registration, no Cloudflare/D1 deployment, no public domain, no live reports and no child profiles.

## Delivered in V004

1. **Disabled-by-default public report intake.** POST /v1/events/{slug}/reports with JSON containing submissionId, reason and details. Reasons: unwanted, incorrect, privacy, accessibility, other. Reports require a published, approved listing and an independently supplied durable quota adapter. HTTPS Origin is checked for every write. The handler refuses to operate when reporting is disabled, unconfigured or not rate limited. No reporter identity is persisted.
2. **Server-declared availability.** Active public directory includes reportingAvailable only as a truthful server setting. The public report form stays disabled without a server-declared capability and published homes.
3. **Event-scoped organizer report queue.** GET /v1/organizer/events/{slug}/reports only accepts an independently authenticated event-specific reviewer/manager. Private description and linked submission ID never enter public analytics.
4. **Audit-guarded resolution.** POST /v1/organizer/reports/{id}/resolve requires an organizer, current revision and private reason. Transactional conditional update and audit entry prevent stale/double decisions. Resolution is not a safety certification or an emergency response.
5. **Privacy-driven withdrawal.** Host withdrawal and organizer rejection/removal delete related reports atomically. Report-audit rows cascade. Existing private-address scrub and event pause remain.
6. **Proposed isolated schema.** prototypes/porchlight-v002/schema-v004.sql is additive only for a future dedicated Porchlight D1, not the live member database.
7. **Time-bounded cleanup module.** runPorchlightRetention() in retention-v004.mjs defaults to dry-run; when allowDelete=true it deletes an event's report, audit, submission, block, role and event records after seven full days beyond the event end. It has NO scheduled runner, no verified backups and has never been executed on real data.
8. **Mobile reporting.** Public report form and role-protected resolution queue use semantic labels, server-sourced options, textContent rendering and no external SDK.

## Local commands

Node 22+, no production credentials required:

    node --experimental-sqlite --test prototypes/porchlight-v002/test/service.test.mjs prototypes/porchlight-v002/test/v003.test.mjs prototypes/porchlight-v002/test/v004.test.mjs
    node --test prototypes/porchlight-v003/test/ui-contract.test.mjs prototypes/porchlight-v003/test/v004-ui.test.mjs

Synthetic browser review is in prototypes/porchlight-v004/test/browser-smoke.mjs. It creates random test-only adult cookies in a localhost fixture and covers request -> review -> report -> resolve -> withdrawal -> pause at 320/390/768/1440 widths. No hosted external auth verification.

## Release blockers

- Actual independently verified identities, adult eligibility, organizer MFA, provider recovery and revocation.
- Household control verification and legally reviewed event-specific visibility/withdrawal consent.
- Server/edge quotas, abuse response coverage and protected incident note handling.
- Separate approved staging Worker/D1/secrets, audited migration, backups, restore/rollback, hosted cross-account acceptance and physical iPhone Safari.
- Scheduled/observed purge and tested backup retention policy. A maintenance helper is not an automatic service.
- Appropriate event/location rights, municipal terms and map-provider costs; no city, school or emergency-services affiliation claims.
- The 3D synthetic design PR #495 remains fictional. There is no real neighborhood GIS integration, student bus tracking or certified walking route.

**Release decision: NO-GO for collecting real home addresses or public deployment.** Trusted neighbors may review the offline fictional prototype without submitting a residence or account. If actual identity, consent, moderation and deletion gates cannot be met by Halloween, share public event information only.

