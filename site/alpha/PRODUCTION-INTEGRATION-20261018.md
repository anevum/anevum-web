# ANEVUM — Public releases + staff approval integration

Deployment date: 2026-10-18
Work: ANEVUM.WEB.ALPHA.2026-10-18.002.NATIVE-DISCOVERY-STAFF-REVIEW
State: LIVE, with verified public read paths and anonymous staff restrictions.
Important: a fresh authenticated staff approve/reject cycle after the cutover has NOT yet been tested because the queue contains zero pending projects.

## What changed

ANEVUM's main public `/discover` catalogue now reads approved alpha releases alongside the existing canonical community projects by proxying the existing public API and inserting read-only, specially identified alpha records.

Published alpha releases:
- appear in `GET /api/v1/projects` with native project card shape and IDs `alpha_<uuid without dashes>`;
- appear under Games/Creative/Learning category counts;
- have detail API `GET /api/v1/projects/alpha_<id>`;
- contribute to public status totals and `/api/v1/boards` latest releases;
- link to their same-domain `/play/<uuid>` restricted player.

No data was copied into `COMMUNITY_DB.projects`. Unpublished drafts, rejected projects and pending reviews are never visible through this bridge. Alpha records do not assert a public creator handle if a public creator profile has not been established. Free access is not misrepresented as a verified declaration.

The live app's alpha project detail page now labels approved games "ANEVUM-HOSTED", removes creator-site misinformation, embeds the existing sandboxed alpha player, offers "OPEN FULL PLAYER", and disables a generated `/creators/null` link. This patch only matches an `alpha_<id>` project whose player URL matches the same origin and identifier.

## Staff

The existing `/staff*` Cloudflare Access application still gates the portal. The original staff app is wrapped by a narrow, reversible navigation worker that adds a "PROJECT REVIEWS" link.

Review occurs inside **https://anevum.com/staff/projects**, protected by:
1. The existing Cloudflare Access policy for `anevum.com/staff*`.
2. A fresh, verified canonical ANEVUM Better Auth session.
3. An unrevoked `staff_access_grants` role of `owner` or `reviewer` in the canonical member database.

The project-review page shows the incoming queue, submitter display names, private same-origin player previews, publish/reject controls and recent decisions. Decisions are executed by the existing alpha API, with its own origin checks, session validation, storage-integrity checks and conditional status update.

The alpha backend now reads the canonical `staff_access_grants` table for staff permissions; the previous hardcoded reviewer allowlist is retired. Existing staff grants authorize two reviewers (one owner, one reviewer). Pilot *uploader* eligibility is unchanged.

An additive D1 trigger `anevum_alpha_review_status_audit` creates immutable-in-application review events for **new** publish/reject decisions in `anevum_alpha_review_events`. It was installed after the first Single Drift approval and does not retroactively reconstruct old decision events.

The retired standalone entry `/alpha/review` now redirects to `/staff/projects`. The original staff-ops and forum-review API routes have not changed.

## Published smoke-test project

Single Drift:
- UUID: `5764a892-0526-47b6-953b-4cf6a9053c0f`
- Public catalogue: https://anevum.com/discover
- Project detail: https://anevum.com/projects/alpha_5764a892052647b6953b4cf6a9053c0f
- Full player: https://anevum.com/play/5764a892-0526-47b6-953b-4cf6a9053c0f
- Status: published
- API category: games
- Public creator handle: not linked

## Current source snapshots

All files below are archived on isolated branch `alpha/player-uploader-20261018` of `anevum/anevum-web`. This repository's V5 app is archived, **not** the current creator-v1 apex frontend; do not deploy V5 to the apex.

- `site/alpha/anevum-alpha-main-discovery-v001.mjs`: read-only public catalogue compatibility adapter.
- `site/alpha/anevum-alpha-runtime-v004-staff.mjs`: canonical reviewer grants with existing uploader and player.
- `site/alpha/anevum-alpha-submission-tracker-v005.mjs`: pending creator status, staff review links and redirect.
- `site/alpha/anevum-staff-project-review-v002.mjs`: protected review page.
- `site/alpha/anevum-staff-review-navigation-v001.mjs`: non-invasive staff portal navigation.
- `site/alpha/anevum-alpha-frontend-player-v002.mjs`: scoped native hosted player on React project detail.

## Cloudflare routes and rollback

Route -> Active Worker -> Previous Worker

- `anevum.com/api/v1/projects*`, `anevum.com/api/v1/categories`, `anevum.com/api/v1/status`, `anevum.com/api/v1/boards`: `anevum-alpha-discovery-adapter-v001` -> `anevum-apex-prelaunch-gateway`.
- `anevum.com/assets/index-*`: `anevum-alpha-frontend-player-v002` -> `anevum-apex-prelaunch-gateway`.
- `anevum.com/api/v1/alpha/*`: `anevum-alpha-uploader-player-v004-staff` -> `anevum-alpha-uploader-player-v002`.
- `anevum.com/play/*`, `anevum.com/upload*`, `anevum.com/alpha*`: `anevum-alpha-submission-tracker-v005` -> `anevum-alpha-submission-tracker-v003`.
- `anevum.com/staff/projects*`: `anevum-staff-project-review-v002`. This is a new route; for rollback delete *only* this exact route after verifying its ID.
- `anevum.com/staff*`: `anevum-staff-review-navigation-v001` -> `anevum-iren-apex-staff-v002`.

Leave `anevum.com/*`, canonical auth, `/api/v1/member/staff-ops*`, `/api/v1/member/forum-review*`, earned levels and badges untouched.

Rollback by changing exact Cloudflare route script targets after preflight inspection. Do not delete R2 objects, D1 project rows, review history, or the new additive D1 audit table.

## Checks completed

- Live canonical `/api/v1/projects` contains the approved Single Drift game, project detail exists and category count is 1.
- `/discover` renders Single Drift with a working project link.
- The project detail describes ANEVUM-hosted play rather than an external creator site, includes an inline game frame, and has no `/creators/null` link.
- Cloudflare mobile visual rendering reported an embedded player without serious clipping.
- `/play/<uuid>` still renders the published game.
- Alpha API reports both R2 and D1 connected, and guest session flags false.
- `/staff`, `/staff/projects` and redirected `/alpha/review` require Access login when visited anonymously.
- Live D1: 1 published project, 0 pending reviews, 2 current owner/reviewer grants, audit trigger exists.
- Production Worker route targets were verified after cutover.

## Required final acceptance test

Sign in to Cloudflare Access and ANEVUM using an authorized staff identity, open `/staff/projects` and confirm the empty queue renders. Then upload a *new*, safe test game through `/upload`, submit, preview in `/staff/projects`, approve or reject, confirm audit event and creator-visible status, and verify the public `/discover` count changes without further manual deployment.

Note: Do not claim this last authenticated test has passed until completed by an authorized staff session.
