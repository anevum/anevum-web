# ANEVUM Creator V1 - build and acceptance checklist

Session: `ANEVUM.WEB.BUILD.2026-10-12.002.CREATOR-PLATFORM-EXECUTION`
Prepared: October 12, 2026. Public opening target: January 1, 2027.

This is an execution view of [engineering board #325](https://github.com/anevum/anevum-web/issues/325), not a second backlog. [#308](https://github.com/anevum/anevum-web/issues/308) owns dates; [#344](https://github.com/anevum/anevum-web/issues/344) owns the locked product doctrine. Keep the existing #328-#333, #335 and #337 issue owners.

## Current continuation checkpoint — October 13, 2026

Session: `ANEVUM.WEB.BUILD.2026-10-13.009.CREATOR-SUBMISSION-READINESS`.

The working visual baseline is the owner-accepted **Dimensional Underground** React frontend, staged at `next.anevum.com/creator/` from `5a16dad48491035ba9397ddb97bb84b65d562dd4` ([deployment workflow 38373612921](https://github.com/anevum/anevum-web/actions/runs/38373612921)). This is recorded deployment evidence from #325, not a fresh provider query. No fixed bottom mobile dock; keep the header navigation and original orbital mark. Optional artwork PR #350 is deferred.

Build 008 / [draft PR #351](https://github.com/anevum/anevum-web/pull/351) added member profile editing and first-time creator setup at `a64c262bf97e650240f736333ac8cd62ff310ed8`; its exact-source CI passed. Build 009 continues directly from that source with saved-revision submission protection, an advisory readiness checklist and a private project passport preview. These draft-source changes have not been merged or deployed; public production stays read-only. The earlier source/status section below is a historical Build 002 checkpoint, not the latest React review head.

Levels have no product cap; the first 60 artifacts form Series One. The current curve remains `20*(level-1)^2` until accessible pacing is simulated and separately approved. Earlier fixed-60-level wording is superseded; no new XP award or rate is enabled here.

Still next: complete real invited member A → separately authenticated staff → anonymous guest → independent member B acceptance with a rights-cleared, genuinely hosted project. Evergrove and The Fold remain separate development projects; unfinished games and synthetic fixtures must not be published to fill the catalogue. Production go/no-go, identity/security and recovery acceptance remain open.

## Source and status correction

The current integration source is `production/creator-v1`, confirmed at `1ccaf67dac52eaa2e801f69222b289fd3d7a9631` after merged [Build 001 / PR #343](https://github.com/anevum/anevum-web/pull/343). The older `build/anevum-v1-newyear-overhaul-20261011` remains a historical/pre-production branch; do not repeat its missing UI work over the newer baseline. Archive `archive/pre-production-20261012` preserves checkpoint `e34faf8ad72d319e469eface8aec7fe26741951f`. Nothing was deleted.

A source branch named production is NOT evidence that its code is deployed. Build 001 CI passed at [run 38311049179](https://github.com/anevum/anevum-web/actions/runs/38311049179). No deployment is authorized by this checklist or Build 002. Public production is recorded as read-only; public accounts/publishing/voting remain closed. The last recorded project-count audit in #325 is not a fresh database read.

Use separate states: planned, implemented in source, tests passed, staging deployed, accepted with real users, live. A staged prototype or synthetic test does not complete a launch requirement.

## Preserved baseline - do not rebuild

- [x] Product identity: a public discovery and participation home for independently made games, apps, AI experiences, open-source work and digital experiments. AI is optional; ordinary visitors matter as much as developers.
- [x] Selected 01 ORBIT direction and the cinematic page composition/navigation are retained. Final optical, typography and device acceptance is still open under #335.
- [x] Public catalogue, source/demo separation, real-data visibility, search/category filtering, creator discovery and portfolios exist in source.
- [x] Build 001 retains filters and scroll/return paths, connects projects to creators, discloses external destinations, and fixes skip-to-content routing.
- [x] Existing staging code for invited email identity/profiles, member drafts, staff review, ratings/XP, achievements, saves, export, deletion requests and session revocation is retained. This does not certify production readiness, deletion fulfillment or all planned social features.

## 1. NOW - one genuine creator-to-community journey (#325, #328, #329, #330)

- [ ] Record exact staging build, migrations, provider readiness and unresolved auth/security findings before the test. Do not expand invites to work around unresolved security concerns.
- [ ] Prepare the owner-selected Evergrove / The Adventure Book showcase separately from private family data. Review its actual hosted demo, source/license, media rights, AI/human contribution, access cost and phone compatibility. Selection is not publication approval.
- [ ] Real invited member A signs in from a delivered email, creates/owns a profile and creates, edits and submits a private draft.
- [ ] Separately authenticated staff requests changes, reviews the corrected version and approves publication with an audit reason.
- [ ] An anonymous visitor finds only the approved project, sees correct attribution/disclosures and opens the genuine external experience.
- [ ] Independent member B performs the implemented rating/save actions; finish missing written-review/follow behavior under its existing owner issue rather than claim it exists. Verify persisted history after refresh/sign-out.
- [ ] Check self-rating, duplicate rewards, account switching, private drafts and staff/member isolation. Hide/restore moderation must reverse/restore eligible progress correctly.
- [ ] Attach real browser/provider evidence, defects and unresolved blockers. Synthetic fixtures must never seed the public catalogue.

Exit: one reproducible authentic accepted journey, not merely a unit-test count. This remains the active functional slice; security work runs alongside it.

## 2. Identity and account lifecycle (#328, #332)

- [ ] Resolve independent review/hardening or reviewed replacement of the staged identity prototype.
- [ ] Accept email sign-in and recovery; finish/verify prioritized GitHub and Google methods, callbacks and safe account linking.
- [ ] Verify session expiry, revocation, CSRF/origin controls, throttles, enumeration resistance and independent account isolation on real services.
- [ ] Complete deletion fulfillment and retention, not only the existing deletion-request UI. Verify exports and recovery do not expose another account.
- [ ] Resolve the recorded sending-credential concern through the approved operations process before widening access; no secret values in artifacts.
- [ ] Approve age eligibility, privacy and terms before public registration. Broad public appeal is not authorization for unrestricted child accounts.

## 3. Creator publishing and moderation (#329)

- [ ] Finish/accept project creation, edit, submission, requested changes, publication, updates/changelogs, withdrawal/archive and ownership checks.
- [ ] Complete the project passport: separate demo/source/docs links, rights/license, AI and human contribution, costs/external accounts, device support, status and versions.
- [ ] Accept safe media handling and actual project screenshots, without invented content or unapproved mirroring.
- [ ] Finish reports, review queue, takedown, appeals and durable audit reasons. Staff permissions remain separate from XP and creator dashboards.
- [ ] Validate externally hosted project failures honestly; a source-only entry must never acquire an invented playable destination.

## 4. Discovery and creator channels (#331, #335)

- [ ] Review Home, Explore, project pages and creator portfolios with genuine content, including empty, loading, unavailable and hidden states.
- [ ] Reconcile the existing category vocabulary with the locked product families using an explicit source/schema plan. Do not silently add filters the API cannot support.
- [ ] Finish verified free/browser/mobile/source/AI facets only when stored data supports them; public repository visibility does not prove an open license.
- [ ] Accept search, filtering, pagination, creator attribution and return navigation on real desktop/phone browsers.
- [ ] Add honest editorial selections and fair newcomer exposure; no fake trending, ratings, counts, plays or followers.

## 5. Member participation, library and return visits (#330, #331)

- [ ] Accept member-owned saves/library; finish and verify follows, written reviews, creator responses and useful project updates within agreed scope.
- [ ] Prove one active rating per eligible member/project, no self-votes or duplicated reward on edits, and transparent small-sample counts.
- [ ] Provide moderated project discussion/feedback with report and appeal routes before general discussion access.
- [ ] Keep communications opt-in and useful. No forced daily check-in, public DMs or full chat-platform rebuild is required.

## 6. XP, levels and achievements (#337, #330)

- [ ] Simulate accessible progression for occasional phone users, explorers, reviewers and creators. Current staging rates/curve are not final.
- [ ] Simulate and approve an accessible curve with unlimited levels and the first 60 Series One artifacts, plus any proposed contribution awards; do not silently activate coefficients or XP values.
- [ ] Implement/verify auditable, deduplicated meaningful contribution awards, limits, concurrent writes, reversals and appeals.
- [ ] Show consistent level/progress, earn history and a polished starter achievement set in account, library and profile surfaces.
- [ ] Preserve no bought XP, no ranking/vote power from payment, no staff authority from levels and no promised cash redemption.

## 7. Visual, accessibility and operational acceptance (#335, #332)

- [ ] Complete 01 ORBIT small-size/mono/inverse fidelity and wordmark review without reopening the overall identity or replacing the cinematic shell.
- [ ] Check all relevant pages at 320/390/1024/1440, keyboard/focus, touch targets, contrast, reduced motion and failure/loading states.
- [ ] Independently test auth/authorization, private data, malicious inputs, link/media abuse, email delivery and signed staff boundaries.
- [ ] Perform actual Creator V1 backup and isolated restoration, then rollback and incident drills. A legacy V5 restore or source archive is not V1 account/project recovery proof.
- [ ] Verify monitoring, errors, bounded costs, support/moderation coverage and truthful event names. An outbound Try click is not proof of external app use.

## 8. Launch content and release (#308, #333)

- [ ] Assemble a small genuine, rights-cleared catalogue and real useful feedback rather than creating filler applications.
- [ ] Complete onboarding/help, privacy/terms, reporting and support. Keep all public claims aligned with tested capabilities.
- [ ] Retain November 30 feature freeze, December 20 release-candidate target, December 26 rehearsal and December 27 owner go/no-go from #308. Do not move dates or calendar events through this document.
- [ ] Owner approves exact commit, migrations, access expansion and rollback before production promotion. Observe the release before the January 1, 2027 opening.

## Build 002 - bounded implementation in this change

- [x] Make a valid demo the primary Play/Try action; make View source primary only when no valid demo exists.
- [x] Keep unsafe URLs rejected, destination-host and new-tab labels intact, and missing/source-only states explicit.
- [x] Include AI experiences and open-source creations in homepage/metadata without imposing AI as a membership or publishing requirement.
- [x] Add eight regression cases to the existing client tests. Local focused suite: 36 passed, zero failures.
- [x] Check 16 offline inline-fixture render states across 320/390/1024/1440; zero page errors and no horizontal overflow in those cases. This is not hosted-network, CSP, real-device or authenticated acceptance.
- [ ] Verify full exact-head GitHub CI before merge. The full local npm suite exceeded its execution window; do not describe it as passed.
- [ ] Complete hosted preview and real-service acceptance before any live release.

No source acceptance checkbox above grants a production capability. Build 002 changes no auth, database, routes, roles, XP rates, provider configuration, live deployment or legal policy.

## Explicitly later

Expanded profile animation/customization, large collectible sets, richer collections and first jam are conditional after the core is sound. Third-party app hosting/execution, custom app subdomains, paid marketplace/payouts, commissions, full messaging/Discord replacement, AI app-building agents and public RHEN/BYOB are not January launch dependencies. Avoid new platform migrations, side projects or a second roadmap.
