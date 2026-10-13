# ANEVUM Creator V1 - Cinematic Worlds visual overhaul
Session: ANEVUM.WEB.BUILD.2026-10-13.001.CINEMATIC-CREATOR-OVERHAUL
Status: source-only candidate / visual and release acceptance pending
Ownership: #325 canonical board, #335 design, #333 release
Parent: design/creator-v1-celestial-artifacts-20261013

## Direction
On October 13, 2026, the owner selected a generated cinematic creative-universe reference with deep midnight navy, painterly floating worlds, a monumental gold portal, decorative celestial achievements, and gold-framed creator discovery. Use this as a visual direction, not an exact production screenshot. Existing React/Cloudflare Creator V1 application remains the implementation foundation. This is a major visual migration, not a private RHEN/V5 data migration, new auth system, shop, or web-app execution feature.

## Implemented in the proposed candidate
- Original deterministic layered SVG scene art in eight category palettes for hero, category previews, and project category fallbacks. No third-party stock art.
- New creator-first cinematic homepage with genuinely routed actions, category strip, server-backed project and creator records, truthfully reported catalogue counts, clear illustrated empty states, celestial preview art, real LevelPanel, and a community navigation module.
- Project cards show clearly marked CATEGORY ILLUSTRATION fallback rather than pretending the mock artwork is user-submitted art.
- Site-wide final CSS layer with midnight/navy/gold editorial surfaces and touch/keyboard/reduced-motion behavior.
- Accessible member account link, existing nav/search/quick launcher, project/creator/participation behavior preserved.
- Source contract tests for genuine data, no invented content, reliable links, eight illustration categories, accessibility and layout.
- The art-study display does not create any achievement; verified server state owns awards, levels and permissions.

## Required raster asset production next
Image generation is valuable for artistically detailed original art that should not be recreated as crude CSS or excessive SVG paths. The selected generated page concept is a visual reference, not a usable production screenshot. Produce new source artworks without overlaid UI text and export:
- Responsive cosmic portal hero master around 2560 to 3200 pixels wide, plus optimized WebP/AVIF.
- Eight visually distinct category environments (games, apps, art/AI, open source, automation, research, learning, other) as 16:9 masters and compressed variants.
- Transparent detailed 512 to 1024 px achievement and collectible renders alongside independently simplified 16-48px SVG icons.
- Exact original ANEVUM symbol and custom wordmark SVG variants with small-size legibility tests.
- Real project thumbnails, creator avatars, and profile banners ONLY after media-rights, moderation, size and file-type rules are implemented.

Avoid merging the generated mock's fictional project names, ratings, imaginary creators, or invented activity. Real creator-owned covers must be preferred once available, with category illustrations as fallback.

## Verification and release boundaries
- Build/CI on exact source commit, inspect compiled pages at 1440/1024/390/320px, keyboard, focus, contrast, reduced motion, loading/empty/error paths.
- Before production: finish the real member A -> staff -> anonymous -> unrelated member B project cycle, independent account/auth/security review, moderation/recovery/restore testing, and creator-content rights disclosures.
- Before visual approval: compare the actual render against the owner's image reference, homepage first at 1440px and 390px, then Explore, Projects, Creators, Community, Levels and member/owner screens.
- Stage only to isolated next.anevum.com/creator/ after exact SHA verification and preserved staging / member Worker isolation. Do not claim CI is staging/browser acceptance.
- ANEVUM apex production and production D1 do not change until the owner explicitly approves production cutover after those checks. Old site archive/worker and private RHEN, lab, portfolio remain intact for rollback. Do not delete database, DNS, credentials, archives, or member records because a design is replaced.
- No fabricated users, social metrics, payments, Shop links, subscriptions, hosted third-party code, RHEN account access, or public signup enablement.

This candidate intentionally does not include generated raster masters, binaries or on-premise project-media storage. Those are a separately testable art production and rights-review step, not falsely reported as implemented.
