# ANEVUM NEXT — Living Commons React integration and browser review

**Current session:** `ANEVUM.WEB.BUILD.2026-10-23.007.LIVING-COMMONS-REACT-BRIDGE`
**Original integration session:** `ANEVUM.WEB.BUILD.2026-10-23.006.LIVING-COMMONS-REACT-BRIDGE`
**Status:** IMPLEMENTED AS OPT-IN REACT REVIEW ONLY; NO LIVE ROUTE REPLACEMENT, NO PRODUCTION DEPLOY, NO DB OR ACCOUNT MUTATION.
**Source lineage:** Protected V131 exact candidate -> NEXT foundation #676 -> profile/community #677 -> Living Commons prototype #678 -> this narrow real-data React bridge.

## Continuation 007 — compiled React polish and recovery

Continued the existing PR #679 branch from `dca020a410ba28fe5e8c704ea26531045fa325b4`. The previous checkpoint had source/type/build checks but no compiled React browser captures; earlier concept images were standalone HTML. This continuation adds the actual browser fixture and fixes defects found in that review.

### Changes

- Tightened the orbital hero and mobile typography so the destinations appear earlier. Preserved the genuine repository OrbitalMark, established colour language, existing high-resolution CosmicArtwork and one Shell-owned IREN.
- Repaired the overly broad project-art span selector, refined card hierarchy and focus states, added honest loading skeletons, and moved implementation notes into a collapsed review note.
- Made Atlas presentation agree with its controls: small screens initially select the list; both list and a readable two-column spatial map remain available. Counts still come only from the category API.
- Added independent retry controls for projects, discussions, category totals, creator results and status. Stable focusable result regions keep keyboard focus in place when a retry replaces its error button with loading content. Status retry closes discussion visibility until the authoritative flag is verified again.
- Added live operating-system reduced-motion observation. Changing the preference while the page remains open updates animation state and the control label; explicit pause and hidden-document suspension remain supported.
- Preserved bounded search/category state in full Discover links and project return links, and creator search in full-directory links. The existing `safeReturnPath` intentionally rejects review-only routes, so project details return to **filtered public Discover**, not an expanded route allowlist. Unicode/control-character handling respects the existing 72-unit input and 512-character encoded return-path budgets.
- Local view, district, search and browser-history changes land at the selected content after the Shell's navigation effect. Project filters are explicitly distinguished from the independent discussion sort.
- Context Lens now changes its description and destinations for the Signal Board, Atlas, creators and selected project field.

### Evidence and its limits

The new `creator-v1/test/continuance-next-community-browser.mjs` serves an immutable temporary copy of the real flagged Vite build on loopback. The default browser fixture uses conspicuously labelled synthetic public responses; it rejects external requests, private profile reads and mutations. The final local Chromium run passed **37 recorded checks** and retained **11 labelled captures**. It checks the three destinations at **1440, 390 and 320px**, navigation/history, query-preserving return links, loading/empty/error/closed states, independent retries, keyboard recovery and skip focus, mobile map/list parity, OS reduced-motion changes and the single existing IREN/main landmark. It captures labelled 1440/390 screenshots and a JSON receipt. Source/model contracts total **24 passing tests**; TypeScript and the unflagged/flagged bundle-isolation builds passed locally.

Read-only production requests during this continuation returned HTTP 200 for `/api/v1/status`, `/api/v1/projects`, `/api/v1/categories` and `/api/v1/creators`. The public response at that point reported **one published project, zero public creator channels and `communityPosts: false`**. These are endpoint observations, not a claim about all signed-in ANEVUM features. A separate optional `--public-snapshot DIRECTORY --capture-only` harness mode renders those actual saved responses with an explicit **public API snapshot / local review / not deployed** label. Synthetic conversations are never represented as current public content.

The read-only PR workflow now retains browser screenshots and the source-SHA receipt as a GitHub Actions artifact. Local receipts record tracked working-tree changes; only the subsequent clean PR-head Actions run is exact-commit CI evidence. The original OV03 foundation allowlist is unchanged and remains a separate known cumulative-stack failure, not a waived release gate. Browser checks do not certify physical iPhone Safari, screen-reader acceptance, signed-in role isolation or production release readiness.

**Release reconciliation:** #655 is completed and records founder-accepted V131 production at 100%. This NEXT continuation changes no production deployment, Worker, authentication, database, XP or migration. A future NEXT release requires its own reconciled successor candidate and authorization; do not reuse the completed V131 approval as NEXT approval.

## Decision and recommendation

Adopt **Signal Board first, District Atlas second** as the accepted direction for this review. The Atlas is the differentiated spatial experience, but public projects, constructive discussion and a clear participation path should be immediately accessible. A third People & Worlds view presents existing approved creator channels. Production adoption still requires #335's visual acceptance and a separately authorized successor release; #655 records the completed V131 release.

## Real implementation

The disabled-by-default `VITE_LIVING_COMMONS_REVIEW=true` flag mounts `/__review/commons` only on an intentionally flagged build, inside the **existing** `Shell`. This new page contains:

1. A cinematic orbital cover using the repo's real `OrbitalMark` and ambient Motion/CSS animation; it honors reduced-motion and local pause. The shell owns the only IREN instance.
2. **Verified status**: uses `readStatus` counts; shows an em dash when unavailable, not zero or fabricated proof.
3. **Original releases**: uses existing `readProjects` with bounded query/category (first 24 records) and `projectDetailPath` and actual creator profile route; source stays in the canonical record. When a next cursor exists, users can continue in full Discover; the first-page count is never misrepresented as the total.
4. **Moderated conversations**: `readCommunityPosts` runs **only** when authoritative `status.features.communityPosts === true` and the Signal Board is selected. Closed, error, loading and no-content states remain distinct. Existing `/community/posts/:id` continues owning discussions and actual replies/reactions.
5. **Eight category districts**: stable categories map to existing identifiers. `readCategories` supplies truthful published totals. The fixed positions are taxonomy, NOT actual density or activity. Each district links back into the exact same project records on the Signal Board; the equivalent readable list is available alongside it.
6. **Creators**: `readCreators` is called only on People & Worlds, and links only to real approved creator channels. Private canonical member worlds are not enumerated or inferred.
7. **Context Lens**: deterministic links to existing Discover, Community, Creators, member space, recognition and review-gated discussion submission. No autonomous AI and no privileged actions.
8. **URL state**: pure `decodeCommonsQuery`, `nextCommonsQuery` with safe view/category/sort/query validation, and navigation history semantics.

## Exactly what does not happen

No new auth, D1 migration, API endpoint, Worker, uploaded media, profile write, social follow, XP, rewards, badges, staff privileges, fake demo accounts, generation model, extra IREN companion, Studio merge, or V131 deployment. Private member profiles remain independent from creator channels. Server authorization and moderation remain authoritative.

## QA / acceptance

- Local source and URL-model tests must pass.
- GitHub exact-head CI must prove pinned `npm run check:creator-v1-web` and **both** Vite builds: default `VITE_LIVING_COMMONS_REVIEW=false` excludes all `lnx-root` markers, while explicitly flagged true builds contain it. No deployment commands in the workflow. A failure of the older foundation's intentionally narrow cumulative diff guard is not a release exception; preserve that guard and keep this stacked PR review-only.
- Actual browser QA on compiled React with mock API fixtures must show accurate empty/error/closed behavior; fixture screenshots must be conspicuously labeled, and final verified real-record acceptance uses live approved read-only endpoints only.
- Accessibility: keyboard operation, reduced motion, focus visibility, 320/390 responsive, contrast, screen reader and static map list. Accessibility and end-to-end production acceptance are **not** implied by local syntax tests.

## Recommended implementation order after this slice

| Next slice | Real-source integration | Gate |
| --- | --- | --- |
| 02 — Project Rooms | Existing `/projects/:id`, approved project-thread links and release provenance. No duplicate project DB. | Project visibility, authorship and destination checks |
| 03 — Deep Threads | Existing `/community/posts/:id`, `memberCreateReply`, revisions, rate-limit and staff review receipt. | A/B account isolation and moderation acceptance |
| 04 — Identity & Cabinet | Existing `CompactMemberIdentity`, `LevelEmblem`, `BadgeInsignia`, `EarnedRewardVault`; server-earned only. | Public/private reward visibility and 30 level artwork preservation |
| 05 — Personal Commons | Existing `/member`, saved works and opt-in avatar/banner preference; no client-controlled permissions. | Owner verified revision and export/deletion safety |
| 06 — Assemblies | New explicit lifecycle design, do not invent available membership now. | Consent, invitation, abuse/moderation, new schema and owner approval |
| 07 — Motion polish | Layout continuity, bounded shared-element transitions, optional ambient backgrounds, hardware profiling. | Reduced-motion, iOS Safari, CWV, energy and WCAG 2.2 AA |

## Related controls

Owner creative checkpoint: #335. Engineering board: #325. V131 protected release and rollback: #655. Public surfaces draft: #667. Creator Studio draft: #658. NEXT foundation: #676. Community/Profiles: #677. Living Commons prototype: #678. Keep independent PR reviews without mixing unfinished migrations, production artifact uploaders, or worker routes.


## Continuation 011 — shareable Atlas layout and independent search filters

Session `ANEVUM.WEB.BUILD.2026-10-23.011.LIVING-COMMONS-SHAREABLE-FILTERS`.

The review's map/list presentation choice now lives in a typed `atlas=map|list` URL query instead of transient local React state or browser storage. Unset or unrecognized values honor the current viewport (map on desktop, accessible list on small screens). The choice survives Back, Forward, reload and copied links; a visible “Use device default” control clears the override. A presentation-only change leaves keyboard focus on the selected control instead of scrolling to the content. District and search filters continue to travel with the URL and approved project detail return links.

The Signal Board now exposes independently removable project-discipline and search chips, with a separate Clear all control. Each removal preserves the other active filter and produces the correct actual public API query. Updated local compiled-browser tests cover phone map/list reload and navigation, focus, independent chip removal, browser history and full reset. The continuation does not introduce additional API endpoints, persistence, analytics/telemetry, member reads, writes, earned rewards, permissions or dependency changes. Default-off preview isolation, a single existing IREN and all release gates remain intact.

Source remains in draft PR #679; every new screenshot/test receipt must be bound to its exact checked Git head. No V131 release or Cloudflare action is implied.
