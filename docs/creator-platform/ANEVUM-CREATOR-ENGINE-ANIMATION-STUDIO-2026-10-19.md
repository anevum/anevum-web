# ANEVUM Creator Engine + Animation Studio — Unified product and technical design

Session: ANEVUM.WEB.DESIGN.2026-10-19.001.PHONE-FIRST-CREATOR-UNIVERSE  
Companion to: docs/creator-platform/ANEVUM-WEB-PHONE-FIRST-CREATOR-UNIVERSE-2026-10-19.md  
Status: PRODUCT / TECHNICAL DESIGN ONLY — NO DEPLOYMENT, DB MUTATION OR FEATURE ACTIVATION  
Lineage: V091 #554, design PR #555, engineering board #325, publishing #329, doctrine #344  
Release constraint: Do not extend production while V091 authenticated acceptance and guarded release remain unresolved.

## The governing decision

ANEVUM will have a single creator platform that can evolve into a genuine browser-based 2D game engine and animation authoring suite, while also supporting interactive stories, images, audio, episodes, educational tools, and independently imported web apps.

A creator owns one canonical account, one editable project record per creation, any number of private project revisions, and a separately authorized immutable public release history. A public profile/space is an optional presentation of the person's released work, not a second identity or project database.

**No-code entry, pro-grade ceiling**: a first-time phone user can make a short branching game by adding a scene, character or choice and pressing Play, without ever seeing code, ZIP, raw JSON, or a settings wizard. As the creator gains skill, the same project can expose layers, timelines, reusable objects, gameplay events, physics, and code-import tools where authorized.

**Not a Unity clone**: ANEVUM owns its editor UI, format, event system, publishing, collaboration contract, identity, and runtime orchestration. Use mature permissively licensed browser rendering/physics libraries as implementation dependencies; verify package versions/licenses during implementation.

## Product families and realistic rollout

| Project family | Initial native entry | Serious later capability | Runtime/security notes |
|---|---|---|---|
| Games | Branching stories, interactive choices | 2D platformer, top-down, puzzle, arcade, turn-based, RPG, tilemaps, collisions, scores, variables, savepoints | First native game artifacts are declarative, not arbitrary user scripts |
| Animation | Scene slideshow and media sequences | Flipbook, layered drawing, keyframe timeline, transforms, easing, sprite rigs, camera movement, effects, synced sound and voice | Interactive animation can play natively; MP4/GIF/WebM encoding is a separate export pipeline |
| Interactive comics/books | Structured pages, choices, image backgrounds | Panel layouts, speech bubbles, branching panels, voiced/animated pages | Safe native renderer |
| Digital art/gallery | Ordered images and captions | Drawing canvas, brushes, shapes, layers, sprite sheets, filters | Private originals retained, separate preview derivatives |
| Music/audio | Upload and arrange tracks with covers | Sound effects, loops, sequencer, audio timeline, waveform editing, voice-over, basic mixing | Browser audio unlocks only after user interaction; no unbounded cloud mastering promised |
| Video/series | Ordered uploaded episodes and poster | Timeline trims, overlays, captions, transitions, audio sync | Original video remains moderated; on-device encoding varies by browser |
| Educational | Branching lessons/quiz | Simulations, virtual labs, interactive diagrams, variable-driven miniapps | Same validated data-only engine as games |
| Apps/utilities | Forms, calculators, surveys, dashboards, simple websites | Restricted data connectors, scripts, API-backed apps, advanced layouts | External network/code privileges require separate audited permissions |
| 3D | View an earned 3D collectible or approved scene | Low-poly worlds, cameras, materials, animated models, simple physics, 3D games | Optional 3D engine/module only after 2D workflow passes phone acceptance |
| Imported builds | Existing live self-contained HTML pilot | HTML/CSS/JS ZIP packages and possibly recognized framework exports | Always isolated execution origin with reviewed immutable release and explicit security policy |

“Make anything” refers to a progressively broad set of creative formats; it is not a promise that a phone browser can compile arbitrary native executables, build app-store-ready binaries, run unrestricted AI agents, edit feature films, or author AAA 3D games.

## Creator paths: two doors, one project library

### Quick Create (default)

