# ANEVUM Cinematic Creator Preview

**Session:** `ANEVUM.WEB.BUILD.2026-10-11.001.CREATOR-PLATFORM-SEPARATION`

**Status (2026-10-11):** Owner-approved cinematic UI deployed to `next.anevum.com` as Cloudflare Worker `anevum-community-preview`. Cloudflare API verified the current script, domain attachment and separate Worker version. The original `anevum.com/*` Worker route still points to `anevum-web-nextgen`. Actual public browser access outside the Cloudflare API has not yet been independently verified.

## What the approved UI includes

- Angular warm-gold ANEVUM logo and dark cinematic orange/violet/blue theme based on the approved 1536x1024 concept.
- Artwork-rich landing page with hero, creator-focused copy, featured projects, trends, creator rankings and a jam sidebar.
- Searchable and filterable app/tool, game, automation and template directory.
- Distinct project page with sample preview, about/releases/reviews/discussion tabs, voting and save controls.
- Sample creator profile with level progress, collectible emblem icons, follows and project history.
- Community feed, Jams, Portal (first-look queue), Rankings, saved Library and Publish local-draft page.
- Responsive desktop and mobile layouts; mobile bottom navigation and accessible drawer.
- Fourteen locally served WebP crops from the approved image generated during this conversation. Media is embedded in the self-contained preview Worker script; no external image or execution dependencies.

**All nine projects, creator names, view counts, ratings, rankings, levels and challenge events are illustrative fixtures.** The demo bar explicitly discloses that they are not live. Votes, follows, bookmarks and drafts do not contact a server and may be stored in browser localStorage only.

## Technical boundary

`community-preview/worker.js` is an independent classic Cloudflare Worker. It serves `/`, `/index.html`, `/health`, `/robots.txt`, and `/assets/*.webp`. It has no database bindings, Secrets bindings or RHEN order paths. Other endpoints are 404; mutations are 405. CSP denies outbound network requests and iframe embedding. No user-generated code executes on ANEVUM infrastructure.

`anevum-community-preview` D1 already has initial member/project/moderation tables under `migrations/0001_initial_creator_platform.sql`, but **this Worker is deliberately not bound to it yet**. The public V5 D1s are untouched.

## Verification

- Local Node smoke script passed home/health/assets/noindex/CSP/denied private routes/writes.
- Chromium UI tests passed at 1440px desktop, 390px and 320px mobile: successful artwork loading, no script errors or horizontal overflow, project navigation, reviews tab, local vote, drafts and responsive drawer navigation.
- Cloudflare API upload returned success 200. Downloaded Worker verified `ANEVUM CINEMATIC CREATOR PREVIEW` marker and new version count of two.
- `anevum.com/*` remains pointed at `anevum-web-nextgen`; `next.anevum.com` stays bound to `anevum-community-preview`.

Do not interpret screenshot approval as authorizing a cutover, fake activity or bypass of authentication.

## Source / workflow

This file is still on feature branch `build/anevum-creator-platform-20261011` of `anevum/anevum-web`, because the new independent `anevum/creator-platform` repository has not been created. Worker code contains the HTML, styles, script and preview artwork for reproducible deployment; `tests/portal-worker.test.mjs` exercises routes and security. The canonical image reference and owner approval are recorded in `docs/creator-platform/APPROVED-CINEMATIC-IDENTITY.md`.

When a permanent repository is available, split source into normal React/TypeScript components and dedicated asset files, use a reviewed Cloudflare deployment workflow, introduce a separate community D1 binding for authenticated project publishing and add real moderation before public registration. Keep external creator execution off the main origin.

**V5 cutover and RHEN isolation:** See `docs/creator-platform/BACKSTAGE-MIGRATION.md`. All V5 owner identity, signed Access JWT audience, OAuth trusted origins, backups and permission gates must pass before moving `anevum.com` away from V5.
