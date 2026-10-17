# V060 / 30-level micro-badge delivery
Session: ANEVUM.WEB.BUILD.2026-10-17.009.EVOLUTION-MICRO-BADGES

V060 is a source-only, unpublished design candidate. It creates 180 sizes (32/48/64px PNG, 128/192/256px WebP) for the thirty 3D specimens in V059 and uses DPR-aware responsive raster badges in local community/profile/notification examples. The large originals, 6 chapters, names, XP formula, account data and permissions are unchanged.

Build after V059 native assets: `python src/micro.py && python src/build.py && python src/validate.py`. The generated media, interactive HTML and full archive are delivered outside this GitHub source branch. No binary renders are committed here.

The local checks completed: 180/180 transparent assets validated, V059 validator 1669/1669, simulated Chromium UI 37/37 (1440px DPR1, 390/320px DPR3, reduced motion, static WebGL fallback). These test results belong to the local V060 archive, not a GitHub exact-commit CI run.

**Canonical site reconciliation (checked 2026-10-17):** The public V060 site release already retired the older 60-level Series One and installed the 30-level Evolution contract with `75*(L-1)^2` and Level 30 at 63,075 XP. V061 added earned miniature identity cards; V062 deployed native animated WebGL miniatures in the shared `LevelEmblem` component, with static fallback posters. This V060 optical pass should improve **those static fallback/poster images** without replacing the V062 renderer or changing earned levels, XP, permissions or visibility. Keep V062's shared WebGL context and reduced-motion safeguards. Artwork acceptance and real iPhone Safari/VoiceOver and device performance remain open. This V060 preview-only branch is not a live deployment.
