# ANEVUM — OPEN SIGNAL: Free Launch & Discovery Companion

Session: \`ANEVUM.WEB.BUILD.2026-10-24.008.FREE-LAUNCH-DISCOVERY-LAYER\`
Build: PARITY V136.018
Repository: \`anevum/anevum-web\`
Branch: \`build/parity-v136-free-launch-companion-20261024-018\`
Stacked base: the existing V136.017.003 Creator Studio nested-file explorer, PR #735.
Status: **DRAFT SOURCE / NOT PRODUCTION ACTIVATED**. Release authority remains with the existing V136 rollout gates.

## Product decision (additive; no redesign)

Creators should be able to **create, describe, launch, share, demonstrate, collect feedback on, improve and relaunch** meaningful work without buying ranking, expedited listing or permanent page retention.

ANEVUM is **not** becoming a separate launch-directory website or adding a second UX system. Open Signal is a cross-cutting product *capability*, distributed across the existing Discover, approved project passports, Commons, public boards, creator profiles, Creator Studio, Artifact Lens, and IREN. Keep their current URL hierarchy and PARITY V136 graphics, responsive CSS, spatial navigation, controller mappings, WebGL scene, and first-party truth and permission boundaries.

Core functionality is free subject to published, reasonable quotas, security checks, moderation, storage and abuse controls. "Free" does **not** promise unlimited GPU, video transcoding, LLM tokens, storage, emails, promotional impressions or immediate approval.

## Relevant competitor features, adapted to ANEVUM instead of copied

Evidence as of 2026-10-24:
- Microlaunch: launch exposure, feedback, repeated product discovery; https://microlaunch.net/
- PeerPush: permanent distribution, AI/search/API/MCP visibility, community and analytics; https://peerpush.com/pricing
- Product Hunt: launch pages, creators, discussions and product updates; https://www.producthunt.com/
- Uneed: free launch queue with paid expedited spots and relaunches, temporal boards, badges; https://www.uneed.best/how-it-works/
- DevHunt: permanent listing, weekly developer launches, votes, recognized winners and maker discussions; https://devhunt.org/faq

We implement capabilities and improve their interoperability; we do **not** replicate copyrighted layouts, copy proprietary content, scrape private user data, fabricate popularity, or claim ANEVUM can make external audiences obsolete.

## Existing foundation (verified in the V136.017 development tree)

- Discover includes real, approved project catalogue and type/free-text/free-only filtering.
- Project pages have canonical public facts, creator disclosures, external/ANEVUM player links, community discussions and member-engagement gating.
- Public Boards include **Latest Releases**, **First Looks** and **Creator Activity** from verified publication records. They explicitly **do not** claim popularity or quality ranks.
- Canonical Creator Studio distinguishes verified private project drafts, upload capabilities and staff-approved publication; the local source workbench does not execute untrusted code.
- Existing public read APIs include \`/api/v1/projects\`, \`/api/v1/projects/:id\`, \`/api/v1/creators\`, \`/api/v1/boards\` and approved public community reads.

Important: the V136 visual/source work is still in draft PRs, and production uploading/publishing remains gated. None of the planned launch features is allowed to silently unlock publication, create a post, award XP, boost rank or grant staff permission.

## V136.018: First independently testable increment (implemented on this branch)

- \`creator-v1/web/src/lib/launch-kit-v136018.ts\`: pure and bounded builder for canonical, correctly prefixed published project URLs, human-readable text and escaped **scriptless HTML** link; reject malformed IDs, unsafe origins and paths.
- \`creator-v1/web/src/components/ProjectLaunchKit.tsx\`: small sidebar instrument on canonical approved public project pages, with copy link, native OS share when supported, and optional expandable embed HTML. Browser with no clipboard support receives a selectable read-only field.
- \`creator-v1/web/src/components/project-launch-kit-v136018.css\`: strictly component-scoped optical presentation, narrow/mobile-safe, keyboard focus and forced-colors behavior.
- \`creator-v1/test/free-launch-kit-v136018.test.mjs\`: pure contract and source-guard tests.
- Existing \`ProjectPage\` now mounts the companion only **after** the approved public project API succeeds.

**Not included:** promotional voting, launch scheduling, server analytics, share tracking, notifications, paid upgrades, page-specific SEO endpoint, new publication privileges, moderation bypass, or fake badges. If the project does not exist or is not publicly approved, the page remains inaccessible as before. Preview links point to the actual preview origin, not anevum.com.

## Delivery sequence — future separate PRs and gates

### Gate A — Free listing, scheduling and new launch editions

1. Reuse the verified Studio project record and existing public project passport. Support ordinary HTTPS link-only projects **as well as** uploaded/browser-native projects, preserving ownership and external-link safety.
2. Introduce explicit draft \`launch_intent\`, \`requested_date\`, \`approved_publication_id\` and review state. A scheduled intent is *never* treated as an approved/public launch.
3. Accepted releases enter a fair chronological rotation on the existing Discover/Boards surfaces. No paid queue jumping, hidden scoring, or infinite reposting. Define per-account reasonable anti-spam limits, with human moderation and published appeal rules.
4. A relaunch is a separate versioned event for meaningful changes, with a changelog and preserved original history, not a duplicate fake project.
5. Support short permanent URLs and indexable project metadata once actual route serving has been inspected.

**Acceptance:** direct link-only creator draft -> valid ownership -> staff review -> genuine public passport -> indexed release, with rejected drafts unlisted and rollback verified.

### Gate B — Community usefulness instead of manufactured votes

1. Extend existing Commons and member engagement **without** bridging legacy and canonical identities. Ratings only from server-verified accounts when authorized.
2. Product questions, bug reports, beta-tester requests, creator replies, verified fixes and helpful-feedback acknowledgment.
3. Time-window boards and trending only after valid public signals exist. Separate verified unique votes, genuine engagement and editorial curation. Never fake default scores, sell vote weighting, sell rank boosts, or use hidden pay-to-win multipliers.
4. Moderator review, rate limiting, abuse-report and appeals, author conflict detection, one member vote per project/launch episode, audit and cache-safe canonical results.

**Acceptance:** no self-boost bypass, two-account cross-user isolation, replay protection, privacy safeguards, traceable ranking source, graceful zero-data views.

### Gate C — Distribution surfaces and machine-readable discoverability

1. Add first-party OpenGraph and structured-data/JSON-LD metadata to actual server responses for approved projects; structured types reflect actual project category and do not assert unverified ratings.
2. Approved-only sitemap, RSS/Atom release streams and a documented read-only public API with versioned contracts, caching and safe bounded pagination.
3. Optional read-only MCP discovery adapter, sourced **only** from the same approved public catalogue, with rate limits and prompt-injection resistant data handling; no access to creator drafts/private accounts.
4. Free first-party assets: scriptless embed links, optional safe official badge images for **verified** milestones, share cards/copy and creators' release changelogs.
5. Multi-channel distribution favors opt-in integrations and export; do not promise automatic placement on third-party sites without their authorization.

**Acceptance:** crawler fetch sees sanitized real data with cache freshness, unpublished/revoked projects disappear from public feeds, no private data or fake awards.

### Gate D — Creator analytics, tester programs and retention

1. Server-owned, privacy-minimized project impression/open/play/referral counts with bot filtering and unambiguous definitions; no fingerprinting or cross-site tracking pixels.
2. Dashboard showing only measured and adequately sampled values, time window and "unavailable" instead of invented zeros. Do not claim exact unique-human traffic unless proven.
3. Consent-driven beta tester opt-ins, maker-managed invitation queues, build/release notes, feedback routing and response notifications.
4. Optional digest/newsletter and creator-follow release updates, delivered only to opted-in recipients. Provider quotas, unsubscribes and anti-spam controls apply.
5. IREN assists with accessibility/compatibility guidance and honest public project summaries, not fabricated endorsements or unsupervised publication.

**Acceptance:** account export/deletion, private tester authorization, opt-out honored, bounded provider costs, latency/mobile regressions within budget.

## Cross-cutting protections / no-change list

- No new top-level destination, second project registry, competing homepage, duplicate canvas or CSS overhaul.
- Do not modify protected Command/RHEN, brokerage, credentials, payment processor, supporter entitlements or existing XP/badge eligibility.
- No account creation, upload capability, moderation, rights or public publishing is unlocked in this branch.
- Use existing Cloudflare Worker/D1/R2 and routes **only** when a future change has audited limits, migrations, backups and owner approval.
- Source-of-truth API, privacy separation and public vs member access are retained.
- All motion stays optional and responsive; maintain mobile, keyboard, assistive-technology and controller navigation.
- Full CI, real-account and browser QA, owner visual acceptance and security gates precede any merge/production traffic.
- Source branch is intentionally stacked on #735; do not merge an older sibling ahead of the consolidated V136 lineage.

## Product measurements after rollout

Track only genuinely verified counts: approved makers/release submissions, successful external-link and playable openings, creator-to-feedback cycle completion, repeat maker releases, retained creators, useful feedback accepted, content reporting and false-positive moderation, API/cache cost per project, page LCP/INP/CLS, and conversion from first Discover visit to a real project experience.

Adoption and network effects, **not** a long feature checklist, establish competitiveness. Launch this program by improving one complete creator-to-audience loop and publishing real evidence of use.
