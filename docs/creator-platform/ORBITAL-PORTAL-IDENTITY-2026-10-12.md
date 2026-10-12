# ANEVUM orbital portal identity — approved design direction, 2026-10-12

**Session:** ANEVUM.WEB.BUILD.2026-10-12.001.BRAND-MARK-INTEGRATION
**Owner decision:** Approved the copper/gold/black orbital-portal ANEVUM concept in chat on October 12, 2026 and requested continuation into existing Creator V1 development.
**Scope:** Brand mark, tokens, identity consistency. This does not restart the website or authorize production release.

## Identity
- ANEVUM is the entire creator-and-community destination, not a separate “Commons” destination or trading homepage. A discoverable, welcoming place for creators, players and participants, with submissions, profiles, useful feedback, libraries and earned recognition.
- Hero concept: a copper portal/A whose orbit encircles a warm central sphere, with one small orbiting satellite. The space/cosmic background in the mood board is *presentation artwork*, not a mandatory interface wallpaper.
- The production mark distills the reference into a simple arch, ellipse, core and satellite; do not use glowing raster art as a logo or hide the A silhouette behind effects.
- Paired identity: uppercase **ANEVUM** wordmark, geometric modern sans, confident weight and moderate letter spacing. No competing product-wide wordmark. The SVG symbols are font-free; final wordmark letterform refinement remains a visual QA task.

## Colors
| Role | Token | Hex |
| --- | --- | --- |
| Main canvas (warm near-black) | `--anevum-bg` | `#100d11` |
| Raised surface | `--anevum-panel` | `#19151b` |
| Quiet divider | `--anevum-line` | `#3a303a` |
| Readable foreground | `--anevum-text` | `#f8f1e7` |
| Supporting foreground | `--anevum-muted` | `#b0a7b0` |
| Copper, primary interactive accent | `--anevum-copper` | `#d9945e` |
| Gold, achievement/highlight | `--anevum-gold` | `#f3ca86` |
| Restrained atmospheric violet | `--anevum-violet` | `#8e83a9` |
| Restrained atmospheric blue | `--anevum-blue` | `#7887ac` |

Do not create a black-and-gold casino/dashboard look; keep original cinematic project imagery, readable UI, compact navigation and a welcoming, broadly accessible creator community.

## Implemented in this reviewable source branch
- `creator-v1/shared/brand.mjs` holds the sole canonical mark, version, light/dark monochrome exports, and shared CSS tokens.
- `creator-v1/brand/*.svg` supplies portable primary and flat monochrome vector masters; export paths are locked by tests.
- The V1 public build replaces the historical screenshot-preview header A and favicon with the same mark and serves a true SVG favicon; no change to concept art, real content rules or route hierarchy.
- Existing join, community, creator profile, saved library, projects, privacy and Studio reuse the shared module; their colors inherit the new version without independent glyphs.
- Tests cover actual rendered page markup, exported assets, color tokens, old-header mark removal and public favicon.

## Acceptance to finish
- Review at 16/32px and at 320/390/1024/1440 widths on actual public/member/staff screenshots, including light/dark/flat marks, 200–400% zoom, touch targets, reduced motion, focus states and contrast. The icon size proof is directional, not user-tested acceptance.
- Confirm readable active/disabled states; copper text on dark is high contrast but light text over a copper button is not automatically acceptable. Use dark text when copper is a solid control fill.
- Keep accessibility and source/CI checks; run the existing functional/security acceptance slice separately. This visual work does not mark accounts or public onboarding safe.
- This identity supersedes the *logo shape and core palette* portions of the October 11 cinematic identity document. Its creator-first layout, artwork and interaction strategy remain in effect. September website v2 and V5 trading-first style guides remain historical.

**Release:** Source/PR only. No automatic promotion to `anevum.com`, D1 migration, public signup, paid hosting, brokerage changes or permission changes.
