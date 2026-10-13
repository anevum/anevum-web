# ANEVUM Creator V1 - Production React Cutover Candidate
Session: ANEVUM.WEB.BUILD.2026-10-13.001.CINEMATIC-CREATOR-OVERHAUL
Status: source code only - NO PRODUCTION DEPLOYMENT OR ROUTE CHANGE

## Target
Replace the old read-only ANEVUM homepage with the accepted React cinematic creator universe, while keeping the existing public catalogue on the same production D1 and leaving private account functions closed until separately authorized. All subdomains and private RHEN remain unchanged.

## Implemented safely behind a gate
- A new public-only Worker in `creator-v1/web/production-worker.mjs` serves built React assets and delegates the published project/creator/status APIs to the existing read-only `api/worker.mjs` with request credentials stripped.
- Config `creator-v1/wrangler.react-production-candidate.jsonc` is intentionally **UNROUTED**, has workers_dev and preview_urls disabled, and names a separate candidate Worker. Deploying or merging its source DOES NOT replace `anevum.com/*`.
- Its existing production D1 binding uses the exact current public production database identity, with the existing API's published/active SQL visibility predicates and no writer APIs.
- All requests for /api/v1/member, /studio, /staff, /join, /command, /rhen, /lab, and /private fail closed. Member UI must remain visibly labelled invite-only/unavailable on the public version until real production auth is accepted. Do not connect the staging Member Worker or use staging session cookies at the apex.
- Strict host, HTTPS, method, CSP, referrer, iframe and cookie stripping checks are tested.

## Release gates (not waived by green CI)
1. Complete exact-head GitHub CI + Chromium visual/functional review of 1440 and 390/320 widths on `next.anevum.com/creator/` using the separately guarded manual staging workflow.
2. Confirm production D1 backup, recovery rehearsal, existing Worker and route configuration snapshot, and reversible rollback that preserves all current records.
3. Confirm real public API, deep link, content download, asset and CSP performance, plus owner/staff/member A / member B privacy checks in isolated staging.
4. Confirm privacy policy, creator licensing/AI disclosure, moderation/reporting, age-appropriate community defaults, and honest page copy; no public signup or payment activation before readiness.
5. Make an owner-approved irreversible cutover decision with exact SHA, route and old Worker rollback ID. No DNS or Worker edit before that acceptance.
6. Publish at least one rights-cleared genuine project or visibly label empty categories; Evergrove cannot appear until private family data are removed, licensing/rights and the hosted destination accepted.

The old ANEVUM Worker and Backstage archive must be retained intact. This package deliberately does not contain a deployment action, secrets, database migrations or automatic promotion.
