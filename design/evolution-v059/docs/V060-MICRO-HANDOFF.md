# V060 / 30-level micro-badge delivery
Session: ANEVUM.WEB.BUILD.2026-10-17.009.EVOLUTION-MICRO-BADGES

V060 is a source-only, unpublished design candidate. It creates 180 sizes (32/48/64px PNG, 128/192/256px WebP) for the thirty 3D specimens in V059 and uses DPR-aware responsive raster badges in local community/profile/notification examples. The large originals, 6 chapters, names, XP formula, account data and permissions are unchanged.

Build after V059 native assets: `python src/micro.py && python src/build.py && python src/validate.py`. The generated media, interactive HTML and full archive are delivered outside this GitHub source branch. No binary renders are committed here.

The local checks completed: 180/180 transparent assets validated, V059 validator 1669/1669, simulated Chromium UI 37/37 (1440px DPR1, 390/320px DPR3, reduced motion, static WebGL fallback). These test results belong to the local V060 archive, not a GitHub exact-commit CI run.

**Canonical site reconciliation (checked 2026-10-17):** The public V060 site release already retired the older 60-level Series One and installed the 30-level Evolution contract with `75*(L-1)^2` and Level 30 at 63,075 XP. V061 added earned miniature identity cards; V062 deployed native animated WebGL miniatures in the shared `LevelEmblem` component, with static fallback posters. This V060 optical pass should improve **those static fallback/poster images** without replacing the V062 renderer or changing earned levels, XP, permissions or visibility. Keep V062's shared WebGL context and reduced-motion safeguards. Artwork acceptance and real iPhone Safari/VoiceOver and device performance remain open. This V060 preview-only branch is not a live deployment.

## V062 poster overlay (non-deployed)

The accompanying V060 deliverable archive now includes an optically corrected **30-file, 128px transparent PNG overlay** whose filenames match the `level-NN-compact-128.png` static fallbacks used by V062's native member WebGL renderer. This is additive visual integration: preserve V062 native animation, GPU context sharing, privacy, earned XP and award states. The guarded source script `src/v060_v062_fallback_overlay.py` defaults to a dry run and requires a separate backup folder with `--apply`. It validates all thirty source and target images before writing. The installer passed a local dry-run and apply/backup verification on staged V059 baseline posters. The actual images are distributed in `ANEVUM-EVOLUTION-V060-V062-POSTER-OVERLAY.zip`, not committed to this source-only PR. No website deployment occurred.
