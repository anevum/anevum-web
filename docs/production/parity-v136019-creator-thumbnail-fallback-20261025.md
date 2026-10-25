# PARITY V136.019 — Creator thumbnail priority and category-specific default media

Session: ANEVUM.WEB.BUILD.2026-10-25.001.SITEWIDE-VISUAL-PARITY-OVERHAUL
Date: 2026-10-25
State: Implementation draft on PR #737, not production accepted

## Product rule
All creation cards share the same display rule:
1. If the already-approved package API supplies a canonical same-origin uploaded cover URL, display the creator's original thumbnail.
2. If the URL is missing, rejected by the canonical URL validator, or the image load fails, display a type-specific ANEVUM default.
3. Never replace a user's upload with invented promotional artwork, pretend a default belongs to a user, import private/quarantined images into public routes, or execute uploaded HTML for thumbnail extraction.
4. Thumbnail resolution is independent of account identity, XP, follower counts, paid placement or moderation status.
5. The category SVGs are hand-authored vector interfaces, not AI-generated artwork or runtime image generation. They render at any display resolution.

## Initial type mapping
- games, game → games.svg
- tools, app → tools.svg
- automation → automation.svg
- research → research.svg
- creative → creative.svg
- learning → learning.svg
- libraries → libraries.svg
- simulation → simulation.svg
- story → story.svg
- unknown/other → other.svg

All assets reside at `creator-v1/web/public/assets/default-thumbnails/`, use a 1600×900 intrinsic viewBox, and are responsive without raster upscaling. The shared `ProjectThumbnail` component reads `projectThumbnailPreset` and uses the existing `safePackageCover` canonical URL validator.

## Implemented consumers
Existing public project grid cards, homepage releases, Community project entries, first-contact feed, project detail stage, saved works, catalogue tiles, discovery cards, Creator Package Gallery, and Artifact Lens use the shared media component. Category navigation fields still use the separate native interface instruments. Text-only list modes may intentionally omit imagery for scanability.

## Current backend boundary
The browser-package service provides `cover_url` through the approved `/upload/v3/api/v1/packages/covers/:uuid` path. This path is already validated before use. The older Creator V1 public Project DTO and canonical saved-project DTO do **not** expose an approved public thumbnail URL. Their cards therefore receive type defaults, even when creators may have uploaded private attachments. A future backend change can supply approved thumbnail media only after storage ownership, image scanning, review/publication, access controls, and URL provenance are established. No such backend expansion is claimed here.

## Safeguards
No member auth, privacy, upload, publish, payment or production flags are modified. Uploaded covers are never fetched until their canonical path is validated, no external arbitrary URLs are accepted, and a failed cover falls back without generating a new image or adding a network API. No artificial ratings or content records are created. CI checks all ten vector assets as XML, validates source-level mapping and the rendering contract, then builds the existing site and runs its browser compatibility suite.

## Still pending
Production-appropriate browser screenshot comparisons and server-side support for older project cover URLs. Production traffic is not changed. The stacked release source allowlist intentionally remains fail-closed pending review.


## V136.020 — QA remediation and concept preservation (2026-10-25)

The community browser capture now validates the first-party native Community hero rather than requiring its deleted promotional raster. Published project media is asserted against the shared `ProjectThumbnail` component, including its load state, category and default source. The full PARITY browser harness validates `native-institute` arrival and the single modeled WebGL canvas, rather than waiting for an intentionally retired poster `<img>`. Same-context native-overlay / real-3D comparison, scroll handoff, reduced-motion behavior, and navigation remain under strict assertions. The latest separate concept-led desktop wayfinder geometry and CSS are merged without replacing Creator Studio work.

Protected V132 and release source allowlists remain fail closed; their rejection of the broad ongoing design branch is not treated as production approval. Do not deploy or mark visual parity complete without exact-head browser evidence.


## V136.021 — Real member profile navigation and upload-first identity (2026-10-25)

Private and public member spaces now use one failed-media fallback for uploaded portraits and banners. Verified account media loads normally; a failed portrait returns to the existing native OrbitalMark, and a failed banner reveals the already-present native cover instead of a broken image element. The original versions and private/public media routes are retained. There is no new image source, media upload route or AI image generation.

Public profiles gain an actual section index for the member's public wall, biography, verified recognition, and—only if the approved package gallery is enabled—browser creations. Each target is a real in-page anchor, not an imagined feed or data count. The private and public identity surfaces receive responsive, accessible Institute-native panels, maintaining aura/theme accents and creator-uploaded imagery. All media, identity, authentication, wall availability, and publication gates remain server-owned. These changes are a draft visual integration pending browser verification.


## V136.021 QA fixture route correction

A previously observed compiled Community screenshot failure was the offline fixture's path whitelist, not a missing default asset: `/creator/assets/default-thumbnails/games.svg` was rejected while the image component and positioning rendered correctly. The loopback-only fixture now permits exactly ten approved `default-thumbnails/<kind>.svg` paths, with its existing path normalization, static-file existence requirement, and unchanged public/private API route behavior. This preserves strict file provenance without widening access to arbitrary directories or user uploads.
