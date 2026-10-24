# ANEVUM Living Commons — connected community operating experience

Session: `ANEVUM.WEB.DESIGN.2026-10-23.005.LIVING-COMMONS`
Status: **NEW INTERACTIVE CONCEPT AND ENGINEERING HANDOFF; NOT MERGED, NOT DEPLOYED, NO LIVE FEATURES OR SERVER WRITES.**
Source lineage: V131 exact reviewed commit `ad0d3aef473e12c124b003d2c3bb45b79bff520e` → NEXT foundation draft PR #676 → Community/Profile draft PR #677 → this next stacked isolated review slice. The protected production release #655 remains independent.
Visual approval process: issue #335, Orbital Underground direction, review at **1440 desktop first, then 390 mobile**. The existing mark is taken from `creator-v1/web/src/components/OrbitalMark.tsx` geometry. This proposal does not change the locked brand source or pretend final wordmark approval.

## 1. Product thesis: a living creative commons, not a copied social app

ANEVUM should be a place where people can *understand, make and improve things together*. The high-value community loop is **discover a relevant original work → enter its canonical context → contribute something specific → receive a human response → observe an actual improvement → collect the verified recognition of the work**, without trapping people in shallow engagement mechanics.

Do not optimize for time-on-site, streak completion, endless reactions or addictive compulsion. Optimize for **meaningful, voluntary participation**: useful creation, constructive feedback, quality learning, real collaboration, honest provenance, durable relationships and creator-reported value. Community should feel welcoming and unexpectedly deep while remaining legible to a new visitor. This is an original combination of an editorial hub, a spatial 2D map, project-centric archives, moderated conversations, contextual tools and a customizable personal workspace; no claim of absolute global uniqueness is made.

### Eight experience principles

1. **Places, not channels.** Creative disciplines have stable Districts with meaningful editorial identity and URL hierarchy; they are never fragmented into dozens of dead rooms.
2. **Work precedes metrics.** Original releases, public project provenance, and constructive questions are primary; vanity popularity and invented social proof are not.
3. **Context stays attached.** A Project Room follows a project's actual authorship, release trail, source/destination and reviewed discussions, not a duplicate project database.
4. **Involvement has multiple entry levels.** Visitors explore; members can save or submit replies with verified authority; creators publish subject to review; collaborators explicitly consent.
5. **Private and public are not design themes.** Account, moderation, visibility and reward access are controlled by canonical server state even when the new UI animates between presentations.
6. **The member controls their space.** Pinned panels, chosen appearance, filters and reduced motion remain stable until explicitly changed; AI can recommend but not silently mutate.
7. **An identity carries earned history.** Evolution level artwork, badges, medals, ribbons, verified standing and reputation are only displayed from earned server inventory, never generated from profile cosmetics.
8. **Progressive enhancement, always.** Every spatial map has an equivalent semantic list; every effect has an off state; every contextual command has a visible ordinary path.

## 2. Connected information architecture

```
COMMUNITY / LIVING COMMONS
├── The Commons (arrival, paths, real releases/questions)
├── District Atlas (2D overview + equivalent accessible list)
│   └── District (games, tools, creative, research, libraries, learning, automation, other)
│       ├── Filtered real public projects
│       ├── Approved real discussions
│       └── Relevant opted-in creator channels
├── Signal Board (release / moderated discussion / feedback call)
│   ├── Project Room [future review substrate anchored to real Project]
│   └── Deep Thread [canonical moderated CommunityPost]
├── Assemblies [future-gated, not live]
│   ├── Public topic-based mentorship/learning paths
│   └── Invitation-based collaboration requiring membership policy
├── People & Worlds
│   ├── Creator channel /creators/:handle
│   └── Opt-in canonical member world /@:handle
├── Cabinet (real earned-only recognition)
├── My Commons (explicit private panel composition & saved work)
└── Commons Charter (governance, moderation, privacy, reporting)
```

The demonstrator includes 11 internal view states: `home, atlas, district, signals, room, thread, assemblies, people, cabinet, desk, charter`; navigation maintains URL hash for review, and no production router is changed. Do not route private member state through a public creator channel. Community's internal 'Commons' label is a product IA layer, not a new company or subbrand.

### 2.1 The Commons arrival

The first viewport is cinematic but legible: ANEVUM mark, a strong human promise, sparse orbital geometry, and two dominant routes. The page immediately explains *why* to explore, contribute or create. Beneath the entrance are distinct project and discussion signals, topic paths, and tangible next steps. Do not lead with the test game or unverified counts.

### 2.2 District Atlas

