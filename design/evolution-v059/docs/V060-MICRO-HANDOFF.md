# V060 / 30-level micro-badge delivery
Session: ANEVUM.WEB.BUILD.2026-10-17.009.EVOLUTION-MICRO-BADGES

V060 is a source-only, unpublished design candidate. It creates 180 sizes (32/48/64px PNG, 128/192/256px WebP) for the thirty 3D specimens in V059 and uses DPR-aware responsive raster badges in local community/profile/notification examples. The large originals, 6 chapters, names, XP formula, account data and permissions are unchanged.

Build after V059 native assets: `python src/micro.py && python src/build.py && python src/validate.py`. The generated media, interactive HTML and full archive are delivered outside this GitHub source branch. No binary renders are committed here.

The local checks completed: 180/180 transparent assets validated, V059 validator 1669/1669, simulated Chromium UI 37/37 (1440px DPR1, 390/320px DPR3, reduced motion, static WebGL fallback). These test results belong to the local V060 archive, not a GitHub exact-commit CI run.

**Blocker before public website integration:** The current website still renders a 60-level Series One and server-sourced XP; V060 is a 30-level progression with `75*(L-1)^2` and level-30 threshold 63075. Do not silently substitute images or thresholds into live accounts. Reconcile the schema/migration and confirm real iPhone Safari/VoiceOver/photographic art acceptance first. No production deployment or XP updates happened.
