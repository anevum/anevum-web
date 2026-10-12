# ANEVUM V1 — Independent Software Marketplace and Requests

**Direction clarified:** 2026-10-12
**Target:** `anevum.com` / January 1, 2027
**Status:** Product positioning adopted for development; exact final mark **not approved**, production branding unchanged.
**Position:** The app store for independent software, especially AI-assisted apps, tools, games and practical automations, intended for *anyone* looking for a useful solution, not only developers.

## One-sentence product promise
Find independent software that solves your problem; try it, save it, ask for something better, or build and publish it yourself.

## People and their jobs
1. **Visitor / everyday user**: "I need an app that does X"—discover by problem, compare alternatives, see compatibility/cost, try without creating an account or paying ANEVUM.
2. **Independent developer**: Publish verifiable project listings and updates, link external demos/source, receive thoughtful feedback, gain followers and credible reputation; no requirement that ANEVUM host executable files.
3. **Requester**: Describe desired software in ordinary language, find matches first, submit a request, track interest/status, hear from interested developers, and eventually be notified when a solution ships.
4. **Tester / contributor**: Review real projects, save collections, suggest improvements, get attribution for useful contributions—no pay-to-win reputation.
5. **Moderator**: Prevent spam, scams, unverified claims, manipulated votes, harassment and request abuse; preserve appeals, decision history, and safety.

## V1 primary navigation (mobile: compact icons with accessible labels)
- **Discover** — the storefront and homepage, not a separately branded Commons.
- **Requests** — problems people want software to solve; public idea-to-product pipeline.
- **Publish** — authenticated creator workspace and project submissions.
- **Library** — private saved projects and followed creators.
- **Account** — identity, achievements and privacy controls.
Community interactions appear on project pages, requests and profiles; do not hide the marketplace behind a generic social feed.

## Discovery UX
- Hero search field: **What do you need software to do?**; plain language keyword search, with suggestions; launch does not require LLM-powered search.
- Curated rails from *real* entries only: new, updated, useful free tools, rising independents, editor selections, requests fulfilled, categories. No invented metrics or scarcity.
- Search filters: purpose/category, platform (browser/mobile/desktop), accessibility, free/paid, open source, self-hosted, no-account-needed, AI used or not, external costs and API key requirements, desktop/mobile tested. Relevance, new and top-rated sorts; no undisclosed sponsored weighting.
- Cards: real cover, name, precise one-line problem solved, creator, platform, honest price/free label, trust/source badges and **Try** action. Small-screen cards optimized for scanning, not art-heavy posters.
- Product page: screenshots, 30-second overview, try external app, platform, real price, privacy/data considerations, source/release info, versions/changelog, reviews, creator, save, report, and link to fulfilled requests. Safe external-origin warning; no uncontrolled third-party scripts/iframes on ANEVUM origin.
- Applications can be *listed* without being hosted by ANEVUM. Verified HTTPS demo/source/release links; optional developer-owned PWA install instructions. Separate future sandbox hosting decision.

## Requests — the marketplace differentiator
**User journey:** "I wish there were software that..." → search existing tools/requests → request submitted → others endorse/discuss → developer volunteers/claims with optional moderation check → progress/updates → independently hosted app listed/reviewed → linked request marked fulfilled → subscribers notified.

### Request card
- Short title in plain language.
- Problem/desired result, intended user, device/platform, important privacy constraints.
- Category/tags, requester alias, created date.
- Demand: unique supporters (no paid priority, no self-boost), comments, saved/followed requests.
- Status: `open`, `exploring`, `claimed`, `in_progress`, `reviewing_solution`, `fulfilled`, `closed`.
- Named developer claim with visible progress when accepted, attached project ID only after project review.
- Owner/moderator actions: merge duplicates, edit titles/categories with audit, block abuse, decline claims, close/reopen with explanation.
- Optional future **bounty** payments after marketplace legal/payment/consumer-protection review, not required for V1 or to request.

### Safety and integrity
- Public can browse/read; creating/supporting/commenting requires verified member, throttling and report flow.
- Cap request creation per account/day, safe markdown/plain text, forbid personal information solicitation, harassment and unlawful content; avoid private contact details.
- One active support per member per request. Users can withdraw support without rewriting historical analytics.
- No fake demand figures, paid popularity weighting, speculative "ready to download" labels or auto-awarded XP for spammy submissions.
- Request status cannot be changed to fulfilled solely by its claimant. A moderator or verified requester must confirm a publicly approved, relevant app link.

## Return habit — through utility, not dark patterns
- Fresh launches; updates to saved/followed projects; requested solutions delivered; personalized *opt-in* update notifications.
- Small editorial collections for real purposes: student research, freelancers, organizing home, accessibility, coding and gaming.
- Better discovery quality as the catalogue grows; useful reviews with actual experience, real change logs, "new since you last visited" without coercive streaks.
- Rewards for constructive first-use testing and verified release/help contributions, no arbitrary time-on-site XP or loss aversion.

## Brand / UX clarification (pending owner mark selection)
- Less "A", less orbital cosmic prestige branding, less exaggerated neon/sci-fi wallpaper.
- Clean, friendly, distinctive abstract mark with simple geometry, recognizable flat at 16px and in monochrome, useful as web app icon. Avoid generic app-store shopping bag, rocket, initial A or orbital cliché.
- Visually welcoming, responsive and premium with compact navigation and genuinely strong app artwork on listings; dark-first with accessible contrast and eventual light mode. Small warm accent and restrained violet permitted, not a full-screen galaxy motif.
- Favor storefront function and inviting editorial typography over generic AI dashboard cards. Artistic covers are app content, not mandatory page chrome.
- **Do not modify** production `anevum.com` logo or canonical `BRAND_MARK` until final owner approval and visual acceptance. Current cinematic identity remains in force meanwhile.

## P0 for 2027-01-01
1. Consistent visual design across public / member / Studio; one approved production mark.
2. Guest search/browse and useful real verified third-party software listings; compact category/filter rails, project detail, try-out link and safety labels.
3. Member email sign-in and recovery, profiles, creator publishing/editing, review queue/moderation, real voting and saves; complete secure cross-device acceptance.
4. **Requests V1:** public browse/search/request detail, authenticated create/support/follow, basic duplicate moderation, claimant/developer linking, visible status history, fulfillment link to approved project.
5. Privacy/reporting/abuse controls, accessible mobile experience, incident/backup checks and non-fabricated initial catalogue.

## P1 after secure P0, ideally before launch if time allows
GitHub verified public repo linking/import; richer request matching, opt-in notifications, editorial collections, creator follows, release diary, first community jam, original collectible art.

## P2 explicitly not a launch dependency
Creator payouts/Stripe Connect, bounty escrow, hosted binary files, third-party executable sandbox, app-store certificates/custom subdomains, AI-powered matching service, paid premium rankings, Discord role sync.

## Critical launch metrics (do not invent)
- Search → meaningful Try click (guest).
- Search with no results → request created or existing request endorsed.
- Creator signup → first approved project.
- Request created → developer interest → approved project linked → requester confirmation.
- Project published → authentic saves/reviews, not bot activity.
- Safety: spam, report handling, link failures, time to moderation decision and uptime.
