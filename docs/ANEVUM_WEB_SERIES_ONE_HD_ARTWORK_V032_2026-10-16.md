# ANEVUM V032 — Series One original illustrated artifact presentation

**Session:** ANEVUM.WEB.BUILD.2026-10-16.004.SERIES-ONE-HD-ARTWORK  
**Source:** V031 deployed staging branch, Draft PR #432 / October 16, 2026  
**State:** artwork integration prepared in isolated source branch; NOT enabled or deployed.

## Owner decision and recovered assets

The 60 simple SVG emblems in V031 are valid scalable **fallbacks**, not final art direction. The original generated 60-piece ANEVUM Series One illustrated collection was recovered from the owner's Library. All sixty independently named 1254×1254 RGBA PNG source files were verified; originals remain unmodified.

Delivered to the owner as **ANEVUM-Series-One-HD-Illustrated-Artwork.zip** (SHA-256 `91b890d904c8ebe67560fc4ae4178a4c2495556fd2bc431719ad0e7ea513fdae`). Includes:

- 60 original artwork provenance entries in `manifest.json`, with source filenames, SHA-256 fingerprints and nontransparent bounds.
- 180 transparent WebP production variants: `128`, `512` and `1254` (60 each), totaling approximately 34 MB.
- Searchable, chapter-filtered interactive `preview.html` and three gallery contact sheets; one 16:9 key-art board.
- No recreated or generated visuals; these are the prior image-led concepts.

## Implementation contract (intentionally OFF)

This source branch provides an optional image-led presentation for all current LevelEmblem uses: collection cards, member levels, reward history and level-up toasts. Artwork images use a responsive source set, browser lazy loading on collection tiles, eager loading for active level toasts, and the original SVG as an error fallback. The level registry gains a keyboard-operable detail preview (full-size artwork, thresholds, accurate server-derived earned/locked status).

The gate `VITE_SERIES_ONE_ILLUSTRATED_ART=true` is **never enabled by default**. Do not enable until:

1. The owner's visual review accepts the 60 illustrated originals and identifies any outliers needing manual refinement.
2. The WebP bundle is copied as static assets at `creator-v1/web/public/assets/levels/illustrated/{128,512,1254}/level-XX.webp` for all levels 01–60; names must match the canonical server catalog, and the original SVG files remain untouched.
3. The application bundle is rebuilt with the explicit presentation flag (no identity flags changed).
4. Browser and production-style checks verify real image fetches (200 + image/webp), stable transparent rendering, 320/390/1440 layouts, performance, reduced-motion, and regressions to 60 distinct level artifacts.
5. Owner approves a **staging-only** artwork cutover. Keep the public apex launch page unchanged.

Without the art bundle or feature flag, V031 remains pixel-equivalent in function. If an individual art fetch fails, its existing SVG automatically replaces it. There are no new tables, migrations, reward writes, unlock conditions, account/provider settings, staff powers or publication rules.

## Visual acceptance criteria

- Cinematic high-resolution materials, illumination and crystalline depth at phone and desktop sizes.
- Correct level-to-artwork mapping (1–60, with no artificial maximum level).
- No raster edges, unexpected dark fringes, clipped silhouettes or excessive blur on transparent surfaces.
- Low-contention lazy image loading: the 512px gallery image and 1254px detail do not all load on initial page entry.
- Actual user level / XP / earned states come only from the member service; visual preview never mints anything.
- Mobile Safari review and dark/transcosmic typography consistency before staging cutover.

**Scope boundary:** Source/code preparation only; do not merge, deploy to staging, enable the art flag, or open public registration from this PR.
