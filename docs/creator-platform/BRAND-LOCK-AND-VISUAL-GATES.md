# ANEVUM - Orbital Underground identity and sitewide visual release gates

**Owner-selected mark:** **03 ORBITAL UNDERGROUND**, selected October 12, 2026.
**Canonical brand version:** `orbital-underground-2026-10-12-v1`.
**Source of truth:** `creator-v1/shared/brand.mjs`, `creator-v1/brand/anevum-mark.svg` (full master) and `creator-v1/brand/anevum-mark-compact.svg` (small/favicon master).
**Prior iterations:** Earlier angular A / orbital portal and 01 ORBIT ribbon directions are design history, not approved replacements.
**Owner correction (October 25, 2026):** The V136 three-plane atom-like React mark must **not** replace the original Orbital Underground logo in the top-left header or elsewhere.

## Brand identity - mandatory

1. The symbol retains one tilted ellipse, the original continuity-point path and central orbital core, and one upper-right satellite. Preserve the exact SVG viewBox, geometry, colors and optical variants. Never substitute three orbit planes, glowing letter A, generic thin Saturn/atom symbol or a locally invented logo.
2. Header, mobile navigation/wayfinder, studio shell, branded player and cinematic stage must reuse the shared `creator-v1/web/src/components/OrbitalMark.tsx`, geometrically identical to the canonical full master. No conditional logo swap under `VITE_PARITY_V136_FULL` or any other feature flag.
3. Static pages, notably the public `/updates` page, embed geometry from the same approved brand master. The browser favicon keeps the byte-identical compact master geometry and color inside a dark contrast tile; it must not introduce new orbital paths. Monochrome variants are allowed only as supplied and with appropriate background contrast.
4. Cinematic orbit lighting, 3D scenes, animations and floating decorative visual layers may evolve around the mark, but may not replace, morph, distort or visually overwhelm the glyph. Keep the original symbol clear and recognisable at all breakpoints; respect reduced motion.
5. The logo is not a collectible badge, XP level, member identity proof, moderation seal, fabricated platform metric or security status. Styling changes must not modify those contracts.

## Acceptance and release boundary

- Do not alter the master. The shared React logo must have all six original geometry primitives and exact palette; no separate atom variant.
- Confirm shared usage in desktop header, mobile navigation, account shell and cinematic stage; the favicon must preserve all approved compact contours and colors (a solid dark contrast tile is allowed).
- Public `/updates` must use the same official SVG in the top-left brand and hero, not the previous CSS pseudo-element atom and generic A.
- Run `node --test creator-v1/test/v136-orbital-brand-lock.test.mjs`, the existing brand integration test, TypeScript/frontend build and real responsive browser screenshots at 320/390/1440. Owner visual comparison is still required before broad public V136 rollout.
- On every public and signed-in route (Discover, Commons, Creators, Studio included), prefer the existing shared brand component over local duplicates.
- Brand source passing is not permission for website cutover, D1 changes, authentication changes, Creator publishing, XP resets, payment operations, or modifications to V131 and the current 99/1 V136 canary allocation.

## Visual continuity

Preserve the expressive spatial V136 UI, accessible navigation, and approved catalogue. Do not restart the redesign merely to restore the correct identity. Historical concepts remain archived; this document is the active design contract.
