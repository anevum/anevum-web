# ANEVUM V1 — Locked visual identity and release design gate

Status: **OWNER-APPROVED identity, not a new theme proposal.**
Approved source: `docs/creator-platform/APPROVED-CINEMATIC-IDENTITY.md`
Reference design: cinematic creator portal concept approved 2026-10-11.
Code: `creator-v1/shared/brand.mjs`
Regression check: `creator-v1/integration/brand-lock.test.mjs`

## The issue we fixed

Independent new screens accidentally authored independent logos and nearby-but-different colors. The approved homepage used the triangular warm-gold illustrated mark, while join used a different 32px SVG, projects used a triangle character, profiles/privacy/community used a letter A, and Studio used a geometrical glyph. This is accidental identity drift. Passing accessibility, code and mobile checks did not prevent it.

## Immutable identity

- The original ANEVUM symbol's three vector paths and gradient color stops are authoritative. Preserve those shapes and proportions. Treat it as **brand**, not a generic icon.
- ANEVUM wordmark accompanies the mark on full-size navigation. Avoid inconsistent glyph substitutions, emoji logos, hexagonal placeholders, or new mascots in the site header.
- Shared cinematic palette: deep charcoal `#080b13`, elevated dark surface `#101522`, subdued line `#292e40`, luminous text `#f7f7fc`, supporting text `#a1a8bd`, warm orange `#ff9d50`, warm gold `#ffb043`, muted violet `#9582e3`.
- Header typography is compact, weighty and purposeful. The logo must retain recognizability at mobile sizes (27–32px), with no clipped/offset edges.
- Functional icons are a coherent utility family distinct from the company mark and collectible progression artifacts.
- Badges/achievements may have distinctive objects and colors for recognition **within their content**, but must never become competing ANEVUM logo variants.
- Feature content, layout and decorative artwork can evolve. Changes to the brand mark, palette, primary navigation identity, or overall visual direction require explicit owner approval and separate brand-version/review.

## Engineering rules

1. Import `BRAND_MARK` and `BRAND_CSS` from `creator-v1/shared/brand.mjs` in member and Studio screens. Do not clone, redraw or restyle the logo in a feature-local file.
2. Do not declare replacement brand palettes. Feature-local styles may define layout and purpose-specific accents but must inherit the canonical tokens.
3. A CI test imports the *rendered HTML* of join, member projects, community, creator profile, saved library, privacy and Studio; it compares the actual mark and token CSS against the approved reference and rejects known temporary glyphs.
4. New features must add tests for their own page before review. Visually compare homepage, staging join, Studio, profile, project, library, community and privacy at desktop and 390/320 mobile widths. Automated tests do not replace screenshot acceptance.
5. Never use fictional social metrics to make screenshots appear active. Use fixtures only for clearly labeled local visual tests; live views reflect real databases.
6. `anevum.com` remains the canonical public brand; `next.anevum.com` is feature staging. The old V5/RHEN site remains archived, not a competing current identity.

## Implementation caveat

The independent Cloudflare staging Workers must include the shared module during deployment. Where direct Worker multipart upload requires a flat module namespace, rewrite only import module specifiers mechanically and include the exact canonical module source; **do not create another forked brand file**.

A successful brand-lock CI result guards source consistency. Final release acceptance still requires browser screenshots and real user navigation checks.
