# ANEVUM Creator Studio — Unified AI Workbench and Alpha Publishing System

**Session:** ANEVUM.WEB.DESIGN.2026-10-20.001.UNIFIED-AI-CREATOR-STUDIO  
**Date:** 2026-10-20  
**Status:** DESIGN-ONLY / ALPHA-IMPLEMENTATION CONTRACT — NOT A DEPLOYMENT  
**Repository:** anevum/anevum-web  
**Source lineage:** Creator Universe and Scene Editor #555, safe Workbench #466, V004 isolated package stage #562, V005 compatibility draft #569, V091 integration #554/#568, production/publishing bridge #564.  
**Owners:** ANEVUM WEB / Creator Studio.  
**Security rule:** No changes to canonical accounts, staff authorization, public publishing, production D1/R2, live routes, XP, role grants, payments, or RHEN from this design.

## 0. Executive decision

Creator Studio is **one product with several creation methods**, not a new chatbot site, a second upload portal, or a separate account system.

A signed-in creator may: (A) describe a project to a connected AI, (B) make a supported declarative creation in the visual editor, (C) import a browser-ready HTML/ZIP application, or (D) resume an existing canonical Studio project. Every method resolves to the **same canonical member/project ownership and review lifecycle**. Private working files can change; public release bytes are immutable and reviewer-approved.

**One identity. One project. Many private revisions. Separately verified immutable releases. One player. One wall and Discover projection.**

The initial closed alpha must prove an end-to-end phone-first browser app/game experience; it is **not** an attempt to ship a complete Unity/Hammer/Creation Kit clone, arbitrary Python server, unrestricted cloud IDE, app-store binaries, or always-on free compute.

Use "ANEVUM Creator Studio" for the product, "Workbench" for the authoring surface, "Build Lab" for build/compatibility/revisions, and "IREN" for contextual guidance. Avoid yet another public brand, runtime, member directory, or separate studio identity.

## 1. Locked decisions carried forward

1. Preserve the existing canonical Better Auth member identity and verified staff/reviewer grants. Never infer owner from display names, emails, or handles, and never merge identities from legacy alpha by fuzzy matching.
2. Preserve V091 experience, player cards, auras, real earned recognition and XP, IREN, existing members and published work.
3. Maintain a **single owner-bound project ID** and server-controlled mapping to any isolated package stage record. Do not pretend V004's separate staging DB is already canonically bridged.
4. Browser-ready root index.html ZIP and self-contained HTML are the first advanced executable intake types. V005 can diagnose source-only JS/Python/Godot but cannot execute, ingest as a live package, or automatically build them today.
5. V004's current bounded upload, duplicate SHA checks, serial leases, hourly/daily budgets, private 48-hour test expiry, explicit durable Save, cleanup receipts, and published-release preservation remain authoritative. Never run each AI keystroke through the formal package upload flow.
6. V005 probe findings are advisory. The actual server revalidates ZIP members, extraction budgets, hash, files, and origin before storage/review.
7. Untrusted HTML, JS, WASM and web-engine exports run only in an independently isolated, cookieless execution origin; the main signed-in ANEVUM origin never executes creator scripts.
8. Preview is not publication. Source diffs are not reviews. Human rights attestations are not malware scans. Viewport emulation is not real iOS/Android certification.
9. No self-approval. Reviewer attestation is bound to exact owner/project/release/hash and evidence. Publication defaults off until its separate verified activation gate.
10. Keep native .anvg/.anva/.anvs/.anvw/.anvp prototype compatibility; future native scene projects are typed/data-only, not disguised user JavaScript.
11. New work enters on isolated feature flags/alpha surfaces after the current release consolidation. No route theft from /upload, /play, /staff, existing /studio or the public main site.
12. A child-friendly interface does not authorize underage account enrollment. Minor eligibility/privacy/consent remains a separate legal and operational gate.

## 2. Product promise and target audiences

- A first-time creator with only a phone can tap **Create**, choose **Describe it**, describe "a simple platform game with a double jump," review a proposed file change, play a private preview, ask for an update, and make a review-ready package, without learning ZIP or Git.
- A curious learner can choose **Make visually**, edit an object, a rule, or a small timeline, and playtest a validated scene without connecting an AI provider or writing code.
- A vibe coder can choose **Import**, provide a finished web export, get specific compatibility and repair guidance, inspect phone/desktop layouts, and submit the same immutable bytes.
- A more advanced user can connect a supported AI API, inspect/edit individual files, use an error console and build trace, and export a portable ZIP. Future authorized external agents may use an explicitly scoped remote tool bridge.
- A reviewer can reproduce the exact build that will be promoted, see rights and provenance, review mobile/test evidence and security findings, request changes, suspend, and roll back. No agent has reviewer authority.