A bounded **2D map** uses eight current product categories as conceptual districts. It does **not** imply member locations, real-time activity or hidden social data. A one-touch **Accessible List** mirrors all map destinations. On selection, an information panel explains the discipline, representative goals and a clear next action. On enter, a stable District page shows filtered approved records, real zero/error states and opt-in following where the backend supports it. The map can become an optional WebGPU projection later, but baseline navigation must work in DOM and on mobile without GPU.

### 2.3 Signal Board

This is not an untyped feed. Project release cards, questions, feedback requests and discussions have distinct content hierarchies and actions. `readProjects` and `readCommunityPosts` remain separate backend sources, merged on the presentation side only after public visibility and availability checks. Search and filter results are transparent; no invented 'trending' metric, unread count, reactions or user presence. Bookmarks and saved items are account operations only after signed-in server acknowledgment; otherwise a visible local preview must explicitly say it is not saved.

### 2.4 Project Room

A project’s creator-authorized home for **what is being made** and **how to contribute**. Sections: identity and licensing; canonical public release destination; audited authorship/collaboration credit; stage/milestone ledger; public approved discussion; contributor feedback forms; reversible review states. There is no release-stage backend in this prototype. When built for production, prefer a direct adapter over the existing project record and public discussion routes; add a narrow, versioned, protected project-context table only after verifying need, with separate publication/moderation permissions. A UI stage label never equals permission to deploy.

### 2.5 Deep Thread

A readable document first, discussions second. Present project/creator context, immutable authorship labels, focused quoted context, moderation status and a clear reply composer. Visual reply nesting must match canonical parent-child data. The current production APIs appear to have a moderated discussion reader and flat public replies; **do not claim threaded nested persistence exists**. Build nested reply records only after parent authorization, staff review, deleted-parent handling, pagination, reporting, conflict tests and guest/owner isolation. The demo's nested content is fictional.

### 2.6 Assemblies

Topic-based or project-based collaboration paths, distinct from a conventional channel list. Each space must declare its purpose, visibility, membership criteria, stewards, approved public information, moderation process, leave/exit controls, and publication/export boundaries. **Entirely future-gated** pending a server-owned membership system. A visitor who clicks Join must see that the capability is unavailable or requires explicit authorization; never simulate a live membership change.

### 2.7 People & Worlds

Respect the existing dual model: `CreatorPage` channel resolves approved creator work; `Phase1PublicMemberPage` presents only opt-in member-world data from canonical public profile+space APIs. Personal mini-cards can display approved appearance, but no private account enumeration or inferred roles. The existing `CompactMemberIdentity` (aka PlayerCard) already supports earned specimens, featured badges, medals, ribbons, verified roles, earned aura and reputation. Reuse it rather than replace earned record identity with synthetic decorative status.

### 2.8 The Cabinet

A premium exhibition interface for **actual earned-only inventory**. Current components include `LevelEmblem`, `BadgeInsignia`, `HonorInsignia`, `EarnedRewardVault`, `RewardInspector`, verified `LevelPanel`, `CompactMemberIdentity`, and canonical recognition definitions. Do not disclose future level names/media or badge grants in guest HTML. Unreached level models remain unknown; inspect only actual permitted earned entries. Themes, decorative rings and supporter appearance are separately editable cosmetics. Independent earned honors must never become a purchasable or selectable look-alike.

### 2.9 My Commons

A private **Continuance Deck** of rearrangeable modules. In the demo, modules are moved via explicit Up/Down buttons, not inaccessible drag only, and in-memory saves persist only until the concept page reloads. Production requires user-owned layout version, revision and module schema, a per-member private read/write API, anti-stale conflict resolution, export/deletion and conservative default arrangements. A proposed AI or IREN 'organize my workspace' feature may only generate a previewed list of allowed module operations, with a visible Apply action; never reroute a member silently.

### 2.10 Commons Charter

Explain provenance, consent, contribution, verified recognition, moderation, reporting, privacy and accessibility. Transparency prevents dramatic visuals from obscuring user expectations. Publishing and reporting require separate audited backend workflows.

## 3. What makes the interface different

### Context Lens + typed action graph

A deterministic **Context Lens** suggests a next meaningful action for the current screen and explains why it is suggested. In this prototype it is not AI-powered. Its typed source-only successor `engineering/commons-action-graph.ts` separates allowed UI composition from pending server-authorized actions. Navigation is local; save, reply, react, join and reward views never grant permission in the frontend. The model returns `needs-server`, not `authorized`, for sensitive intentions. AI/IREN may later choose among registered descriptions, but all identity, moderation, ownership, revision, consent and idempotency checks stay in the canonical server implementation.

### Spatial continuity and memory

A route may use browser-native same-document View Transitions when supported, unless the user or system disables motion. The visual object can move between map selection, project card and room without losing semantic context. Browser support is progressive and focus/read position must be preserved; do not require experimental element-scoped transitions. Navigation history and map/list routes remain human-readable.

