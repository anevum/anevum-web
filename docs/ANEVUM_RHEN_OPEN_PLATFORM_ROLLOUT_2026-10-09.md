# ANEVUM.RHEN.PACKAGE.2026-10-09.002.OPEN-PLATFORM-OVERHAUL
## Delivery plan, QA matrix, economic gates and operational handoff

**Status:** PREPARED FOR REVIEW; NO RUNTIME DEPLOYMENT OR COMMERCIAL ACTIVATION.
**Primary responsibility:** ANEVUM Web for public/member/payments and experience; RHEN for paper/compute contracts.
**Inputs:** Product spec and technical architecture documents of this package.
**Current owners of adjacent work:** website member platform #210, owner identity #235, paper OAuth #237, Stripe #241 / PR #240, RHEN #462 / PR #463.

### 1. Canonical decisions

LOCKED for design:
- ANEVUM remains an independent maker's workshop, RHEN first product.
- Free education and basic access; free personal workspace and bounded paper-research path as capacity permits.
- Supporter contributions voluntary; cosmetics only, no credibility/trading advantages.
- Resource charges only where usage measurably justifies them, with an upfront consented limit and no debt.
- Research contribution and rights/consent are optional; contributor reputation is evidence-based.
- Founder company's live RHEN and broker remain exclusively private to the owner; maintain PUBLIC-PERFORMANCE-v1 projection.
- No LLM in any live order-write path; manual research strategy promotion.
- New member live brokerage, payments and publication require independent owner approvals and legal/commercial gates.

ACTIVE EXISTING WORK (do not restart):
- member and owner identity separation;
- sandbox Stripe billing and webhook acceptance;
- member paper execution kernel / future isolated shared compute;
- paper brokerage OAuth readiness.

FUTURE / NOT AUTHORIZED:
- annual/monthly supporter Stripe catalog;
- paid compute checkout and actual price list;
- user research publication/moderation scale;
- member live broker-write; expansion to options, shorts, leverage or crypto.

SUPERSEDED OR DEFERRED:
- RHEN Cloud as subscription-mandatory access;
- treating $2.99 founding and $4.99 introductory inactive prices as the official new supporter tiers;
- paid badges influencing research reputation or trading access;
- unbounded hosted bot promises;
- referral or loyalty mechanisms encouraging deposits, volume, or speculative returns.

### 2. Release slices and dependency map

**R0 — Package/reconciliation (NOW, documentation-only).**
Outputs: product spec, architecture, rollout plan, GitHub parent epic, linked work issues, explicit migration decision ledger. Verify no production flags, trading or Stripe catalog change. Existing work referenced rather than forked.

