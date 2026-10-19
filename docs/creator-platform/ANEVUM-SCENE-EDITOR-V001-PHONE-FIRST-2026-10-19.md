# ANEVUM / Scene Editor V001 — Phone-First Interactive Design

**Session:** `ANEVUM.WEB.DESIGN.2026-10-19.002.PHONE-FIRST-SCENE-EDITOR`  
**Scope:** Detailed interface, behaviors, project contracts and prototype for Canvas · Objects · Visual Logic · Timeline.  
**Product lineage:** Continuance Creator Universe design PR #555; Creator Engine architecture; V091 #554; Native Packs #486; Workbench #466.  
**Status:** Design-only interactive browser prototype. **Not merged, deployed, authenticated, cloud-saved, or connected to public publishing.**

## Design doctrine

One project must support creation, animation and gameplay through **shared scene objects**. A novice using only a phone should be able to add and position an object, create an event, animate it, and press Play within the same workspace. No ZIP, JavaScript, file-system jargon or other application is required for the beginner's first playable creation.

The experience should not hide how things work: a character is an object, an object belongs to a scene, an event points to an object by stable ID, and a keyframe changes the same object's properties at a specific time. The creator can gradually uncover additional sophistication without converting their project to an incompatible format.

The V001 prototype deliberately proves this information architecture using a local, declarative sample game (`THE FIRST SIGNAL`). It does **not** implement Phaser physics, real account saves, game-package execution, staff approval, public media storage or a production game engine.

## 1. Screen anatomy

### Mobile / 320–430 CSS px

- **Title rail (67–73px):** small ANEVUM orbital mark, editable project title, honest LOCAL save status, Undo, Redo, Playtest. On narrow phones, the Play icon condenses, retaining its accessible label.
- **Environment notice:** low-profile status band makes it unmistakable that the design prototype is not a cloud-connected ANEVUM session.
- **Scene context:** active scene name, optional GRID and SNAP, fixed logical stage size of `360 × 440` for the prototype. The rendered canvas scales to fit the actual device width.
- **Canvas:** responsive, 9:11 portrait sample composition; original first-party vector-rendered sample, not stock image or fake published work. Objects have visible bounds and handles when selected. Pointer positions convert from CSS viewport pixels into logical stage coordinates.
- **Context strip:** selected object name and current X/Y, with a link to its inspector. Small enough to avoid occluding the artwork.
- **Timeline:** 5-second sample, 24fps semantic target, ruler, scrubbable playhead, object rows, keyframe markers, Add Keyframe and Preview. The timeline scrolls with the page rather than hiding the stage under an enormous permanently fixed panel.
- **Bottom dock:** Scenes / Objects / **Add** / Logic / Animate. The Add button is the primary local creation action. Each tool opens a safe-area-aware bottom sheet with an explicit Close control. Sheets must honor mobile keyboard resizing, focus management and `prefers-reduced-motion`.

### Desktop / >=851 CSS px

- Same title and play controls.
- Left panel: Scenes and Objects, including hierarchy and selection.
- Center: responsive canvas with visible scene context, then timeline.
- Right: persistent Inspector and a compact Logic summary. Logic editor opens as a focused modal to preserve space for complex event rules.
- No separate source of truth on desktop. Switching devices should eventually reopen the same canonical private revision after authenticated save.

### Visual system

Match existing V091 Continuance identity: `#070D18` background, `#0D1728` panels, `#131E32` raised surfaces, `#EEF4FF` primary text, `#B4C6DF` secondary text, cyan `#A4E6EE` for creation and selected state, violet `#C7B9F3` for timing/events and rose `#E2BFCF` for earned/archival accents. Typography is editorial serif for project/section names, readable sans-serif for controls. The interface uses original grid/ring iconography and a quietly animated celestial canvas with reduced-motion fallback. No oversized art banners or intrusive assistant overlay.

## 2. Canvas and object placement

**V001 interactions:** Tap/click selects the topmost visible object. Selected objects show dashed bounds and four handles. A pointer drag translates its X/Y in logical scene coordinates. GRID displays 30-unit guide lines; SNAP rounds moved coordinates to a 10-unit increment. Numeric inspector fields are an alternate precise and keyboard-accessible input. Object naming, X/Y, scale, opacity, visibility, position lock, duplicate and removal work without editing raw JSON.

**Target real product interactions:** two-finger pan/pinch-to-zoom that does not accidentally move objects, optional transform handles for resize/rotate, grid presets, safe-area layout guides, editable z-order, multi-selection, align/distribute, guides and undo/redo transactions. Selection must never depend solely on hover. A deliberate drag threshold prevents accidental movement on taps; locking excludes pointer manipulation. Keyboard arrow nudges move selected objects by one unit, Shift+Arrow by ten units.

**Coordinates:** fixed logical scene width/height per scene, device-independent unit system. Screen pointer mapping is `(screenPoint - contentBounds) / displayedScale + cameraOrigin`. Rendering scale never changes stored object coordinates. An object's transform is `x, y, scaleX, scaleY, rotationDeg, opacity, anchorX, anchorY`. V001 prototype uses uniform scale and basic rotation semantics. Every object has stable opaque ID, declared type, bounded properties, visibility and a validation contract.

