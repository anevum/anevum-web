# ANEVUM — Participation, Experience, Levels and Real Recognition Charter

**Decision:** FOUNDATIONAL ANEVUM operating principle
**Decision date:** 2026-10-12
**Product:** ANEVUM, the public-first, Newgrounds × Envato-inspired destination for independently made games, apps, AI tools, experiments and other creator submissions.
**Target launch:** 2027-01-01.
**Scope:** Company strategy and product architecture, not a change of mark, current site information architecture, or production deployment.

## Founding conviction

**Experience (XP), progression, levels, recognition and tangible rewards are a primary ANEVUM growth and retention engine—not decorative gamification or a later optional sidebar.**

ANEVUM should feel alive, delightful and worth revisiting because participation matters: discover something good, actually try it, rate/review constructively, make something, share it, help another creator, earn legitimate recognition, and come back to see what is new. Every member can become part of the platform's creative history, not only software developers.

The level system is a public, lasting part of member identity and should become one of the platform's most memorable characteristics. Rewards are meaningful, earned, visible and transparent; ANEVUM's free core remains accessible without paying, meeting streak demands, or having a powerful computer.

## Product experience rules

1. **Everyone can meaningfully participate.** Browsing/trying published creations should work as a guest. Members can submit creations on equal basic terms, rate, review, save and contribute across games/apps/AI tools/media, subject to safety and moderation. Non-creators can also make progress through genuine discovery and useful feedback.
2. **One shared member XP identity.** The account's accumulated experience, level, current artifact, unlocked cosmetics and achievement history are consistent across the public site, profile, member library and creator dashboard. No separate "app-store points" and no staff-only XP.
3. **Quality over quantity.** XP is awarded for finite, verifiable events that help creators, audiences or the catalogue. No XP for endless scrolling, passive pageviews, raw app launches, artificial referrals, posting low-quality comments, or paying for rankings.
4. **Earned status lasts.** Permanent level/artifact history where applicable; moderated fraud and content removals can adjust points with recorded reasons/appeals. A normal day away should not remove earned status.
5. **Recognition is visual and social.** Distinctive progression artwork, member titles, profile trophies, contributor credits, milestones in activity feeds, tasteful celebrations, creator showcases and community spotlights become first-class UI.
6. **Real rewards are possible, not fictional promises.** Prioritize valuable low-cost benefits immediately (genuine contributor attribution, personalized profile cosmetics, curated showcase eligibility, editorial interviews, access to events and beta features). Physical merchandise, sponsored software credits, contest prizes, creator grants or cash awards only after budgets, eligibility, taxes, jurisdiction rules, fraud prevention and fulfillment are explicitly approved. Never guarantee financial redemption of XP.
7. **XP does not equal trust or authority.** High levels never automatically grant moderator/admin controls, moderation exemptions, verified ownership, ranking manipulation or preferential votes. Creator quality, verified identity, editorial awards and security trust have independent evidence.
8. **Not pay-to-win.** No bought XP, purchased voting influence, subscription-gated progression, slot-machine/randomized reward economy, punitive streaks or hidden boosts. Opt-in notifications and finite, healthy return cues only.
9. **Fair mobile-first participation.** Accessibility, reliable low-bandwidth views, creator submissions by phone, meaningful free tiers and parity for users without money, desktop hardware or extensive free time.
10. **Operational truth.** No fabricated leaderboards/XP/social activity. Every display derives from auditable server records. Public leaderboards must respect privacy/opt-out and anti-abuse review.

## Core loop (everyday player + creator)

Explore real work → Try/use it → Provide useful feedback or submit something → Get validated XP and visible progress → Earn a badge, level artifact or earned recognition → Discover new creators and events → Return because there is meaningful new content and visible community response.

The participation loop should improve the marketplace: high-quality feedback helps creators ship better work; more appealing creations attract more visitors; more participants help each other discover independent projects. **That is the business growth flywheel.**

## XP economy: carefully reviewed proposed earning matrix

Existing stage behavior must not silently change until each event's abuse tests and moderation/reversal semantics pass.

