# ANEVUM Creator V1 — Brand lock and visual release gate

**Current approval:** Orbital-portal concept, copper/gold/black palette, and ANEVUM-first wordmark direction approved October 12, 2026.
**Source and exact color values:** [ORBITAL-PORTAL-IDENTITY-2026-10-12.md](ORBITAL-PORTAL-IDENTITY-2026-10-12.md).
**Versioned code:** `creator-v1/shared/brand.mjs` — `orbital-portal-2026-10-12-v1`.
**Regression test:** `creator-v1/integration/brand-lock.test.mjs`.

The October 11 cinematic *layout, community-first journey and artwork* stay approved. Its former triangular A and orange-heavy identity lock are superseded by this explicit new owner selection. The 2026-10-11 source is historical and remains for continuity.

## What must not drift
1. Public site, join, member project manager, community, creator profile, saved library, privacy and owner Studio all render the single shared ANEVUM mark. Do not insert custom page-specific glyphs.
2. Primary background is charcoal/black, primary brand accents are copper and gold; violet/blue remain atmospheric, not dominant. UI state colors (success, warning, errors) must remain functional and distinguishable.
3. The mark survives flat light and dark monochrome and 16–32px usage. No reliance on glow, lens effects or tiny orbit details for recognition; no gradient-only meaning.
4. Main site name is **ANEVUM**. Keep compact responsive navigation, icon labels accessible, content-led project cards, visible meaningful recognition and genuine user content.
5. The company mark is distinct from platform utility icons and collectible badges; badges can be playful but cannot replace the ANEVUM identity.
6. No fictitious projects, ratings or community activity. Test fixtures must be labeled.

## Engineering / release rules
- Import `BRAND_MARK` and `BRAND_CSS` from `creator-v1/shared/brand.mjs` in every staging member/staff screen. The read-only public Worker consumes the same brand module at build time.
- Standalone primary/mono masters in `creator-v1/brand/` must byte-match their exported string counterparts; source tests enforce equality.
- Do not mutate the 2026-10-11 archived preview Worker merely to paint the new identity. Replace only the released public header and favicon through the V1 build pipeline.
- Release requires independently captured browser/mobile/keyboard/contrast evidence; source-level CI alone is insufficient.
- The V1 functionality/security gates tracked in #325/#328/#329/#332 remain independent and mandatory. Branding does not authorize production signup or publishing.
