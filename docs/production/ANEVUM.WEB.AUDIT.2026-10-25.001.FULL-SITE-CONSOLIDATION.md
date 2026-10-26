# ANEVUM — Complete Website Consolidation and Continuance Experience Audit

Session: ANEVUM.WEB.AUDIT.2026-10-25.001.FULL-SITE-CONSOLIDATION
Date: 2026-10-25 America/New_York
Repository: anevum/anevum-web
Review branch: audit/full-site-route-consolidation-20261025-001
Parent: V136.038 unified development, f58bed9370dc3fed0429033852a0a9c506daffae
Status: ACTIVE AUDIT / BOUNDED SOURCE FIXES / NOT A RELEASE

> **2026-10-25 owner-direction precedence update:** read [the unified motion-first North Star](./ANEVUM.WEB.NORTHSTAR.2026-10-25.002.MOTION-FIRST-SINGLE-STREAM.md) first. It supersedes the older statements below that the visitor-facing site must preserve its continuous WebGL ambience. Preserve *legitimate product/Studio 3D capability*, not ambient model loading behind routine navigation. The North Star also defines one thumbnail and theme authority, the URL/Worker inventory, the current /updates collision and one canonical release stream. No deletion or release is authorized by this note.

## Governing constraint

Consolidate the site people use, not another alternate visual overhaul. Preserve the
approved Orbital Underground logo in desktop/mobile/header/favicon and other product
contexts; preserve existing V136 art, one WebGL environment architecture, IREN,
working Monaco Creator Studio and real backend security boundaries. The two user
Hushwire reference images establish cinematic environment / dimensional-panel
quality and usable collaboration expectations. They DO NOT approve replacement
of ANEVUM identity, private messaging, fabricated social activity or encryption
claims, new services, account permissions, or publication gates.

Owner-controlled visual approval, actual device review, and the release process
remain separate from source tests. V136.038 is development, not production. Do
not touch main, live Worker routes, traffic, databases, member records, family
data, payments, release flags, or the sealed production candidate in this audit.

## What was inspected

1. React V5 application, src/App.tsx, its public route registry, Commons shell,
   member/RHEN destinations, public documents and historical redirects.
2. Creator V1 / V136 application, creator-v1/web/src/App.tsx; shell, global
   header, spatial Wayfinder, portal launcher, navigation registry, published
   destination pages, Studio, member areas and return-context logic.
3. Current GitHub V136 draft ancestry and the existing route/security regression
   suites and source-level visual contracts.
4. Read-only Cloudflare zone: Worker domains, exact Worker route patterns,
   DNS hostname names, and Pages projects. Read-only inspection does not prove
   each hostname renders its latest proposed code.
5. Existing source-driven legacy-page retirement audit. Historical source
   dependencies are not permission to delete source.

A static scanner was added at scripts/audit-sitewide-navigation.mjs. It emits
the literal links, route declarations, compatibility-redirect references,
unresolved literal destinations, and count of dynamic expressions for BOTH
React trees. Outputs are retained as GitHub Action artifacts. This excludes
runtime-generated URLs, live third-party redirects, Worker-handled routes,
authenticated behavior and actual HTTP or visual success; those require their
own checks. It must never quietly reclassify a catch-all 404 as a working page.

## Current canonical public information architecture

