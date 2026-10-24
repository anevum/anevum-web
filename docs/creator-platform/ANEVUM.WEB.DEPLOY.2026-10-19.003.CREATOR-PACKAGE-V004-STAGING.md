# ANEVUM.WEB.DEPLOY.2026-10-19.003 — Creator Package V004 isolated staging

**Status: deployed to opt-in staging routes on anevum.com; NOT the production uploader cutover.**
**Source:** draft PR #562, `build/creator-package-v004-resource-protection-20261019`.
**Main Creator Build Lab:** https://anevum.com/creator-lab/v004
**API health:** https://anevum.com/api/v1/packages/v004/health
**Separate runtime health:** https://anevum-package-alpha-v004-runtime.devonakins.workers.dev/__anevum_runtime_health_v004

## Verified staging infrastructure

- Creator control Worker: `anevum-package-alpha-v004-control`; entrypoint `staging-entry.mjs`, forwarding only namespaced V004 requests to `api.mjs`.
- Cookieless executable-content Worker: `anevum-package-alpha-v004-runtime` at a distinct `workers.dev` origin. Its HTML5 player uses signed 15-minute HMAC previews, a restrictive content-security-policy, per-build D1 authorization, and denies expired private tests even if cleanup has not yet run.
- Dedicated **new** D1 database `anevum-package-alpha-v004-staging`, created by copying only the table DDL from the **empty** V003 staging database, then applying additive migration `0002_resource_protection.sql`. The V003 project/release rows were not copied or changed.
- Dedicated **new, private** R2 bucket `anevum-package-alpha-v004-private-staging`, without any public object domain. It is not the live V003 bucket.
- The control Worker reuses the existing Better Auth **read-only session lookup** service so signed-in pilot creators work through the same-origin V004 route. It does not use an independent account or identity database.
- `PILOT_IDS` and `STAFF_IDS` were transferred from existing V003 configuration without exposing values in GitHub. Public self-service uploading is **not** enabled.
- Fresh 384-bit preview HMAC secret is bound to the new control and runtime Workers only. The secret was not printed, stored in the repo, or copied from V003.
- V004 controller pilot upload admission is enabled; global D1 budgets still cap 10 attempts/hour, 30/day and 300 MiB/day and only allowlisted accounts can write.
- Edge-local rate limiters: 12 preflights/min and 6 upload requests/min per key and colo. Hourly scheduled cleanup: `0 * * * *`.
- DNS and Cloudflare Worker routes:
  - `anevum.com/creator-lab/v004*` -> new V004 controller.
  - `anevum.com/api/v1/packages/v004/*` -> new V004 controller.
- **No replacement** of `anevum.com/upload*`, `anevum.com/play/*`, the current V003 control/runtime, released projects, member accounts, progression, the staff portal, or home page.

## Live unauthenticated smoke checks

- `GET /creator-lab/v004` -> Creator Build Lab 004, user sign-in prompt when unauthenticated.
- `GET /creator-lab/v004/help` -> complete ZIP/HTML upload guide.
- `GET /creator-lab/v004/projects` -> empty staging catalogue (expected).
- `GET /api/v1/packages/v004/health` -> JSON `ok: true`, `version: 004`, both DB and storage bound and runtime configured.
- `GET /api/v1/packages/v004/me` -> unauthenticated false, pilot false.
- `GET /creator-lab/v004/staff` -> unavailable without staff session.
- `GET /api/v1/packages/v004/usage` -> 401 when unauthenticated.
- `GET /api/v1/packages/v004/staff/metrics` -> 404 when unauthenticated.
- Runtime signed-preview health -> `ok: true`; a nonexistent release `/r/{uuid}/index.html` -> 404.
- D1 counts after deployment: zero projects, releases, reservations, or cleanup jobs.
- Dedicated CI: [Creator Package V004 Resource Protection](https://github.com/anevum/anevum-web/actions/workflows/creator-package-v004-verify.yml) covers bounded multipart, SQLite and fake R2, parallel upload/cleanup, ownership, signed preview, route isolation, and 390/1440px screenshots.

## Required owner-and-reviewer acceptance before production routing

1. As the allowlisted owner already signed in at `anevum.com`, open `/creator-lab/v004` on iPhone and desktop. Upload a safe, static ZIP with a root `index.html`. Do not upload secrets or personal data.
2. Confirm the private player uses the V004 runtime and that the exact package opens at `/creator-lab/v004/play/{id}?preview=1`.
3. Upload the exact same file again; verify the existing version opens without creating a duplicate R2 package or D1 release.
4. Replace with a modified build; verify its version increments but a failed replacement never alters the last good private build.
5. Save the new private test; verify it will not expire. Discard a disposable test; verify queued cleanup and subsequently freed physical quota after cron.
6. Test independent member ownership, staff authorization, review approve/reject, isolated run restrictions, old public version preservation, and rollback.
7. Verify actual R2 entries, D1 costs, error logs, iPhone Safari behavior, and publication bridge. Existing production alpha and native project pages must remain reachable.
8. Only after these gates and V091 release acceptance, stage a separate approved production cutover. An isolated staging deploy is **not** authority to merge PR #562 or replace current production routes.

## Operational rollback

To disable this opt-in staging feature, detach only the two V004 staging Cloudflare routes. Existing V003 routes and published creations remain intact. To halt new pilot writes while retaining private cleanup and owner read/erase, set `PACKAGE_UPLOADS_ENABLED=false` on V004 control only; do not delete R2, D1, or the cron before reconciling pending uploads and cleanup jobs. Preserve staging evidence until verified retention or deliberate erasure.
