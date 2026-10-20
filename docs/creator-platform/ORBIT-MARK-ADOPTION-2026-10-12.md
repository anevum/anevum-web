# ANEVUM — 01 ORBIT: preferred mark and implementation candidate

**Session:** `ANEVUM.WEB.UPDATE.2026-10-12.002.ORBIT-MARK-ADOPTION`  
**Owner direction:** On October 12, 2026, Devon supplied the **01 ORBIT** concept screenshot and identified it as the favorite among all explored marks. This supersedes the earlier A-shaped orbital-portal mark direction.  
**State:** Owner-selected visual concept; exact vector rendering remains a reviewable candidate pending visual/accessibility and trademark clearance. **Do not deploy automatically.**

## Preserve what makes the selected concept recognizable
1. A wide **asymmetric cream/gold ribbon** sweeps clockwise around a center sphere, with clear black negative space and an open upper-right silhouette. The ribbon must remain substantial, not a generic thin Saturn ring.
2. The **large orange-to-coral sphere** sits inside and behind the ribbon. It is the visual center; do not turn it into an A.
3. A distinct **small lavender/violet satellite** sits above and to the right. The warm/cool contrast makes the mark more playful and memorable.
4. **Warm near-black** canvas. **ANEVUM** remains the brand name, with uppercase cream wordmark and purposeful tracking.
5. The 01 ORBIT label is a **design-study identifier only**. Do not rename the platform or add ORBIT as a product.
6. Preserve the approved cinematic creator showcase, real projects, public discovery, member profiles, submission flow, moderation, XP/achievements, compact navigation, and free participation. This is *identity refinement*, not a site redesign.

## Initial vector interpretation
- `creator-v1/shared/brand.mjs` now exports the full mark, compact header/favicon variant, monochrome light/dark variants, canonical CSS, and explicit `BRAND_VERSION`.
- `creator-v1/brand/anevum-mark.svg`, `anevum-mark-compact.svg`, `anevum-mark-mono-dark.svg` and `anevum-mark-mono-light.svg` are source-controlled actual SVGs.
- Public site, join, profile, library, community, projects, privacy and owner Studio all use the shared inline mark through current build wiring. The public Worker serves the same compact favicon.
- The reference image includes subtle material texture/lighting; the first SVG pass is a **simplified interpretation**, not a pixel-identical trace and not proof of legal uniqueness. Rendering, small-size optical refinements and wordmark typography remain open.

## Palette — chosen to harmonize with the mark (provisional exact token values)
| Role | Value |
| --- | --- |
| Warm near-black canvas | `#181418` |
| Raised charcoal | `#211b22` |
| Cream/ivory lettering | `#f9f0e6` |
| Soft ribbon cream | `#f7dbb7` |
| Copper interactive accent | `#dfa176` |
| Coral/creative highlight | `#f08e5b` |
| Violet satellite/accent | `#a9a1ef` |
| Dark foreground on copper buttons | `#181418` |

Copper buttons intentionally use dark text and a visible keyboard focus ring. Colors and gradients are not the only channel for semantic status.

## Review and release acceptance
- Compare full mark and favicon against the owner's original concept at 16, 24, 32, 64, 128 and 256px. The 16px purple satellite may need a deliberate optical adjustment; do not silently delete it without review.
- Review with real browser screenshots of home, discover, detail, join, member profile, library, community, projects, privacy and Studio at 320, 390, 1024 and 1440px; keyboard focus, reduced motion, visible contrast, touch targets and print/flat use.
- Validate same-shape monochrome and inverse marks, safe standalone SVG semantics, and no image/JS injection.
- Acknowledge the broad existing orbit/Saturn visual vocabulary; distinctiveness and trademark search are separate requirements before hard legal or merchandising commitments.
- Keep production read-only and existing member staging gates independent. Source commit + CI does not equal browser acceptance or permission to promote V1.

**Technical authority:** [V1 engineering #325](https://github.com/anevum/anevum-web/issues/325), [Visual decision #335](https://github.com/anevum/anevum-web/issues/335), [Brand PR #338](https://github.com/anevum/anevum-web/pull/338), [Launch #308](https://github.com/anevum/anevum-web/issues/308).
