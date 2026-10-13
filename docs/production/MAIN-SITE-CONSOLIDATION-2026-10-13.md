# Main-site consolidation

Session: `ANEVUM.WEB.RELEASE.2026-10-13.001.MAIN-SITE-CONSOLIDATION`.

Owner request: transfer current work to main anevum.com and continue UI/UX.
Base: read-only candidate d86da162672625502b547fda74d719d05d2e13b0, with cinematic source 74c30d4e7e9aebcc7844f5fb464ed3b442582768.
Portfolio source: a4189daf3b0553b12dc1833bcd2ed90acc1fc77a, preserved public assets with path-only relocation and a main-site home link.

## Scope
The main site becomes the current cinematic Creator UI, catalogue/discovery/creator channels, Start Here, Field Guide, Levels, Community roadmap and member-access gates. Trusted portfolio files are served at `/portfolio/`; `/workspace` provides entry to existing protected owner Lab. Old `/creator/*` UI paths redirect within the apex. Public API remains read-only on the existing production D1. No source maps or synthetic catalogue records are deployed.

UI refinements: five primary links, useful footer/mobile links, Escape-dismissal and focus return for mobile navigation, main-content focus and scroll reset after route changes, 44px account/menu targets, truthful member-access copy, responsive workspace cards.

## Retained boundaries and pending work
No production signup, member publishing, moderation, votes, XP writes or private broker routes are enabled. Staging membership and staff Workers remain on their current separate origins. Owner Lab remains behind its existing Access policy; it is linked from the main site, not proxied or made public. Existing portfolio subdomain is retained for old business-card links. Untrusted upload execution must remain on a separate sandbox origin.

Following/forum drafts require migration reconciliation; native uploads/hosting, genuine first showcase, licensing/privacy acceptance, real member A → staff → guest → member B acceptance and independent auth/recovery checks remain outstanding. This release promotes the public presentation layer only.

## Release and rollback
The branch-scoped workflow runs builds and public/member/privacy tests without provider credentials, verifies the existing apex route and production D1 identity, records old deployments, then uploads `anevum-creator-v1-main` without routes. Following a successful exact-source release, change only route `2659b522a96a435db4aadac49dbea8fa` (`anevum.com/*`) from retained `anevum-creator-v1` to the new Worker. Inspect latest state before mutation. Probe root, compiled JS/CSS, all ten artwork assets, portfolio files, catalogue and blocked private endpoints.

Rollback: update that same route back to `anevum-creator-v1`, after checking for intervening changes. Original Worker/version bb61cbb9-a6ef-4a74-93bd-307dd6b3d15b and production D1 remain untouched. No database restore is required because this release performs no D1 writes/migrations. Staging, private Lab, portfolio, archive and original services are retained.