### Purposeful variation in density

Arrival = cinematic and sparse. Atlas = spatial + semantic. Signal Board = structured cards. Thread = editorial reading. Assemblies = purposeful directory. Cabinet = earned-gallery inspection. My Commons = personal tools. Same tokens, different information density. Contrast and focus state are shared across all of them.

### Ownership of attention

Contextual actions are visible but never hidden behind hover. No streaks, forced daily return, infinite scroll traps, fake social proof, auto-playing sound, mandatory AI or speculative emotional scoring. Use voluntary return paths based on unfinished meaningful work, creator updates chosen by the member, and real helpful responses. Provide quiet/limited-notification settings.

## 4. Design system, motion and performance

Baseline: **React 19 + TypeScript + React Router + Vite + Motion** (retain existing versions). Scoped tokens carry black-charcoal, bone-white, restrained copper/coral and violet with conditional blue/mint for subject identification. Maintain official `OrbitalMark.tsx` geometry. Never copy standalone global CSS into the current `main.tsx` cascade. Use semantic `--commons-*` tokens and isolated page classes, then consolidate old styles by route. The existing site has many versioned CSS imports and separate product surfaces: a wholesale global reset is unsafe.

Motion language: orbital atmosphere (12–95s, nonessential); page continuity (<450ms); cards (150–260ms); dialog/sheet (<300ms); nameplate/avatar accent (<1000ms); title and reading text stable. `prefers-reduced-motion: reduce` overrides Full or Gentle; Off disables visual motion; visibility pause; no mandatory canvas. Optional WebGPU / WebXR is strictly progressive on isolated flagship experiences after device/battery/task-success tests. Rive or dotLottie may power bounded scenes only if demonstrated value beats static+CSS/SVG. Avoid forcing all users to download shader/runtime libraries to read a post.

Accessibility acceptance: keyboard navigation, focus visibility, target sizing, touch reflow at 320px, VoiceOver+NVDA and screen-reader dialog focus restoration, map/list parity, status text not only color, reduced motion, semantic landmarks, and moderated-reply states. Aim for WCAG 2.2 AA. **The prototype has local Chromium tests but is not a completed audit**, and native mobile Safari remains unverified.

Performance acceptance (targets, not measurements): on release hardware, LCP <= 2.5s at p75, INP <=200ms, CLS <=0.1, reliable low-end 60/30fps budget depending on device tier, no regressions in existing player/sidebar/IREN, and no long animation-induced main-thread task. Load interactive map enhancements lazily after core public content. The single current IREN remains one instance; no duplicate agent dock or model access.

## 5. Current repository reconciliation

| Production/review source | Current role | Required treatment |
|---|---|---|
| `creator-v1/web/src/pages/CommunityPage.tsx` | Approved project/discussion/creator read surfaces | Preserve adapters and explicit availability, restructure visual presentation behind owner review and feature flag |
| `creator-v1/web/src/pages/CommunityPostPage.tsx` | Real moderated discussion and reply flow | Preserve reply pending-review state, revision-checked reactions, public-only reader |
| `creator-v1/web/src/pages/CreatorsPage.tsx` | Public channels and creator/member route distinction | Never merge identities silently or fabricate following |
| `creator-v1/web/src/pages/Phase1PublicMemberPage.tsx` | Opt-in public member world + wall and earned vault | Respect isolated wall failures and missing/private indistinguishability |
| `CompactMemberIdentity.tsx`, `EarnedRewardVault.tsx` | Server-verified XP/levels/badges/medals/player cards | Reuse actual earned artwork and APIs; apply presentation theme only |
| `creator-v1/web/src/pages/Phase1MemberPage.tsx` | Private member editing and authorization | Keep revision checks, explicit visibility, export/erase controls |
| NEXT draft #676 | Isolated React foundation / Action Lens | Stack review design; no shared CSS regressions |
| Community/Profile draft #677 | Existing seven-screen concept and Motion Atelier | Improve in-place via successor slice; preserve accepted components / lessons |
| Draft #667 | Shared Discover/Community public surfaces | Reconcile before integrating to avoid duplicate routes or source regressions |
| Draft #658 | Creator Studio V109–V113 | Keep file tree, builder, OpenAI dock and migration0014 isolated |
| Issue #655 / V131 | Protected current release and rollback | Do not merge or deploy the NEXT concept as a shortcut |

## 6. Implementation packages and acceptance

**LC-00 / Restore + reconcile** — lock exact V131 source and current draft PR refs, inventory existing routes, data adapters, CSS layers, IREN and release safeguards. Reconcile active branches and owner-selected visual direction.

