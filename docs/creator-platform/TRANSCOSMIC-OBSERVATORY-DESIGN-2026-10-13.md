# ANEVUM Creator V1 — Transcosmic Observatory design candidate
**Session:** ANEVUM.WEB.DESIGN.2026-10-13.013.TRANSCOSMIC-OBSERVATORY
**Status:** reviewable frontend-only candidate, NOT approved for deployment
**Source base:** reviewed and deployed public React staging code at `f04a26a23374526321cf2923c5590b414aae4fbf`
**Canonical boards:** #325 (engineering), #335 (design), #333 (release)

## Where this direction comes from
The owner's most recent design request explicitly replaces the pink/coral-heavy look with something **more like Transcosmic**, more polished, fluid, and inviting. It supersedes older color directions without cancelling the independently approved site architecture, original ORBIT mark, or Creator V1 experience.

Preserve the actual owner's recurring UX decisions:
- An immersive, cinematic, memorable, layered interface with real motion/depth; no flat minimalist shell and no wholesale deletion of established pages, sidebars, artwork, category navigation, search, creator channels, or component behavior.
- The soul of **Newgrounds + Steam + Envato + Discord**, while remaining ANEVUM's own accessible, free-to-participate, creator-first and all-ages platform. Do not substitute financial SaaS, pay-to-rank or shallow app promotion.
- Tactile devices/cards that feel collectible, individually designed and satisfying to interact with, on a **phone** as well as at a 1440px desktop.
- Readable UI, authentic real content, no pretend members, ratings, achievements, creator projects or fake live telemetry.
- Existing responsive ANEVUM orbital vector as the permanent brand anchor; cosmic atmosphere frames, not replaces, the mark. Keep the current public architecture, original navigation and low-cost Cloudflare/Vite hosting; no external font, hosted video, WebGL runtime, new package dependency, tracking or image assets.

The historical Transcosmic archive frames a first-contact speculative universe with mystery and discovery. This implementation borrows **atmosphere only** (celestial charts, observatory rings, aurora blue light, night horizon, a sense of infinite exploration); it does not turn the ANEVUM platform into a fiction wiki, publish unpublished lore, copy protected third-party artwork, or assert that decorative coordinates/stars are genuine celestial data.

## Actual palette
| Role | CSS token | Value | Usage |
|---|---|---|---|
| Main cosmic canvas | `--cosmos-void` | `#080a12` | root / global shell |
| Midnight atmosphere | `--cosmos-deep` | `#0e1424` | lower body gradient |
| Elevated console | `--cosmos-panel` | `#131c31` | reusable panels |
| Instrument elevation | `--cosmos-rise` | `#1a253b` | active surfaces |
| Foreground | `--cosmos-white` | `#f4f7ff` | readable headlines |
| Supporting foreground | `--cosmos-mist` | `#c5d1e7` | copy / captions |
| Supporting quiet text | `--cosmos-quiet` | `#9aabc9` | muted secondary |
| Aurora signal | `--cosmos-cyan` | `#7de7e8` | active/focus/CTA |
| Electric signal | `--cosmos-blue` | `#80b1ff` | secondary highlights |
| Distant nebula | `--cosmos-violet` | `#a89cff` | atmospheric depth |
| Recognition/awards | `--cosmos-gold` | `#e8c26e` | earned-artifact accents |
| Brand warmth | `--cosmos-copper` | `#c98b5f` | supporting ANEVUM brand warmth |

Legacy style token bridges are intentionally declared in a **last-imported** theme CSS layer so the original 20+ pages and components share a palette, while the more detailed visual rules replace hard-coded warm surfaces. The scope of this candidate is the frontend only, not the older production 01 ORBIT public pages or logged-in Member Worker templates.

## Design anatomy — source changes
- `components/CosmicHorizon.tsx` renders an original decorative, fixed star map; SVG geometry, no dependencies, no live-data simulation; aria hidden.
- `HomePage`, `PortalHeading`, `LevelsPage` receive the horizon as a visually contained, pointer-inert backdrop. The real text and CTA remain unobscured and functional.
- `cosmic-observatory.css` is imported **after** all previous CSS so the visual system is coherent across header, search, categories, real project cards, side panels, Level artifacts, free-only filters, Start Here, Field Guide, quick launcher and creator studio/profile controls.
- Replaces hard harsh sticker-block shadows with luminous layered edges, textured navy material, dimensional instrument wells, smoother hover/press response, cooler orbital-glass surround, cobalt/teal highlights, and reserved warm gold/copper.
- CSS-only subtle orbital animation (23–34 seconds) gives ambient life but does not move real content; it is explicitly removed under `prefers-reduced-motion`. No scroll hijacking or high-frequency device listeners. Existing pointer depth remains available and touch scrolling is preserved.
- Prioritizes readability, focus-visible, 44px control targets where appropriate, desktop/phone responsive hierarchy, low-cost static CSS/SVG with no backend changes.

## Evidence and review gates
1. Run Creator V1 Verify on the exact design branch: TypeScript, normal + staging Vite builds, all public/member/staff/privacy regression checks, contrast/token design contracts. Design-layer code must not change project data, auth, releases, votes, XP or submissions.
2. Review actual compiled React captures at **1440px first**, **1024px tablet**, **390px phone**, and **320px small phone** on the homepage, discovery, Field Guide, Start Here, and progression. Synthetic offline catalogue fixtures must remain clearly labelled.
3. Check interactive touch targets, command launcher opening/focus and reduced motion; inspect no horizontal scrolling at 320/390. Automated CSS and screenshots are not a replacement for owner visual acceptance or real-device usability review.
4. Obtain explicit owner UI approval before deploying this visual experiment. Never re-use the already released staging head as proof of approval for this new stylesheet. Production must remain unchanged.
5. After approval, prepare a separately bounded exact-SHA **staging-only** release with proper route/Worker/DB isolation, homepage regression check and rollback version recorded. Existing workflow's allowlist does not yet include this new design branch; do not bypass its guard.
6. Keep member interests PR #360 separately gated on D1 migration and Member Worker acceptance; no feature work should accidentally slip into this visual PR.

## Out of scope
No member DB migrations; no public signups, payments, ads, XP adjustments or fake gamification; no hosted project submission or Transcosmic fiction; no rebranding of the company or replacement ANEVUM mark; no production deployment.
