# ANEVUM — Owner-selected Orbital Underground identity lock

**Decision:** 03 **ORBITAL UNDERGROUND**, selected October 12, 2026 and reiterated October 25, 2026. The earlier `01 ORBIT` / abstract A proposals are design history, **not** an authorization to replace the logo. The V136 three-plane atom-like logo was not approved as a substitute.

**Canonical geometry and color:** `creator-v1/brand/anevum-mark.svg` (full-size SVG, bone `#e8e1d6`, asymmetrical angled orbit ribbon, central circle/cutouts, vertical spike and one small satellite). Its approved smaller-form companion is `creator-v1/brand/anevum-mark-compact.svg`. The two monochrome assets belong to the same identity family, not new symbols. This identity's version is `orbital-underground-2026-10-12-v1`, implemented in `creator-v1/shared/brand.mjs`.

## Absolute mark lock

- **One brand symbol, not many variants of a different symbol.** The public header, V136 full navigation, fallback header, phone navigation dialog, console Wayfinder, Hero OrbitalStage, static /updates header, and future portfolio or merchandise placements must all use the actual master geometry. Never substitute a generic letter A, thin Saturn lines, concentric three-plane atom, CSS-only circle, AI-generated approximation, or a second competing logo.
- V136's `creator-v1/web/src/components/OrbitalMark.tsx` is the shared React implementation of the official full vector. It must not branch on `VITE_PARITY_V136_FULL` to choose a different SVG, and it must retain the original ellipse, path, circles, exact proportions and bone/dark colors.
- The static /updates Worker is a **separate public deployment** with inline official master markup in its navigation header. That deployment must be independently source-tested and promoted only via exact Worker version + isolated route safeguards.
- Browser tab favicon is byte-identical to `anevum-mark-compact.svg`; update the favicon cache key on the V136 HTML entry point when the asset changes. Apple/PWA raster icons must visually retain the compact Orbital Underground silhouette. When regenerating rasters, render from the vector master, not a prompt, model or screenshot.
- Never recolor the actual paths in a way that makes the mark unrecognizable. Dynamic lighting, 3D stages, orbit backgrounds, cyan/violet environmental effects, object glows and particle transitions may surround the mark without changing its silhouette. Logo geometry must remain static and legible even under reduced motion and forced colors.
- The approved wordmark is **ANEVUM**. Product labels like IREN, Commons and Creator Studio are labels, not substitute ANEVUM logos. Reserve the orbital mark for ANEVUM identity, not XP badges, AI assistants, reviewer authority or verified identity emblems.

## Required acceptance

1. Run `node --test creator-v1/test/v136-orbital-brand-lock.test.mjs` and the existing `creator-v1/integration/brand-lock.test.mjs` to establish exact geometry, shared usage and favicon equality.
2. Build the actual V136 site; check header, menu, Wayfinder, cards and stage at 320, 390, 1280 and 1440 CSS px. Include public, signed-in, private Studio, and fallback routing; no second mark must appear as a logo. Check 16/32/64px tab icons and home-screen raster icons.
3. Do not strip focus outlines or obscure the mark with cinematic effects; inspect dark/light, reduced motion, high zoom and accessible naming. Decorative SVG instances can be aria-hidden; the linked ANEVUM home action must remain accessible.
4. Portfolio/design deck/merch reuse must refer to the same full or compact master before any parallel redesign branch merges. This document does not approve or deploy the portfolio project or merch by itself.
5. Preserve the V131 live baseline, 99/1 V136 canary allocations, release allowlist, disabled public creator publishing, D1 migrations, account authority and payment boundaries until separately approved. **Passing a source test does not approve production.**

**Implementation note:** V136's former three-plane `p136-living-mark` came from a feature-flag branch in `OrbitalMark.tsx`. The October 25 correction removes that condition and restores exactly the approved geometry everywhere the shared mark is mounted. The separate /updates static header is handled in its own tightly scoped release, not through a V136 homepage cutover.
