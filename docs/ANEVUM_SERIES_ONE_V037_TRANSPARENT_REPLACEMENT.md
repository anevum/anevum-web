# ANEVUM Series One V037 — Transparent Preview Replacement

This is a verified image-only replacement of the prior opaque atlas crops, **not a claim of individually re-rendered high-definition masters**.

- All 60 files: `creator-v1/web/public/assets/levels/series-one-v037/level-01.webp` … `level-60.webp`
- Size: 256×256 each, extended WebP with true alpha, one SHA-256 per file.
- Manifest: `creator-v1/web/public/assets/levels/series-one-v037/manifest.json`
- Check: `node --test creator-v1/test/series-one-v037-artwork.test.mjs`
- Runtime: `LevelEmblem` renders V037 by default. Set `VITE_SERIES_ONE_V037_TRANSPARENT=false` at build time for SVG fallback, with automatic SVG fallback on load failure.
- V035/V036 staging-only lighting and responsive layout remain; V037 overrides the old screen blend and radial CSS mask so transparent edges stay clean.
- This does **not** modify the XP awards, saved user progression, unlocking rules, D1 schema, member permissions, registration rules, or public apex.
- Prior V033 artwork remains in a separate directory for rollback / comparison.

### Release gate

Before staging deployment, validate the exact GitHub commit via Actions, check all 60 source and built assets, the screenshot at `a.anevum.com/levels` (phone + desktop), preserved health/auth routes and Worker bindings, and the existing apex countdown. Deploy **only** `anevum-creator-v1-a-staging` with an explicit previous-version rollback path. Do not trigger the historical V031 workflow: its pinned predecessor version has drifted.

The V037 files are improved transparent previews generated from earlier low-resolution artwork. Truly premium standalone render quality still requires individually authored high-resolution masters.