**Default sample objects:** Wayfinder character, Signal crystal, Aperture portal and scene title. Add menu includes Character, Signal, Portal, Text, Star and Shape. Those are prototype primitives, not a promise that original asset uploads or custom character drawing is already deployed.

## 3. Visual Logic / no-code events

An event rule is a **typed, declarative WHEN / SUBJECT / THEN / PARAMS record**, e.g.:

```json
{
  "id": "rule-signal",
  "trigger": "tap",
  "subjectObjectId": "signal",
  "action": "add_score",
  "parameters": { "amount": 1 }
}
```

V001 demonstrates WHEN `Play starts` or `Object tapped`, THEN `Add to score`, `Pulse`, `Switch scene`, or `Hide object`. Scene changes target a real scene ID, never a URL. Rules reference object IDs rather than names (names are editable); deleting an object removes or explicitly invalidates rules that reference it. There is no `eval`, JavaScript code injection, API access, network command or client-origin XP minting.

**Target 2D engine event graph:** WHEN `Scene entered`, `Pointer pressed`, `Tap`, `Collision`, `Timer`, `Variable changed`, `Animation complete` → IF bounded typed conditions → THEN `Move`, `Show/Hide`, `Set variable`, `Score`, `Play sound`, `Transition scene`, `Start animation`. Each node requires a schema version, allowed type, bounded parameters and reference checks. Detect dangling connections and no-termination loops before saving or publishing. Permit node reordering and accessible choose-from-list alternatives to graphical wiring.

**Playtest separation:** rules execute against an ephemeral runtime copy. Score, hidden objects and scene transitions are *play state*, not edits; exiting Play restores the editor and its unsaved changes. Only server-confirmed platform activity can earn member XP, not game event packets from an untrusted creator runtime.

## 4. Timeline and animation semantics

V001 illustrates a shared object timeline with keyframes at 0–5 seconds. Selecting an object and adding a keyframe stores its position at the playhead. Dragging an object at t>0 updates that time position; dragging at t=0 updates its base transform. Tweening uses deterministic easing (simple smoothstep in the prototype). Scrub updates the visible frame without running game events. Preview advances playhead and stops at timeline end. A keyframe marker can be selected to seek directly to its time.

**Next real milestones:** tracks for translation, rotation, scale, opacity; per-keyframe cubic/step interpolation; anchored motion; nested clips; animation state machines and transitions; frame-by-frame drawing, onion skin and reusable sprites; markers, sound waveforms and lip-sync guides. Save keyframes as typed, bounded records using the same stable object IDs as the canvas and logic. A move at one timestamp should produce **one undoable editing transaction**, not hundreds of history entries. Frame duration and FPS can change without silently distorting a clip's real-time duration.

**Suggested production data:**

```json
{
  "objectId": "signal",
  "property": "transform.position",
  "keyframes": [
    {"timeMs": 0,"value": [254,245],"easing": "linear"},
    {"timeMs": 2500,"value": [251,214],"easing": "ease-in-out"},
    {"timeMs": 4700,"value": [254,245],"easing": "ease-in-out"}
  ]
}
```

The prototype stores a simplified `keys: [{t,x,y}]` form for clarity, not a finalized canonical schema. A future migration can map it into typed property tracks, versioned against the Native Pack/Studio document schema.

## 5. Editor state model

- `EDIT_IDLE`: stage displayed, nothing selected; Add/Scenes/Objects available.
- `EDIT_SELECTED`: one real object selected; context strip and Inspector reflect its immutable ID.
- `POINTER_DRAG`: pointer capture with a single undo record after release; cancel restores last valid state where required.
- `INSPECT`: sheet/modal shows object properties; edits flow into same project document.
- `LOGIC`: choose/edit typed rules; invalid target blocks publication and suggests repair.
- `SCRUB`: playhead changes frame, no gameplay side effects, no server mutation.
- `TIMELINE_PREVIEW`: playback of timeline position only; stop leaves editable state intact.
- `PLAYTEST`: isolated ephemeral game state with its own restart and accessible Exit.
- `LOCAL_PENDING` / `SERVER_SAVING` / `SERVER_SAVED` / `OFFLINE_QUEUED` / `CONFLICT` / `SAVE_FAILED`: production save-state contract. The prototype supports only a clearly labelled local browser save, with JSON export as a fallback.

Transitions that would discard user data require a confirmation or safe recoverable draft. A future real service must surface a revision conflict instead of overwriting whichever device last saved. Avoid treating local browser storage as private cloud persistence.

## 6. Canonical architecture and integration boundaries

Single project identity (server-assigned): `projectId`, canonical `ownerMemberId`, `kind`, `visibility`, current `draftRevision`, separately immutable `publishedReleaseId`. Scene document contains ordered `scenes[]`; each scene has `objects[]`, `rules[]`, `timelineTracks[]`, and a scene-level camera/stage configuration. Reusable assets have owner-scoped opaque identifiers, verified content hashes, rights/provenance, media derivatives and publication flags. Rules, keyframes and scenes resolve references by stable ID. JSON schema validation occurs in client **and server**.

