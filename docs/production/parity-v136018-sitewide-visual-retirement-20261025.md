# ANEVUM PARITY V136.018 — Sitewide visual retirement checkpoint

Session: ANEVUM.WEB.BUILD.2026-10-25.001.SITEWIDE-VISUAL-PARITY-OVERHAUL
Date: 2026-10-25
Branch: build/parity-v136-sitewide-ui-20261025-001
Review: PR #737, stacked on unfinished V136.017 PR #735

## Applied in this draft (not a production release)
- Replaced the common illustrative raster/category art with native, semantic interface index fields across existing consumers.
- Removed decorative Community hero art; preserved real moderated discussions, public creators and catalogue reads.
- Preserved user-uploaded project art, profile portraits, and member banners. Distinguish user media from ANEVUM-owned filler.
- Replaced V136 arrival image-generated poster with native animated optics over the one retained live 3D renderer and ready-only inspection control.
- Retired optional V010 raster kit and V011 atmosphere image lookups. Native emissive geometry remains.
- Removed 25 repository-tracked decorative promotional raster files (4440300 bytes) from the Vite public assets tree, including explicitly image-generated community, cinematic category, and V136 poster sources. Real 3D GLBs/textures and earned-member reward media are not classified as disposable.
- Updated legacy source QA contracts and added a static regression test for removed image files.
- Updated Blender preview QA to render original modeled scenery with **no generated matte input**.

## Remaining work, not claimed complete
- Browser screenshots and exact-head CI need review for 1920px, 1440px, 1024px, 768px, 390px, 320px. Validate contrast, text geometry, and touch/controller focus.
- Audit older **separately built** preview workers / `community-preview`, `evolution/assets` and any optional packs before making the claim that all published surfaces are image-free. Preserve genuine user assets and lawful provenance.
- Replace transitional flat native index fields with the approved dimensional design language, while keeping actual public data and navigation usable at every stage.
- Continue Community forum/feed, private spaces, public creator channels, discovery filtering/recommendation and Studio UX work without changing access rights or inventing content.
- Retired decorative assets remain recoverable in Git history for audit only. This branch removes their active public bundle path.
- The older PARITY release allowlist must remain fail-closed pending separate review and author authorization. Do not automatically merge, deploy, or switch traffic.

## Acceptance boundaries
Never use AI-generated imagery as stand-in for users, project releases, reward ownership, community activity, or cinematic site masters.
Model-based WebGL scenes may be retained and built using authored geometry and procedural materials.
No changes to member authentication, account authorization, moderation, payment systems, uploader permissions, or production environment flags.
