# ANEVUM Package Publisher v003 — implementation and operating contract

Session: \`ANEVUM.WEB.BUILD.2026-10-18.001.UNIVERSAL-PACKAGE-PLAYER\`
Date: 2026-10-18

## Purpose

Make publishing a playable web experience as simple as publishing an HTML5 ZIP to Newgrounds, while preserving ANEVUM's authenticated creators, member cards, staff moderation, and later Creator Studio.

**Supported now:** ZIP packages of prebuilt browser files, and standalone \`.html\` files. Browser-only games, interactive apps, simulations, stories, and WebGL/WASM builds are eligible if they fit alpha constraints.

**Not represented as supported:** arbitrary servers, PHP, Python/Node backends, databases, AI proxy services with private API keys, full React source compilation, native .exe/.apk/.ipa installers, package installs, creator-defined network access, external CDNs, webcam/microphone, or threaded engine builds that depend on SharedArrayBuffer. These require a separately approved hosted-app runtime and per-project isolation.

## UX

- \`/upload/v3\` — uploader, own projects, version updates.
- \`/packages\` — public approved package projects, no fake releases.
- \`/play/v3/:project_id\` — universal browser player. Supports restart and fullscreen.
- \`/play/v3/:project_id?preview=1\` — owner/reviewer preview, signed 15-minute build capability.
- \`/staff/packages\` — verified reviewer queue inside staff namespace.
- \`/help/packages\` — package requirements, export guidance, security limitations.
- \`/api/v1/packages/*\` — creator and review REST API.

The old \`/upload\`, \`/alpha\`, and \`/play/:id\` routes are unchanged. V003 is additive and isolated.

## Alpha limits

| Setting | Value |
| --- | --- |
| Uploaded ZIP | <=20 MiB |
| Unpacked aggregate | <=48 MiB, streaming one file at a time |
| Maximum unpacked entry | <=12 MiB |
| Maximum entries | 180 |
| Compression ratio | <=400:1 per file |
| Standalone HTML | <=5 MiB |
| Projects per creator | 20 active |
| Compressed source bytes per creator | 100 MiB cumulative |
| Attempts | 10 uploads per hour |
| Manifest | <=16 KiB, optional |
| Entry point | Root \`index.html\` |
| Preview token | 15 minutes |

Production-scale engine builds larger than these ceilings need a streaming/queued extraction pipeline. **Do not raise limits in a single Worker without measuring memory and CPU**. Cloudflare Workers have a 128 MiB memory cap and R2 operations consume subrequests.

## Upload format

Example:

\`\`\`text
signal-drift.zip
├── index.html
├── style.css
├── game.js
├── assets/
│   ├── ship.glb
│   ├── music.ogg
│   └── background.webp
└── anevum.json                 # Optional
\`\`\`

Root \`index.html\` is mandatory; normalize builds before zipping. For Vite/React export \`dist\` with relative asset URLs (\`base: './'\`) and ZIP **the contents** of \`dist\`, not the enclosing folder. For Phaser, Construct, or game-engine web exports, ZIP the built HTML/JS/WASM/assets, not the source project.

Optional manifest:

\`\`\`json
{
  "schemaVersion": 1,
  "runtime": "browser",
  "entrypoint": "index.html",
  "permissions": [],
  "name": "Example",
  "recommendedAspectRatio": "16:9",
  "input": ["keyboard", "pointer", "touch"]
}
\`\`\`

V003 validates \`runtime\`, \`entrypoint\`, and empty \`permissions\`; other fields are descriptive and not granted special capabilities.

## Security model

- Creator and reviewer identity is resolved only by a service binding to canonical member auth. No account IDs, session cookies, or access tokens go into the runtime.
- Allowlist restrictions remain in effect for pilot uploaders and verified staff reviewers.
- State-changing API calls require POST, \`Origin: https://anevum.com\`, and \`x-anevum-package: v003\`.
- ZIP central-directory and local-header reconciliation, UTF-8 entry names, traversal checks, Unicode NFC validation, case-collision detection, compression/size limits, allowed extensions, no symlinks, and CRC32 verification reject hostile archives before publication.
- Assets have immutable unique release-specific R2 keys plus SHA256 metadata and a matching D1 asset inventory. An archive remains in private R2; neither the bucket nor its source packages receive public URLs.
- D1 stores project visibility separately from release status and live pointer. A draft release never overrides a live release. Staff approval atomically advances the release state and project pointer via D1 batch.
- Runner Worker is a **different site**: \`anevum-package-v003-runtime.devonakins.workers.dev\`, not a subdomain of \`anevum.com\`. It has **no AUTH binding**. The content's CSP enforces an opaque sandbox, including when the build URL is opened directly. iframe has \`sandbox="allow-scripts allow-pointer-lock"\` without \`allow-same-origin\`.
- Package assets may make requests to their own runtime origin only. Remote calls, form submissions, camera, microphone, geolocation, cross-origin embeds, and third-party code loading are forbidden in V003.
- No \`Access-Control-Allow-Credentials\` on runner. CORS response is \`*\` so module fetches work from opaque origins.
- Preview token is HMAC-SHA256 scoped to release UUID and expiry; both Workers use the same secret binding. Public URLs require \`published\` release state and \`live_release_id\` matching.
- Staff may reject with a reason; rejected builds are not executable through the public route.

## Infra

Existing Cloudflare account, but **new staging resources**:

- D1: \`anevum-package-alpha-v003-staging\` (\`fe6a2c20-ccde-451e-ab5f-3610b38d97ff\`).
- R2: \`anevum-package-alpha-v003-staging\` (private).
- Worker: \`anevum-package-v003-api\`.
- Worker: \`anevum-package-v003-runtime\`.
- Worker credential: \`PACKAGE_PREVIEW_KEY\` (secret_text, unique 96-character hex value, same in control/runtime; DO NOT check into Git).
- \`AUTH\` service binding: \`anevum-apex-prelaunch-gateway\`.
- \`PILOT_IDS\`, \`STAFF_IDS\`: copied by service configuration from v002 canonical owner pilot, not email strings.
- \`DB\` / \`MEDIA\`: dedicated staging resources; no D1 mutations to existing member tables.

Source of truth: \`site/alpha/v003/*.mjs\`, \`schema.sql\`, \`tests/alpha-package-v003.test.mjs\`.

## API

- \`GET /api/v1/packages/health\` — DB/R2/runner configuration.
- \`GET /api/v1/packages/me\` — canonical verified session and pilot/reviewer flags.
- \`GET /api/v1/packages/projects\` — public releases only.
- \`POST /api/v1/packages/upload\` — multipart \`title\`, \`summary\`, \`category\`, \`file\`, optional \`project_id\` for update.
- \`POST /api/v1/packages/projects/:id/submit\` — ready → pending review.
- \`POST /api/v1/packages/projects/:id/review\` — review body \`{"action":"publish"}\` or \`{"action":"reject","reason":"..."}\`.
- \`POST /api/v1/packages/projects/:id/delete\` — unpublished creator-owned deletion.

Public \`/r/:release_id/<path>\` and signed \`/p/:release_id/:token/<path>\` paths are handled only by the runner. They accept GET/HEAD, return explicit MIME types, and support single HTTP byte ranges. Public asset cache max age: 30 seconds. Raw ZIP files are never served.

## Publishing and updates

New project: \`draft → pending_review → published/rejected\`.
New version: \`ready → pending_review → published/rejected\`, with existing live version remaining public until the replacement is approved. Each release preserves its own immutable file inventory.

Delete is disabled for already-published projects or active review submissions. Deletion and takedown procedures for abusive content should be added before unrestricted public uploads.

## Verified and unverified

Node 22 SQLite integration suite exercises archive traversal/CRC/symlink attacks, HMAC expiry, private preview, asset loads, staff review, public playback, range handling and immutable public version during update. CI runs on each PR change. This **does not** establish that signed-in browser flows work on Cloudflare production.

Before general availability, test:
1. Owner signs in to \`anevum.com\` using canonical owner account, visits \`/upload/v3\`.
2. Upload real Signal Drift ZIP and validate private HTML/JS/CSS/manifest playback on desktop and iPhone.
3. Submit; verify pending draft is not publicly playable.
4. Open \`/staff/packages\` with verified reviewer account, preview and approve.
5. Verify catalog and anonymous link from a private browser; verify asset URL sends correct CSP, CORS, MIME, cache/range headers.
6. Upload v2 to same project; verify v1 remains live until approved.
7. Ensure original \`/upload\`, \`/alpha\`, \`/staff\`, \`/play/:id\`, current website route assignments, creator sign-in and profile pages are unchanged.

## Deployment / rollback

Deploy the controller and runtime as separate ESM Workers with module metadata and bindings. Apply only \`site/alpha/v003/schema.sql\` to **new package staging DB**. Bind private R2 storage and owner/reviewer allowlists. Preserve or replace **both** preview secrets together if reuploading Workers.

V003 Cloudflare staging Worker's workers.dev URLs can be independently inspected; no production \`anevum.com\` route needs to change to upload the source. If routing is authorized, use only highly specific paths: \`anevum.com/upload/v3*\`, \`anevum.com/packages*\`, \`anevum.com/play/v3/*\`, \`anevum.com/staff/packages*\`, \`anevum.com/help/packages*\`, \`anevum.com/api/v1/packages/*\`. Retain exact route IDs and prior assignment for rollback; never repoint catch-all \`anevum.com/*\` or legacy alpha routes.

Rollback deletes only the V003 route mappings; it must not delete canonical auth, member DB, existing submissions, or the private staging bucket. Deleted package sources can be garbage-collected separately after an auditable retention process.

## Deferred design: hosted AI apps

Full-stack AI code requires a second runtime: per-project isolated backend, bounded build job, per-app secret vault, user-scoped DB, quotas, explicit network egress policy, billing and abuse monitoring. This is **not implemented** by the browser ZIP runner and must not share the ANEVUM authentication Worker or database connection.


## Deployment verification update — 2026-10-18

The `anevum-package-v003-api` Cloudflare Worker was uploaded with isolated D1 and R2 bindings, and its `workers.dev` subdomain was enabled. Cloudflare's deployment API shows a version deployed at 100%, but an external staging endpoint fetch returned HTTP 404; no passing external health or UI smoke test is established. The separate executable runtime Worker was **not** deployed in this session. Therefore, ZIP uploading, private browser playback, creator sign-in, and staff review remain **unverified in the deployed environment**, regardless of green Node integration tests. No `anevum.com` routes were moved.

A real multi-file test archive `anevum-single-drift-v003.zip` was generated outside this repo and passed ZIP integrity, manifest, local-relative-dependency and size checks. Headless Chromium navigation is restricted in the working environment, so no device/browser pass is claimed.
