# V079 sitewide polish — review candidate

Session: `ANEVUM.WEB.UPDATE.2026-10-18.001.V079-SITEWIDE-POLISH-AND-QA`  
Date: October 18, 2026 · Source review: [PR #523](https://github.com/anevum/anevum-web/pull/523). **Not deployed.**

## Source and production boundary

Base: `release/home-wayfinder-v079-approved-20261018`, commit `cce65fad033f34d97181d44c3d999e2039fc34b0`. Development branch: `update/v079-sitewide-polish-qa-20261018`. The V079 release record and actual production asset paths were inspected before modification. Cloudflare independently confirmed apex Worker `anevum-apex-prelaunch-gateway` at 100% version `df09d4b8-6d42-4cf3-a816-0c3c5682f947`, deployment `09c90556-2f8d-4676-9d8b-f31f4921bc76`.

No provider configuration, secret, binding, route, role, member identity, database, executable-upload approval, payment integration or entitlement was changed. The production redirect for exact `/boards` remains active. The original Evolution assets, V078 player cards, V079 homepage and Wayfinder remain the baseline.

## Prioritized defect register

| Priority | Finding | Candidate result |
|---|---|---|
| P1 | A route-render or lazy-import exception could remove the whole React experience. | Route recovery preserves navigation and offers reload/discovery; raw exceptions never enter the UI. |
| P1 | Public project typing excluded null creator handles; community/player credits assumed a channel existed. | Nullable contract and guarded credits throughout reachable and retained consumers; no `/creators/null`, inferred member, XP or award. |
| P1 | Search Escape behavior and overlay handoff could leave confusing focus/scroll behavior. | Explicit Escape close, shared scroll locking with cleanup, focus return, visible keyboard selection and combobox semantics. |
| P1 | Legacy library entry opened a separate member flow. | `/library` consistently redirects to the independently authenticated and capability-gated `/saved`. |
| P1 | Native `/boards` historical blank screen (#520). | Not reproduced through current live SPA navigation. Candidate adds null-creator, error/retry, render-failure and failed-lazy-import browser regressions. Production verification remains open; redirect retained. |
| P2 | Boards used a large illustrated hero, decorative project art and unrelated future sections. | Compact content-first boards; every existing category; shared editorial cards and V078 creator-channel credits. |
| P2 | Board selection/filter context was lost across reload and project return. | URL state, validated public return path, Back to Boards, and no forced scroll-to-top on query-only changes. |
| P2 | Header search promised creators but submitted only to project search. | Uses the real shared project/creator search with its typed query preserved; partial directory failures are identified. |
| P2 | Search and creator pages used different presentation systems. | Wayfinder materials, compact creator heading/channel, shared editorial cards, 44px mobile utilities and 16px form text. |
| P2 | Hosted creations were described as external demos in the project passport. | Exact matching first-party release URLs receive hosted labels; unrelated/external URLs cannot inherit the label. |
| P2 | Missing creator channel produced only a generic outage/status dead end. | Distinct 404 recovery with discovery/directory links; no invented creator profile. Underlying projection defect remains #524. |

## Verification and limits

- Root TypeScript and Creator React TypeScript pass; production and staging-path Vite builds pass.
- Full `npm --prefix creator-v1 test`: **525 passed, zero failed/skipped** at the implementation checkpoint. Separate auth and integration tests: **113 passed, zero failed/skipped**. Final CI and any later source changes must be checked on the PR's exact head.
- Targeted source/regression tests cover auth sessions, private saves, independent moderation, Studio restrictions, progression, original media and reward entitlement. No production test mutations were performed.
- Review-only workflow `sitewide-polish-v079-qa.yml` captures the exact V079 baseline and candidate at **320, 390, 768 and 1440px**, using compiled React and prominently labeled **synthetic loopback fixtures**. Fifteen routes × four widths per phase; additional menu, search, retry, unavailable-channel, navigation and route-recovery interactions. Screenshots must be visually reviewed; rendering alone is not functional acceptance.
- Public live browser inspection covered home/Wayfinder, discovery, native Boards via client navigation, creator directory/unavailable creator channel, real published project, community, levels, recognition, support, join and guest Studio. The real game loaded; desktop immersive entry and exit returned to its project. No votes, reports, posts, saves, uploads or sign-in codes were submitted.
- Genuine anonymous HTTPS checks: public boards returned one approved release; session returned `null`; private member space and Level 30 card returned 401; direct Level 30 scene returned 404. `/evolution-card-plates.json` serves the SPA HTML fallback, **not a public artwork registry**. `/staff` redirects to Cloudflare Access; this proves an anonymous gate, not authorized staff functionality.
- Native player, uploader, social and staff interfaces include independently routed runtime overlays. Offline React fixtures do not reproduce those production Workers. Real account persistence, cross-member visibility, staff operations, full upload/review publication, mobile keyboards, orientation and Safari WebGL/immersive behavior remain acceptance gates in #525.
- Performance: baseline entry ≈718 kB JS / 212 kB gzip; ≈678 kB CSS / 142 kB gzip. Candidate remains around 720 kB JS / 213 kB gzip and 683 kB CSS / 143 kB gzip. Boards' own chunk/styles shrink, no artwork or animation dependency is added, and the existing lazy 3D renderer remains separate. The shared bundle-size warning remains; this is not a whole-site performance clearance (#526).

## Outstanding work

- [#524](https://github.com/anevum/anevum-web/issues/524): P1 — Single Drift's returned creator handle leads to an unavailable public channel. Reconcile the actual routed publication projection; do not fabricate a channel or associate a member by name.
- [#525](https://github.com/anevum/anevum-web/issues/525): P1 — authenticated, independently authorized staff, creator/community persistence and physical-device acceptance.
- [#520](https://github.com/anevum/anevum-web/issues/520): retain the Boards protection until post-deployment native-route verification.
- [#526](https://github.com/anevum/anevum-web/issues/526): P2 — consolidate historical style overrides and reduce shared code cost without disturbing the active theme or overlays.

## Deployment and rollback plan — requires explicit authorization

1. Approve the exact PR head and required acceptance results. Do not use historical `main`, V078 drafts or replay a workflow pinned to an older source SHA. Resolve/review the P1 gates above before a broad public release.
2. From the exact reviewed source, regenerate the unchanged original 152 Evolution assets with the current guarded release process. Build both frontend variants and rerun relevant media, privacy, auth and browser checks. Preserve the current independently routed player/social/staff/upload Workers.
3. Read the active apex version immediately before any write. Require the expected V079 version above; stop on drift. Snapshot and compare all existing binding names, plaintext flags and zone routes against the existing V079 release safeguards (24 bindings, 23 routes); never retrieve secret values or replace bindings.
4. Adapt the guarded V079 release process to the newly approved immutable source, with its pre-write lease and automatic rollback. No schema migration, role edit, payment operation or new upload capability belongs in this rollout.
5. Verify the actual new production JS/CSS, genuine homepage/search/discovery, one real native project, guest/member gates and private reward denial. Follow a real internal Boards link to mount the native React route while the edge redirect still protects direct requests; verify real data, 320/390px layouts and null-creator regression evidence. Remove only the exact temporary Boards rule after native-route acceptance and separately authorized release action; verify direct navigation/reload afterward.
6. Rollback target for **this candidate** is the current V079 version `df09d4b8-6d42-4cf3-a816-0c3c5682f947` at 100%, not the earlier V078 version. Restore only apex traffic using the established guarded deployments API; preserve separately versioned overlays, existing routes, identities and data. Recheck home, native player, sign-in methods, private media denial and Boards protection. Stop and report any concurrent release drift.