1. Tap CREATE from anywhere; choose GAME, ANIMATION, STORY, ART, MUSIC, VIDEO, or TOOL.
2. Choose BLANK or a genuine template; the first-use default is a two-scene game with editable choices.
3. The canvas loads instantly with one clear action: change a scene, add something, or press Play.
4. The creator can play a private local preview at any point.
5. Server-backed private autosave stores an immutable/revisioned document and shows SAVED, SAVING, OFFLINE PENDING, CONFLICT, or SAVE FAILED with a real retry.
6. Optional IREN gives brief contextual hints, such as “Tap + to add a character,” without inserting intrusive overlays or publishing anything.
7. Creators name, credit and label the completed version, then SUBMIT FOR REVIEW.
8. Independent staff review approves a fixed, checked version; only then does it appear in Discover, the canonical project player, and a public creator space when the profile is deliberately public.
9. Creator may create v2 while v1 stays available; published links remain stable through reviews and rollback.

### Import a project (advanced)

The same Studio supports the current alpha self-contained HTML upload and accepted image/audio/video/PDF formats where actually enabled. Evolve it to strict portable native pack import and then ZIP app/game import after independent sandbox, malware/asset inspection, reviewer, and legal gates. Do not silently import/relabel legacy V1 creator identities by matching display name or handle.

## Editor layouts

### Phone portrait editor

- Top rail: Back, project title, server save status, Undo, Redo, Play.
- Stage: actual viewport canvas with fit/zoom/pan; support portrait and landscape project aspect ratios without flipping the overall editor layout.
- Bottom tool dock (one row with accessible sheet): ADD, SCENES, OBJECTS, ANIMATE, LOGIC, AUDIO. Hide unavailable controls according to project kind.
- Each dock item opens a safe-area-aware bottom sheet with a clear Close control. Never crowd the stage with desktop-sized panels.
- Tap selects an object, two-finger pinch zooms/pans, and touch handles can move/resize with snap/grid; offer equivalent numeric position controls and an accessible object list.
- Scene list is a scrollable sheet, not a huge homepage-style navigation. Drag sorting has accessible Move Up/Down buttons.
- Canvas playtest can expand into immersive mode; returning does not destroy unsaved edits.
- Tooltips and optional IREN explanations are context-sensitive, short, dismissible and nonblocking.
- Keyboard input, orientation change, background/foreground, back navigation, reduced motion, and safe areas are first-class acceptance cases.

### Desktop advanced editor

Same project document and runtime, with resizable scene/object tree on the left, live canvas in center, contextual inspector on the right and optional bottom timeline/event graph. Expose a deeper interface only when requested; do not force professional complexity onto mobile Quick Create.

### Studio project shelf

ALL, DRAFT, SUBMITTED, CHANGES REQUESTED, PUBLISHED, ARCHIVED; each card shows real cover, title, project kind, last saved revision and a legitimate actionable status. Start/Edit/Preview/Submit manage the current draft; Manage Release/Versions/Analytics manage published work. No fake “plays”, revenue, followers, thumbnails or engagement counts.

## Native 2D game engine (target)

Recommended default renderer/runtime: Phaser, because it already offers 2D scenes, WebGL/Canvas, input and physics for browser/phone games. Build ANEVUM-owned tools and validated event documents around it. PixiJS can be reconsidered for low-level custom rendering if benchmarks show Phaser is a poor fit, but don't put two equivalent 2D runtimes in the first release. The engine is a host component, not a mandate that members write JavaScript.

Runtime object model:

- Project: title, kind, canonical owner ID (server-side), runtime version, platform/viewport settings, chosen aspect ratio, input policy, locale and content advisories.
- Scene: ordered layers, camera, stage size, background, objects, rules, entry/exit transitions.
- Object: unique stable ID, type (sprite, text, button, region, trigger, tilemap, audio emitter, camera, particle), asset reference, transform, collision shape, properties, components and animations.
- Logic: validated event graph with triggers and bounded actions, typed variables, timers, conditions, state transitions and references.
- Timeline: frames/seconds, keyed property tracks, clips, easing, markers, synced sound and optional transition events.
- Assets: opaque approved object IDs and manifest-checked content hashes, MIME, size, dimensions, copyright/source and derivative references.
- Release: immutable bundle manifest + reviewed attribution + stable public project ID.

