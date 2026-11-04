# Anevum — Canonical Homepage Cutover

Session: ANEVUM.WEB.OPS.2026-11-03.027.CANONICAL-ORIGINAL-WORKS-LAUNCH

## Objective

Make the reviewed Original Works creative-studio design the **public Anevum.com homepage**, with no need for a finished revised REPLY edition or publication of private Transcosmic articles.

This is a **homepage-only routing change**. Preserve all existing member, staff, API, game, staging, and backstage routes and their existing Workers.

## Source of truth

- Repository: `devonalanakins/anevum-web`
- Static public source: `apps/anevum-public-studio/worker.mjs`
- Public Worker service: `anevum-original-works-public`
- Existing public paths: `anevum.com/original-works*`
- Existing root path: `anevum.com/`
- Previous root Worker: `anevum-profile-staff-access-v001`
- Root entry must be served directly, **not via a redirect**.
- No new D1, KV, service or environment bindings; `workers_dev` and preview URLs remain disabled.

## Required safety checks

1. Review the current Cloudflare zone route inventory and snapshot the exact existing `anevum.com/` root-to-Worker association and current public Worker deployment version. Do not modify `anevum.com/*` catch-all or any more-specific route.
2. Verify exact PR head passed existing production build, public-studio Node checks, and 35 page/viewport Chromium checks plus **canonical root at 390px and 1440px**. Cover valid `GET`/`HEAD`, non-root rejections, proper mobile nav, no horizontal overflow, no client JavaScript, noindex, and public-safe content boundaries.
3. Merge with expected-head guard. Deploy the exact merged source to **only** `anevum-original-works-public`, retaining no bindings. Verify the existing `/original-works*` pages still respond and root-ready source serves `/` in the direct Worker tests.
4. Change **only** the existing exact `anevum.com/` route to `anevum-original-works-public`; retain its existing route pattern and ID. Do not delete or replace the previous root Worker.
5. Verify live `https://anevum.com/` renders Anevum / Original Works, old software-studio title absent. Verify `/original-works/reply`, `/original-works/wiki`, `/member`, `/staff` and unaffected API route mappings.
6. If homepage fails, immediately restore the original exact-root route to `anevum-profile-staff-access-v001`; if the public Worker build itself regresses, restore the preceding deployed Worker version. Verify rollback endpoints rather than only trusting mutation responses.

## Content and discovery

- REPLY remains a work in author revision. Typographic cover is explicitly a **concept**, not an approved publication cover.
- The encyclopedia remains a public-safe status/preview page. No private canon entries, unpublished manuscripts, future retail claims, release dates or new commerce endpoints are to be exposed.
- `noindex, nofollow, noarchive` remains until **separate editorial/SEO authorization**. Publicly accessible is not equivalent to indexed. Publishing approved book or article assets and search discovery are later independent changes.
- The old `/original-works` landing path remains supported for bookmarks, but navigation home should point to `/`.
- A Cloudflare exact-root route may not match every query-string URL; inspect and verify separately after release before claiming campaign URL compatibility.

## Release status

Prepared in source as a reversible, gated change. Mark LIVE only after confirmed Worker upload, exact-root route switch and independent live smoke tests.