| Event | XP/reward posture | Required safeguards |
|---|---|---|
| First eligible rating on an approved third-party project | **Implemented in staging:** 2 XP per project, maximum 5 XP-awarded ratings/day (10 XP/day) | One rating per member/project, no self-votes, revisions earn zero extra XP, moderation reversal and appeals |
| Approved public submission | **P0 planned:** meaningful one-time XP after staff approval, not on creating a draft | Unique project, originality/provenance checks, no duplicate/repost farming, rollback on removal |
| Useful substantive review | **P0/P1 planned:** small XP only if review meets objective integrity criteria (not merely text length) | Verified member, one qualifying review per project, rate limits, no AI-generated review spam, moderation |
| Versioned useful project update | **P1 planned:** capped XP for legitimate independently reviewed releases | Source/release history, meaningful changes, cooldown, reject artificial version spam |
| Recognized collaborative contribution | **P1 planned:** credit + achievement, optional XP when verified by project maintainer/editor | Consent, provenance, duplicate/fraud controls, moderator appeal |
| Community event / creative jam participation | **P1 planned:** published event badges and judged creative rewards | Transparent entry rules, accessible participation, no pay-to-enter, independent judging |
| Passive browsing, likes-only, repeated clicks, purchases or mere daily login | **0 XP** | Prevent engagement farming |

The numerical values for new XP event types, scaling curve and moderation policy are **proposals requiring controlled tests**. Do not invent arbitrary rewards in the live order of development.

## Progression and recognition components

**At launch / P0**
- Common server-authoritative XP ledger and event taxonomy with idempotency, reversals, daily/category caps and moderator audit.
- Visible level / next level / milestone progress on profiles, member entry points, library and creator dashboard. Users should understand how XP was earned.
- Beginner-to-contributor onboarding milestones: first genuine review/rating, first saved collection/project, first approved publication, first creator feedback; celebration only when earned.
- A distinctive base set of illustrated artifacts/badges, with monochrome and reduced-motion accessibility alternatives.
- First launch day achievements and small showcases curated from actual community contributions—not automatic guaranteed promotional exposure based only on level.
- Legitimate member account lifecycle: XP export, account closure rules, fraud appeals, optional privacy controls for progress display.

**P1, as capacity permits**
- Full art direction for all 60 level artifacts, rare verified accomplishments, seasonal creative events, contributor spotlights and clear badge families.
- Optional opt-in public leaderboards segmented by participation category, not a universal prestige contest; creator quality independent of total XP.
- Profile shelves, cosmetics, display nameplate customization, project contribution credits, followed-creator achievement updates and editorial honors.
- Free creator challenges with transparent judging and non-monetary awards.

**P2, requiring explicit budgets and legal/policy review**
- Actual physical merchandise, sponsored service subscriptions/credits, partner discounts, small grants or funded prize pools; published eligibility, delivery/tax and geographic rules.
- Creator support/payments separate from XP/recognition so purchases never buy status or rank.

## Engineering baseline verified 2026-10-12

- Staging `creator-v1/auth/community.mjs`: a server-backed append-only XP event ledger, 1–60 level progression, quadratic level thresholds, one-off first-rating awards, daily cap and moderator XP reversals.
- Staging `creator-v1/auth/social.mjs`: six achievements derived from eligible ratings, approved published projects and releases. These are currently read-only achievements; not all categories pay XP.
- Project submission, votes, profiles, library, protected moderation and privacy are built in staging. Production remains a separate read-only catalogue without public member signup.
- The current sixty **names** are working placeholders. The collectible artwork, balance, reward entitlement/claim flow, project XP awards and full visual prominence **are not completed**.
- The official mark/color/typography decision is a **separate open owner-approval gate** and must not be changed by this business-strategy decision.

## Metrics that matter

- Eligible first-time visitors who *try* a real project and participate meaningfully.
- New member → first genuine feedback or approved submission.
- Weekly returning contributors and creators, cohort-adjusted instead of raw vanity DAU.
- % published creators receiving actionable feedback; number of fulfilled collaboration loops.
- XP-award reversals, fraud flags, false positives, appeals; differences in fairness across mobile/nontechnical members.
- Reward cost per healthy retained contributor, editorial showcase traffic, sponsor funding versus fulfillment costs.
- Survey measures of usefulness, belonging, creativity and satisfaction. Track overuse/complaints, not compulsive session length.

## Organizational decision rule

When prioritizing a new ANEVUM feature, ask: **Does it help members discover, create, participate, earn legitimate progress or receive recognition?** If yes, design its contribution to progression and abuse-safe reward handling early. If no, keep it optional. **Progression is a first-class platform layer, never a reason to redesign the core Newgrounds/Envato public experience.**

No automatic production deployment or monetary reward obligation is created by adopting this charter.
