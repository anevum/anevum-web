# Project Commons — Stage 1: Dense social application shell (V4)

**Session:** `ANEVUM.WEB.DESIGN.2026-10-09.003.COMMONS-REDDIT-LIKE-APP-SHELL`  
**Milestone:** ANEVUM 2.0 / Project Commons. Public identity: **The Commons**.  
**Review status:** **DESIGN REVIEW ONLY. NOT APPROVED FOR MERGE OR DEPLOYMENT.**  
**Supersession:** This V4 app-shell contract **supersedes** the original Stage 1 marketing/large-card entrance concept in this PR. The owner explicitly rejected the previous design on October 9, 2026.

## Product correction

This must look and operate like a **social application**, not a project-portfolio homepage or WordPress-like block layout. The implementation must match a fully rendered, browser-tested app-shell design; use layout screenshots as acceptance evidence, not aspirational image concepts disconnected from the code.

* Top global bar ~60px desktop/~55px mobile, including ANEVUM identity, search, quick navigation and compact account actions.
* Persistent unboxed **left sidebar** ~249px desktop: Home feed, Explore, Research, RHEN, spaces, profile, saved work, Command. Collapsible; mobile drawer.
* The **main central feed** must occupy the most horizontal area (~883px at 1440px viewport). Inline tabs, search, post rows separated by thin lines, compact metadata, contributor identity/flair, small vote/comment/save/share controls, and optional modest thumbnails. **Card and compact density modes.**
* Smaller **right rail** ~308px: introductory context, RHEN, topics, current published work. Hide at tablet width; do not let it displace feed.
* At <770px, single-column feed with bottom navigation and a restrained 55px header. No horizontal overflow at 320px.
* Restrained neutral-charcoal surfaces with sage/green as an **accent only** and a light theme. No boxed sidebars, massive welcome banners, CTA tiles, glowing diagrams, fake metrics or gratuitous motion.

## Honest production content

The default Stage 1 production feed must derive from genuinely published `src/data/fieldNotes.ts` records (currently 7 first-party notes) with exact original titles, dates, statuses and links. It must not depict fictional users, likes, trading returns, discussion counts or active communities.

The offline V4 design prototype has a clearly labeled **Preview community design** toggle that demonstrates fictional member usernames, badges and levels solely for future visual acceptance. **Do not ship that fictional preview mode to production.** No user generated functionality is authorized by this stage.

## Stage boundaries and routing

| URL / surface | Stage 1 behavior |
| --- | --- |
| `/` | Publicly browsable dense Commons-style feed, without forced sign-in |
| `/products` | Existing real project list; later becomes Discover |
| `/field-notes` | Existing real published notes; later expanded research library |
| `/products/rhen` | Public RHEN project and real evidence; no brokerage permissions |
| `/sign-in` | Existing authentication, no new account claims |
| `/commons` | Respect staged invite-only/private data access and existing gates |
| `/command/rhen/*` | **Founder-only terminal unchanged** |

Stage 1 includes public shell only: **no** member writes, D1 migrations, XP, badges ledger, subscriptions, downloads marketplace, broker OAuth, owner-terminal authority changes or trading engine changes. Unreleased navigation must lead to truthful states or real existing content, not dummy features.

## Existing engineering conflict

Open draft #249 expects `/` to be a marketing-service entrance and `/commons` to be an invite-only application. Reconcile the public entrance layout before code review. Draft #251 adds moderation and #252 adds separate broker-related work; neither may be bundled into this design or Stage 1 cosmetic release. Respect #234 deploy-race mitigation and #235 company terminal privacy.

## Required implementation method (AFTER owner approves design)

1. Implement this design as **genuine React components with strongly scoped CSS/design tokens**, e.g., GlobalBar, Sidebar, FeedHeader, PostRow, ContextRail, BottomNav. Do not paste the preview's vanilla JavaScript and simulated content into production.
2. Isolate from existing `PublicShell` and legacy site CSS, leaving protected routes unchanged. No changes to live RHEN.
3. Verify typecheck, build, existing privacy/member/security tests, public search and navigation, plus responsive captures at 320, 390, 768, 1024, 1440, and 1680px. Target WCAG 2.2 AA.
4. Run explicit visual parity against the approved real-browser screenshot and interaction tests for navigation, density, filtering, theme and focus behavior.
5. Isolated preview/staging first; validate routing and privacy. **Production merge/deploy requires separate explicit owner approval.** Commons member write feature flag stays OFF.

## V4 preview and visual review

The current ChatGPT handoff includes a self-contained 3-file browser implementation (`index.html`, `styles.css`, `app.js`), desktop/mobile dark/light screenshots, documented design assumptions, and passing Playwright responsive/interaction checks. This establishes browser feasibility; it does not mean that the React production implementation has been completed.

Owner is reviewing V4 before any integration.
