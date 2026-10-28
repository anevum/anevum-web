# ANEVUM.WEB.RELEASE.2026-10-27.002.SEVERANCE-BRAND-ICONS-SHARE

Date: October 27, 2026 ET (UTC deployments may appear on October 28).

## Purpose and user-approved art

Change **only** the installed website icon, browser favicon and social-sharing image, in line with the now-live game-first homepage for TRANSCOSMIC: SEVERANCE. This artwork is original, generated entirely by a checked-in deterministic Python script without third-party imagery or downloads. It preserves the genuine ANEVUM mark: a tilted elliptical orbit, vertical four-point flare, central circular aperture and small satellite. **Do not substitute a triangular A** or suggest the game is playable. Deep crimson, distressed champagne metal, ruined landscape, eclipse and atmospheric horror are the visual treatment. The public message card reads "TRANSCOSMIC: SEVERANCE — IN DEVELOPMENT".

## Approved visual assets and entry points

All output is deployed under new versioned paths, preserving existing cached URLs:

- `/anevum-severance-icon-v141-192.png` and `...512.png`: manifest home-screen icons
- `/anevum-severance-maskable-v141-512.png`: Android safe-area icon
- `/anevum-severance-apple-touch-v141-180.png`: iOS Add to Home Screen
- `/anevum-severance-favicon-v141-64.png`: browser tab icon
- `/anevum-severance-icon-v141-1024.png`: archival high-resolution master
- `/anevum-severance-share-v141-1200x630.png`: messaging social preview / Twitter summary_large_image
- `/anevum-severance-v141.webmanifest`: new versioned PWA manifest

`creator-v1/web/index.html` contains the actual server-delivered Open Graph and Twitter tags, not just client-side hydrated React metadata. The existing `creator-v1/web/src/components/PublicPageMetadata.tsx` is unchanged.

## Release invariants and rollback

- Previous verified homepage: Worker **V69** (`f30caf48-f56f-4209-be51-f029559d1cc0`) at 100%, deployment `1d965db3-68f0-431e-bc88-dbb7ef337101`.
- Retained V69 original frontend SHA256 `1cbc17726657086e7b86b8ee8a1ddee16a4067a9abdf6f49ebf40e8eb829fb44`.
- Sealed original V67 gateway SHA256 `1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99` remains unchanged.
- Preserve all old V69 static assets, including V67/V68 historical clients. Do not rewrite `/site.webmanifest`, `/apple-touch-icon.png`, `/favicon.svg`, `/anevum-social-share-v2.png` or any other existing public URL.
- Preserve Worker settings, **26 bindings**, **45 routes**, controller Worker, D1/R2, authentication and publishing permissions.
- Only the static index Open Graph, Twitter, icon, apple-touch-icon, manifest head tags may differ from live V69. No React component, JS/CSS, auth flow, APIs, permissions or Studio code is modified.
- Baseline and candidate Worker versions share every new image asset, differ only in the index HTML. Baseline retains V69 HTML and serves original visual until controlled switch. Candidate serves V141 branding HTML. Upload both **inactive first**, then verify exact provider settings.
- Only after source/browser/asset integrity gates pass, promote the brand baseline to 100%, canary branding candidate, inspect live HTML plus image bytes, then promote 100% with V69 and baseline rollbacks intact.
- Message app crawlers can retain previously fetched preview cards. A new image URL avoids old-image caching; an existing message cannot be forcibly refreshed by the site.

## Status

Source and release pipeline under implementation. Do not claim publication until the exact Cloudflare deployment and public readback are recorded here and in canonical handoff Issue #784.

## Exact release trigger

This change activates the guarded CI source/render/asset/upload gates. Only a successful current-head run may upload two Workers versions **inactive**; it is not authority to switch traffic without independent Cloudflare provider and public readback verification. Site behavior and authenticated/private paths remain unchanged.

## Release gate retry

The previous automatic attempt generated all seven images and passed source tests. Its conservative package hash check revealed a transcription error in the expected live V69 HTML SHA256. This is corrected from the exact GitHub Actions V69 production acceptance evidence. No Worker was uploaded or deployed in the failed attempt.
