# ANEVUM V143 studio website — review checkpoint

Session: `ANEVUM.WEB.DESIGN.2026-10-30.001.STUDIO-IDENTITY-REDESIGN`

## Decision and boundaries

The public creative studio is ANEVUM, founded by Devon Akins. TRANSCOSMIC is the primary fictional universe; SEVERANCE is its first major game in development. The website introduces worlds, games, open-source creative tools and verified development records. It does not claim a launched multiplayer server, fictional studio statistics, or access that is not independently verified.

This is a website presentation update on the **Creator V1 / release-v141 lineage**, not on GitHub `main`. The `main` tree lacks the Creator V1 production frontend. Do not retarget this PR to main, rewrite production Worker routes, or treat any source merge as automatic permission to deploy.

The feature flag `VITE_ANEVUM_STUDIO_V143=true` selects the new homepage, About page, navigation, visual design and static HTML metadata. Without the flag, established V137 entry and navigation remain available. Protected account, Creator Studio, community, D1/R2 and auth contracts are unchanged.

## Verification

- `node --test creator-v1/test/studio-identity-v143.test.mjs`
- `npm run check:creator-v1-web`
- `npm run build:creator-v1-web` with the exact production-mode and V143 flags
- `node creator-v1/test/studio-identity-v143-browser.mjs` after a Playwright Chromium install
- Visual review of the browser screenshots at 1440, 390 and 320 pixels for all five primary public routes, with special attention to SEVERANCE text geometry, header and mobile overlays
- Independently verify existing protected routes with suitable test accounts before any live promotion

**Outstanding release dependencies:** compare the actual live Cloudflare Worker, route and asset bindings; restore approved first-party cinematic media where applicable; prepare a new dedicated ANEVUM studio PNG social share (the current public fallback PNG still has legacy Creator Universe wording); verify HTML social previews, PWA icons, and actual browser access; document exact-SHA rollback. Baseline V136/V139 release workflows contain earlier frozen contracts and source-scope checks. Do not silence them to force a release. Review exact baseline failures separately.

No live deployment is performed by the V143 review workflow. Its jobs only build, test, take screenshots and upload evidence.
