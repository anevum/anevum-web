# ANEVUM Master Continuity — public engineering index

Coordination session: `ANEVUM.ANEVUM.PACKAGE.2026-10-25.001.UNIFIED-WORKSTREAM-CONTINUITY`.
Scoped implementation: `ANEVUM.WEB.UPDATE.2026-10-25.002.UNIFIED-UI-INTEGRATION`.
Verified discovery date: October 25, 2026 (America/New_York).
Status: **ACTIVE DEVELOPMENT. NOT released, merged, deployed or visually accepted.**

This is an evidence index and continuation checkpoint, not another task board.
[Canonical engineering #325](https://github.com/anevum/anevum-web/issues/325)
continues to own tasks; [#344](https://github.com/anevum/anevum-web/issues/344)
owns product doctrine, [#331](https://github.com/anevum/anevum-web/issues/331)
discovery/community, [#335](https://github.com/anevum/anevum-web/issues/335)
visual acceptance, [#308](https://github.com/anevum/anevum-web/issues/308)
conditional January 1, 2027 opening, and
[#333](https://github.com/anevum/anevum-web/issues/333) release authority.
All six issue bodies and their #325/#335/#333/#344 comments were read.
Older provider-state descriptions in issues are historical, not current evidence.

## Authority and status

LOCKED: owner authorization controls changes; current deployed-provider evidence
establishes running state, current source/ancestry/CI establish implementation,
then locked decisions/issues, approved visual references, and historical reports.
A passing test is not a deployment; a screenshot is not real-user acceptance.
Use LOCKED, PRODUCTION, VERIFIED DRAFT, ACTIVE DEVELOPMENT, PROPOSED, RESEARCH,
BLOCKED, SUPERSEDED, UNKNOWN. Record verification scope and time with every status.

Devon is product/creative/release owner. Implementation ownership follows the
existing component and PR contracts, not a newly invented team. Current reviewed
candidate is isolated branch `integrate/unified-continuity-20261025-001`,
based on immutable #735 head `988b7447633044a3c07de5ee3a4773f43c97412a`.
Original #735/#737/#736 source branches are unchanged.

## Source and lineage matrix

| PR | Observed base / SHA | Observed branch / head | Discovery status |
|---|---|---|---|
| [#735](https://github.com/anevum/anevum-web/pull/735) | `build/parity-v136-concept-convergence-20261024-017` / `6ed4c53d` | `build/parity-v136-concept-convergence-20261024-017-003-studio-tree` / `988b7447` | ACTIVE DEVELOPMENT: CI failure + pending |
| [#737](https://github.com/anevum/anevum-web/pull/737) | `build/parity-v136-concept-convergence-20261024-017-003-studio-tree` / `9ca03c2b` | `build/parity-v136-sitewide-ui-20261025-001` / `256975cd` | BLOCKED: four conflicts |
| [#736](https://github.com/anevum/anevum-web/pull/736) | `build/parity-v136-concept-convergence-20261024-017-003-studio-tree` / `47bbea05` | `build/parity-v136-free-launch-companion-20261024-018` / `d449d5a6` | ACTIVE DEVELOPMENT: unmerged |
| [#734](https://github.com/anevum/anevum-web/pull/734) | `research/studio-project-doctor-v001-20261023` / `059a0181` | `research/continuance-hybrid-compute-v001-20261024` / `a3d1e03f` | RESEARCH: mocked local inference CI green |
| [#724](https://github.com/anevum/anevum-web/pull/724) | `main` / `1262ea6f` | `build/continuance-house-v001-20261024` / `78976984` | VERIFIED DRAFT: two CI workflows green |
| [#733](https://github.com/anevum/anevum-web/pull/733) | `build/parity-v136-cinematic-runtime-20261024-016` / `628ca8e8` | `build/parity-v136-concept-convergence-20261024-017` / `6ed4c53d` | ACTIVE DEVELOPMENT: unmerged |
| [#732](https://github.com/anevum/anevum-web/pull/732) | `build/parity-v136-cinematic-camera-20261024-015` / `0c87f3a7` | `build/parity-v136-cinematic-runtime-20261024-016` / `628ca8e8` | ACTIVE DEVELOPMENT: unmerged |
| [#731](https://github.com/anevum/anevum-web/pull/731) | `build/parity-v136-cinematic-production-20261024-014` / `0d5a4364` | `build/parity-v136-cinematic-camera-20261024-015` / `0c87f3a7` | ACTIVE DEVELOPMENT: unmerged |
| [#730](https://github.com/anevum/anevum-web/pull/730) | `build/parity-v136-cinematic-continuance-20261024-013` / `07ef1d1a` | `build/parity-v136-cinematic-production-20261024-014` / `0d5a4364` | ACTIVE DEVELOPMENT: unmerged |
| [#729](https://github.com/anevum/anevum-web/pull/729) | `build/parity-v136-controller-input-20261024-001` / `3a313fb1` | `build/parity-v136-cinematic-continuance-20261024-013` / `07ef1d1a` | ACTIVE DEVELOPMENT: unmerged |
| [#728](https://github.com/anevum/anevum-web/pull/728) | `integrate/parity-v136-multichat-20261024-010` / `fd3c7ea0` | `build/parity-v136-controller-input-20261024-001` / `3a313fb1` | ACTIVE DEVELOPMENT: unmerged |
| [#727](https://github.com/anevum/anevum-web/pull/727) | `build/parity-v136-integrated-console-20261024-008` / `44c2fcc8` | `integrate/parity-v136-multichat-20261024-010` / `fd3c7ea0` | ACTIVE DEVELOPMENT: unmerged |

The provider's PR base SHA can lag the current base branch. Local git confirmed
the real common ancestor of #735/#737 is `9ca03c2b4f7e43b621a2f4f1fe78c8606eb29e33`;
#735/#736 share `47bbea059726ff25b12c41108ed64cf1dd11fd09`.
Exact changed-file lists and parent hashes are retained in the private session
checkpoint. No rebase, force-push, cherry-pick or branch/history merge was used.

Historical dependency chain is #727 → #728 → #729 → #730 → #731 → #732 →
#733 → #735. The latest #735 already contains that ancestry: do not apply
older PRs again. #734 and #724 have independent bases and remain excluded.
Read-only three-way tree comparison exposed four conflicts in #737; the inspected
delta was ported into the separate draft, retaining rollback through its parent.

Integration order:
1. Hold #735 at the inspected head as UI/Studio baseline.
2. Reconcile #737's art retirement/shared media/profile behavior against that
   baseline, preserving newer Community history and Boards behavior.
3. Add #736's six-file public-project sharing delta explicitly.
4. Repair canonical thumbnail callers and source/browser assertions together.
5. Obtain exact-head CI and actual screenshots before considering a subsequent
   baseline update. Recheck remote heads; do not overwrite concurrent work.
6. Keep all production/release/publication gates closed. No merge is authorized.

## Resolved overlap and actual code

- Community: retain #735 URL/history-driven tabs, empty/error states and real
  APIs; use #737 ProjectThumbnail, remove generated hero artwork.
- Public member world: retain the #735 full-width profile scope and #737
  working section anchors, conditional creations gallery, uploaded banner and
  portrait error fallbacks. No media/API ownership changes.
- Discover: retain URL/data ownership and keyboard category navigation; use
  native category panels and real-media-aware project/package cards.
- Boards: keep #735 published-only data, filters/history and creator counts;
  replace now-deleted CategoryCover callers with shared ProjectThumbnail.
- Artwork tests: preserve real records/moderation checks; require native
  surfaces, canonical media fallback and no retired promotional rasters.
- Open Signal: same approved public ProjectPage owns the panel; safe origins,
  escaped scriptless embed, copy/share fallback; no new endpoint or publication.
- Studio, Monaco, source operations/backups/archives and local sandbox preview
  remain in their existing owning modules. No source rewrite or 3D expansion.

The previous `ACTIVE-V136-WEB-OVERHAUL.md` falsely said #737 had already
been incorporated into #735. Current ancestry disproved that statement; corrected.
It now identifies the separate integration candidate and open verification.

## Visual direction and acceptance

LOCKED: functional Continuance Institute / Creator Universe UI comes first.
No new decorative generated art, fabricated creators, usage or rankings.
Preserve creator uploads; safe reviewed package cover first, category SVG second.
Legacy Project DTO still has no approved image field; do not invent one.

Four governing October 24 boards were recovered and inspected:
- Creator Universe Dashboard: `libfile_f70fb019b5b48191a029ec67b45ddbe5`
- Neon UI Showcase: `libfile_66e0cab1cfbc8191b5eb13ed678da923`
- Neon Creative Universe: `libfile_9cdf13e3cd9c8191bdbe977dc11f8d4e`
- Dashboard Showcase: `libfile_5a835586bc1881918421842c11e46f33`

These are reference concepts, not factual user/financial/activity records.
Visual acceptance remains #335: inspect actual 1536×1024, 1440, 390 and 320
resting and interactive states; typography, hierarchy, focus, reduced motion,
navigation, source editor, empty/error data and no overflow. Final AAA fidelity,
physical Safari/VoiceOver/Xbox and owner visual acceptance remain open.

## Verified production boundary

Read-only Cloudflare inspection confirmed the actual apex wrapper/service chain
rather than assuming the historical `anevum-creator-v1` Worker owns apex traffic.
The current gateway deployment `f2f950d8-8ec6-42cd-80c2-06681ad2fcf9`
serves `72f35ec3-e046-4f75-ae65-19fa672b87c9` at 99% and
`cf058439-2487-4b96-b183-94a5c419f3cb` at 1%.
The existing release helper identifies those as V136.003/V136.005.
These are observed rollback references, not authorization to invoke rollback.

Native Work browser verified deployed homepage and real Discover navigation.
The deployed homepage still contains the older illustrated arrival; art retirement
in this draft must not be described as live. No traffic, Worker, binding, auth,
database, upload, member, publication, payment or trading mutation was performed.
`VITE_PARITY_V136_HORIZON_QA` and `VITE_PARITY_V136_SHARED_SCENE_QA`
remain release-forbidden. Strict release source allowlists are unchanged;
a broad integration rejection is a BLOCKED gate, not permission to relax it.

## Verification at first integration checkpoint

- PASS: TypeScript, default and full-flag frontend compilation.
- PASS: 113 targeted V136, thumbnail, member world, Open Signal and legacy media tests.
- Full local regression: 1,751 passed / 3 failed; failures require absent generated
  evolution artwork/mini-runtime inputs and a Node 24 stream-test asynchronous
  activity error in the unchanged alpha-controller suite. Record these as unresolved local checks until CI proves them.
- #735 input head: Creator V1 CI run 40199161202 failed at old Community browser
  hero-art requirement after source/integration tests passed. #737 had no returned
  PR-triggered head runs (conflicting PR); absence is not a pass.
- #736 input: seven returned head workflows succeeded. #734: one mocked
  compute-contract workflow succeeded; real Ollama/model quality remains untested.
- #724: two returned head workflows succeeded; not evidence of private deployment.
- Draft browser: local Chromium missing and download failed; Work native browser
  loopback refused. Added integration assertions are pending exact-head CI.
- Keep security/member A → moderator → guest → independent member B, actual
  publishing, owner design acceptance and release approval separately incomplete.

## Separate subsystem boundaries

| Track | Purpose / source owner | State and next owning evidence |
|---|---|---|
| Public Creator V1 | `anevum/anevum-web`, #325/#331/#335 | PRODUCTION older gateway; current unified UI ACTIVE DEVELOPMENT |
| IREN / COMMAND | Existing web staff/guidance modules and historical command architecture | PRODUCTION staff Worker inventory observed; durable operating intelligence and privileged action acceptance UNKNOWN |
| RHEN | `anevum/rhen`; protected execution and research | Source repo accessible; Railway inspected production has no services; other live runtime UNKNOWN; no execution or risk change |
| GRAEN | Analytical/mathematical research | Historical Slack runtime claim conflicts with current empty Railway inventory; current runtime UNKNOWN |
| NOSTRA | Forecast evaluation | UNKNOWN runtime; retain distinct research ownership |
| VELUM | Simulation/replay validation | UNKNOWN runtime; never grant execution capability |
| Continuance Compute | #734 `services/continuance-compute/`, separate Lab research base | RESEARCH; local-only inference contract CI green, real ThinkPad/Ollama acceptance pending |
| Synthetic biological computing | Longer-term living-computing research | RESEARCH; distinct from software inference; no purchase, laboratory or spending authorization |
| Continuance House | #724; isolated household application | VERIFIED DRAFT source/CI; private operating state requires separate permissioned evidence |
| Family sharing | Separate isolated implementation | Keep private operational details out of this index; source permissions must be verified independently |
| ANEVUM Sites | Existing services/outreach track | Relationship-first plan; contracts and client permissions must be evidenced, not inferred |
| First Signal | Proposed recognition/partnership framework | PROPOSED; no granted equity, commission or binding payment promise |
| ANEVUM Pay | Existing payment draft #713 / retirement #530 | PROPOSED migration direction; no live processor change inferred; payment/legal approvals remain separate |
| Feedback research | #331 and existing issue owners | Owner reports need original evidence; no invented engagement or research metrics |

Railway read-only inventory: Continuance Lab diagnostics service SLEEPING;
ANEVUM Core inspected staging environment has no services and a staged empty
patch; RHEN and RHEN Archive inspected production environments list no services.
These observations do not prove other environments/providers are empty.
Supabase lists ANEVUM ACTIVE_HEALTHY and ANEVUM Command INACTIVE; this establishes
project status only, not application health, schema acceptance or actual runtime.
Slack contained older operational claims; they remain historical.
Google Drive discovery found September records, not an authoritative current
October coordination record; no unseen document content is claimed inspected.

## Continue from this checkpoint

Re-fetch the three website heads before another edit. Verify the current candidate
tree and exact-head CI; inspect screenshot artifacts against the recovered boards.
Repair observed interaction/layout failures before more art or 3D work.
Then advance one UI slice through #325/#331/#335, while authentic creator
publication acceptance remains the separate #325/#333 gate.
Update this index and the active handoff at every substantial increment.
Private infrastructure/family/feedback notes belong in the access-controlled master
checkpoint, never public issue bodies or source. No new product doctrine or board.


## Browser-discovered correction — after a6837404
Exact code checkpoint a6837404 passed 1,753 Node 22 regressions, Creator V1
compiled page captures and 15 complete workflows. Spatial CI 40200865470
then exposed a genuine Boards Back-navigation defect: URL reverted while
Games remained selected. The correction makes board/category derive directly
from location.search, removing mirrored optimistic state. The existing strict
Back assertion is retained. Public Community/Boards/Open Signal browser groups
now run before expensive scene stress; no test group was removed. Exact new
head browser acceptance is required. PARITY/V132 release source gates remain
blocked and unchanged. Screenshot evidence at a6837404 establishes the real
1536/1440/390/320 UI and source editor, not final owner concept acceptance.

## V136.023 — UI density and console clearance (draft)
Scoped session: `ANEVUM.WEB.UPDATE.2026-10-25.003.UI-DENSITY-AND-CONSOLE-CLEARANCE`.
Continues verified #738 `ba18a065` without modifying #735/#737/#736.
Removes the 220–330px former poster reservation above mobile arrival text;
retains native optics and actual inspect/route controls. Embedded public member
activity/forum panels use the existing Institute typography/materials. Normal
desktop console has a reserved left gutter; private source authoring retains
its full editor width. Phone/tablet focus and deep links reserve dock clearance.
Strict compiled checks cover heading/action placement, actual panel styles,
real console/content rectangles and focused mobile sharing controls.
No source, API, auth, account, WebGL architecture, permission, publication or
provider changes; no release allowlist changes. Local compiler/contracts pass;
exact-head CI and screenshot comparison remain required before acceptance.

The first V136.023 run at `d9f0f300` passed Creator V1 verification and
mobile/Commons/source-workstation checks. Its Boards forward-selection assertion
raced React's render after the URL changed; the captured DOM subsequently showed
Games correctly selected. Browser checks now wait for the rendered People/Games
selection before asserting it. Back-navigation checks and all acceptance groups
remain strict. Full exact-head browser verification is required for this correction.
The actual 320px capture also exposed inspection-status/first-contact overlap;
the mobile inspection control moves up 22–26px, with a strict rectangle-clearance
assertion. This preserves its 44px target and the compact headline position.
