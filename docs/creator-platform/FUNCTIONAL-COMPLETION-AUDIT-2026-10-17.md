# ANEVUM Creator V1 — Functional Completion Audit
**Session:** `ANEVUM.WEB.AUDIT.2026-10-17.001.FUNCTIONAL-COMPLETION`  
**Audit:** 2026-10-17 (read-only live site, Cloudflare zone/Worker configuration, canonical D1 table/counts, and GitHub source).  
**Owner tracker:** #480, subordinate to engineering board #325 and launch operations #308.  
**Canonical public origin:** `https://anevum.com`; `a.anevum.com` currently routes to the retirement Worker. Do not use older staging-origin assumptions.

## Acceptance vocabulary
- **VERIFIED LIVE READ:** public production route or provider state observed; no authenticated mutation implied.
- **SOURCE ONLY:** exists in a development branch but not accepted as deployed.
- **PARTIAL:** visible or implemented but not a complete user journey.
- **GATED:** deliberately disabled pending acceptance.
- **BROKEN:** observed route, endpoint, or messaging mismatch.
- **UNVERIFIED:** no independent, genuine user acceptance evidence. Never convert a source test into a live claim.

## Exact public snapshot
- Apex Workers route: `anevum.com/*` -> `anevum-apex-prelaunch-gateway`; `anevum.com/assets/index-*` -> `anevum-continuance-v064-20261017`.
- Active apex gateway V064 at audit: `80c6f0d1-c35b-4524-b97d-7cffdd4063d5` (100%). Staging member Worker and apex point at existing canonical `MEMBER_DB` and `COMMUNITY_DB`; account isolation must be verified before changes.
- Apex gateway flags recorded: public mode and launch approved; email/public signup/studio/XP-test enabled, uploads and Google/GitHub/Apple/Microsoft sign-in disabled. Existing secret bindings are opaque: do not read, copy or drop.
- Apex Worker has **no** `CANONICAL_FORUM_ENABLED` binding and **no** `CANONICAL_FORUM_REVIEWER_IDS` binding. Backend `canonicalForums` explicitly returns 404 until the feature flag is true.
- Canonical member D1 has the five required `member_forum_*` schema tables installed, verified via read-only `sqlite_master`. Aggregate only: **2 registered accounts, 1 claimed profile, 1 public profile, 1 forum thread awaiting approval, 0 approved forum threads, 0 replies, 0 unresolved forum reports** (read-only counts, no identities or private text).
- Site home reports **0 approved public projects and 0 public creator channels**. Community has at least one publicly exposed member-wall entry; separate community index still lacks approved forum content.
- `/api/v1/member/auth-methods` reports email OTP available and registration open, all social providers disabled. This is NOT proof an independent new member receives and successfully redeems the code.
- `/api/v1/member/health` reports service ready, Studio ready, uploads unavailable and progression ready. This is NOT authenticated acceptance.
- Public `/levels` exposes 30 permanent Evolution stages; `/thebutton` is a sign-in-gated XP testing instrument.
- The actual `/community/write` route rendered the retired `MemberGate` UI saying invited testing, contradicted by the live open-registration state. `/api/v1/community/threads` returned 404; `/community/threads` (without an ID) redirected home.
- Anonymous `/studio` truthfully asks the visitor to sign in. Authenticated Studio draft saving and account/role isolation need genuine tests.

## Live route / interaction matrix
| Entry | Read-only evidence | Status | Next gate | Owner |
| --- | --- | --- | --- | --- |
| `/` | Renders; public catalogue + creators both zero | PARTIAL | At least one genuine reviewed showcase and invitation to meaningful action | #329/#331/#335 |
| `/join` | Open registration UI / email OTP service advertised | UNVERIFIED | Independent email deliverability + verify + account claims + recovery | #328 |
| `/member` | Guest goes to /join | VERIFIED LIVE READ | Two distinct signed-in member journeys | #328 |
| `/member?tab=wall` | Public profile/wall foundation in code; existing wall content visible | UNVERIFIED | Create/edit/remove wall entry and visible privacy; save across sessions | #328/#337 |
| `/community` | Renders public records; no approved forum threads | PARTIAL | Create, independent approve, reply, reaction, report | #331/#330 |
| `/community/write` | Legacy MemberGate advertised invite-only despite open auth | BROKEN | V066 routes to canonical forum once released | #480 |
| `/api/v1/community/threads` | 404; D1 tables exist, feature flag absent on apex | GATED | Independent reviewer + safe canary + guarded forum activation | #373/#331 |
| `/boards` | Route resolves; public release catalogue empty | PARTIAL | Genuine entries and independent mobile interaction verification | #331 |
| `/studio` | Guest sees auth gate; Studio draft service ready | PARTIAL | Independent owner-bound draft/reopen/review, canvas design integration | #329 |
| `/discover` / creator channels | No approved public catalogue | PARTIAL | Truthful first project and creator evidence | #329/#331 |
| `/levels` | 30 stages visible | VERIFIED LIVE READ | Test earned XP, badges and persistence on two accounts | #337 |
| `/support` | UI implemented; checkout not verified | UNVERIFIED | Secure Stripe sandbox flow and truthful terms before charging | #308 |
| `/community/review` | Staff-specific source/release exists | UNVERIFIED | Verify immutable reviewer allowlists, independent approval, audit history | #373 |
| `/thebutton` | Test instrument visible; XP requires member | VERIFIED LIVE READ | Ensure gated abuse limits and no fabricated recognition | #337 |

