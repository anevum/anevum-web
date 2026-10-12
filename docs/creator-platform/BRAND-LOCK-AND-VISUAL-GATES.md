# ANEVUM Creator V1 — current shared identity / visual release gates

**Preferred concept:** **01 ORBIT**, owner selected October 12, 2026. The former angular A emblem is superseded.
**Reference and vector details:** [ORBIT-MARK-ADOPTION-2026-10-12.md](ORBIT-MARK-ADOPTION-2026-10-12.md)
**Canonical module:** `creator-v1/shared/brand.mjs` (`orbit-2026-10-12-v2`)
**Tests:** `creator-v1/integration/brand-lock.test.mjs`

## Design and functional locks
- Never substitute a letter A, portal arch, simple character, or a generic thin Saturn line for the selected thick **orbit ribbon, central coral world, and small violet satellite**.
- Use one shared brand token set and mark across the public homepage, join, member profile, library, community, project manager, privacy and Studio. The mark is not the same as collectible badges or utility icons.
- The public ANEVUM website stays an inclusive, creator/community-first discovery destination, not a conventional SaaS template, a trading-first brand or a mandatory space-themed wallpaper.
- Preserve original project content and cinematic visuals, compact responsive navigation, accessible labels, meaningful earned community XP, and truthful real-data states. No fictional ratings/projects or artificial activity.
- Keep app/header/favicon forms geometrically related. Decorative shading can disappear in monochrome; the asymmetric ribbon and sphere must still read.
- Never use color contrast alone to indicate moderation, errors, security, earning or status. Solid copper buttons use dark foreground.

## Engineering
1. Import `BRAND_MARK` and `BRAND_CSS` from the shared module; avoid locally authored mark forks.
2. Keep full, compact, light/dark monochrome SVG files byte-equal to the module exports. Automated source-level assertions reject old A shapes.
3. Public V1 build replaces the archived sample site's header mark with the current canonical mark and serves a real SVG favicon; do not rewrite the archived visual prototype.
4. Pass exact-head CI and then actual responsive/manual accessibility screenshots. Source passing alone is not production or authenticated account acceptance.
5. Founder approval of this preferred concept is **not** authorization to expand staging invitations, migrate databases, open public accounts, deploy to the live apex, pay providers or relax V1 security gates.