The product's differentiator is not "another chat box." It is a **verified creation-to-publication workflow**, with creator ownership and a playable destination already inside the community.

## 3. Information architecture

Preserve the site's real navigation while adding a small, progressive creation entry.

| Surface | Canonical or proposed route | Source of truth |
| --- | --- | --- |
| Create landing | /create (established design destination) | User selects Describe / Visual / Import / Resume |
| Owned projects | /studio | Canonical owner-bound private project library |
| Workbench | /studio/:projectId/workbench (proposed alpha) | Private editor document, current working revision, AI run log |
| Build Lab | Existing /creator-lab/v004 opt-in stage until canonical bridge is tested | Existing V004 preflight, upload, tests, quotas, revision and cleanup |
| Isolated preview | Existing isolated package runtime; additional short-lived working-preview lane proposed | No ANEVUM session cookies/privileged API |
| Staff review | Existing authorized /staff/projects or current package reviewer route until bridged | Independent staff receipt and immutable release SHA |
| Discover | /discover | Approved public release projection only |
| Creator space | Existing canonical My Space / public handle | Owner identity; approved works only, privacy permitting |
| Player | Existing /play or canonical /projects route as the integration plan dictates | Published immutable release, stable project URL |

**Do not create new route owners just because the design uses a conceptual pathname.** Implement alpha routes only after inventorying current production and staging route ownership, and keep route flags default OFF.

## 4. Core experience: one project, four doors

### 4.1 Create entry

The first screen has a single strong primary action and four concise choices:

- **Describe it** — conversational project-building with a supported AI API connection.
- **Make visually** — start with safe story/scene/object blocks and visual logic.
- **Import a build** — file-first compatibility and package path.
- **Continue** — resume an existing saved project or draft.

Do not ask beginner users to choose runtime, schema, framework, platform, file extension, hosting provider, or pricing plan. No obligatory onboarding tour. IREN offers short dismissible contextual help; it is not the same entity as the user's connected AI provider.

### 4.2 First-run project seed

Offer three real starters rather than generic artificial demos: **Tiny Platformer (advanced static-web template)**, **Signal Story (trusted declarative two-scene starter)** and **Mini Tool (static calculator/form)**. Templates must have licensed source files, verified packaging and real preview; never imply Phaser physics exists before it does. Every starter starts privately and supports duplication. Blank remains available.

### 4.3 A single Workbench

**Desktop:** narrow left file/scene navigator, center dominant live stage and adjustable timeline/diagnostics, right agent conversation or object inspector. Collapse panels. Preserve 65–80% space for useful preview when not coding.

**Phone (320–430px):** compact title/save rail; stage first where possible; one focus region at a time through **AI / Preview / Edit / Files** tabs; 44px minimum targets; bottom editing sheet for selected object; no desktop-style three-column squeeze. Keep input above software keyboard and honor dynamic viewport/safe areas. A sticky small Preview/Run action survives panel switches. Avoid forced landscape.

**Tablet:** two-pane AI + Preview by default; reveal Files/Inspector as a drawer.

**Visual language:** Continuance midnight #070D19, surface #0E182B, raised #17253F, text #EDF4FF, secondary #B4C4DC, focus cyan #A6E7EF, orbital violet #C6B3F0, archival rose #D8B8A0. Premium typography, authentic technical tracery, genuine creator project artwork and sparse meaningful micro-motion. No fake ratings, fake "AI completion" screens, stock art, oversized menus, constant moving 3D scenes, or motion-dependent instructions. Reduce animation under prefers-reduced-motion.

**Persistent truth signals:** owner status, Saved / Saving / Offline pending / Conflict / Failed, active revision, private versus public, actual preview compatibility, provider connection and estimated cost, review status, last successful build. Never call a locally modified buffer "Saved" until server confirms it.

### 4.4 Conversational building

Creator asks for something. Agent responds with a plan and **proposed tools**, not an unconstrained shell transcript. Example:

1. Creator: "Make a small space dodge game for my phone."
2. Assistant returns a brief plan: generate 3 static files, include touch input, stay offline, support 390px.
3. Files appear as **pending proposed changes**. A readable change card says: "Create index.html; create styles.css; create game.js." Diff and explanation are expandable.
4. Creator presses **Apply changes**, which commits one atomic private editor revision after server path/schema checks, optimistic concurrency, and secret scan. Undo restores prior snapshots.
5. **Run private preview** builds/renders in an isolated runtime, shows playable frame and real diagnostics.
6. Creator: "Make the blue ship slower and add a pause button." AI sees only project-scoped, intentionally selected context and latest sanitized errors. It proposes a patch; creator reviews/applies.
7. The creator can select an object/property and say "change this" when typed scene context exists. For arbitrary HTML, agent can edit code but the platform must not claim fully structured object control without a scene adapter.
8. **Prepare release** invokes compatibility and verified packaging, prompts for credits, license and AI disclosure, pins exact immutable build.
9. Separate reviewer approves or requests changes; reviewed release appears in Discover and eligible public creator space. Public v1 remains live while v2 is in review.

