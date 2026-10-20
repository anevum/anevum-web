# ANEVUM.WEB.UPDATE.2026-10-15.001.COMMUNITY-HOME-MODULES

The homepage portal images were soft, heavily cropped concept artwork enlarged into tall modules. Replace the four collection illustrations with separate full-frame original 1536×1024 artwork, delivered through 768/1536 WebP srcsets. Keep titles, descriptions and navigation in independent HTML reading surfaces.

Desktop uses four collections across; tablets use two; phones use a native, keyboard-accessible horizontal collection shelf with previous/next controls and reduced-motion support. A community desk connects directly to the real creations feed, conversations, and maker directory. Three public activity modules share a compact status footer. Preserve the cinematic introduction → discovery → public activity → community feed hierarchy and the existing Continuance/Transcosmic typography.

No invented people, projects, activity, achievements, rankings or unlocked publishing. Reuse the existing approved-data components and route gates.

Screenshot review also confirmed the main hero painting was visibly soft. The new portal-world original now supplies the hero and matching category illustration, while the other new originals supply their corresponding category/feed thumbnails. Historical assets remain versioned, and other categories retain their existing artwork. No creator-supplied covers are replaced. The existing Chromium capture runners now wait for browser exit before cleaning up profiles, fixing a teardown race observed after all first-run page checks passed.

## Artwork brief
Built-in Image Generation; original decorative category art, never submission covers. Each illustration is one full-frame landscape, premium cinematic science fantasy with an indigo/obsidian, ivory-light, violet and restrained-copper Continuance Institute atmosphere. Clearly resolved materials and shapes, no UI, text, logos, collage or pixel art.

- Games: monumental orbital stone ring on an alien plateau; suspended small worlds, silver-blue starlight, copper light and layered mountains.
- Tools: quiet maker observatory; modular instruments and translucent geometric mechanisms on an ivory desk looking into deep space.
- Creative: levitating luminous violet/pearl-glass ribbon in a celestial atelier; copper particles and an eclipse beyond a tall opening.
- Libraries: celestial archive of ivory shelves and floating folios around a blue-white astrolabe; a vault opening into stars.

Assets: `creator-v1/web/public/assets/community-portals/`. Dimensions and SHA-256 hashes in its `manifest.json`. Original PNGs were only resized and encoded for delivery; no synthetic upscaling.

## Validation and deployment
TypeScript and Vite build pass. Existing visual/route contracts pass. Hosted-browser verification is deferred to GitHub’s existing Chromium capture workflow because the required local browser-control capability is unavailable. Additional CI acceptance verifies decoded responsive originals, live HTML reading surfaces, category destinations, mobile next/previous scrolling, and no page overflow at 320/390/1024/1440 widths. Screenshots include the collection shelf and community modules.

The deployed staging Worker contains a newer canonical signup backend than the source branch’s older deploy configuration. Never run the historical a-staging release workflow for this update. Any staging release must retain the exact currently deployed Worker modules, current database/secret/plain-text bindings, asset-first settings and compatibility, swapping only the frontend asset manifest. Capture the active version immediately before upload and preserve it for rollback. Do not modify `anevum.com` or merge unrelated signup work.
