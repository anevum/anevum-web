# ANEVUM Discovery UX v069 — deployment record

Session: `ANEVUM.WEB.UPDATE.2026-10-18.001.DISCOVERY-EXPERIENCE-OVERHAUL`
Date: 2026-10-18
Status: **Live presentation overlay verified. Canonical creator-v1 integration still pending.**

## Purpose

Retire the oversized synthetic/illustrated portal navigation treatment from the homepage and navigation dialog. Prioritize small purposeful cards, actual publication data, functioning controls and readable mobile layouts. Do not manufacture creators, activity, rankings, approved projects or follower counts.

This patch preserves existing account flows, creation permissions, moderation workflows, member cards, 30 Evolution levels, badges, unlock conditions, XP and earned models.

## Production owner and boundaries

- Hostname: `anevum.com`.
- Existing apex application / API ownership: `anevum-apex-prelaunch-gateway`.
- Frontend asset route: `anevum.com/assets/index-*`.
- Route ID: `09309bb420984beba855276efcf58daf`.
- Overlay Worker: `anevum-discovery-ux-v069-20261018`.
- Overlay service binding: `UPSTREAM` -> `anevum-evolution-runtime-v068-20261018`.
- The overlay intercepts only 200 responses for Vite-style `index-*.css` and `index-*.js` assets. All other requests are passed through without modification.
- Source archive: `site/patches/discovery-ux-v069-20261018.mjs` **on this isolated branch**.
- The archived `anevum/anevum-web` V5 frontend is **not** the current creator-v1 production application. Do not redeploy its source to the apex.

## Actual changes

1. Homepage world categories become four responsive icon-based entry tiles, preserving URLs and hover/focus interactions.
2. The navigation directory uses compact, readable cards rather than large cover-art panels.
3. Discovery gets an editorial header, a prominent functional search, wrapped category filters and a clear results area.
4. The honest zero-project state offers direct paths to publish and learn; no fake projects or creators are introduced.
5. Existing identity, levels, progression, member records and permission boundaries are untouched.
6. Reduced-motion and forced-colors support is included.

## Live verification

- Homepage and `/discover` render and return usable public content.
- Homepage at **390x844**: root width 390 px, collection section width 368 px, four cards arranged as **2 columns**, each **180x148 px**.
- Homepage at **1380x850**: root width 1380 px, collection width 1325 px, four cards arranged as **4 columns**, each **324x178 px**.
- `/discover?category=games` renders the new heading and search form. Games is selected with `aria-pressed="true"`.
- Live discovery reports **0 approved public projects** at time of verification. No synthetic activity was inserted.
- The homepage DOM contains the new `Explore what people make.` heading, labels/icons, and browse/publish links.
- Full mouse/touch interaction automation remains an outstanding acceptance check. Automated accessibility/layout inspection is not equivalent to completing a full user journey.

## Rollback

Switch **only** Cloudflare zone route `09309bb420984beba855276efcf58daf` back to Worker `anevum-evolution-runtime-v068-20261018` while keeping pattern `anevum.com/assets/index-*`. Do not alter apex, signup, accounts or API routes.

Reconfirm the route configuration before updating it, and verify the homepage and `/discover` afterward.

## Integration debt

The present patch is additive CSS and a guarded DOM-enhancement script. Move its final component structure into the canonical creator-v1 source build after reviewing the current frontend, then remove this overlay in a controlled release. Do not merge the archived V5 site into production.