Agent may explain, repair, and propose; it cannot silently pay, expose data, publish, moderate, impersonate reviewers, mint XP, deploy Workers, access RHEN, or alter account permissions.

### 4.5 Visual editing

For native declarative projects, the canvas/inspector/logic/timeline target remains the already designed Scene Editor V001 and Creator Engine architecture. Objects retain stable IDs, typed transforms, references, event rules and property keyframes. Selection and property changes generate validated typed document operations; IREN and AI may suggest operations, not fabricate executing JavaScript.

For imported arbitrary HTML/ZIP, use **code mode + preview + diagnostics** until optional instrumentation or structured adapters are real. HTML element selection can offer a visual hint/DOM locator, not claim a lossless game scene model. This prevents a misleading "Hammer for everything" promise.

The desktop inspector and phone bottom sheet share a single revision ledger; visual changes and AI changes appear in one undoable project history. A timeline view is visible only for formats that actually support keyframes.

### 4.6 Import detection and repair

Existing V005 compatibility flow remains intact: inspect user-selected ZIP/HTML metadata locally/through authorized bounded probe; identify HTML/static web, WebAssembly, Unity/Godot web export hints, source-only JS/Python, missing root entry, nested dist/, oversized files, suspicious secrets, unsafe paths, bundled node_modules. Return exact blockers/warnings and **actionable repair steps**.

For source-only Python or raw application repositories, display **Needs web build** rather than a fake green Play button. Guided AI may give export/build instructions; no arbitrary backend execution or GitHub clone in closed alpha. GitHub import and reproducible builders are later adapters.

Import is not a reason to bypass current V004 authoritative upload/parser. Optional future anevum.json/AEP manifest is advisory only; it is not required for existing HTML/ZIP exports.

## 5. Workbench connection architecture

### 5.1 Provider modes

**Alpha supported, if integration passes security:** one provider-backed API adapter using separately billed API credentials, with a second provider behind the same stable adapter contract after QA (OpenAI Responses API and/or Anthropic Messages API as appropriate). Each provider is a **model**, not a second project source.

**No AI connection:** Visual and Import remain fully functional. Starter projects and non-AI diagnostics remain available without a billable model.

**Later, access-dependent:** permitted third-party ChatGPT plan usage through official approved Sign in with ChatGPT; Claude subscription identity-to-API is not assumed. Users must not be told that an ordinary chat subscription automatically entitles them to API access. ANEVUM remains the first-party identity and project owner regardless of which provider connects.

**Later, external agent bridge:** remote MCP-style tools with separate authorization, constrained per-project grants, no account token passthrough and project-scoped revocation. ChatGPT, Claude, or another agent may initiate supported tools **from outside ANEVUM** only if its client supports a compliant connection. Do not imply an arbitrary existing conversation can simply be embedded in an ANEVUM webpage.

### 5.2 Cost / consent / secrets

- Explicitly show a provider, model, billing mode, and approximate per-run usage before first model request; hard-stop on user-configured spend/token budget and platform pilot quota. No paid inference without opt-in; default platform-subsidized inference budget zero.
- Prefer provider OAuth only if actually approved and supported. For BYOK, receive keys only through a backend-bound secret exchange, encrypt under separately managed rotating keys, bind owner and provider, redact logs, and never send raw tokens to creator code, third-party iframe, or browser storage. Add disconnect/revoke/export/delete and expiration/error handling.
- Ask before sending project contents to an external AI provider. Limit payload to relevant allowlisted files and metadata; honor private content and personal data policies. Exclude account emails, cookies, internal environment, secret values, unpublished other members' projects and staff records.
- Do not claim zero data retention at providers without a contractual policy. Explain what context was sent and how to remove ANEVUM-side conversational history.
- On a disconnected provider, edits remain accessible; user can keep working manually. Model failure never erases files.
- Alpha uses pilot account + per-user daily run ceilings, per-run token/byte caps and a global kill switch.

### 5.3 Agent tool contract

The agent operates on a **virtual project workspace**, not a general terminal. All tool calls go through a policy gate bound to member_id/project_id/revision and an explicit action authorization. Suggested minimal tools:

| Tool | Scope | User approval |
| --- | --- | --- |
| project.listFiles | Project-owned allowlisted paths and metadata | Default allow during active AI session |
| project.readFile | Project-owned text snippets within byte limits | Project-data-sharing consent |
| project.proposePatch | Typed create/replace/delete patch with expected file hashes | Agent may propose |
| project.applyPatch | Server-validated atomic patch; creates revision | Explicit Review & Apply (batch) |
| project.getScene | Safe typed scene selection context | Project-data-sharing consent |
| project.proposeSceneOps | Typed property/event/track edits | Explicit Review & Apply |
| preview.request | Run a bounded build in isolated preview | Explicit Play/Run or creator-authorized session setting |
| preview.readDiagnostics | Read sanitized stdout/console/build errors for this project | Default allow, redacted |
| package.preflight | Hash, quotas, missing entry and compatibility | Allowed; cannot write public state |
| package.preparePrivateBuild | Create immutable draft in existing gated package flow | Explicit creator action and upload quota |
| publication.submit | Submits exact private revision to human review | Explicit creator action; agent alone denied |
| publication.publish, staff.*, db.*, auth.*, infra.*, rewards.*, RHEN.* | Forbidden | No override in agent protocol |

Reject unknown tools, broad glob reads, symlink/path traversal, hidden dot-env files, credential patterns, external network fetches, shell commands, process spawning, install scripts, arbitrary R2/D1 operations and cross-project requests. All new binary assets still enter existing validated private asset intake with rights/provenance.

Tool outputs are **untrusted evidence**, never elevated to system instructions. Prompt injection inside HTML comments, README, imported assets or console logs cannot expand capabilities or auto-approve a patch.

Every AI run has state: queued -> streaming -> proposed -> awaiting_user -> applying -> applied, or cancelled/failed/expired. Tool calls and immutable before/after hashes are auditable. On cancellation, no partial patch remains. Reapply with stale expected revision returns 409 and a human-readable merge/diff flow.

## 6. Private project structure and revisioning

### 6.1 Canonical model

The canonical project remains the owner-bound principal. A WorkbenchWorkingCopy references it, never replaces it. WorkingCopy has workspace_kind (native-document/static-web/import-reference), schema version, base revision, last saved revision, current branch, and a private manifest of file hashes. Text blobs and asset binaries live in private storage; DB holds indexes/revision pointers and small metadata, not giant source archives.

Suggested new **alpha-only** records (design names, not a migration authorization):

- workspace_documents: project_id, owner_member_id, kind, schema_version, head_revision, save_state, updated_at.
- workspace_revisions: workspace_id, revision_id, parent_revision, author_type (user/agent/import), before_hash, after_hash, file_inventory_hash, created_at.
- workspace_files: revision_id, normalized_path, content_sha256, content_type, byte_size, private_storage_key.
- workbench_ai_connections: owner, provider, encrypted reference, status, updated_at, revoked_at.
- workbench_ai_runs / proposed_operations: run ID, project, revision expected, selected context inventory, bounded token/estimated cost, reviewed decision, redacted events.
- workbench_preview_runs: revision, isolated preview capability token/expiry, sanitized diagnostics, render mode, viewport and receipt.
- creator_project_package_links: canonical project ID -> separately allocated package record, server-verified ownership/issuer and migration state. Unique, server-minted; never from a handle.
- project_release_evidence: exact immutable package release hash plus compatibility report, credits/rights, human review reference and verified runtime checks.

If canonical DB and V004 staging DB are separate, use idempotent events plus compensating reconciliation; **do not assume cross-D1 atomic transactions**. Never rewrite existing project ID or silently associate a V004 project by title.

### 6.2 Working-file ceilings (new alpha proposal, NOT current V004 limits)

Suggested closed-pilot maximum: 50 text files, 512 KiB/file, 2 MiB combined text workspace, 100 retained private revision metadata entries (with bounded snapshot retention) and one active agent patch session per project. Actual upload limits **stay** V004's 20 MiB compressed ZIP, 48 MiB expanded, 180 extracted entries, 12 MiB per entry, and its established per-creator budgets. Profile usages and immutable published revisions are never silently erased to satisfy editor retention. Adjust new pilot ceilings only after measured D1/R2 and phone memory performance.

### 6.3 Conflict and history UX

Every editor edit is optimistic and revision-aware: atomic patch with expected revision, idempotency key, after hash and a verified saved response. User edits made while an agent is streaming must not be silently overwritten. When conflict occurs, show **Keep mine / Review merge / Save separate private revision**. The default is preserve data, not force replace. "Time Shards" is the optional Continuance-themed visual history of private revisions; restore creates a new revision, never overwrites an approved release.

Local autosave queue is distinguishable from confirmed server saves. Offline draft queues are encrypted where practical and always labeled un-synced; do not guarantee recoverability if Safari clears site storage.