Examples of safe visual logic:
- WHEN START -> set score to zero; spawn character at start point.
- WHEN LEFT BUTTON HELD -> move character left at fixed speed.
- WHEN PLAYER COLLIDES WITH COIN -> add 1 to score; play pickup sound; hide coin.
- IF SCORE >= 5 -> go to Victory scene.

The runtime interprets an allowlisted typed event/command schema with validated targets; it NEVER evaluates strings as arbitrary JS. Loops and spawned objects have per-project limits to prevent runaway projects. Creator-authored code belongs only in the isolated advanced import/runtime tier.

Gameplay capability targets after the initial branching slice: sprite atlas support, object placement, collision and platform physics, touch controls and keyboard remapping, local savepoints when authorized, animation state machines, audio bus, HUD/text, reusable components/prefabs and templates. Multiplayer, online leaderboards, payments and game-to-account APIs are explicitly separate projects with anti-cheat/privacy/abuse review.

## Animation Studio (shared with games, not a competing service)

A project can enter ANIMATE mode or be an animation-first project. Its objects, layers and assets share the same editable project schema with games.

Minimum useful animation stack:
1. Frame-by-frame: draw, duplicate frame, onion skin, layer visibility, brush/eraser and adjustable frame rate.
2. Keyframes: choose an object and set position, scale, rotation, opacity or color at time markers; interpolate using easing.
3. Timeline: multiple layers/tracks, drag or accessible move/reorder, scrub/pause/play, shot length, loop and playback range.
4. Motion/camera: pan/zoom, fades, basic masking/transitions, particles later, audio markers and captions.
5. Characters: sprites first, reusable body-part transforms and 2D rigs later; 3D skeletal import much later.
6. Interactive playback: tap/click branches and state machines using the same validated events as games.
7. Export: lossless native ANEVUM editable project and approved interactive ANEVUM player format first; then MP4/WebM/GIF and sprite-sheet export using supported browser codecs or an explicitly quota-limited background render service if approved.

Mobile export should feature-test media APIs and codecs; display truthful per-device capabilities and never promise 4K/60 fps rendering on every phone. Store source artwork, not only lossy preview encodes. Limit CPU/memory, prevent giant scene/image allocations, and warn before unusually large local rendering tasks.

## Future 3D Studio

Use an optional Babylon.js module for low-poly environments, approved glTF model import, camera/picking, materials, animation and physics. Ship after robust 2D game and animation editing is independently tested. Scope the first 3D release to templates, scene arrangement, a few behaviors and import of licensed assets; do not imply a full Unity/Unreal feature set or console publishing. Use WebGL fallback where WebGPU/device support is unavailable and conservative graphics profiles on phones.

## Broader app/tool studio

Non-game apps can use safe reusable UI blocks, tables, charts, forms, decision rules, local calculations and approved dataset assets. Treat third-party API access, authentication, persistent multiuser state, server-side computation and AI model calls as gated managed capabilities requiring separate credential storage, quotas, permission UI, rate limits and explicit app review. A creator's content never receives canonical account cookies, private ANEVUM keys, staff APIs, RHEN access or arbitrary network execution permission by default.

## Storage, rendering, origin and safety

- Preserve the existing Better Auth canonical member ID and staff owner/reviewer grants.
- Private draft data and project metadata stay owner-scoped; persistent revisions use D1/appropriate durable storage. Asset binaries live in private R2 with bounded quotas and verified derivative processing. No unlimited uploads/free GPU promise.
- Native pack format is a data-only, versioned portable archive. Reuse existing .anvg/.anva/.anvs/.anvw/.anvp reader/writer prototypes through schema adapters; don't break currently exportable local files. Expand file format only with versioned migrations and tests.
- Client preview of data-only native projects can use trusted engine code interpreting validated JSON. Uploads and advanced HTML/ZIP are untrusted and require independent scan/review and a separately registrable execution origin.
- An immutable, staff-approved public release is the only source of playable published bytes. Account profile visibility and creator attribution remain independent from ability to publish; private creators cannot be deanonymized through artwork, routes, social widgets or staff data.
- Publish uses an idempotent outbox/projection across member and public datasets; do not assume two D1 databases can commit atomically. Revocation/takedown hides public play promptly; preserve audit trail and prior approved assets for controlled rollback.
- All user engagement/XP/reputation updates are server authoritative and abuse-resistant; game code cannot directly mint XP. Sandbox frames receive minimal explicit host messaging only.
- Preserve account deletion/export, content rights and credits, profile earned emblems and security boundaries.
- Accessible mobile UI, reduced-motion settings and seizure-sensitive effect controls are mandatory.

