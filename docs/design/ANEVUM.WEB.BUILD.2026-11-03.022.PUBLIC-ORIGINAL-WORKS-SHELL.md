# Anevum Original Works — Public Visual Edition

Session: ANEVUM.WEB.BUILD.2026-11-03.022.PUBLIC-ORIGINAL-WORKS-SHELL

This is a separately deployed, public, read-only static Worker in the existing website repository. It is for visual design iteration, not a manuscript or encyclopedia publication.

- Source: apps/anevum-public-studio/worker.mjs
- Config: wrangler.anevum-public-studio.jsonc
- Route: https://anevum.com/original-works*
- No D1, KV, service bindings, authentication, API, cookies, external scripts, or analytics.
- Deliberately excludes unpublished reader articles and sensitive canon; /wiki is a status page only.
- noindex remains in force until public/editorial release approval.
- This deployment must not change anevum.com/, its existing gateway, member or staff routes, or DNS.
- Rollback: remove only the dedicated anevum.com/original-works* route; leave the legacy catch-all route and Worker untouched.
- Build/test: node --check apps/anevum-public-studio/worker.mjs && node --test tests/anevum-public-studio.test.mjs.
- Real browser QA must confirm no overflow, accessibility landmarks, valid links, and screenshots at mobile and desktop widths.

This is an intermediate live release, not an apex cutover. Move to the root only after preview review, separately approved editorial content, and a verified compatibility/rollback plan.