## 7. Preview and build pipeline

### 7.1 Two explicitly different preview tiers

**Trusted native/document:** validated declarative schema interpreted by first-party renderer without executing arbitrary project source. Can preview locally without costly builds; runs on ephemeral **play state** separate from edits.

**Executable static web:** compile/assemble only allowed browser files in a capped, deterministic build action, serve resulting bytes via cookieless isolated runtime on a separate registrable origin, and embed with sandbox/CSP and limited postMessage contract. **Never inject untrusted JS into the main ANEVUM origin, even for faster HMR.** Use short-lived capability URLs and ephemeral session storage for fast Preview; do not submit every keystroke, chat token or drag to V004 upload/R2 release flow. Debounce and cancel superseded preview tasks; bound preview count/time/bytes per member. Ephemeral preview is not a saved package or public review record.

No arbitrary npm install, Python execution, Docker, root shell or internet-based dependency fetch in closed alpha. A deterministic static starter and plain JS/CSS/HTML need no paid Node containers. Framework-specific build adapters (Vite/React/Godot/Unity exports) come only with locked, scanned toolchains and measured compute costs. WebContainers or hosted general builders are optional future vendor/license decisions, not prerequisites.

### 7.2 Preview inspector and mobile proof

Preview offers honest 320/390/768/1440 CSS pixel presets plus optional rotation, dark/light color-scheme test, keyboard/touch controls when relevant, reload, restart, screenshot and isolated console. These are **viewport simulations**, not device certifications.

Capture structured error cards: missing asset 404, unsupported MIME, CSP violation, module import, unhandled error, memory/timeout, blocked network, resizing/overflow. A creator can press **Ask AI to repair**, which sends only redacted diagnostics and bounded file context and returns a patch needing creator approval. IREN can explain the issue without model usage.

Real iPhone Safari, Android Chrome and desktop acceptance remain a distinct staff verification evidence item. Do not fake green mobile checks or allow an AI narrative to satisfy release attestation.

### 7.3 Package preparation

1. Select exact saved workspace revision or supplied upload.
2. Resolve a supported runtime: native typed pack OR supported static HTML/browser ZIP. Source-only JS/Python is diagnosed, not automatically executed.
3. Create deterministic archive with root index.html for static web, relative local assets, no hidden secrets or remote credential dependencies.
4. Generate canonical file inventory, SHA-256, sizes, MIME and optional internal release metadata. Creator-authored anevum.json/AEP fields remain untrusted/advisory.
5. Run existing V005 compatibility classification and **V004 authoritative** archive parser, path/bomb/CRC/size/quota checks and SHA deduplication.
6. Store an immutable **private** build (48-hour unsaved test or explicit saved draft as in V004). Protect last good private preview on failed replacement.
7. Play the **exact** candidate in the isolated runtime; collect approved evidence, credits, ownership/AI/provenance/asset licenses and content labels.
8. Submit the exact release/hash to independent moderation. Reviewer can request changes or refuse; creator must resubmit changed hash after repair.
9. Reviewer independently verifies owner, rights, asset integrity, malicious content safeguards, actual device checks, runtime, and issuer-bound hashes. Human attestation remains honest and cannot substitute an independent malware scanner.
10. Only approved release flows through existing reviewed publication bridge into canonical public player, Discover and optionally public member wall. v2 drafts never mutate still-live v1.
11. Suspension and removal immediately deny public play and projection, preserving audit; rollback only to a known approved immutable release.

### 7.4 Proposed future AEP manifest (non-blocking)

Do not change current intake contract to require a new proprietary format. Later, a manifest may advertise: schema "anevum.release.v1"; runtime "static-web" or supported native pack; root entrypoint; static asset hashes; supported orientation, touch/keyboard input; requested bounded capabilities; creator's declared credits and license. The server computes its **own trusted release manifest** from verified bytes rather than trusting creator-provided claims. Stage alpha must accept valid existing root-index ZIPs with **no manifest**.

## 8. Release gates (compatibility + publishing)

**G0 — Identity and eligibility:** signed-in canonical owner, allowed pilot, age/account policy, safe project ownership.

**G1 — Intake and resource admission:** bounded bytes, rate/quota, archive integrity, path normalization, duplicate hash, no secrets in manifest, file allowlist.

**G2 — Runtime recognition:** root browser entrypoint or validated native schema. Unsupported source-only imports receive actionable instructions without ingestion-as-executable.

**G3 — Static and security checks:** correct MIME/path, resource counts, supply-chain/dependency policy, CSP compatibility, dangerous behaviors flagged and blocked according to policy. No claim of full malware scanning before an independent scanner exists.

**G4 — Isolated functional preview:** exact candidate runs on separate cookieless origin; errors and capabilities visible. Phone presets are suggestions, not certifications.

