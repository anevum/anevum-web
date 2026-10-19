# ANEVUM V5 — Distinctive Social Interface

**Session:** `ANEVUM.WEB.DESIGN.2026-10-11.001.DISTINCTIVE-SOCIAL-INTERFACE`  
**Status:** Source-only redesign candidate, draft PR, not approved for production.  
**Base:** `main` at `5c53fa530a495f022094fe3cc4903b43a8fc138c`.

## Design decision

**ANEVUM is the site.** Do not use “The Commons” as the primary public identity. Existing `CommonsV5` component names, API contracts, local-storage preference keys, security rules and routes remain stable through V5; they are implementation details, not a competing brand. References to Commons in old issue/contract names remain historical, not visible homepage labels.

The core experience is a workshop plus community: real software, people discussing ideas, published experiments, and useful learning. Borrow GitHub's discoverability and contribution recognition, Reddit's readable discussions, and Discord's sense of belonging, but never copy those products' trade dress.

## Visual language

- Editorial rather than generic SaaS. The opening screen communicates a useful workshop, not a financial dashboard or uniform collection of cards.
- Deep botanical tones with warm off-white type and restrained amber accents. A native sans UI paired with occasional serif editorial emphasis and mono operational labels.
- Tight radii and selective rules/borders; no repetitive oversized rounded containers and blue gradient decoration.
- Structure and varied density matter more than animation. Full desktop detail remains available; initial desktop left rail is icon-only and expands via the existing menu control.
- Featured Field Note gets the real publication-history graphic. Each later note has a category-specific procedural illustration, decorative and non-misleading; no stock imagery, fictional trading charts or invented user engagement.
- Studio publications keep real author/publication records and gain type-specific editorial symbols.
- Member discussions use their verified topic as a visual signature. The server deliberately reports “Commons member” rather than personal identity; do not invent avatars or handles.

## Navigation map

| Surface | Primary | Secondary | Interaction |
| --- | --- | --- | --- |
| Mobile dock | Home, Topics, Projects, Field Notes, Account | Drawer: Learning, Updates, Member access, settings | Five large touch targets, one clear active route, labels visible |
| Desktop | Icon-first left rail, compact top icon shortcuts, searchable header | Expandable text labels, topic shortcuts, member tools | Label/title/aria-label on icon links, keyboard focus |
| Homepage | Project discovery, Field Notes, learning, real work | Member access / beta | Real navigation, no disabled imitation posting controls |
| Member discussion | Topic, dated post, reply/report/remove | Server-controlled pilot permissions | Distinct visual classes per verified topic, no fabricated reputation |

The `/feed` compatibility route continues to highlight Home. Keep URL routes, member-owner separation, and authentication boundaries stable.

## The community model — forward-looking, not enabled by this change

**Phase 1 (current V5):** public-first project directory, verified publications, topic navigation, free member onboarding and moderated, feature-gated discussion pilot. No fabricated user social statistics or automatic bot replies.

**Phase 2 (later):** optional follow/bookmark and real user-contribution signals with a durable data model; project stars, meaningful appreciation/upvotes, selected badges for actual completed contributions, user-authored project cards, trustworthy moderation/audit trail, media attachments with secure moderation and storage limits. Votes, awards, stars and roles are different concepts: do not pretend all are equivalent reputation. Protect against brigading, manipulation and pay-to-win status.

**Phase 3 (later):** IREN as an opt-in, clearly labeled automated participant that can answer product help/questions or identify duplicates when the platform is ready. Rate-limited, transparent, human-overridable; never impersonate a person or auto-promote investment signals.

Separate proposal and safety/abuse design is needed before implementing actual reaction counts, media uploads, automated comments, or rewarding user-generated content.

## Acceptance checks

1. At phone widths 320, 375, 390, 430, 720 px, no clipped heading/search/navigation; dock and drawer usable with 44-pixel interaction targets or equivalent spacing.
2. Desktop 768–1920 px retains usable layouts, an understandable icon rail, keyboard labels and a reversible collapsed/expanded state. Watch header overlap on 1150–1320 px.
3. Public home does not appear to be “The Commons” and the hero first communicates what ANEVUM does. No unrelated landing page or broker-performance promise.
4. Featured and standard posts have distinguishable layout and artwork; medium and narrow viewports do not clip. Default/compact/focus layout preferences still work.
5. Forest and all user-selectable appearance variants remain legible; no contrast regressions in links, placeholders, focus rings or disabled buttons.
6. Screen-reader navigation labels, active states, heading order and reduced-motion preferences remain intact. No inaccessible icon-only actions.
7. `/communities` real discussion pilot remains independently permission-gated. No implied voting/stars/badges/media upload availability.
8. Existing V5 owner-only Studio/Command, member isolation and all private RHEN trading routes are unchanged.
9. Build/typecheck and foundation/member suites pass on **exact** branch head, plus real browser visual QA of ShadowRoot routes before merge.
10. Production deployment requires separate explicit release review and does not follow automatically from design acceptance.

## Files / scope

`src/commons/CommonsV5.tsx`, `src/commons/CommonsPages.tsx`, `src/commons/CommonsPostsBeta.tsx`, `src/commons/StudioRecentPosts.tsx`, `src/commons/site-navigation.ts`, new `src/styles/commons-v5-identity.css`, `src/App.tsx`, `worker.mjs` route metadata only, `index.html` metadata, test coverage, and package test registration.

**Release boundaries:** No database migration, API mutation contract, OAuth adjustment, Cloudflare deployment, brokerage authorization, real order, IREN automation, social rewards, payments, production change or page publication. CSS is isolated to the existing V5 ShadowRoot.

**Visual QA evidence:** Not yet collected. Do not merge or deploy solely because source-level contract checks pass. Preserve the existing V5 master tracker #259 and New Year's public launch #308.
