# ANEVUM IREN Observatory — V105 Growth Intelligence

Session: `ANEVUM.IREN.BUILD.2026-10-23.001.OBSERVATORY-GROWTH-INTELLIGENCE`  
Tracking: [Observatory #683](https://github.com/anevum/anevum-web/issues/683), canonical [board #325](https://github.com/anevum/anevum-web/issues/325)  
Release base: `release/v084-continuance-approved-20261019`  
Delivery state: **source-only, isolated candidate; NOT production deployment**

## Product goal

The Observatory is ANEVUM's first-party business intelligence command center. It should answer: who discovers ANEVUM, which channels lead to meaningful participation, what makes people return, how creators and their releases fare, and whether ANEVUM is becoming financially sustainable. Decorative volume charts are not success. Every metric needs a dependable meaning and a decision it enables.

## V105 implementation scope (source built)

- Add `creator-v1/operations/anevum-iren-staff-observatory-v105.mjs` as **isolated successor** that imports the V104 Worker and delegates existing routes unchanged.
- Existing /staff/observatory gains a Growth link on desktop and mobile. New protected pages: `/staff/observatory/growth`, `/styles.css`, `/app.js`, and read-only `/api`.
- Reuse the V104 authenticated staff overview gate; reviewer/owner aggregate access only. Existing member email, recognition/aura modification, moderation, and staff-access privileges remain unchanged. New responses expose only aggregate counts and day buckets.
- Eight database-backed KPI cards: rolling seven-day new accounts, rolling thirty-day new accounts, verified accounts, verification share of stored accounts, total registered accounts, creator profile records, published projects, and pending project records.
- Compare registration counts for the last rolling seven days against the preceding rolling seven days; when prior baseline is zero, rate is undefined rather than an infinite/false percent.
- Display 30 UTC **calendar dates** with zero-filled days and exact-values table; explicitly distinguish this series from the rolling thirty-day KPI.
- Display cumulative project saves/votes/comments and forum/wall record totals with clearly qualified labels.
- Explicitly mark visitors/UTM attribution, traffic-to-signup conversion, activation/retention, active creator engagement and collected revenue/ROI as **NOT CONNECTED**, not zero.
- Add an interactive staff-side **Campaign Link Laboratory**: generate canonical ANEVUM homepage, join and Discover links with validated source, medium, campaign and optional content UTM labels; copy link with manual fallback. It makes **no event capture, API calls or storage writes** and openly states that attribution reporting is not connected.
- Preserve staff no-store, CSP, noindex, noframe headers; restricted methods; fail-closed invalid sessions, DB outages and invalid numeric aggregates. No XP test display or grants.
- Run isolated fixture tests and Chromium screenshot QA (1440/390/320 and owner/reviewer/error). Synthetic fixture counts live **only in tests**.
- **No existing V104 or frozen V092 source modification**, migration, event collection or production settings change.

### Truth contract and denominators

| Metric | Definitive current source | Definition / qualification |
|---|---|---|
| Registered accounts | `"user"` | Cumulative persisted accounts, potentially including test accounts until tagged |
| Verified accounts | `"user".emailVerified` | Current saved email verification state |
| Verified share | Verified / registered | Snapshot composition, **not** completed onboarding conversion rate |
| Registrations / 7d, 30d | `"user".createdAt` | UTC rolling 7×24h and 30×24h windows |
| Previous seven days | `"user".createdAt` | UTC rolling window from -14 days inclusive to -7 days exclusive |
| Registration bars | `"user".createdAt` | 30 UTC calendar dates inclusive of today, zeros filled in UI |
| Creator profiles | `member_creator_profiles` | Stored profiles, **not** active creators |
| Published and pending projects | `anevum_alpha_projects.status` | Stored status inventory, not engagement or sales |
| Saves, votes, comments and posts | Existing creation/community tables | Total records, not deduplicated people, retention, or unique visitors |

Counts are exact for the queried database snapshot provided queries complete. They are **not** exact counts of human visitors and cannot be labeled organic while test-account exclusion remains unimplemented. The API exposes its source and snapshot timestamp. The application must never fill unavailable live data using fixture values or persisted client caches.

### North-star measurement once events are available

**Weekly Meaningful Participants (WMP):** unique verified non-test member identities completing ≥1 qualifying, server-confirmed meaningful action in a rolling seven-day period. Proposed qualifying actions: completed creator play with actual completion eligibility, project save, substantive community contribution, project publish, or approved creator participation. Passive pageviews, login/session creation, repeated XP tests, and autoplay never qualify. Before implementation, document exact event eligibility, identity persistence and anti-spam policy.

### Acquisition and market intelligence

- Browser visitors by day, landing page, device and region (coarse, privacy-preserving), separately from HTTP requests and WAF bot analytics.
- UTM source/medium/campaign/content/term with allowlisted lengths and reserved internal campaigns; preserve first-touch and last-touch with clear expiration. Referral/share codes separate from user-identifying URLs.
- Verified funnel: landing view → signup started → account created → email verified → first meaningful action → return participation.
- Campaign ledger: platform, placement, creative asset, cost, tracking URL, impressions where reliable, attributed member activations, manually reviewed ROI. Never infer attribution from direct traffic.
- Marketing snapshots with source and measurement confidence for truthful public claims; export aggregated, anonymized figures only.

### Retention and network effects

- D1/D7/D30 cohort return ratios **by meaningful action**, with denominator defined as activated cohort on UTC signup/activation day and numerator as return on the specified UTC day; retention horizon and timezone disclosed.
- New/returning/resurrected meaningful participants; time-to-first-value; invitations and accepted creator collaborations.
- Discovery → project open → valid play start → valid completion → save/comment/follow → creator return funnel.
- Creator lifecycle: studio opened, first draft, first preview, project submitted, approved, published, actively visited, repeat publish. Creator achievements are verified awards only, not proxy for successful creations.
- Community quality: helpful replies and authentic participation, reports per 1,000 eligible actions, review latency, false-positive moderation, reward-abuse signals.

### Revenue and sustainable operations

- Revenue only from verified provider settlement or a reconciled internal order ledger; distinguish gross charge, fees, refunds, disputes, taxes, net collected fees and recognized revenue.
- By tier/product/source: paid conversion, contribution margin, retention, churn and support cost. For ANEVUM Sites, keep client-business revenue/accounting separate from consumer entertainment statistics.
- CAC = eligible campaign spend / *new attributed customers* over a declared period; use no denominator until attribution and paid-customer definitions are consistent.
- Infrastructure unit economics: Workers/D1/Stream/R2/AI request cost per meaningful participant, projected consumption and budget alerts. Do not confuse tokens or request counts with invoiced costs.

### Source-implemented V1 event governance — NOT ACTIVATED

`creator-v1/analytics/growth-events-v1.mjs` now contains a strict, versioned schema for 24 named first-party product events across acquisition, identity, discovery, engagement, creator work, experiments, revenue and moderation. It is a **pure validation/definition library**, not an ingest service or new telemetry provider; CI covers its privacy and authority boundaries in `creator-v1/test/growth-events-v1.test.mjs`.

- Client-observed intent events may be validated but cannot claim server-only `account_created`, `email_verified`, `project_play_completed_verified`, `project_saved`, `project_published`, `creator_achievement_issued`, `payment_settled`, or `payment_refunded`.
- Unknown event names, unknown top-level attributes, unapproved dimension keys, client-supplied account/role/test/consent identifiers, raw URLs, emails, message text, malformed timestamps and oversized identifiers are rejected rather than stored.
- WMP eligibility requires an authoritative server event; merely `community_reply_published` or `community_post_published` is **not** enough. Only a separate `community_contribution_qualified` event may certify a valuable community contribution after moderation/anti-abuse checks. No XP or creator rewards are granted by this module.
- A real collector must additionally enforce consent, signatures/authenticated identity, event-id deduplication, clock skew bounds, bot/test suppression, retention, access audit and reconciled aggregation. None of those server-side operations is activated here.

### Verified Cloudflare observability availability (provider read-only discovery)

The Cloudflare Web Analytics site for `anevum.com` is enabled with automatic installation. Authenticated read-only GraphQL discovery confirmed historical `rumPageloadEventsAdaptiveGroups` data grouped by UTC date. This establishes a practical candidate source for browser-beacon **visits/page loads**, not a presently valid unique-person count or ANEVUM member funnel. The provider may sample reported datasets; much of the historical period overlaps site development and synthetic/owner traffic. **Do not treat this finding as a production dashboard integration or as proof of organic growth.**

A future Cloudflare RUM adapter must use a distinct least-privilege analytics-read credential, server-only account/site identifiers, bounded grouped GraphQL reads, confidence/sample metadata where available, safe error handling, rate-limit backoff, and aggregate-only reviewer projections. Cloudflare introspection/query read budget was exhausted during discovery; no additional reads were attempted after that provider limit. No API token or private ID should enter the repository. Browser visits must remain separate from registered accounts and action-based participation.

### V106 Continuance NEXT design and optional browser analytics adapter — SOURCE ONLY

The V106 protected Worker imports V105, which imports V104. It decorates both staff pages with the selected Orbital Underground/NEXT theme and authentic OrbitalMark SVG geometry. Staff access, owner-only fields, legacy APIs and production bindings are preserved. CSS/JS/theme endpoints reuse the original staff grant check. Registrations can be viewed across **7, 14 and 30 UTC calendar dates**, and exported as verified-source read-only CSVs.

**Cloudflare Web Analytics implementation:** `creator-v1/analytics/cloudflare-rum-observatory-v106.mjs` defines a bounded thirty-day server-only GraphQL aggregate reader. `creator-v1/operations/anevum-observatory-rum-v106-assets.mjs` adds a dedicated browser-signal UI. V106 exposes protected `/staff/observatory/rum/api`, `/rum.js`, and `/rum.css`. No GraphQL read is attempted unless *all* three private Worker bindings are present and validated:

- `ANEVUM_RUM_ACCOUNT_TAG` — private account tag, never included in HTML/JSON.
- `ANEVUM_RUM_SITE_TAG` — private Web Analytics site tag; validated before query.
- `ANEVUM_RUM_READ_TOKEN` — least-privilege analytics read token, set as a Worker secret only after independent approval.

Without these bindings, the dashboard says **NOT CONNECTED** and returns no numeric visit estimates. The reader makes one bounded read-only GraphQL POST with timeout, checks site/account/time window, response shape and exact UTC day integrity. A failed upstream request returns a generic 503 without revealing token, upstream messages or IDs. No raw visitor events, individual identities, full URLs, session identifiers, IP addresses, advertising identifiers or user profiles are queried or stored.

When credentials become available after separate review, the dashboard may show only **estimated 30-day browser beacon visits and page-load events**, with clear Cloudflare sampling/aggregation cautions. These are not unique people and cannot be divided into saved ANEVUM account counts as a signup conversion rate. Provider data may include owner/test/bot traffic until a reliable exclusion policy exists; daily zeros mean zero provider-reported samples on dates within an otherwise valid response, never that real human traffic was absent.

**Release boundary:** New code is currently source-only and not wired to an active production Worker. Do not install the bindings, touch runtime routing or claim live metrics until exact-head CI, owner/reviewer access QA, bounded Web Analytics query verification and explicit telemetry privacy review are complete. See [Cloudflare Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/) regarding sampling and retention.

### Technical instrumentation blueprint — NOT ACTIVATED

1. **Browser Web Analytics:** evaluate scoped Cloudflare Web Analytics GraphQL reads for pageviews/visitor estimates, sampling indicators and available history. Browser beacons are not server-confirmed activity; show sampling or estimate metadata. Never use edge requests as unique visitors.
2. **First-party event capture:** one versioned `analytics_event_v1` schema, event UUID for deduplication, UTC timestamp, first-party anonymous session key, member pseudonym only after verified authentication, event/source/version/consent/test/bot flags, and a compact allowlisted dimension map.
3. **Trusted server actions:** grant authoritative events only after real database writes/transactions succeed; suppress untrusted client claims for publish, payments, recognition, subscriptions and moderation outcomes.
4. **Pipeline:** Cloudflare Workers ingestion with rate/size guards and bounded Queues; Analytics Engine for high-volume aggregate trends if suitable; governed D1 aggregates or another fit-for-purpose store for reproducible authenticated long-term cohorts. Select one canonical cohort store after reliability/retention evaluation.
5. **Privacy:** no email, names, message bodies, sensitive profile data, IP-derived tracking identifiers, raw full URLs, access tokens or creator-private content in event analytics. Consent/opt-out policy, data minimization, deletion propagation, retention period and visible data-provenance required before browser collection.
6. **Governance:** event schema registry with owner, meaning, eligibility conditions, version, sample rate, test exclusions, privacy class and backfill policy; version changes cannot silently rewrite the denominator of existing reports.
7. **Security:** separate ingest and admin credentials/bindings, server-side access filtering, anti-bot and dedup controls, bounded query windows, role-based workspace restrictions and audit logs. Do not offer member-level browsing to reviewer roles.

### Data-quality state machine

- `verified`: definition and source confirmed, fresh and complete for requested window.
- `estimated`: sampled/inferred/bounded result, visually marked with coverage and limitation.
- `unavailable`: not instrumented, unauthorized, source outage, invalid data or insufficient quality. Display `—`/explicit unavailable, never `0`.
- `stale`: previous snapshot shown **only if plainly labeled**, with last update and retry. V105 currently fails closed and does not use cached snapshots.

Each future tile must include a definition, numerator, denominator, time zone, window, source, scope/test filtering, freshness and a route to its breakdown.

### IREN guided intelligence (future, bounded)

- Growth anomaly: "Registration volume changed by X vs prior rolling seven days"; don't imply causality.
- Funnel diagnosis: identify which verified transition changed when event definitions match.
- Owner-controlled milestone export: verified wording and reproducible numbers for social posts; private counts and member identities never exported.
- Opportunity feed: source channel/creative segments with enough sample and explicit uncertainty; no automatic posting or spending.

### Implementation gates

1. CI: parse both Workers, run V105 and preserved V104 regression; cross-role auth, read-only SQL, unexpected routes/methods, error states and no synthetic production values.
2. Browser: exact candidate 1440/390/320, owner and reviewer, reduced-motion/keyboard, no horizontal overflow, disconnected source and honest values; artifacts labeled synthetic.
3. No production activation until exact-head build/review, real founder/reviewer sessions, actual D1 schema QA, bindings/inactive Worker, and separately approved rollout. V131 #655 rollback versions stay retained.
4. Later: separately approve event capture, data retention/policies, D1 migrations, Cloudflare analytics credentials and revenue data integrations. Creator Studio #658, Discover #667 and Commons #679 remain independently gated.

## Dependencies and evidence

- [Existing Observatory V104](https://github.com/anevum/anevum-web/blob/release/v084-continuance-approved-20261019/creator-v1/operations/anevum-iren-staff-observatory-v104.mjs)
- [V104 maintenance PR #614](https://github.com/anevum/anevum-web/pull/614)
- [V131 accepted production #655](https://github.com/anevum/anevum-web/issues/655)
- [Cloudflare Web Analytics FAQ — sampling](https://developers.cloudflare.com/web-analytics/faq/)
- [Cloudflare Workers Analytics Engine SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/)
- [Cloudflare SQL API beta (October 2, 2026)](https://developers.cloudflare.com/analytics/sql-api/)