## Functional release sequence (do not restart projects)
### Release A — real member → conversation
1. Independently verify OTP inbox, signup, profile claim, sign-out and return, without using an owner session as the second member.
2. Fix obsolete composer route (V066); run exact-head source/TypeScript/browser checks; do not deploy before acceptance.
3. Reconcile forum flag, live DB schema, reviewer secret and permissions. Preserve immutable role grants; two reviewers must not self-approve.
4. Capture backup/time-travel bookmark, inspect all existing apex Worker bindings before a nondeploying new version; preserve the 4 opaque secrets and both D1 bindings. Never use `wrangler deploy --keep-vars` on this Worker.
5. With authenticated Member A, create a genuine forum thread; independently authenticated staff reviews, publishes or rejects with audit. Member B replies, reacts, reports; staff moderates; guest sees only approved records. Verify owner-only withdrawal and privacy.
6. Verify event/notification and XP behavior without assuming every forum action grants XP. Repeat on iPhone Safari and in a private browsing session.
7. Promote only the accepted source and recorded Worker version with rollback; record evidence in #480/#331/#373.

### Release B — creator → review → playable discovery
Owner-bound private draft, edit/reopen, independent project review, approved public project, honest player/demo/source link, meaningful mobile discovery, revisions and moderation. Binary uploads/R2/HTML execution remain gated until scanning, quota, CSP, ownership and isolation are verified.

### Release C — consistent member recognition
Player cards across forums/posts/projects, earned levels and selected badges, reviewed ribbons/medals (not purchasable authority), notifications and privacy. V065 is source-only; do not substitute a catalog of award art for a tested grants ledger.

### Release D — supported public beta
Onboarding/support, report/recovery/retention policy, accessible 320/390/1440 layouts, real iPhone testing, asset/share previews, storage/hosting budgets, truth in payment copy, moderation coverage and ability to roll back. Only then invite a small outside Reddit test cohort.

## V066 bounded code changes
- Redirect legacy `/community/write` to `/community?compose=1` (the current Better Auth forum), instead of the incompatible historical `MemberGate` / discussion endpoint.
- Open the canonical thread composer on its deep link when forum is enabled, with no automatic mutation.
- When forum feature returns 404, display an explicit unavailable message and provide the already-implemented member wall as a truthful alternative; don't silently return no UI or falsely claim a submission.
- Explicit limitation: former `?project=...`-linked legacy composer does not confer project linkage on new forum topics; project-specific cross-links need a separately tested feature.
- Added a review-only test + workflow; no Cloudflare flags, secrets, role grants, member data, D1 migration, or active traffic changed.

## Launch gate
Reddit outreach for **development feedback only** is appropriate after two independent member accounts complete onboarding, the forum discussion loop and staff actions pass, and at least one rights-cleared approved project is actually discoverable. A full community launch needs a functioning returning-member experience; never advertise unavailable uploads/apps, social sign-ins or supporter checkout.

## Tooling limits
The read-only route extraction and provider configuration inspection were completed. Automated interactive browsing could not be started because the connected browser account had insufficient balance; these live findings do not constitute an authenticated E2E browser pass. Do not spend to clear that limitation without the owner's approval.


## Continuation and supersession — 2026-10-17 evening EDT

This October 17 read-only snapshot is retained as historical evidence; the original V066 PR #481 is being consolidated into integrated **V067 PR #488**. This branch adds a further bounded fix so historical `/library` resolves to canonical `/saved` rather than the obsolete invitation-only `MemberGate`. The original `/community/write` redirect and forum availability notice are preserved. Same-origin error copy now points to `anevum.com`, not retired `a.anevum.com`.

**Cloudflare configuration has advanced since the original snapshot:** apex gateway now uses deployed Worker version `cd84468c-861a-47d5-8e64-8f8c53d51074`, 24 bindings including four opaque secrets and two D1 bindings. New, independent IREN routes `anevum.com/staff*`, `anevum.com/api/v1/member/staff-ops*`, and `anevum.com/api/v1/member/forum-review*` are attached to `anevum-iren-apex-staff-v002` (staff feature enabled). Anonymous `/staff` requires sign-in; anonymous forum-review request returns 401. Staff grant summary: one active owner, no separately verified independent reviewer grant. Apex forum public reading remains disabled (404) because its gateway lacks `CANONICAL_FORUM_ENABLED`; IREN staff-side enablement does not activate public threads. Canonical D1 still shows 2 verified accounts, 1 claimed public profile, 1 pending forum thread, 0 published, 0 replies. Uploaded creator projects and true multi-account E2E acceptance remain outstanding.

These are **read-only observations**. Do not assume the IREN staff Worker is fully validated for real owner/moderator sessions or that the latest source integration is deployed. Promote no new Worker without exact current binding parity, least-privilege checks, independent reviewer acceptance, and rollback evidence.
