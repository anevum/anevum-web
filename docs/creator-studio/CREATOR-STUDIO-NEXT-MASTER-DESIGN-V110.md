# ANEVUM Creator Studio Next — Integrated Master Blueprint V110
## Professional browser creation environment: games, apps, websites, stories, simulations, and OpenAI connected agents

**Session:** `ANEVUM.WEB.DESIGN.2026-10-22.002.OPENAI-AGENT-CONNECTION`
**Status:** Master long-term design. Design approval and code implementation remain separate.
**System owner:** ANEVUM WEB / Creator V1.
**Current implementation:** First source-only private multi-tab workspace slice [draft PR #638](https://github.com/anevum/anevum-web/pull/638), built on the approved release branch. Other professional editing features here are design candidates, not active.
**Primary board:** [Creator Studio Next #635](https://github.com/anevum/anevum-web/issues/635).
**Agent subsystem:** [V110 requirements](./CONNECTED-AGENT-SYSTEM-V110.md), [UX](./CONNECTED-AGENT-UX-V110.md), [technical spec](./CONNECTED-AGENT-ENGINEERING-V110.md).

## 1. Product promise and honest scope

**Creator Studio is a professional browser application for designing, building, testing, maintaining and publishing digital creations within ANEVUM.** It should feel like opening purpose-built creative software, not a series of website forms. It must remain approachable to beginners through progressive disclosure.

The eventual "build any app" ambition is a direction, not a guarantee that the browser can safely execute every workload. Organize creation modes by real artifact type and a documented runtime/export target. Preserve the existing **creator-hosted-first** doctrine for the public network: discovery/publishing records remain the default; ANEVUM-hosted executable runtimes are separately approved and isolated.

### Supported families, stages

| Creation family | First working slice | Later development |
|---|---|---|
| Interactive fiction | Existing Workbench declarative scenes/choices, after pilot permissions and schema activation | Visual branching graph, reusable story variables, localization, narrative conditions |
| 2D games | Structured scene/layout objects and previewable interactions after W2/W3 | Sprites, collision and physics rules, particles, audio tracks, state machines, tile maps, animation timeline |
| Interactive websites | Visual page layout with responsive breakpoints and safe component palette | Advanced routing, collections/content bindings, deployable source exports |
| Browser applications | Form, display and data-flow components with restricted runtime | Local data models, validated API adapters, secure environment variables, audited backend bridges |
| Creative simulations | Declarative scene/parameter models and safe preview widgets | Physics/graphics workspaces, advanced rendering and simulation exports |
| Code-first projects | Import/export known browser HTML/ZIP packages already supported for uploads | Real versioned source files, editor, dependency manifests, tests, external Git integration |
| Native OS apps, arbitrary backends | Explicit **unsupported** capability during first release | Separate execution/build service + security/compute economics review |

Do **not** simply embed a full Unity/Godot-like engine without validating memory, accessibility, source portability and phone usability. Godot's own browser editor has meaningful limitations; ANEVUM should start with small, coherent native browser creation primitives rather than making a heavier imitation.

## 2. Unified information architecture

```text
ANEVUM
└── Creator Studio / One existing verified member identity
    ├── Studio Home / recent projects / templates / updates
    ├── Project Workspace
    │   ├── Top bar (project selector / save / preview / review state)
    │   ├── Left activity rail
    │   │   ├── Explorer and nested folders
    │   │   ├── Global project search
    │   │   ├── Components / assets / layers
    │   │   ├── Scenes / flows / code
    │   │   ├── Versions / releases / diagnostics
    │   │   └── Connected Agents (OpenAI initially)
    │   ├── Multi-document tab strip
    │   ├── Center editor: visual, code, graph, story, animation or preview
    │   ├── Context Inspector: properties, events, layers, responsive settings
    │   ├── Agent Dock: scoped context, task thread, diff approvals, usage
    │   └── Bottom dock: console, validation, build, trace, history
    ├── Existing playable upload and private versioned player
    ├── Existing rights/disclosure/review workflow
    └── Existing public creator profile/project publishing after staff approval
```

Never maintain two competing "Studios": existing canonical record editor, native package uploader/player and gated Workbench must be mounted or deep-linked under one coherent interface as each becomes ready. Preserve old routes, resource IDs, ownership, migrations, and user-created content.

## 3. Desktop/phone design and command model

**Desktop:** persistent app bar; resizable left Explorer (~240–320px) and right Inspector/Agent Dock (~340–450px); center scene/editor gets remaining width; optional bottom diagnostics. A very narrow center automatically collapses secondary panels rather than causing horizontal overflow. User can pin Agent Dock, Inspector, or switch between them; both never demand four simultaneous narrow columns. Editor tabs can be reordered, pinned, closed, reopened, deep-linked and restored, with unsaved indicators that reflect actual state.

**Tablet:** activity rail + one flexible side panel; file tree and Agent Dock open on demand. Touch-first property editing, no hover-only instructions.

**Phone:** top document selector, bottom/segmented actions for Files, Editor, Preview, Agent, Properties; full-screen panels with explicit Back, safe-area and dynamic viewport support. Do not cram a desktop coding IDE into an iPhone. Basic create/edit/preview/approve should work; dense visual graph/animation tools may offer a focused or reduced feature mode with honest explanation. The existing iPhone Expand Player bug #631 is a tracked prerequisite for declaring fullscreen preview complete.

**Command palette:** search projects, files, recent documents, scenes, tools, preview, export and Agent actions. Avoid conflicting with global ANEVUM keyboard shortcuts. Keyboard redo/undo apply to the active editor only, never to server review/publishing. Context menus must have equivalent keyboard-accessible actions.

**Visual style:** Continuance Institute / Orbital Underground. Distinct window chrome, subtle luminous cyan/violet selection, dense neutral type, restrained orbital motion, meaningful status lights and no decorative animation that masks performance or errors. Ensure 200% zoom and reduced motion.

## 4. Data and storage contracts

Separate four entities:
1. **Project**: canonical owner, public/discovery details, type/category, edit/review status, accepted release/version. Existing source-of-truth IDs and APIs remain.
2. **Project filesystem (W2)**: reviewed extension with stable opaque node IDs, parent ID, normalized name, file kind, content hash, server-assigned revision, quota and deleted/restore state. Directory structure is not a UI-only illusion.
3. **Editor session/layout**: member-scoped, project-scoped tabs, panel size, recent views, inspector state and last selected file. Keep only metadata in browser; never cache access tokens or protected full source as settings. On sign-out or account switch, clear old identity UI immediately.
4. **Build/release**: immutable review/publish artifact, separate from mutable project source files. Private draft snapshots and public releases never silently point at the same mutable source bytes.

Suggested storage: private D1 indexes/ownership/revisions and R2 content objects for large verified files; choose size thresholds after existing resource analysis. Each mutation requires server authentication, expected revision, idempotency and a conflict UX. File renames/moves must guard cycles, path traversal, collisions, lost edits and concurrent tabs. Deletes use user-confirmed trash/restore where policy allows. Regular backups and actual restore rehearsal precede schema migration.

**Current limit:** Existing narrative Workbench writes bounded declarative content into the existing private Studio description field (28 blocks, 8,000-character encoded description limit). It is a sound first vertical slice, not a general filesystem. The source-tree contract replaces this bottleneck only through approved new persistence, not by weakening existing limits.

## 5. Project Explorer and document tabs

- Tree supports folders, nested folders, files, drag/move, rename, duplicate, sort, local filtering, global search and breadcrumbs. Server ordering and collision behavior are deterministic.
- Files have meaningful type/category icons; no fictitious server-managed folder labels when file APIs are absent.
- Pinned/locked tabs preserve separate semantics from save state; never confuse tabs, branches or release versions.
- Multiple tabs can belong to one project. Cross-project tabs are optional once authorization, dirty edits and context switching work; V109 currently opens project views before full file tabs.
- Closing a dirty document prompts or reliably auto-saves only when server-confirmed autosave exists. Crash recovery provides a user-visible restore, not silent overwrite.
- File search may index only project content the signed-in member can access. The OpenAI agent never gains access from a file appearing in search.

## 6. Editor modes and feature contracts

### Visual UI builder
- Semantic component palette: text, buttons, cards, images, inputs, forms, navigation, containers, custom safe components.
- Selection overlay, resize handles, alignment/distribution, snapping/grid, auto-layout, responsive breakpoints, component tree/layers, style inspector and interactions.
- Save a versioned declarative component graph, with real source export for users who prefer code. No direct injection of arbitrary scripts into authenticated Studio UI.

### Scene/game builder
- Scene hierarchy, object properties, object IDs, 2D camera/viewport preview, sprite/image assets, interactions and collision/event triggers.
- Node graph for scene transitions, state conditions, input events and simple rule chains. Explicit diagnostics for disconnected nodes or invalid references.
- Time-based animation timeline: keyframes, easing, loop boundaries, frame/scene scope; audiovisual previews only through accepted asset pipeline.
- Choose a small controlled first runtime (e.g., declarative 2D scene runner) before pursuing 3D or arbitrary physics stacks.

### Code editor
- Syntax highlighting, find/replace, symbol navigation, linting, completion, diff, schema validation, command palette and workspace search when actual source files are available.
- Evaluate **CodeMirror** for a lightweight/mobile-capable first slice; **Monaco** can serve richer desktop editing but its official site states it is not supported on mobile browsers. Do not force a desktop-only editor into phone workflows. Final editor library requires license/performance/security comparison and a code-splitting budget.
- Source files are editable private project objects. Existing published ZIP/HTML artifacts are immutable release inputs, not the live editable code tree.

### Assets
- Tree/folders plus private upload queue, thumbnails, preview, validation, rights metadata, duplicate detection, quotas and accurate storage usage.
- Images, audio, video and fonts require format/size/MIME/signature enforcement, content rights disclosures and safe rendering. EXIF/location or personally identifying metadata needs explicit privacy policy.
- Transform/transcode services must be scoped after cost review. Protect R2 access; signed URLs/indirect fetch cannot leak other members' assets.

### Preview, testing, and diagnostics
- Instant project validation for declarative documents; real isolated browser build preview for supported formats.
- Device viewport controls: responsive phone/tablet/desktop, orientation, reduced-motion, input/touch and accessibility checks; do not claim accurate native device certification from a desktop emulation alone.
- Preview runtime runs on isolated origin with strict sandbox, no signed-in host cookies, controlled bridge and resource budgets. Runtime logs are sanitized and project-authorized.
- Console reports actual errors, warnings, build steps and run receipts. "Tests passed" only from an executed test runner. Prevent the current fullscreen mobile regression.

## 7. Templates and first-time experience

**Project wizard (eventually):**
1. Pick **Story**, **2D Game**, **Website**, **Browser App**, or **Import Browser Build**; only show cards for modes truly supported and clearly mark previews/coming-soon.
2. Title, short intent, privacy and device target.
3. Open a working starter (e.g. two linked scenes, one simple page, one safe 2D interaction) in the same Studio shell.
4. Complete a tiny task and preview it, not a long questionnaire.
5. Learn Save/History, optional OpenAI agent, and publishing gates only when relevant.

Starter templates are **genuine editable projects**, not nonfunctional marketing mock cards. Keep template data versioned; never overwrite a user's imported project.

**Save/export:** private save, local downloadable source, optional real Git integration later, then independent submit/review/publish. The user owns source and assets under accepted rights policies. No source export equated to public release.

## 8. Connected OpenAI agents as a first-class but optional subsystem

Project-scoped **Agent Dock** shows one real provider **OpenAI**, creator-selected file context, active profile, usage limits, streamed grounded answer, scoped tool outcomes, and change proposals. Suggested role profiles: Builder, Designer, Debugger, Story Architect, QA Observer. IREN remains the native Studio field assistant and navigation guide, not an external AI login substitute.

**Grant boundary:** verified ANEVUM identity + selected owner project + explicit file IDs + current versions + read/propose tool scopes + approved connection and budget. No blanket access across tabs/projects. Files can contain prompt injections; server tool permissions remain authoritative. Proposed changes are staged, validated and shown in before/after diff; creator authorizes saved revision. Independent staff still controls public publication.

**OpenAI connection modes:** a capped owner-approved API pilot is feasible without claiming "Sign in with ChatGPT". Actual commercial ChatGPT website OAuth and possible plan usage require provider approval/permissions; an OpenAI account connection does not automatically import a user's personal ChatGPT, custom GPTs, memories or conversation history. No other provider advertised or implemented in initial release.

**Cost:** founder controls whether pilot calls are enabled; budget limit, per-user caps, rate limits and usage ledger must exist before paid requests. Store secrets only in server-approved bindings/vault.

See V110 subsystem docs for detailed UX, API schema, permissions, cancellation, data handling and launch QA.

## 9. Versioning, publishing and collaboration

**Undo/redo** is editor-local history for immediate operations. **Revision history** is server-verified private project history with immutable snapshots, diff, restore and consistent attribution. **Build numbers** identify tested packages. **Public releases** identify independently approved immutable publications. These are different layers and must be clearly named.

Publishing pipeline remains: edit private project → validate/disclose rights/AI assistance → prepare exact build → creator submits → independent moderation → publish actual release → update project page → iterate with new version. Never let an agent click through moderator checks.

Future collaboration: invite named existing members into a project with narrowly scoped editor/reviewer roles (not ANEVUM staff) and audit trail; conflict resolution and invitations require security/privacy acceptance. Do not bundle live collaborative cursors, real-time sync or chats into the first alpha.

## 10. Security and operational constraints

- Keep canonical Better Auth and server-side ownership authoritative; no client-asserted owner IDs.
- Honor draft/review/public segregation, creator-hosted-first launch policy, copyrights and provenance, malware/phishing moderation, privacy and account closure rights.
- Never evaluate third-party project source on ANEVUM's privileged authenticated origin. Existing package isolated runtime policies are retained.
- All writes idempotent and revision-checked; user can recover from offline/timeout/409 conflict. Project backups actually restored in test environment before production migration.
- Enforce storage/egress/CPU/AI budgets; realistic quotas rather than unlimited media. The UI should not promise unavailable general computing.
- Actual mobile Safari and desktop acceptance remain independent; synthetic browser fixture/CI is necessary, not sufficient.

## 11. Implementation order and milestone acceptance

| Milestone | What ships | Clear evidence | Release classification |
|---|---|---|---|
| **W0** Baseline & bug recovery | Production/source/feature reconciliation, mobile defects tracked, shared visual tokens | Existing creator paths/canonical identity safe | P0 stability |
| **W1** Multi-tab shell | Existing real project/build inventory in tabs and Explorer (draft #638), search and responsive docking | 320/390/1440 browser, authenticated member isolation | Near-term |
| **W2** File tree | Persistent nested folders, create/rename/move/delete, file IDs, quotas, revision API | Backup/restore, conflict test, account isolation | After W1 |
| **W3-A** Story production slice | Existing Workbench scene editor integrated with persistent revision saves and private playtest | Real member creates, edits, exports, previews a story | Highest true creation milestone |
| **W3-B** Visual component UI | Basic responsive page editor, inspector and component tree, export | Form/button layout visible on phone/desktop | Conditional |
| **W4** Safe preview | Isolated runtime and testing dock, fullscreen player repair | Real physical iPhone and cross-account runtime QA | Conditional |
| **W5** Advanced editing | Graph interactions, controlled 2D scene canvas, code editor, timeline, project search | Working export/import and performance/rights QA | Later |
| **W6-A** OpenAI agent pilot | Real connected model, scoped read, guided response, safe proposed scene edits | Consent, quota, audit, visible diff and human save | Optional pilot |
| **W6-B** Agent expansion | More types, integrated validation, code diffs, safe test requests | No secret leakage or publishing authority | After pilot |
| **W6-C** ChatGPT website sign-in | Officially authorized OpenAI OAuth connection | Registered client, PKCE/OIDC, separately granted inference rights | Only if approved |
| **W7** Advanced collaboration | Realtime multi-user editing, trusted templates/plugins/importers | Security, consistency, cost and moderation review | Future |

**Launch guardrail:** January 1, 2027 Creator V1 means authentic discovery, account onboarding, creators/reviewers, working public play, feedback and XP protections. Deliver W1 and an actual small W3 slice; do not delay public readiness to build a universal browser operating system. The agent feature is a major differentiator but remains optional until its security and paid API economics are proven.

## 12. What remains unapproved

This design does **not** approve production DB migrations, paid API usage, new compute providers, public file hosting, commercial OpenAI OAuth, user credential storage, general-purpose application servers, arbitrary code execution, additional AI providers, new user roles, collaboration grants or publication changes.

**Outcome sought:** a single recognizable ANEVUM creative environment that works today for verified project management, grows to authentic games/app authoring and controlled OpenAI-assisted development, and stays safe, performant, accessible and financially sustainable.
