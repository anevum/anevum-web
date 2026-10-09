# Project Commons — Stage 01: Public entrance and app shell

**Session:** \`ANEVUM.WEB.DESIGN.2026-10-09.002.COMMONS-STAGE-ONE-ENTRY\`  
**Milestone:** ANEVUM 2.0 / Project Commons (internal); The Commons (public experience)  
**Status:** DESIGN REVIEW — NOT APPROVED FOR IMPLEMENTATION OR DEPLOYMENT  
**Repo:** \`anevum/anevum-web\`  
**Applies to:** public website, public route/nav, static first-party feed, responsive UI. **Does not apply to:** RHEN trading runtime, founder terminal, broker access, member writes or production DB.

## Outcome

A first-time visitor to \`anevum.com\` immediately encounters a recognizable, compact, socially oriented community interface rather than a large marketing landing page or the founder's trading dashboard. The experience is useful before signup: guests can open authentic ANEVUM publications and public project pages. ANEVUM is the umbrella, The Commons the community, RHEN the first distinct application. Do not repeat "2.0" on public navigation.

**Primary five-second test:** new visitor can identify what ANEVUM is for, find the feed, Discover, Research, RHEN and Join, and open real work without signing in.

## Design acceptance checklist

- [ ] Compact social home with direct access to real public content; **no tall promotional hero**
- [ ] Dark forest default; restrained sage and green accents; user-selectable light appearance
- [ ] Navigation labels and grouping as below
- [ ] Honest official/first-party starter feed until genuine public member posts exist
- [ ] Anonymous public browsing, but user-generated writes gated by real authentication and releases
- [ ] Mobile layout with compact bottom tabs, readable 320px viewport and no sideways scrolling
- [ ] Stage 1 stays limited to entrance/shared shell; identity, profiles, XP, creators, research publishing and RHEN member terminals remain in their respective later approval stages

No stage implementation begins until these have been reviewed.

## Layout and navigation

### Desktop

Global header, 61px: existing ANEVUM mark + wordmark, search, **Commons**, **Discover**, **Research**, **RHEN**, light/dark switch, Sign in and **Join free**. Width constrained around 1480px.

Below: three-column social shell. Left sidebar ~215px; fluid content column; discovery rail ~287px; gaps ~16–18px. Left navigation: Home feed, Discover projects, Research library, Communities *(later)*, Levels & awards *(later)*, Create a profile, My Command *(sign in)*. Compact current-section styling, no glowing telemetry.

Main: intro strip ~120–132px; title **"Make. Learn. Share what works."**; one-sentence explanation; account-gated composer invitation; real-content filters **All / Systems / Engineering / Releases**; chronological or curated ANEVUM first-party editorial cards. Right rail: Join/Start here, published projects, Field Notes, public RHEN app, clearly disclosed future community/profile capabilities. Inert or unreleased destinations must never impersonate working functions.

### Mobile

At <~1060px, omit the discovery rail; at <~760px, hide the sidebar and switch to a single reading column. Sticky mobile header ~57px with wordmark, compact search and theme. Bottom navigation: **Home / Discover / Research / Account**, reachable with thumb and safe-area padding. Critical links removed from the right rail must remain available in mobile navigation. No overflow at 320px.

### Design tokens

| Role | Dark | Light |
| --- | --- | --- |
| canvas | \`#101813\` | \`#f4f6f3\` |
| surfaces | \`#19261e\` | \`#ffffff\` |
| border | \`#32463a\` | \`#d5dfd7\` |
| primary text | \`#eef6ef\` | \`#1c3024\` |
| secondary text | \`#abc0b1\` | \`#566a5b\` |
| accent | \`#89d7aa\` | \`#276449\` |

Quiet 1px borders, 10–11px corners, strong typography, clear focus, system fonts. No large 3D scenes, dashboard counters, animated orbital backgrounds, auto-playing video, fake trading performance or paywall-first messaging.

## First-party launch content (no fiction)

Reuse existing published **\`src/data/fieldNotes.ts\`** and the public product registry as the source of truth; never hardcode prototype examples as durable data. Proposed starter cards:

1. **ANEVUM gets smaller on purpose** — published 2026-10-08. \`/field-notes/anevum-lean-runtime-reset\`
2. **RHEN 4.4: observe first, earn the crossover** — published 2026-10-07. \`/field-notes/rhen-v4-4-research-observation-and-release-gates\`
3. **RHEN V4.3 narrows authority and raises the evidence standard** — published 2026-10-06. \`/field-notes/rhen-v4-3-canonical-equity-evidence\`

Card content contract: real title, date, type, author **ANEVUM (Official)**, summary, source action and accurate public status. No simulated member identities, replies, XP, awards, performance, likes, subscribers, ratings or download counts. A genuine empty state is acceptable and should explain what has not launched.

Search and topic filters at Stage 1 may operate on existing public ANEVUM content; broader social search belongs to later stages.

## Route contract and future compatibility

| URL | Stage 1 | Notes |
| --- | --- | --- |
| \`/\` | PUBLIC Commons-style landing + public ANEVUM activity | Guest browsing, no mandatory login |
| \`/commons\` | Respect existing staged compatibility and feature gates | Authenticated Commons application later, same visual shell |
| \`/products\` | Existing public product catalog | Later becomes or redirects to Discover |
| \`/field-notes\` | Existing published notes | Later research library is separately designed |
| \`/products/rhen\` | Existing public RHEN app information | No member live trading implied |
| \`/sign-in\` | Existing Better Auth entry | Member profiles/onboarding in Stage 2 |
| \`/command\` | Existing protected member/owner interface | No authority change |
| \`/command/rhen/*\` | **Founder-only operator terminal — unchanged** | Never exposed by public shell |

Draft PR **#249** currently assumes a consumer marketing \`/\` and an invited \`/commons\`; this **conflicts** with the accepted social-first first-visit requirement. Reconcile it before any implementation merge. Draft PRs **#251** (moderation) and **#252** (member RHEN/broker integration) are stacked and must not be pulled into a cosmetic Stage 1 release.

Guest requests must never accidentally query gated Commons member D1 content. Do not auto-redirect users to disabled or invite-only surfaces. Share shell/branding across public and authenticated experiences without sharing private payloads.

## Interaction contract

**Public:** click navigation, open Field Notes, view RHEN/product pages, search/filter published material, toggle theme. Join and gated composer must invoke genuine sign-in or state that contributions are not open yet; they cannot falsely claim posting succeeded.

**Account-only:** member identity, follow/save, post/reply, private Command are not considered implemented by this stage. Navigation can reserve space for them but must clearly indicate sign-in or future availability.

**Unknown or empty data:** honest blank/empty/loading/error states. No placeholders presented as live people or results.

## Implementation release process (after owner approves design)

1. Create focused code PR, preferably rebased/reconciled with #249 only for public navigation and entrance. Do not merge the full stacked Commons chain in Stage 1.
2. Implement tokenized React components **GlobalHeader, LeftSidebar, IntroStrip, EditorialFeedCard, FeedFilters, DiscoveryRail, MobileTabNav**, using existing authoritatively published notes.
3. Preserve public-route meta/canonical/SEO, existing Cloudflare Worker and auth contract, and current protected \`/command/rhen/*\` boundaries.
4. Verify \`npm run check\`, \`npm run build\`, existing privacy/member/owner tests, and CI. No production D1 migration; \`ANEVUM_COMMONS_ENABLED\` stays **OFF** until its separate launch acceptance.
5. Run Chromium visual QA at 320/390/768/1024/1440px, dark/light, keyboard focus, screen-reader labels, reduced motion, >=44px touch targets, no overflow. Target WCAG 2.2 AA and good CWV metrics where measurable.
6. Deploy only to an isolated preview for actual visual review; validate anonymous public read, signed-out write rejection, private noindex/no-store, owner terminal unchanged and rollback. Production release only after separate owner authorization.

## Review artifact

A stand-alone offline **Stage 1 preview** and matching screenshot set was created in the current design session, with a passing local Chromium smoke test covering responsive widths, filter/search, theme, and guest join dialog. **That HTML is a visual prototype, not deployable application code or an authentication implementation.** The zip and screenshots are supplied in the ChatGPT handoff.

## Explicit non-scope

No production deployment; no RHEN changes; no Alpaca connection; no subscriptions or charging; no D1 migrations; no member writes; no badge ledger; no upload/download marketplace; no fictitious communities or returns. Those features each have separate design and release gates.