## ANEVUM world / wall integration

A published project is automatically discoverable as a server-derived, real project tile within My Creations and in the creator's PUBLIC world if the member chooses public profile visibility. Private drafts remain solely in Studio. A personal wall may show release updates, but the project's primary source of truth is the release index, not manual wall text.

Project cards contain genuine first-party screenshot/cover, creator's real public player card and earned emblem (only when publicly available), type, safe compatibility label, real status and a Play/Open action. Pinning or rearranging changes display order, not public moderation state.

## IREN assistant

Optional context-aware teacher and creative helper, not an opaque auto-publisher. It can explain events, suggest a scene, outline a sprite animation, point out missing links or help translate a natural-language instruction into reviewed **typed** actions that the creator explicitly accepts. It cannot bypass copyright, age gates, role permissions, moderation, project ownership or user approval for publishing. Keep IREN small in play mode and let the project fill the screen.

## Creator/visitor lifecycle

1. Member A signs in; starts two-scene game on iPhone; autosaves and resumes without losing revision.
2. Member A adds character movement and collision in later 2D engine phase, or starts a 10-second animation clip in Animation mode; preview uses the same public runtime version.
3. A uploads original approved artwork/audio within enforced limits, supplies rights and credits, and submits version 1.
4. Independent authenticated reviewer inspects immutable evidence and safely approves, requests edits, or rejects; A cannot approve own project.
5. Release appears once in Discover and, if public profile choice allows, on A's wall/portfolio and real project player, never on an unrelated handle.
6. Guest B plays and may share without signing in. Authenticated unrelated member B may save, review, comment or report only where feature gates are verified and rules allow.
7. A edits v2 while public v1 stays stable. New approval promotes an immutable version without breaking canonical link; rollback or takedown works without deleting account/progression.
8. Project export and account export preserve creative work and credited collaborators under approved terms.

## Age suitability vs account eligibility

A kid-friendly interface does not itself authorize underage registration. Keep age/legal review explicit: parental/guardian consent where applicable, default private drafts, content advisories, limited messaging, no direct location/contact leakage, staff moderation and approved reporting/takedown. Do not open public accounts to minors until compliant rules and operational review exist.

## Rollout / hard delivery gates

**P0: First complete mobile creation.** Finish V091 authentic owner/reviewer and iPhone QA first; reuse native branching editor + safe Workbench on the current canonical Studio. Add true server autosave, replay, revision conflict, preview and one reviewed public release. Acceptance: a new member creates a playable two-scene story without ZIP, reloads and resumes.

**P1: Creator wall + unified Studio.** Integrate the canonical release bridge and approved release indexes with My Space/Discover, real cover selection, project versioning and moderated basic engagement, with no duplicate identities/portals.

**P2: Practical 2D Game Engine v1.** Phaser-backed scene graph, objects, sprites, touch movement, events, score, simple physics, tilemaps, stage camera and visual level editor; one genuine phone-built arcade/platform game released and playable.

**P3: Animation Studio v1.** Onion-skin flipbook, object/layer timeline, keyframes/easing, audio tracks, native interactive playback, reliable export fallbacks; one phone-authored short animation published and replayed.

**P4: Advanced creators.** Approved multi-file ZIP execution, richer app permissions, data/API integrations and 3D starter/scene editor when security and performance evidence supports them.

Each stage requires exact-head CI, two-account ownership/privacy, guest/public boundaries, independent reviewer, actual iPhone Safari and desktop browsers, network failure recovery, low-end rendering, reduced-motion/a11y, honest analytics, moderation/reporting and rollback. Do not combine new creator capabilities with payments, RHEN, global account changes or premature launch flags.

## Status distinction

Already deployed foundation: narrow reviewed alpha HTML/media publication/player and public Single Drift, as documented October 18.  
Draft only: V091, visual Workbench #466, native packs #486/#497, advanced ZIP #516, this design PR #555.  
Not built: general physics/event game editor, shared timeline animator, full 3D authoring, cloud rendering/exports, and the completed unified creator-to-public-space release bridge.

This document specifies future product implementation. It does not claim these features work in production and authorizes no new infrastructure expenditure, migrations, account writes or publishing.
