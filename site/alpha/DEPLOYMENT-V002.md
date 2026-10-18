# ANEVUM Alpha Uploader + Player — v002

Session: `ANEVUM.WEB.ALPHA.2026-10-18.001.PLAYER-UPLOADER`
Date: 2026-10-18
Status: **Deployed to isolated production routes; guest/API smoke tests passed; first authenticated upload, review and playback still require owner-session testing.**

## Live surfaces
- Creator upload: https://anevum.com/upload
- Public alpha releases: https://anevum.com/alpha
- Restricted staff review: https://anevum.com/alpha/review
- Play a project: https://anevum.com/play/<uuid>
- API health: https://anevum.com/api/v1/alpha/health
- Public alpha catalogue: https://anevum.com/api/v1/alpha/projects

The alpha is intentionally independent of the existing Creator Studio, member project drafts and `COMMUNITY_DB.projects`. Creator Studio is not a prerequisite to alpha uploads.

## Actual API contract
- `GET /api/v1/alpha/health` — confirms Worker DB / R2 bindings.
- `GET /api/v1/alpha/me` — verified session/pilot/reviewer checks.
- `GET /api/v1/alpha/projects` — approved public alpha records only.
- `POST /api/v1/alpha/upload` — multipart fields `title`, `summary`, `file`; verified pilot session; result `id` and `draft` status.
- `GET /play/<uuid>` — anonymous published player or private owner/staff preview.
- `GET|HEAD /api/v1/alpha/projects/<uuid>/file` — only published or permitted private content. No public R2 bucket.
- `POST /api/v1/alpha/projects/<uuid>/submit` — draft to pending review.
- `POST /api/v1/alpha/projects/<uuid>/review` — staff reviewer `publish` or `reject` plus reason.
- `POST /api/v1/alpha/projects/<uuid>/delete` — delete owner draft or rejected file; cannot delete pending/published through this endpoint.

All mutating API calls require a valid canonical ANEVUM member session, the `Origin: https://anevum.com` check and `x-anevum-alpha: 1`. Account IDs stay server-side.

## Accepted files
- `.html` — self-contained browser game or experiment, max 1 MiB; no external assets, services or network connections. CSP sandbox + iframe sandbox *without* `allow-same-origin`; only inline scripts, styles and data/blob images/media.
- Images: PNG/JPEG/WebP/GIF, max 8 MiB.
- Audio: MP3/WAV, max 16 MiB.
- Video: MP4/WebM, max 20 MiB.
- Document: PDF, max 8 MiB; offered as attachment.
- ZIP/multi-file projects, external asset loading, transcoding, custom file formats, progress resumability, and advanced Creator Studio authoring are **out of scope** in v002.

File extension, browser MIME and magic bytes are checked. Empty/generic browser MIME can be accepted when extension and binary signature match.

## Infrastructure
- Worker: `anevum-alpha-uploader-player-v002`
- v001 Worker: `anevum-alpha-uploader-player-v001` (safe rollback target).
- Service binding `AUTH` -> `anevum-apex-prelaunch-gateway` (canonical existing member authentication).
- D1 binding `DB` -> `anevum-canonical-member-staging` (the canonical member database currently bound to apex).
- R2 binding `MEDIA` -> `anevum-alpha-media-staging`, all files under private `quarantine/alpha/` keys.
- D1 tables: `anevum_alpha_projects` and `anevum_alpha_upload_limits` (additive only).
- Reviewer and pilot allowlists are enabled for the verified ANEVUM owner account. No separate authentication system was created.
- Each pilot member is limited to 20 entries, 100 MiB aggregate, max 10 upload attempts per hour. Files remain private until reviewer approval.

## Active Cloudflare routes
- `anevum.com/api/v1/alpha/*` — route ID `a19d8afd3a7e425aa8a563e21e7f2c69`.
- `anevum.com/alpha*` — route ID `964bf23227f24491b842fc6c8db720b3`.
- `anevum.com/upload*` — route ID `0209cb8d2e274acc98492b7861a86aab`.
- `anevum.com/play/*` — route ID `ff2bf6ffc43643cb88a551616f3d236d`.

All four were updated from v001 to v002 after a successful preflight. Existing apex routes, authentication, member accounts, Creator Studio, rewards, and Evolution levels were not modified.

## Tested
- Unauthenticated health: `{"ok":true,"storage":true,"db":true}`.
- Public projects response: `{"projects":[]}` — truthful empty state.
- Unauthenticated session flags: all false.
- Unauthenticated owner data: HTTP 401.
- Public `/upload` correctly points unauthenticated visitors to sign-in.
- Public `/alpha` shows no fabricated releases.
- `/alpha/review` restricts staff pages.
- Unknown `/play/<uuid>` returns an unavailable page rather than leaking content.
- Source Worker module validated and accepted by Cloudflare.
- R2 bucket exists and is correctly bound; D1 tables exist and are bound.

### Still to validate
One real authenticated user journey: sign in as the verified owner, upload the supplied self-contained HTML smoke test, test the private sandbox player, submit, review in the staff view, publish, and verify the public player and catalogue from an anonymous window. Do not claim this passed until performed.

## Discovery integration
A planned additive `site/alpha/anevum-alpha-discovery-v070.mjs` source integrates real public alpha records and a direct upload CTA into the existing discovery frontend. It was uploaded as a Cloudflare Worker `anevum-discovery-ux-v070-20261018` **but not activated**: the shared `anevum.com/assets/index-*` route changed back to `anevum-apex-prelaunch-gateway` in another workflow during the alpha release. The alpha does **not** overwrite that shared route. Integrate the feature properly into creator-v1's canonical frontend when frontend ownership is resolved.

## Recovery
Before changing routes, read current Cloudflare zone route configuration. To return this alpha to v001, repoint only the four alpha-specific routes to `anevum-alpha-uploader-player-v001`. Do not delete D1 tables or R2 objects during rollback. Never redeploy the archived V5 frontend to the apex.
