# ANEVUM Creator Uplink V005 — Continuance Visual Quality

Session: `ANEVUM.WEB.UPDATE.2026-10-19.001.PACKAGE-UPLINK-CONTINUANCE-QUALITY`  
Parent implementation: `ANEVUM.WEB.BUILD.2026-10-19.001.PACKAGE-UPLOADER-UX`  
PR: https://github.com/anevum/anevum-web/pull/516  
Status: Source implemented / CI responsive browser checks passed / **not deployed**.

## The quality decision

ANEVUM's browser-project uploader, archive, review and player must feel like one part of the premium Continuance Institute site, not a generic dark admin form. The premium look comes from original high-density vector art, editorial typography, disciplined spacing, focus/accessibility, readable data and responsive motion, **not** decorative thumbnails pretending to be user-uploaded projects.

Keep ANEVUM navigation, private/public identities, accounts, earned player cards and published creations intact. Do **not** restart game engine, native pack builders, 3D authoring or advanced Creator Studio. ZIP/HTML are the immediate executable formats; external hosted apps are a separate link workflow.

## V005 design integration

- `site/alpha/v003/continuance-visuals.mjs`: native 56-unit vector Continuance crest, 44-unit radial sigil, retina-sharp procedural SVG orbital signal-map illustration, responsive midnight/navy and muted cyan presentation system. All graphics are authored in source. No fetched AI stock art, external font/CDN or fabricated creator assets.
- The hero signal system animates orbital rings slowly and subtly; a `prefers-reduced-motion: reduce` rule disables nonessential motion. Existing user project iframe content is not artificially animated by the host.
- Upload page opens with a compact Continuance identity, single clear story, format requirements and file-first action. Drag/drop and native phone file picking remain usable. The form, owned library and export guide keep the same validated functions.
- Project cards use an explicitly labeled institute **record plate**, not a bogus game thumbnail. Future visual covers must come from the real author/approved screenshot pipeline and be linked to an immutable release; never use fake art for a user's game.
- Player keeps the project itself visually dominant with only a small institute readout, earned/canonical identity integration later through the release bridge; no fake ratings, views, or false launch state.
- Staff queue uses the same institutional presentation; independent approvals, owner rights checks, version immutability and default-OFF public executable publication stay unchanged.
- All scripts and artwork remain local; the previous isolated execution-origin contract and CSP/iframe sandbox are unchanged.

## Responsive and quality requirements

- Desktop: one compact nav rail, editorial hero with rich orbital illustration, simple upload on left and export context at right.
- 390px and 320px: single-row compact navigation (no redundant terminal readout), short hero with atmospheric artwork, upload selector visible on the first phone screen, 44px buttons and no horizontal scrolling. Guide link is available from the existing help route rather than crowding narrow header.
- Play: mobile page immediately shows title/status and a tall playable stage with accessible Restart, Expand and Submit or Share as authorized. Immersive Escape/Exit keeps the same iframe to avoid losing gameplay state.
- Explicit keyboard outlines, semantic headings and labels, readable small type, accessible file control/review modal, reduced-motion, responsive safe-area Exit, and truthful error states.
- Do not claim screenshots prove real Safari or release moderation. Automated browser fixtures are isolated and marked offline.

## Real browser evidence

Headless Chromium acceptance on the actual generated HTML/CSS/inline JS checks viewport 320, 390 and 1440, no overflow, touch targets, unique original SVG crest/orbital artwork, one-row compact header and upload selector visible above the fold. Also checks selecting a valid file, guest auth state, format guide, player iframe sandbox, and independent review confirmation modal.

Visual artifacts include the uploader at 320 / 390 / 1440, selected file, guest gate, private player, reviewer dialog and format guide. They are produced by `tests/alpha-package-v004-browser.mjs` on CI. Screenshots are synthetic fixtures and not proof of deployed functionality. Check the exact PR head and full workflow before advancing staging.

## Remaining milestones

1. Finish isolated external runtime service, confirm live CSP/MIME, independent code and media review, controlled staging DB migration and recovery. Never turn `PACKAGE_PUBLIC_PUBLISH_ENABLED` on as a design shortcut.
2. Real owner A / separate reviewer B / guest C acceptances, public playable ZIP/HTML, version replacement and actual iPhone Safari/Android touch/fullscreen.
3. Introduce **authentic** high-quality approved creator covers/screenshots bound to reviewed release IDs. This needs explicit asset handling, attribution, safe sizing and moderation. Keep the branded record plate until real art is available.
4. Integrate into the existing canonical V091 frontend routes and profile/project cards, retaining existing alpha releases and all account/XP/security guarantees.
5. Compare final real-device presentation to ANEVUM V091 Continuance palette before owner-approved guarded rollout.

The V005 presentation is source work and visual evidence, not a live release or migration approval.