**Native content** stays declarative. Phaser may provide 2D rendering, input and physics under ANEVUM's validated runtime interpreter; it is not a reason to execute user-authored JavaScript in the member session origin. Advanced HTML/ZIP authors use the separately reviewed isolated player runtime, not the same-origin native canvas. No direct code execution, account cookie/API access, RHEN access, staff grants or filesystem permissions from a creator document.

**Persist / publish adapters (planned):**

1. `GET private project + revision` (owner-only) → validate schema → load editor.
2. Debounced `PATCH draft` with revision precondition and idempotency → server-confirmed saved indicator; retry and conflict reconciliation.
3. `POST private preview` or safe local-native interpreter → never exposes draft to guest.
4. `POST submit` snapshots reviewed metadata/assets/document hashes; independent reviewer can approve only after validation/moderation.
5. Immutable `ApprovedRelease` → idempotent public projection to Discover and, when profile visibility permits, creator's `/@handle` project grid.
6. Update creates another draft/reviewed release, not a mutation of published assets. Takedown revokes play promptly and preserves audit data.

Cross-D1 member/public projections require an outbox/reconcile path; never assume distributed atomic commits. No duplicate `Creator V1` identity based on matching handles or emails. Profile privacy and project public status are separate explicit choices. Preserve existing owner/reviewer and earned player-card data.

## 7. Accessibility and touch acceptance

- All touch actions should meet 44×44 CSS px, including Close/Undo/Play and the bottom dock.
- Screen reader access to an **object list** and numeric properties; canvas is additional visual affordance, not sole editing method.
- Semantic Select/When/Then controls; accessible event lists as an alternative to graphical connection lines.
- Clear focus return after closing sheets, Esc-to-dismiss, focus trap within modal, `aria-live` for save and playtest changes.
- iPhone Safari safe-area insets, dynamic toolbar height, onscreen keyboard resize, browser Back, orientation, reduced-motion and 320px compact-header behavior.
- No forced landscape. Aspect-ratio preview modes should never force page overflow or require precision dragging on a phone.
- Accessible error states for loss of storage/quota, failed preview, inaccessible media, revoked content and invalid scene targets.

## 8. Prototype interactions and limits

Open the self-contained `ANEVUM-Scene-Editor-Interactive.html` and try:

1. Tap a character on the canvas, move it, inspect X/Y, Undo/Redo.
2. Use ADD → STAR; select it; set visible/locked; duplicate or remove.
3. Open LOGIC: inspect `WHEN Signal crystal tapped → Add 1 to score`; create/change another safe rule.
4. Scrub the timeline to 2.0 seconds; add a keyframe; drag an object at the playhead; Preview its motion.
5. Playtest; tap the cyan crystal, verify score; tap the aperture to change scene; exit and return to edit.
6. Export JSON as a **local design artifact**. This file is not a native `.anvg` release or a published project.

The demo's 360×440 stage, preset glyphs, short 5-second timeline, 12-scene/25-object caps and local browser save are illustrative; they are not proposed production quotas. The project has no real image/music ingestion, audio rendering, collision physics, editable sprite drawings, multiplayer or production upload integration.

## 9. Build plan and QA gates

**Gate A — Finish V091 release acceptance:** authenticated owner and independent reviewer, project identity and route behavior, responsive screenshots on real device, guarded rollback.

**Gate B — Native editor foundation:** reconcile Workbench #466 and Native Packs #486 into canonical Studio; implement typed shared scene document, owner-only private D1 revisioned drafts, accessible phone editor, selection/drag/inspector, undo/redo, document import/export migration tests.

**Gate C — Real no-code vertical slice:** start two-scene project on iPhone, add character/signal, author typed tap event and keyframe, play locally, save/reload safely, submit, independent reviewer approves, guest plays it on a separate trusted native renderer, and public optional creator space indexes the genuine release.

**Gate D — Practical engine:** Phaser-backed sprite/tiles/collision, touch/key input mappings, event graph, audio, camera, real art assets and robust mobile preview. Prevent runaway scripts/loops and cross-account data exposure. Use measured performance budgets on lower-end phones.

**Gate E — Animation studio:** shared object timeline with transformations, frame-by-frame layers, onion skin, keyed opacity and clips, audio synchronization and honest device-specific export capabilities.

**Open browser acceptance:** static and scripted DOM-stub source checks in the delivered package pass; this execution environment's Chromium has administrative URL restrictions, so real hosted Chromium and iPhone Safari acceptance have **not** been completed. No claims of screenshots of a live deployed ANEVUM editor.

## 10. Non-goals for this design handoff

No production merge, Cloudflare changes, D1 migrations, account/staff/reward/XP writes, public upload, hidden media exposure, license acceptance, minor enrollment, remote code execution, hosted gameplay credentials or spending. Preserve V091/Studio/alpha infrastructure and existing published projects. This is a design and local prototype handoff intended to be integrated behind reviewed feature flags in a separate implementation assignment.