**G5 — Creator declarations:** license, ownership/permission to publish, third-party credits, AI contribution disclosure, content advisories and public attribution preference.

**G6 — Independent review evidence:** reviewer independently checks exact release ID/hash, device/reproduction evidence, moderation and security; author cannot self-approve; reviewer receipt blocks altered builds.

**G7 — Guarded publication:** reviewed source pin, publish flag, route/source drift checks, immutable public release, idempotent outbox, verified public player/Discover/wall projection and rollback.

**G8 — Ongoing safety/retention:** report/takedown, revoke/rollback, audited updates, expired test and orphan cleanup, true storage meters, stable URLs and privacy-preserving analytics.

Any blocker stops progression with an understandable repair card. "Pass" is computed server-side from verified evidence, not by the agent's confidence or interface color.

## 9. IREN vs AI provider

**IREN** is ANEVUM's small, personable institute guide: teaches buttons, interprets validation findings, explains release states, suggests the next useful action, and supports no-cost hints where deterministic logic suffices. Never overwrite the creator's chosen AI brand or impersonate it.

**Connected AI** is a user-consented code/content collaborator: reads selected project context, proposes file/scene patches, explains warnings and generates supported web projects. Its name/provider is clearly visible in chat. It does not pretend to share ChatGPT/Claude conversation history, plan usage, or account permissions.

**Workbench** executes approved deterministic tools and tracks project revisions. It is the authority boundary, not the model.

If agent is unavailable or declines a request, the Workbench and valid saved project still work.

## 10. Innovations worth building, without distracting from alpha

**Project Passport:** every creation has a compact truthful compatibility/rights/version card: runtime, input, screen support tested vs simulated, source/license declarations, permissions, hash, current public release. Public users see appropriate safe subset. This replaces confusing file extensions for beginners.

**Signal Trace:** compact real preview/build event stream, errors mapped to files and fixes. IREN can translate "asset not found" into exact next step; AI can propose a repair patch. No decorative fabricated logs.

**Time Shards:** private revision trail showing meaningful saved milestones and AI/user authorship. Revert creates a new draft revision. Published version stays immutable.

**Selection-to-Intent:** when a native scene object is selected, chat receives its stable ID and editable typed properties; "make this glow and move right" proposes transparent safe operations. For arbitrary HTML the UI says "Code-assisted edit" until adapter support exists.

**Device Lenses:** phone/tablet/desktop presets, safe-area guides, oversized touch-target diagnostics, no claim of real-device pass. Staff evidence adds actual device runs.

**Release Passport:** a readable build receipt for the exact immutable candidate: content hash, rights, verified checks, reviewer, status, public version and rollback reference.

**Portable exit:** download the generated web ZIP or eligible native data pack, with declared licenses and source attribution. Avoid making ANEVUM a trap. No automatic open source licensing of a user's work.

**Responsible remixes (later):** a creator opts into remix permissions and attribution graph after licensing and revision ownership review; do not auto-copy projects or AI conversations.

**Scoped external Agent Uplink (later):** user authorizes one agent for one owned project, grants read/propose plus selected apply scope, can revoke, receives audited event trail. MCP/OAuth token audience binding and narrow access; no ambient user cookies or ChatGPT session scraping.

## 11. Privacy, abuse, moderation and isolation

- Owner A must never read B's workspace, agent chat, stored API keys, preview bytes, private media, compatibility findings or review evidence. Author/reviewer separation remains intact for founders with other roles.
- Keep secrets in dedicated encrypted server-side storage with separately managed key material; never build keys into frontend bundles, downloadable ZIPs, R2 public objects, AI prompts or preview frames. No unrestricted URL fetching by worker or agent (SSRF).
- AI-generated text/file changes count as untrusted user content. Validate output **after** model inference. Block common secrets, unsafe paths, dependency injection, decompression bombs and direct privileged API calls. Do not promise perfect malicious-code detection.
- Runtime has no ANEVUM member cookies, Better Auth tokens, direct D1/R2 credentials, staff APIs, XP authority or RHEN account/state. Define strict frame ancestor, CSP and message allowlists. postMessage channel checks origin/capability/action; no wildcard privileged commands.
- Public publishing remains separate from code execution and review. For moderation, provide immutable evidence, report, suspension, takedown and irreversible-harm escalation.
- Prevent runaway workload: preview debounce/cancel, per-owner concurrent run guard, request/byte/time limits, AI run caps, project quotas, scheduled private cleanup and global emergency stop. Do not remove already published safe releases when shutting off AI or uploads.
- Account export/delete and licensing/AI disclosures must cover working files and agent logs. Deletion uses bounded audited erasure; published record handling follows approved policy.
- Kids should understand the UX, but opening accounts to minors requires separate eligibility, consent and communications protections. Closed alpha uses permitted pilot users only.

