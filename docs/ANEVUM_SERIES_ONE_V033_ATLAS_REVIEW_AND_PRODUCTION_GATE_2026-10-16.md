# ANEVUM Series One V033 — atlas review and production gate

Status: **concept only / not approved for production**. This document preserves the decision that the 60-piece pre-Transcosmic WebP archive is obsolete and must not be installed. The newer cosmic atlas is likewise an **art-direction moodboard**, not 60 final assets.

## Critical mismatch

The newly generated six-row/ten-column atlas labels its motifs with abstract concepts such as "Awakening", "Curiosity", "Insight" and "The Beyond". Those labels are **not** the canonical level names. Canonical V031 level 1 is **Foundry Spark**, level 2 **Copper Key**, level 3 **Blackglass Seed**, and level 60 **The First Light**. The complete authoritative mapping is `creator-v1/shared/level-artifacts.json` and `docs/ANEVUM_SERIES_ONE_V033_ART_INVENTORY_2026-10-16.csv`.

Do **not** crop and number the atlas as if it represented the canonical collection. Its objects are not necessarily the objects named in the level system. The atlas includes baked-in titles, numbers, framing, and a nontransparent dark background, violating the existing V033 master requirements. It is useful for lighting, dimensional depth, restrained celestial optics, and composition reference only.

## Production acceptance requirements

1. **Canonical identity:** Produce one unmistakably recognizable object for each of the 60 names, keyed to the stable IDs ANV-LVL-S1-001 through ANV-LVL-S1-060; preserve the six visual families and arcs already specified in the V033 art bible.
2. **Object-first design:** For example, Foundry Spark must visually be a controlled ignition element, Copper Key a manufactured copper key, Blackglass Seed a physical dark-glass seed, and The First Light a unique final light-bearing artifact, rather than four arbitrary celestial icons.
3. **Visual authority:** Use the V033 dimensional, restrained Continuance-inspired art grammar. The site remains general-public ANEVUM; no invented Continuance Institute ownership, coordinates, fake documentation, story lore or arbitrary institutional text.
4. **Master assets:** Individually authored and reviewed high-resolution masters with transparent backgrounds, no baked-in labels, and consistent scale and camera; preserve originals and explicit review provenance.
5. **Exports:** Produce optimized, visually checked WebP derivatives at 128, 512 and 1254 pixels (180 files), plus a manifest of canonical ID, source master, pixel dimensions, byte length and SHA-256.
6. **Quality gates:** Review all 60 individually for identity, silhouette, unique composition, no duplicate images, alpha integrity, accessibility/contrast, reduced-motion fallback, and mobile 320/390px rendering. Automated file counts alone are insufficient.
7. **Implementation:** Adapt the V032 `LevelEmblem` responsive renderer only after approved assets exist, retaining SVG fallback. The feature flag must remain off until all 180 actual WebPs are committed and staging CI and hosted asset parity pass.
8. **Safety:** Do not modify XP, awards, level curve, identity, signup gates, user data, production D1, public apex, or the January 1 countdown.

## Current delivery state

- V031: 60 original vector emblems and functional progression, staging deployed.
- V032: old illustrated archive recovered and checksum-verified, but **explicitly rejected** for current visual identity; not approved to commit or deploy.
- V033: art bible and inventory exist in PR #436. New cosmic atlas generated as **reference only**. No final individually reviewed canonical masters or 180 production exports exist yet.
- Production and deployment are **blocked on canonical artwork creation and owner visual acceptance**, not on the XP backend.

References: PR #432 (V031), PR #435 (V032 code only), PR #436 (V033 art direction); visual issue #335 and progression issue #337.
