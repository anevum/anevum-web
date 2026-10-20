# ANEVUM Package Publisher — V004 Creator Uplink Implementation

Session: `ANEVUM.WEB.BUILD.2026-10-19.001.PACKAGE-UPLOADER-UX`  
Source PR: https://github.com/anevum/anevum-web/pull/516  
Status: **SOURCE ONLY / DRAFT / NOT MERGED / NOT DEPLOYED**  
Owner: existing creator publishing board #329; V091 experience #554 remains independently gated.

## Lock: ship completed browser builds, not an ANEVUM game engine

ANEVUM's immediate creator promise is: take a finished web game/app created in any vibe-coding tool or external engine, upload the **finished static web build**, privately playtest it, send it through staff review, and make an immutable approved version accessible inside ANEVUM.

Accepted runnable uploads: (1) `.zip` with a root `index.html` and all relative local assets; (2) one fully self-contained `.html` file. Optional `anevum.json` is not required. Do not require `.anvg/.anva/.anvp`, browser-side coding, creator canvas, in-house animation studio, or proprietary game runtime. The old native-pack editor and full Creator Universe remain future concepts, not launch blockers.

Apps requiring a server, private API keys, remote database or authenticated third-party services are **not** executable in the ZIP runtime; support externally hosted HTTPS demo **links** via the existing, separately reviewed Studio link path. A hosted link is not the same as an ANEVUM-hosted playable upload, and current Studio publication is not yet equivalent to the alpha pipeline.

### First wave browser capabilities

Static HTML5 games, vanilla JavaScript, client-side Phaser, compiled static React/Vite builds, JS/CSS/JSON/GLB/GLTF/WASM, local assets supported by the actual runtime MIME allowlist. Godot and Unity browser exports, custom native apps, advanced server-backed AI agents and unrestricted networks are not guaranteed. No auto-compilation of a raw React/Node project; import the resulting production `dist/` build contents instead. Vite uses relative base `./` before build.

Pilot structural ceilings: ZIP ≤20 MiB compressed; expanded ≤48 MiB; single asset ≤12 MiB; ≤180 files. Standalone HTML ≤5 MiB in **this v003 draft** (existing live alpha v002 remains ≤1 MiB). 20 active package projects, 100 MiB aggregate compressed uploads, 10 attempts per hour. Quotas are subject to measured scaling; do not raise a Worker limit without validating storage and decompression budget.

## Implemented V004 interactions and QA coverage

- File selector first on mobile; drag-and-drop where supported; clear file/type/limit errors, no fake upload percentage, disabled invalid submit and retry after network failure.
- One signed-in upload form for ZIP and HTML with title, category, summary, rights attestation and an explicit private-preview status.
- Guest login gate and clearly marked invited-pilot gate, not a simulated general-public uploader.
- Existing owned project shelf with real statuses, reviewed versions, immutable public release while replacing a draft, failed/rejected revision path.
- Export guide with exact ZIP tree, Vite tips, HTML limit and honest external-app restrictions.
- Phone-first player shell with stage preceding secondary information, restart, share only public URLs, fullscreen plus iOS fixed-viewport fallback, reachable Exit and Escape/Back handling without remounting the iframe on expand.
- Review dialog instead of `prompt()` for approve/request-changes, accessible label/validation and meaningful rejection reason.
- CSS responsive geometry, focus outlines, minimum 44px controls, reduced-motion override, mobile safe-area-aware Exit.
- CSS/browser QA at 320, 390 and 1440px using actual generated HTML and headless Chromium; mobile player/reviewer snapshots are synthetic **offline** fixtures, not authenticated production success.

## Backend safeguards added

- Public executable publish feature flag `PACKAGE_PUBLIC_PUBLISH_ENABLED` is strictly **OFF by default**. No production flag activation is part of this work.
- A draft cannot be submitted or published without a valid separately hosted runtime. Frontend hides false Submit/Approve actions when runtime is missing; server remains authority.
- Staff may not approve their own release, even if creator also has staff permission.
- Every upload must explicitly acknowledge creator rights. An immutable release-specific attestation receipt is stored in `anevum_package_rights_receipts`; public approval refuses missing receipts. A receipt is a claim and **not independent rights verification**.
- New `site/alpha/v003/migrations/0002_rights_receipts.sql` supports existing isolated stage DBs. Never apply migrations without inventory, backup and restore rehearsal, and explicit approval.
- Existing R2 isolation, SHA inventories, signed 15-minute private preview, immutable live releases, ZIP path/hash checks and separate-origin CSP remain intact; no account, XP, member profile or production route changed.
- No false assurance of malware scanning or independent pen-testing. General public executable upload must stay blocked until external origin and malware/content review, real staff/moderation/takedown and operational recovery have passed.

## Release gates (not waived by green CI)

1. Separate runtime Worker deployed on a **distinct registrable origin** with exact CSP/frame isolation and no canonical auth or RHEN secrets. Existing V003 API worker staging health previously returned HTTP 404, and runtime worker had not been deployed in its October 18 record.
2. Confirm stage-only D1/R2 bindings, apply additive rights receipts migration after backup/restore rehearsal and validate actual schema, credentials, traffic and rollback. No account or live-table migrations by convenience.
3. Genuine canonical owner A uploads a **safe, rights-cleared ZIP**, sees a real private preview on phone and desktop. Independent authorized staff B signs in to protected `/staff/packages`, previews, and approves. Anonymous guest C sees public page and runs scripts/assets. User A updates v2 without interrupting v1. Cross-account/privacy and suspended/takedown paths must be proven.
4. Independent executable safety, content inspection, abuse reporting, emergency takedown and transparent rights procedures need to be operational before public expansion.
5. Verify actual iPhone Safari viewport/keyboard/restart/Exit/share and Android/desktop, including network failure, cache, older hardware and accessibility.
6. Integrate the v003 route UX into the canonical `/upload`, `/projects` and existing creator profile/player cards. Keep existing v002 Single Drift, all user accounts and the V091 site experience; do not leave two competing public uploader interfaces.
7. Exact-head tests/CI and inspected browser screenshots plus controlled stage launch; `PACKAGE_PUBLIC_PUBLISH_ENABLED` enabled **only by reviewed deployment action** after independent release acceptance.

## Source and tests

- `site/alpha/v003/ui.mjs`: phone-first uploader, trusted rendering, player and review shell.
- `site/alpha/v003/api.mjs`: checks rights, runtime gate, independent reviewer and default-OFF publishing.
- `site/alpha/v003/schema.sql` and `migrations/0002_rights_receipts.sql`: release attestation.
- `tests/alpha-package-v003.test.mjs`: synthetic Node 22 D1/R2/runtime + security and UX contracts.
- `tests/alpha-package-v004-browser.mjs`: actual synthetic Chromium screenshots and interaction checks.
- `.github/workflows/package-v003-verify.yml`: syntax checks, Node suite and browser QA artifacts.

**Commands:** `node --check site/alpha/v003/api.mjs`, `node --experimental-sqlite --test tests/alpha-package-v003.test.mjs`, `node tests/alpha-package-v004-browser.mjs` (requires Chrome), all on the exact candidate commit.

## Next implementation after this draft

Resolve V091 authenticated acceptance, isolated runtime stage acceptance, independent publication/moderation protections, and canonical route integration. Do not restart Creator Engine design, buy new infrastructure, auto-merge, or move production aliases until those gates are explicitly satisfied.