## 12. Product analytics and observability

Existing founder/staff Observatory should show aggregate: new private projects, first preview success, saved revision success, compatibility blockers and recovery, AI runs/cost caps, preview CPU/errors/latency, package duplicate prevention, expired temporary builds, cleanup backlog, submissions, review cycle, approved playable releases, browser/device failures and takedown events. Each metric must be real and privacy-minimized; no publishing private prompts, secret contents or member emails in aggregate dashboards.

North-star alpha measure: **share of invited creators who privately create or import an actual playable project and successfully resume/edit it on mobile**, not merely open chat. Secondary: percent who package validly, percent who complete safe review, time-to-first-private-preview, helpful repair acceptance and cost per successful release.

## 13. Implementation plan — isolated, vertical, and ordered

### A0 — Stabilize existing creator/publication foundation (release prerequisite)

- Reconcile current approved V091/V003 publication route ownership and PR #564 state; verify actual public player, gallery, Discover, review and account identity with real accounts and real Safari.
- Complete V004 #562 and V005 #569 review/test/migration decisions in their own workstreams. Do not silently promote separate V004 staging DB to production or claim code is live because a PR merged.
- Prove existing SHA-bound private test -> independent review -> immutable public update and rollback, with rights/cover and storage cleanup. Fix any live public-path 404 before adding agent traffic.

**Exit:** A and reviewer B and signed-out guest C can complete existing package route acceptance with no identity leak and no production regression.

### A1 — Unified shell + honest prototype alpha (no AI billing)

- Behind CREATOR_WORKBENCH_ALPHA_ENABLED=false by default, create one route/shell linked from Create/Studio for allowlisted pilots only; existing main nav is unchanged for guests.
- Connect canonical project selection and one initial supported static-web template; keep existing import path visible through existing V005.
- Provide File/Preview/Edit/AI tabs, real save status, revision history, clean compatibility cards and IREN hints. AI tab clearly says Connect to enable; non-AI use is functional.
- Implement typed private workspace persistence, revision compare, last-good preview and safe editor-level undo without modifying public release.
- Trusted native story preview may reuse safe V054 renderer; untrusted static HTML preview uses isolated runtime.

**Exit:** one 390px iPhone user creates/edits/saves/reloads a real private starter; a second member cannot read it; return to edit loses no data.

### A2 — Connected AI patch loop, one provider first

- Implement provider adapter, explicit consent, BYOK vault/reference lifecycle, token and cost ceilings, run cancellation, streaming messages and redacted event trail.
- Read specific project files -> propose bounded patch -> creator review/apply -> persisted revision -> isolated preview/console -> AI-guided repair. No independent shell.
- Add file diff, conflict recovery, clear network/provider errors, provider disconnect, data deletion and security/SSRF/prompt injection tests.

**Exit:** on iPhone, invited user connects provider, asks for a small offline browser game, applies proposed three-file patch, plays on isolated runtime, requests change, replays it and resumes on desktop. Platform never exposes the key or project files to another member.

### A3 — Compatibility-to-release bridge alpha

- Review a narrowly scoped canonical project<->package mapping with issuer-bound proof and idempotent event. Preserve both existing controller namespace and primary routes until accepted.
- Package saved Workbench snapshot to root-index web ZIP; run V005 probe and V004 authoritative admission; retain 48-hour private tests, duplicate avoidance and resource protection.
- Lock exact release SHA and rights, independent real reviewer and device tests, guarded publication to public player/Discover/wall, update version without replacing approved v1, revoke/rollback.
- QA all stages at 320/390/768/1440 and actual iOS Safari/Android/Desktop.

**Exit:** end-to-end real small game from private AI edits to independently reviewed release; owner v2 draft does not change public v1; failed publish and rollback preserve prior release.

### A4 — Native scene operations and external agent capability (not blocking A3)

- Reconcile Scene Editor V001, Workbench #466, native pack drafts #486/#497 through a typed scene document adapter. Start with select/move/resize/object property/tap event; keep advanced physics and 3D deferred.
- Selection-to-Intent generates typed scene ops requiring approval; native Play executes only schema data.
- Expose signed, revocable project-scoped remote tools (MCP-style) only after independent auth/security review. Never reuse provider secrets as tool authorization.
- Phaser-driven full 2D logic, timeline, animation, and eventual 3D remain future milestones with separate device and performance evidence.

**Exit:** one creator demonstrates both visual and conversational editing of the *same* supported native project with consistent undo, private save and publication behavior; no arbitrary executable scene code.

