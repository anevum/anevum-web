# ANEVUM — Evolution of Everything / V052 design handoff

Session: ANEVUM.WEB.DESIGN.2026-10-17.001.EVOLUTION-OF-EVERYTHING
Status: concept prototype, not approved for public deployment.

This updates the **visual narrative only** of The First Continuance. The permanently selected 30-level count, six five-level chapters, and XP curve remain intact. The first five levels are deliberately speculative artistic interpretations of early cosmology; the last two Institute/ANEVUM stages are fictional, not physical predictions.

## Chapters and progression
- 01–05: Before Form — pre-grain, fluctuations, fields, expansion.
- 06–10: First Matter — plasma, quarks, nuclei, atoms, relic radiation.
- 11–15: Stellar Dawn — cosmic quiet, gravity, stellar ignition, nebular formation.
- 16–20: Cosmic Architecture — chemical enrichment, galaxies, cosmic web, solar systems.
- 21–25: Worlds & Life — accretion, oceans, chemistry, replication, biosphere.
- 26–30: Continuance — cognition, signals, civilization, Continuance Institute, ANEVUM.

Permanent Level 30 is ANEVUM (ceremonial title: The First Light). It requires 63,075 legitimate XP. Thresholds: 75 × (L−1)^2. Accumulated verified XP can continue after the cap, but visual rank never advances to Level 31.

## Experience
- 30 separately animated SVG scenes, built from native vector geometry, with layered shading, parallax, atmosphere and scene-specific CSS motion. They are dimensional **SVG illustrations**, not actual WebGL 3D meshes.
- Standalone Vesper-inspired inspector interface, six chapter filters, next/previous navigation, simulated XP, unlock ceremony, pause and reduced-motion fallback.
- 30 static SVGs, 30 transparent 2048-pixel renders, 90 responsive WebPs, and 30 small transparent PNG previews.
- Grid cards should use static artwork. Only the inspected stage and active user badge should animate. Do not run thirty effects concurrently.
- Customizable visual design is subject to review: V052 is an implemented proof of direction, not 30 independently art-approved production masters.

## XP and safety constraints
Retain V048's proposed verified event rules, anti-abuse caps, idempotent server ledger and separate achievement system. Do not give XP for purchases, refreshes, test button presses or self-farming. Do not map legacy development-only test XP into public lifetime XP. Do not change live account balances, membership permissions or notifications until staging migration and reconciliation pass.

## Verification
Offline Chromium desktop and 390px mobile interaction tests passed; thirty cards load, each filter returns five, representative motion was visually detected on Levels 1,15,30, the pause fallback works, and a simulated 63,075 XP reaches Level 30. Native Safari, actual site staging, lower-power devices, account migration, and production accessibility review are pending.

**Delivery:** V052 zipped web and full source art packages remain external to GitHub; only this design manifest and charter are committed here. No production files or deployed services are modified by this branch.
