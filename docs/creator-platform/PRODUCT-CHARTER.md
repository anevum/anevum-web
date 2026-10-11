# ANEVUM Creator Platform — Product Charter v0.1

**Session:** `ANEVUM.WEB.BUILD.2026-10-11.001.CREATOR-PLATFORM-SEPARATION`
**Status:** Direction approved for implementation; this document does not authorize a production cutover.
**Target public opening:** 2027-01-01.
**Public home:** `anevum.com` (currently the legacy V5 app until cutover).
**Independent preview:** `next.anevum.com`.
**Existing operator environment:** `backstage.anevum.com` (hostname and Access provisioned; full migration not accepted yet).

## Product thesis

ANEVUM will become an independent, community-driven destination for **software made by people working with AI**: playable experiments, helpful utilities, bots, games, automations, creative tools, learning projects, open-source software, and serious independent applications. The comparison is Newgrounds' creator-first publishing and discovery energy, not an attempt to clone its branding or features.

The essential loop: **make → publish → try → review → improve → collaborate → remix or fork with attribution**.

The front page should feel like an active creator venue, not a corporate SaaS homepage or generic AI chat UI. It must function comfortably on a phone. There should always be a meaningful free path for creators, learners, and visitors.

## Audiences and roles

1. **Visitor:** browse, search, discover, and try verified external demos without paying or creating an account.
2. **Member:** save favorites, review, follow, join challenges, and share constructive feedback.
3. **Creator:** own a profile, draft and publish projects, link sources/demos, credit contributors and models, maintain changelogs and releases, accept collaboration.
4. **Reviewer / moderator:** handle submissions, reports, attribution disputes, security issues, appeals and appeals history.
5. **Operator:** configure the public platform only; RHEN broker controls remain on a completely separate, owner-restricted surface.

Identity verification and authorization are server-enforced. Role assignment is not inferred from a public profile field.

## Project types

Tools; Games and Interactive; Automation and Agents; Research and Experiments; Creative Software; Learning and Education; Open-source Libraries; Developer Utilities.

Each project may provide:
- name, short description, category, tags and creator credits
- version, publication date, status and release notes
- screenshots/media with moderation rules
- source URL, verified external demo URL, licensing, supported devices, pricing/free-access status
- what AI was used for, what human work was done, provenance and reproduction notes
- issue/feedback tracker, reviews, public changelog, follow/save count
- contribution and collaboration preferences

Do not represent external links as tested or safe until validated. Do not display fake member counts, reviews, rankings or activity.

## Navigation and editorial design

Primary: **Discover / Projects / Challenges / Community / Publish**.
Secondary: Profiles, Collections, Following, Field Notes, Learn, About/Help.
Editorial rails: New, Freshly Updated, Featured, Undiscovered, Open Source, Runs on a Phone, First Builds, Jams/Challenges.

Visual style: custom, lively editorial geometry; concise icon-forward mobile navigation; strong typographic hierarchy; legible contrast; intentional use of mint, acid-lime, and warm orange; no repetitive glassmorphism cards or generic chatbot silhouettes. Respect reduced-motion and keyboard navigation. Use original marks, not Newgrounds logos or design assets.

## First public release (P0)

- Homepage + searchable project directory (server-backed, real records).
- Free account registration and sign-in (OAuth/email as previously planned, after new-domain callback review).
- Creator profiles and ownership-scoped project CRUD with draft/private/pending/published states.
- Source/demo link validation, moderation queue, reports and appeal mechanism.
- User favorites and constructive reviews, with spam protections.
- First-party staff editorial curation, changelog/release history.
- Accessibility, mobile UI, privacy disclosures, terms, security reporting, account deletion/export, basic analytics and operational alerts.
- Initial real seed projects from ANEVUM; no fabricated community accounts.
- Protected owner admin separate from RHEN execution.

## After P0 (P1, not launch-blocking)

- Playable hosted demos **only** after an isolated origin and sandbox execution security review.
- Project forks/remixes and contributor permissioning.
- Collaborative challenges/jams, badges and creator milestones.
- Optional GitHub import and repository updates.
- Following feeds, activity notifications, richer collections and messaging with moderation.
- Community-led discovery/scouting with abuse resistance; quality review must not equate to automatic deletion by mass voting.
- Opt-in supporter revenue; free basic participation remains meaningful.

## Safety boundary

No untrusted user code will run in the primary web origin, the V5 Worker, or RHEN infrastructure. Initially, project demos are outbound HTTPS links. If hosted demos are added, they require independent origin isolation, CSP, framed content policies, malware scanning, resource/time quotas, network egress restrictions, upload/type limits, abuse reporting and incident response.

Project submissions do not grant access to Cloudflare/Railway/GitHub tokens, the operator environment, member data, broker data, or admin routes.

## Initial delivery definition

We can call the project **in development** today because its separate Worker and `next.anevum.com` domain attachment exist. We cannot call it a public community launch until persistent accounts, publishing, moderation, security acceptance, analytics, and an operator rollback path are in place.

## Immediate sequencing

1. Prove `backstage.anevum.com` end-to-end (Access, signed assertions, hostname/cookie/OAuth flows, D1 bindings and owner permissions) before retiring main-domain V5.
2. Establish a distinct `anevum/creator-platform` source repository. GitHub connector currently exposes code/branch/PR operations but no repository-creation action; the temporary preview code sits in a non-default branch of `anevum-web`.
3. Replace static prototype with server-backed directory and real authenticated creator submissions, on a database separate from V5.
4. Build moderation and operator tools before accepting anonymous public uploads.
5. Validate migration, backups, redirects, security, accessibility and monitoring before the owner-authorized `anevum.com` cutover.

**Explicit non-goals:** exposing RHEN accounts to visitors, resetting V5 data, publishing arbitrary executable code, importing V5 member accounts without consent, or launching monetization before core creation/discovery works.