## 14. Alpha acceptance matrix (all must be demonstrable)

| Test | Required result |
| --- | --- |
| Real canonical login/ownership | Two users cannot read/edit/share one another's private files or AI runs |
| No-AI route | Visual starter or valid import works without any model account |
| AI connect/disconnect | Credential never appears in JS bundle, logs, preview, export, or other user's scope; revocation actually blocks calls |
| Permission boundary | Agent cannot call publish, staff, D1/R2 admin, RHEN, XP, shell, URL fetch or user role tools |
| Prompt injection | Instructions embedded in imported source/logs never cause scope expansion |
| Patch safety | Owner reviews/apply; invalid path, unsafe file, stale revision, partial conflict rejected with no data loss |
| Revision durability | Save/close/reopen, browser background, offline recovery and conflict status are truthful |
| Import repair | Root index, nested dist, source-only Python/JS, Godot/Unity hints, missing asset, secrets and ZIP bomb diagnosed correctly |
| Sandbox | CSP/iframe isolation, cross-origin API denial, strict postMessage; no cookies or ANEVUM privileges |
| Mobile | 320/390/768/1440 responsive QA, real Safari/Android, keyboard/safe-area/rotation/touch targets, accessibility, reduced motion |
| Cost/resilience | Provider outage, exceeded spend cap, cancelled stream, double submission, R2 failure, slow network, cleanup outage fail safely |
| Package resources | Existing V004 limits, duplicate SHA, lease, reservation, 48-hour expiry, Save, cleanup and published rollback all hold |
| Review | Independent staff evidence tied to release hash and device check; no self-approval or silent changed-build approval |
| Publication | Verified player + Discover + permitted wall projection resolve stable ID without handle attribution leaks |
| Safety/exit | report/suspend/revoke/rollback/audit and account deletion/export are tested |

Browser screenshot emulation cannot replace physical Safari QA. CI must target an exact SHA with typecheck, unit/integration, D1/R2 isolated fixtures, genuine cross-origin browser checks and a human-reviewed visual capture record. Do not trigger any production deploy from this design branch.

## 15. Feature flags and operational ownership

Suggested flag names (proposal only): CREATOR_WORKBENCH_ALPHA_ENABLED, CREATOR_AI_CONNECT_ENABLED, CREATOR_AI_PATCH_ENABLED, CREATOR_PREVIEW_TEMP_ENABLED, CREATOR_WORKBENCH_PACKAGE_BRIDGE_ENABLED, CREATOR_EXTERNAL_AGENT_ENABLED. All default OFF, scoped to canonical pilot owner IDs. Public publication retains its **existing independent** flag/attestation rather than inheriting any Workbench flag.

Track project decisions and exact source refs in the existing engineering board #325, publishing #329, and identity/security doctrine #344. Staff Observatory is the single control surface, not another admin portal. Each phase requires a deliberately approved alpha activation after staged, two-account, real-device acceptance and source/route rollback documentation.

## 16. Exclusions and honest status

This file is a consolidated design and alpha execution contract. It does not implement or certify a complete AI provider integration, WebContainer license, mobile SDK, malicious-code scanner, native game engine, 3D scene editor, general-purpose cloud terminal, source-only Python runtime, ChatGPT account transfer, GitHub repo builder, paid AI sponsorship, minor enrollment or public publishing switch.

The V004 package lane is staged separately; V005 compatibility remains a draft; remaining canonical integration and production acceptance must be re-verified against **current** GitHub, Cloudflare and actual devices at implementation time.

## 17. References

- Unified Creator Universe: design PR #555, docs/creator-platform/ANEVUM-WEB-PHONE-FIRST-CREATOR-UNIVERSE-2026-10-19.md
- Scene Editor V001: docs/creator-platform/ANEVUM-SCENE-EDITOR-V001-PHONE-FIRST-2026-10-19.md
- Safe native Workbench: PR #466, docs/creator-platform/CREATOR-STUDIO-V054-SAFE-WORKBENCH.md
- V004 resource protection and staged lane: PR #562, docs/creator-platform/ANEVUM.WEB.BUILD.2026-10-19.002.CREATOR-PACKAGE-RESOURCE-PROTECTION.md
- V005 compatibility: PR #569, docs/creator-platform/ANEVUM.WEB.DESIGN.2026-10-20.001.CREATOR-COMPATIBILITY-V005.md
- Creator package/publication bridge: PR #564
- OpenAI official Sign in with ChatGPT developer docs: https://developers.openai.com/siwc/quickstart (partner access and plan usage are eligibility-dependent)
- Anthropic official subscription/API guidance: https://support.claude.com/en/articles/9876003
- Model Context Protocol authorization hardening: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/basic/authorization/security-considerations.mdx
