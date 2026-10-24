# ANEVUM Native Pack V004 — locked Creator Studio integration architecture

**Session:** `ANEVUM.WEB.DESIGN.2026-10-23.001.NATIVE-STUDIO-FORMAT-BRIDGE`  
**Decision record:** [#689](https://github.com/anevum/anevum-web/issues/689)  
**Status:** **LOCKED DESIGN** — source-only documentation, **NOT implemented or deployed**  
**Base visual direction:** [Creator Studio V115 / PR #687](https://github.com/anevum/anevum-web/pull/687), stacked on [V109–V113 / PR #658](https://github.com/anevum/anevum-web/pull/658)

## Intent

ANEVUM Creator Studio is a **single professional creative environment** with shared project identity, owner-only Explorer, versioned source, tools, agents, preview and guarded publishing. Its native file family is the interoperable **import/export + playback + moderated release layer**, not another standalone creator app.

This decision supersedes using V001's standalone **Native Pack Lab** as the principal authoring UI. Preserve and adapt its tested ZIP/manifest readers, declarative player and local packager, plus the audited V002/V003 private review work. Do not duplicate storage, user identities, moderation or the site's original IREN assistant.

## Decision status

| Decision | Status | Source / boundary |
| --- | --- | --- |
| One Studio, V115 Continuance / Instrument Glass chrome, original OrbitalMark | **LOCKED** | PR #687 |
| V109 workspace, V111 revisioned private file Explorer, V112 scenes, V113 UI editor | **Existing draft source** | PR #658, feature-default-OFF |
| Native package family `.anvg/.anva/.anvs/.anvw/.anvp` with versioned manifests | **LOCKED direction; V001 draft source** | PR #486 |
| Native package private quarantine and audited staff text inspection | **V002/V003 draft source; rollout blocked** | PRs #497 / #508 |
| Specialized audio, animation, art and 2D/3D game editors | **Future implementation** | Must be genuinely functional, not decoration |
| Arbitrary HTML5/JS games, public distribution, store and rewards | **Separate gated projects** | No approval or entitlement inferred |

## Canonical architecture

```text
CREATOR STUDIO — one authenticated workspace and visual shell
  Original ANEVUM mark / V115 Instrument Glass / one existing IREN slot
  V109 project tabs, V110 starters and disconnected assistance
  V111 private revisioned Explorer (source of truth, once enabled)
  ├── Scene and story documents (.anevum) — V112
  ├── Declarative interface documents (.ui.anevum) — V113
  ├── Future world documents (.world.anevum, ANEVUM_WORLD_V1) — V115 P1+
  ├── Future audio/animation/art/game editor document schemas
  └── Asset references; originals never embedded into limited text nodes
  Specialized editors — one shared canvas/work surface, not separate apps
  Shared local playtest / player bridge
  Native Pack V004 — typed format registry and version-specific adapters
  ├── Import → validate → preview → explicit source conversion
  └── Export → versioned manifest → portable ANEVUM native file
  EXISTING PRIVATE REVIEW: owner-only quarantine → moderator audit
  FUTURE PUBLIC RELEASE: immutable approved artifact → ANEVUM Player
```

**Do not merge authoring source with distribution packages.** In particular, V111 is currently a revisioned **text** tree with per-file bounds; original audio/video/art belongs in a separately authorized, quota-bound asset service, not encoded into those text files or cached as a duplicate browser database. New persistence requires its own design, tests and release gate.

## Format contracts: preserve compatibility

| Extension | V001 meaning | Studio authoring mode | Export/preview boundary |
| --- | --- | --- | --- |
| `.anvg` | Branching declarative game scenes | Scene/game/world editors, growing in capability | Currently branching scenes; **not** a physics/3D runtime |
| `.anva` | Album + track audio + optional cover | Track sequencing / future audio timeline | Packager + native audio; **not** a DAW |
| `.anvs` | Episode video + optional poster | Storyboard / future animation timeline | Episode packager + browser video; **not** keyframe animation yet |
| `.anvw` | Image pages with captions | Gallery/art + future canvas tools | Image/collection player |
| `.anvp` | Strict Workbench blocks | Private source/interchange | V001 **does not** back up an entire V111 project |

The shared registry must describe `extension`, `packageKind`, `documentSchemaVersion`, `acceptedEditorMode`, `dataOnlyPlayer`, `allowedAssets`, `maxBytes` and `importPolicy`. Every adapter is testable outside React. A future multiformat project package needs a **new, explicit manifest version**, migration/compatibility policy and tests; do not silently change the meaning of V001 `.anvp`.

Unknown schema versions, unreferenced assets, invalid paths, incomplete asset references and executable payloads fail closed. Codec implementations should continue relying on standards such as MP3, WebM, MP4 and WebP rather than inventing proprietary audio/video compression.

## UX, authoring and lifecycle

**Project opening.** The V109 workspace opens owner-authorized project tabs; V111 shows a hierarchical private Explorer. Selecting a native-capable source file activates the right editor mode and inspector inside **the same Studio shell**. Never mount V001's competing full-screen Lab or a second account system. Mobile uses V115's single work surface + selectable bottom sheets, not compressed desktop columns.

**Create and edit.** Use the V115 central canvas/work surface, shared asset shelf, context-aware Inspector, honest Undo/Redo, real dirty/saving/saved/error/conflict labels and existing V111 revision controls. Scene, track, timeline, artwork or world tools vary by document capabilities, but source ownership and Save Revision remain universal. No fake Save or Publish.

**Local import.** File selection invokes format detection and the V001 reader. Show package type/version/claimed creator/rights reminder and preview. Importing into an existing project requires confirmation and a conflict-safe, authorized operation; selecting a file alone must never overwrite a source revision, mint achievements, or publish. V001 `.anvp` imports only its supported Workbench contract.

**Local export.** Package only referenced, validated assets and the appropriate versioned source snapshot. Preserve creator credit and provenance; distinguish self-declared credit from verified publisher identity. Export can remain local even while public upload permissions are disabled.

**Playtest.** Declarative game/story/media experiences route through a unified ANEVUM Player component family with local URLs revoked after use. Future executable creator games/applications are **not** permitted within the logged-in Studio origin; they require a separately registrable, audited sandbox origin and reviewed scoped communications.

**Publish.** Keep V002 category-bound native quarantine, owner allowlists, staff review and V003 audited text synopsis behind independent default-OFF flags. The future publication path requires rights/age declarations, content scanning and media transcoding as appropriate, moderator approval, immutable release IDs/hashes, reporting/takedown, cost controls and rollback. A **project category** is not equivalent to a native **file kind**; broaden V002 mapping only through a reviewed versioned policy, never an implicit fallback. Public publication and any creator achievements are separate permissions and workflows.

## V004 staged implementation

1. **V004.1 registry + contracts.** Extract typed, pure format/source adapter interfaces from V001 into reusable code; preserve old package reader tests. Define exact version/error/asset behavior. Zero UI or backend changes.
2. **V004.2 Studio shell adapter.** Add an opt-in native-format inspector/action surface to the existing V109/V111/V115 Studio under a separate flag (OFF by default). No second shell and no unapproved database writes.
3. **V004.3 round-trip.** Test export → local player → user-confirmed import for each V001 kind; validate schema and ownership conflicts; verify stale versions and tampering fail.
4. **V004.4 player bridge.** Reuse one responsive player shell in the Studio local playtest and future approved public surface; do not serve arbitrary code.
5. **V004.5 tool growth.** Build real 2D game, storyboard/keyframe, audio timeline, gallery/art and optional world tools as independent validated capabilities, not speculative menu entries.
6. **V004.6 publishing reconciliation.** Map V002/V003 to owner-authorized source revision, immutable release manifest and rights/moderation gates; stage only after explicit storage/DB/rollback authorization.

**No frontend flag enabling, R2 migration, D1 schema application, Worker deployment, public release or GPU-server purchase is authorized by this ADR.**

## Definition of done — for integration, not merely mockups

- A verified project owner can create/edit/save/reload source in the existing revision system and explicitly export a valid native package; reimport after confirmation without lost data, silent schema downgrade or stale writes.
- A different member and a guest cannot enumerate or retrieve drafts; independent staff cannot inspect binary media except through separately authorized service capability.
- Tested desktop **1440 px**, phone **390/320 px**, tablet, keyboard, zoom, reduced motion, *actual* Safari where required, invalid/imported packs, memory/Blob URL cleanup and unsupported GPU fallback.
- Existing V115 theme and mark are used as-is; preview labels and actions accurately distinguish fully working tooling from future concepts.
- Focused native package tests, existing V109–V113 Studio tests, V115 visual QA, V002/V003 private-review tests and exact-head sitewide CI all pass after reconciliation.
- Independently restored actual-bound canonical D1 backup, reviewed V111 migration 0014 and V003 audit migration 0010, explicit staging authorization and release rollback are required **before** data-plane activation.

## Parent dependencies and change control

- [Locked decision / integration owner #689](https://github.com/anevum/anevum-web/issues/689)
- [V115 Instrument Glass / #687](https://github.com/anevum/anevum-web/pull/687)
- [Studio integration / #658](https://github.com/anevum/anevum-web/pull/658)
- [Native V001 / #486](https://github.com/anevum/anevum-web/pull/486)
- [Native private quarantine V002 / #497](https://github.com/anevum/anevum-web/pull/497)
- [Native audited review V003 / #508](https://github.com/anevum/anevum-web/pull/508)
- [Product doctrine #344](https://github.com/anevum/anevum-web/issues/344), [creator publishing #329](https://github.com/anevum/anevum-web/issues/329), [board #325](https://github.com/anevum/anevum-web/issues/325)

Changing a LOCKED architecture item requires an explicit owner-approved amendment to #689 and this ADR. Continue implementation incrementally; do not restart existing source, discard prior validations, or silently merge the stacked PR branches.