**R1 — Baseline/permission validation (prerequisite).**
Check current public member runtime against main config (because issue #210 historical status may be stale). Complete secure owner-vs-member separation, authenticated two-account session tests and strict API/stream authorization. Ensure RHEN private owner account inaccessible under crossed cookies. Complete sandbox Stripe existing checkout E2E even if earlier paid access plan is superseded, as a reusable payment system test; never enable production checkout. Separate RHEN kernel tests and market-data review.

**R2 — Free Learn public MVP (smallest releasable content).**
Public /products/rhen/learn, 2 complete lessons (market mechanics + risk math suggested), glossary, example calculations and real sources. Responsive accessible content with revision timestamps. No account or broker necessary. Add page to existing RHEN registry and nav only when real and deployed; otherwise status PLANNED. Test static linking and semantic headings. Avoid login wall.

**R3 — Learning persistence and personal onboarding.**
Versioned D1 member lesson progress, optional quiz explanation, own progress view in /apps/rhen/learn. Allow opt-out and export/delete; never make paid feature or badge depend on risk-taking. Complete two-account tests and migration verification first on preview, then independently authorized production.

**R4 — Private research workspace.**
Private versioned QUESTION/HYPOTHESIS/EXPERIMENT drafts with citations, method assumptions and privacy. Do not publish submissions yet. Add export and edit/revision. Later open editorial curated public catalog of staff-authored evidence. Do not pretend community exists before users.

**R5 — Free bounded RHEN paper pilot.**
Integrate isolated paper kernel with verified member identity, durable lease/idempotency, individual limits, accurate job state and data provenance. No owner broker credentials. Staging with two separate users and adversarial cases before invite-only free external beta. Production new-entry pause without stopping safe exits. Instrument CPU/RAM/network/storage/market-data and support cost by job/tenant. Paid compute OFF.

**R6 — Controlled moderated research collaboration.**
Invitation-only submissions, explicit rights and separate optional company-research consent. Moderator review/retraction/correction and public-safe revisions. Reputation based on reproducibility/quality, never supporter status or trading outcome. Launch public user content only with tested moderation availability; no open forums by default.

**R7 — Voluntary supporter pilot.**
Keep current Stripe inactive catalog untouched. Design and explicitly approve truthful supporter offerings and terms (example $12/year or one-time $3/$5/$10). Add separate consumer supporter billing domain and account preferences with clear optional choice. Test in sandbox with two authenticated members, successful and failed checkout, webhook replay/reconciliation, cancellation, refund, deletion, and cross-user denial. Production sales OFF until regulatory, tax, privacy, fee, and manual commercial approval. Supporter grants only cosmetics.

**R8 — Measured compute passes, if demand exists.**
After meaningful R5 sample, establish free usage windows, marginal job cost and fair global capacity. Propose concrete nontransferable, time-bounded compute allowance. Product, tax, refund and billing review before offering. Purchase neither rewards trade activity nor unlocks broker orders. Final product codes/prices decided only from cost and demand evidence.

**R9 — Separate optional brokerage live pilot, not part of this overhaul release.**
Only after Alpaca commercial and live permission, investment-adviser/financial regulatory review, licensed data rights, security and safe failure plan, explicit member risk consent, and owner authorization. Keep independent technical and commercial PR. Reconcile all active positions, token revocation and incident handling. Never assume a $1 supporter charge covers trade execution obligations.

### 3. Proposed feature flag matrix

Default false until independently gated deployment:
- RHEN_LEARN_PROGRESS_ENABLED (R3)
- RHEN_RESEARCH_PRIVATE_DRAFTS_ENABLED (R4)
- RHEN_MEMBER_PAPER_ADMISSION_ENABLED (R5)
- RHEN_RESEARCH_PUBLIC_SUBMISSIONS_ENABLED (R6)
- RHEN_SUPPORTER_CHECKOUT_ENABLED (R7)
- RHEN_COMPUTE_PAID_ENABLED (R8)
- RHEN_MEMBER_LIVE_EXECUTION_ENABLED (R9; never implied by other flags).

Public R2 content can be deployed without auth/billing activation. Feature names subject to implementation convention; do not insert config-only placebo toggles. Every gate must cover both frontend AND backend authorization, and have negative tests.

R7 must not toggle existing ANEVUM_RHEN_BILLING_CHECKOUT_ENABLED in production as a substitute for specific supporter review. R9 cannot inherit existing owner LIVE_TRADING variables.

### 4. Feature-to-test acceptance matrix

| Slice | Pass conditions | Block on |
|---|---|---|
| R1 member baseline | Two real independent logins; crossed Access + member cookie denies owner API, streams and terminal links; export/delete verified | Missing immutable owner binding, issue #210 drift unresolved |
| R1 Stripe sandbox | Signed webhooks, two-user customer isolation, cancellation/refund and delayed-event reconciliation; test-only | Key exposure/unrotated keys, provider prices mismatched, wrong D1 |
| R2 public learning | 2 complete sourced lessons; no fake data; keyboard/mobile/accessibility and SEO checks | Placeholder lessons, risk claims, missing sources |
| R3 progress | user A cannot read or mutate user B; versioned quiz/progress, export/delete | Member-submitted user IDs, unreviewed D1 migration |
| R4 private research | private by default; draft versioning; rights/export/delete | public accidental visibility, trading secrets in content |
| R5 paper pilot | two-member isolation, 0 owner data access, no broker writes, idempotent restarts, correct residual position handling, quota race test | duplicate orders, unbounded memory, stale feed treated as real time |
| R6 submissions | review-before-publish, consent versions, redaction, reporting/appeals and retraction | no available moderator, missing rights/license |
| R7 supporters | cosmetics only, Stripe webhook authoritative, idempotent grants, portal cancellation and no orphan billing | tier grants trading/compute rights, missing terms/approval |
| R8 compute | accurate measured units, atomic quotas, cost covers incremental expense, no surprise charge | unlimited/free-cost assumptions or auto-charge |
| R9 live | separate explicit owner release, Alpaca/legal authorization, broker and isolation sign-off | any unresolved compliance/security/exit risk |

Additional universal negative cases: injected workspace and user IDs, stale session, replay/reordered webhook, wrong Stripe mode, unknown price, payment failure, concurrent quota exhaust, worker crash during position, quota expiration with open paper position, account deletion with queued jobs, revoked research license, moderation IDOR, malformed input, market-feed delay and absent broker grant. Paper and live account balances should NEVER be conflated.

### 5. Concrete build tasks by codebase

**ANEVUM Web:**
- establish a single truth registry for app feature availability with LIVE/BETA/PLANNED and authoritative server capability checks;
- public lesson content and route, accessible pages and up-to-date references;
- additive learning progress D1 migration, scoped API and member UI;
- private research draft schema/API with immutable revisions;
- protected moderation and sanitized public projection when approved;
- support profile choices and separate supporter contract after consent/cost work;
- member usage readout and capacity adapter to RHEN jobs, without custom wallet or funding features;
- update support/privacy/terms only after appropriate review, preserve existing marks/visual system;
- link current #210/#235/#237/#241 instead of recreating identity, OAuth, and Stripe scaffolding.

**RHEN:**
- finish #462/#463 member paper foundation without touching owner supervisor or volume;
- define shared immutable signal version, tenant-specific risk config and stateless paper worker boundary;
- bounded job admission, idempotent event/journal, safe stop/reconcile semantics, recovery and real resource metrics;
- replays and scenario experiments: cost assumptions, out-of-sample/holdout provenance and no auto-promotion;
- published research summaries use approved public-safe aggregate or consciously consented reviewed artifacts only.

### 6. Capacity and contribution economics gate

Current one-owner Railway metrics are NOT proof of free scale. Instrument active vs dormant users and per-tenant incremental costs. Separate fixed baseline cost from incremental recurring user cost and support time. Compute cost model at 10, 50, 100 and 500 accounts with realistic active-user fractions (5%, 20%, 50%) and concurrency P95. Test burst and market-open volume. Require a policy to queue/reject with transparency when free capacity is saturated.

Illustrative Stripe card math (confirm live merchant schedule and taxes before final): $1 monthly, standard 2.9% + $0.30 plus 0.7% Billing => ~$0.664 net before hosting/support. $12/year => ~$11.268/year net before hosting/support, roughly $0.939/month equivalent. Fixed per-transaction card fees favor annual/one-time support; support conversion is voluntary and not a scaling guarantee. Full margin calculation must include failed payments, chargebacks, refunds, tax, data licenses and customer-support cost. **No statement that every payment is pure profit.**

Decision threshold to create any paid compute SKU: demonstrable user value, at least several independent users who exhaust fair-use without abuse, measured P95 per-job cost, clear cost-recovering price, detailed quotas, understandable cancellation/refund and no regulatory confusion with paid trade advice. One-off support does not finance unbounded perpetual hosted workload.

### 7. Public product language and disclosures

Approved direction, not final legal copy:

RHEN: "Learn the markets. Test ideas. Understand the results." "Free lessons and research tools. Personal paper experiments when capacity is available. Optional support helps fund independent development."

Learn: "Practice does not require investing real money. Hypothetical, historical and paper outcomes do not predict future performance."

Support: "Support ANEVUM's independent development. Completely optional. Support does not buy trading advantage or access to private strategies. Not a charitable donation."

Compute: "See exactly how much research capacity is available and what additional capacity costs before you purchase. Limits stop new jobs; existing work is completed or safely drained according to the published policy."

No marketing claim that member activity or brokerage orders themselves produce revenue for ANEVUM. No guaranteed income, outrageous lifestyle promotions or unverified aggregate performance.

### 8. Staging and release playbook

For every slice:
1. Inspect current main, open PRs and latest migrations; document actual current production state (do not trust older status docs).
2. Isolate branch, feature gate default OFF, production D1 not targeted during preview testing.
3. Add code and negative tests; verify type/build, member auth, privacy/public-safe evidence, data retention, source timestamps and owner terminal protections.
4. Apply only additive preview migration with verified D1 UUID. Inspect row/FK integrity and test independent A/B users.
5. Run staging behavior with feature gate ON only for allowlisted test users. Never alter owner live broker path.
6. Document rollback and clear conditions for pausing admission, restoring prior code, and draining existing jobs. Payment rollback must explicitly handle subscriptions, never orphan billing by flipping checkout flag.
7. Owner independently reviews security/privacy/launch copy and gives authorization for new public accounts, public UGC or money collection as applicable.
8. Merge/deploy through existing guarded CI. Verify real URLs/functions after release; update registry based on actual availability, not intent.

### 9. Stop-the-line conditions

Immediately halt rollout on any cross-account or owner data leakage; wrong Stripe/customer grant; billing with no cancellation route; duplicate paper orders after retry; simulation presented as actual brokerage execution; excessive unbounded resource use; inability to safely drain positions; public unreviewed user research; prohibited market-data redistribution; or material regulatory uncertainty about the proposed commercial offering.

For billing: stop NEW checkout but retain customer portal, webhook updates, reconciler and provider cancellation. For paper: stop NEW admission/entries, preserve safe exits and reconciliation. For company trading: no changes from this package.

### 10. What counts as completed

The PACKAGE is complete when approved direction is consolidated in tracked versioned docs, issues link every slice, a draft PR exposes the review diff, and no production trading/billing/config changed. Implementation is complete only after R2-R8 criteria appropriate to each approved release; a document, route placeholder or inactive Stripe product is not a launched service.

**Open owner decisions:** supporter actual SKUs/prices, public-facing terms/privacy and data consent, new billing launch, moderation policy, and any brokerage live approval. All remain later sign-off gates, not implicit permission.