**LC-01 / Shared tokens and accessible primitives** — scoped body/background, composition, typography, cards, avatar/author metadata, topic labels, focus/keyboard and responsive 1440/390; fail on global CSS bleed. Exactly one IREN.

**LC-02 / Public Commons read integration** — connect home, Signal Board and District list to `readProjects`, `readCommunityPosts`, `readCreators` under existing public visibility rules and feature availability. Real empty/loading/error, withdrawn/no data, pagination, no invented records. The Atlas is optional enhancement.

**LC-03 / Native spatial Atlas** — render static/DOM 2D map and semantic equivalent list; category filtering, URL/query history, focus and map/list parity. Measure comprehension before GPU experimentation.

**LC-04 / Deep Thread UX** — preserve canonical moderated post/reply endpoints first. Only add scoped parent-child conversations and optional inline context after independent schema, staff review, authorization, reporting and migration signoff. No premature 'threading is live' language.

**LC-05 / Project Rooms** — project passport adapters, release notes and provenance from server; assess if metadata endpoints suffice before any new table/migration. Host app/content safely in already approved player/origin; no third-party code inside main shell.

**LC-06 / Identity + Cabinet** — use member/creator split, actual visible earned inventory, normal recognition renderer, opted-in profile appearance, cosmetics separate from earned roles. Preview server media rights/visibility. Avoid listing hidden future reward names.

**LC-07 / Personal Continuance Deck** — private server-owned module preferences, permissible module registry, revision and undo, export/deletion. Agent-plan-to-action contracts require human preview and server action validation; default static layout is always available.

**LC-08 / Assemblies** — product and permissions design first; future-gated until identity, invitations, membership, content moderation, access isolation, audit and safe exit semantics are complete.

**LC-09 / Motion and alternative modes** — honor Full/Gentle/Off + OS accessibility, reduced data, low-memory and hidden tab; optional physics/GPU. Test memory, performance, screen reader and real devices.

**LC-10 / Protected release readiness** — exact-head tests and screenshot parity at 1440, 390 and 320, source/asset hash, A/B cross-member privacy, moderation state and pending/withdrawn tests, rollback artifact, performance evidence, explicit owner creative acceptance in #335 and separate production authorization in #655. Deploy only via verified protected release chain after V131 is dealt with.

## 7. Test matrix and proof semantics

The isolated standalone concept has local Chromium coverage: 11 views × 6 widths = **66 reflow cases**, plus **35 interaction/runtime checks**, totaling **101**. Cases include map/list, deep links, district selection, filtering/search, saved-in-memory items, explicit module Up/Down/re-add, motion controls, focus mode, narrative threads, local moderated-composer receipt, identity privacy placeholder, earned-only inspection, keyboard command palette, and future-gated Assembly handling. A real bug in the document click handler that suppressed form submission was caught and fixed before this pass. **17/17 model tests** validate deterministic action/permission gates, no invented role grants, revision/identity/consent, and denial when real features are unavailable. Strict TS noEmit passed. No unexpected network requests or uncaught runtime errors were observed under the local browser harness. These findings **do not** prove a compiled React product, physical Safari acceptance, complete WCAG compliance, live account access, D1 migration safety or production CWV.

Source evidence for the original research used to form the concept:
- “Hyper-Modern UI/UX R&D Report: Buildable Interaction Systems Beyond the Conventional App” (ANEVUM research, 2026-10-23): typed action graph, context broker, deterministic component registry, Continuance Canvas, Morphic Navigation, Ghost Dock, Signal Atlas; privacy/accessibility and usability validation.
- “ANEVUM Website UI/UX Redesign Technology Landscape” (ANEVUM research, 2026-10-23): retain React/Vite/Motion; semantic tokens; accessible primitives; optional GPU and browser-native View Transitions; consolidate cascade; separate editorial and workspace density; preserve protected boundaries.
- MDN documentation for [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) (read 2026-10-23): supported progressive state continuity; element-scoped transitions vary by platform and must not be required for navigation.

## 8. Specific owner creative checkpoint

Recommended direction: **The Living Commons** — keep the cinematic entry, interactive Atlas + accessible list, contextual rail and dense organized Signal/Project spaces; make the Cabinet and private My Commons closer to a premium creative workstation. The trade-off is more information architecture and UI density versus the simplicity of the earlier Community concept. The proposed experience is intentionally richer but can be learned through stable navigation and prominent paths.

Owner decision for #335: Review **1440px Commons and Atlas first**, then **390px phone**. Is the District map plus stable contextual tools the right defining community interaction, or should the map be secondary to a more prominent work-centered Signal Board? That decision should guide the next React production integration—not a silence-as-approval assumption.