| User need | Creator V1 canonical destination | Meaning / preserved behavior |
| --- | --- | --- |
| Arrive | / | Continuance Institute arrival, approved orbital mark, clear destinations |
| First visit | /start | Discover / Create / Connect, truthful gates |
| Discover | /discover | Real public projects, category, free, search and grid/list context |
| Public project | /projects/:id | Real publication and return-to-filter context |
| Creator directory | /creators | Genuine public authors |
| Creator channel | /creators/:handle | Public-only profile and published work |
| Community | /community | Real community, controlled moderation and view/search state |
| Public record/boards | /boards | Approved first looks / records, not invented activity |
| Guided learning | /guide | Existing free Field Guide |
| Create | /studio | Private authoring / review permissions are independent |
| Packages | /studio/packages/* | Real source/build/upload/review lifecycle |
| Account | /member | Verified personal account and display controls |
| Saved items | /library and /saved | Distinct existing members' library and saved-work behavior |
| Join | /join | Actual authentication and availability |
| Release readiness | /status | Honest enabled/gated feature status |
| Earned progression | /levels, /recognition, /auras | Earned artifacts, not purchasable fake rewards |
| Support | /support, /support/transparency, /support/collection | Existing supporter surfaces, payment decisions require separate authority |

V5 still owns its actual public RHEN and record routes: /products,
 /products/rhen/*, /field-notes/*, /updates/*, /about, /help, /privacy,
 /terms and operator/member paths. Do not assume all these are replaced by
Creator V1 routes; no public release should strand existing information.

## Observed legacy and collision classes

- Creator V1 display navigation previously linked to /create and
  /account/studio even though both redirect to /studio. The landing page
  already pointed to /studio, making links inconsistent. Corrected the
  visible Shell menu, Member Studio registry and Portal Launcher to /studio.
  Retain the alias routes for bookmarks/external references.
- Creator V1 advertised an optional Atlas utility at /atlas. The app's
  historical Atlas adapter takes bare /atlas to home, not a separate spatial
  Atlas experience. Removed only this misleading utility entry; retain
  historical /atlas/* redirects and project artwork, and retain the real
  V136 Wayfinder / living-world navigation.
- V5 advertises /feed as "Updates" and /updates as "Studio updates" while
  Field Notes is also prominent. Keep these as distinct records until
  editorial ownership and archival semantics are agreed; unify the language
  and labels before visual release, never redirect independent content away.
- V5 /store currently redirects to /products. That is only a legacy
  compatibility behavior; it is not a verified merchandise store. Do not
  promote /store as an active retail destination until commerce is approved.
- V5 /live, /performance, /research, /releases, /founder, /case-studies,
  /system, /wiki, /lab and other former entries have intentional redirects.
  Keep old inbound URLs while migrating active links to reviewed destinations.
- Creator V1 site footer currently gives Start Here, Field Guide, Boards,
  Status but not direct Terms/Privacy. V5 has canonical /privacy and /terms.
  Establish reachable and accurate legal/privacy destinations in the
  approved entry routing before any Creator V1-wide promotion.
- V136 world-sector selection explicitly recognizes /studio but not all
  deeper Studio descendants for context selection. Verify the real nested
  authoring route environment and back-navigation before changing it.
- The top-level V5 main route / and Creator V1 / are different experiences.
  Deploy ancestry, not URL name alone, determines which is live. Do not
  label all source routes current production pages.

## Observed infrastructure boundary

Read-only Cloudflare inspection on 2026-10-25 found nine bound Worker
custom domains: backstage.anevum.com, next.anevum.com,
studio.next.anevum.com, lab.anevum.com, portfolio.anevum.com,
guardian-staging.anevum.com, web.anevum.com, sites.anevum.com,
and preview.anevum.com. Separate Zone routes include the apex,
a.anevum.com archive and family.anevum.com protected family link.
The Pages project anevum-command has command.anevum.com as a custom domain.

These hostnames have different audiences. Do not merge away accounts,
administration, RHEN, private labs, the family portal, the designer portfolio
or ANEVUM Sites merely because the parent site needs a single public
navigation model. For each: verify which URL is canonical, whether the
service is public/preview/private, and how it links to/from the main entry.
Some routes still have old service names or redirect bridges; route-table
presence is NOT proof of current public content. Preserve private-domain
isolation and never include private locations in the public sitemap.

Portfolio specifically retains a development prototype while its current
subdomain has a legacy redirect. Review portfolio user journeys independently
within the unified brand system; no production migration is authorized here.
ANEVUM Sites public/authoring/showcase URLs also need their own full content,
contact, navigation and cross-link acceptance before a launch claim.

## Page-completeness review matrix

| Area | Required checks before marking COMPLETE |
| --- | --- |
| Arrival and Start | Official orbital logo; real working CTAs; meaningful first-visit guidance; no hero masking on phone |
| Discover catalogue | Search, filters, empty/error/loading, pagination, view modes, browser Back, only approved public entries |
| Projects and playable pages | Stable deep links and previews; metadata, attribution, rights, provenance, source/thumbnail fallback |
| Creators | Valid handles, directory, identity, published work, private data excluded, return path and blank state |
| Community and Boards | Genuine discussions, sorting/history, moderation gates, safe public identity, accessibility |
| Studio and private authoring | Authoring file tree, previews, source state, rights, archives, upload status, review and clear private/playable distinction |
| Member spaces and saved work | Join/sign-in, redirect safety, owned profile, visibility, saved records, account switching, sign-out and delete |
| Progression and supporters | Genuine rewards and provenance; truthful capability and payment state, no misleading commerce |
| IREN and Wayfinder | One persistent assistant; stable focus return and responsive mobile; no member-data or chat access invented |
| RHEN and Command | Clear public vs owner-only, no live trading implications, preserved authorization and legacy links |
| Research, Updates and legal | Single editorial classification; records retained, index/canonical/sitemaps, privacy and terms reachable |
| Portfolio | Independent user journey, projects/case studies/contact and actual domain destination |
| ANEVUM Sites | Web/services/workshop/showcase continuity, real offerings, customer contact and authorized prototypes |
| Private family and labs | Explicit separation, authorization, no cross-account leakage or public indexing |
| Across all pages | Working literal/dynamic/external navigation, zero inappropriate redirects, keyboard/gamepad, reduced-motion support, 320/390/1440/1920 layouts |

## Content + feature architecture inspired by the references

The cinematic Continuance Institute is a system of real destinations, not
decorative feature panels. Reuse the existing Orbital Underground master mark
and visual vocabulary rather than replacing it with Hushwire's symbol.

- ARRIVAL / DISCOVER: atmospheric arrival, curated real releases and living
  project previews; no pretend users, counters or endorsements.
- CREATE / WORKSHOP: real creator tools, project hierarchy, source/build/
  playtest/submit status, release review and portability.
- CONNECT / COMMONS: real profiles, community threads, collaborations and
  approved public spaces; any new private space membership requires a
  separate access-control model.
- ARCHIVE / MEDIA: portable, permissioned project assets and earned records;
  published public work must not expose private draft files.
- IREN / GUIDANCE: contextual navigation, genuine page-state literacy and
  accessibility-aware help, within its current permission boundary.
- FUTURE PRIVATE COMMUNICATION: messaging, personal spaces, calls and
  sharing remain a proposed independent product workstream. Do not claim
  end-to-end encryption, ad-free guarantees, private file protection or
  live communications based only on concept art or static screens.

## Required closeout gates

1. Produce a complete literal route/reference artifact, triage every
   unresolved and compatibility finding, then fix source navigation at the
   owner component rather than relying on redirect chains.
2. Add a separate live crawl against approved deployed hostnames. Follow
   HTTP status, canonicals, external links, query/fragment, redirects, asset
   loads, cross-domain routes and SEO. Record verified date and source.
3. Run authenticated and role-specific journeys in disposable/staging
   accounts: signup, Studio, owner-only, member spaces, account switching,
   publication gates, moderation and privacy.
4. Inspect desktop, laptop, iPhone 390/320, reduced-motion,
   high-contrast and gamepad/TV behavior with actual screenshot captures.
5. Check service-specific active and former domain routes, source-retention
   dependencies, legal/sitemap indexing and historical bookmarks. Redirects
   must be deliberate and no longer linked from first-party navigation.
6. Complete exact-source V136/Creator test suites, record any CI failures and
   owner visual acceptance. The production source allowlist must remain
   closed until independent release review #333.
7. Receive explicit release approval and only then roll through a bounded,
   reversible production release with rollback and monitored links.

"100% audited" means each scoped page and transition has passed the relevant
live, source, permission and visual gate. This document is a first verified
source/infrastructure checkpoint and cannot be represented as that result.

## Current source changes on this review branch

- Creator Shell Create link now resolves directly to /studio.
- Member Studio nav points directly to /studio with old URLs still recognized
  for active highlighting and inbound redirect continuity.
- Portal Launcher Create shortcut targets /studio.
- Inaccurate optional Atlas menu shortcut removed; V136 Wayfinder remains.
- Existing V079 navigation regression updated to reflect direct Studio.
- New source audit and sitewide route integrity tests/workflow introduced.

Nothing in this review authorizes deleting pages, removing old redirect URLs,
changing publications, creating private messaging, or deploying to production.
Follow development source #763 and protected issue contracts #325, #335, #333,
#344 and #331; avoid duplicating historical features from sibling draft PRs.
