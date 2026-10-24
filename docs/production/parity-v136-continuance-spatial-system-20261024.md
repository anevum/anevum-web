# ANEVUM / CONTINUANCE SPATIAL SYSTEM
## PARITY V136.007 — Visual architecture and product design contract

Session: `ANEVUM.WEB.BUILD.2026-10-24.001.PARITY-V136`  
Owner: ANEVUM / WEB  
Status: active implementation; source branch `build/parity-v136-scene-director-20261024-007`  
Governing reference: PARITY V136 concept register in #714 and #715. Reference boards are design direction, **not** evidence of shipped graphics.

### The experience

**ANEVUM should feel like a navigable institution, not a collection of reskinned pages.** The visitor enters a living continuance environment. The persistent scene provides place, scale and atmosphere. A coherent instrument surface provides orientation and actions. Real public creations, people, discussions and verified achievements populate it. Each user remains able to read, search, browse, publish or operate the site without a GPU.

Innovative does not mean adding movement everywhere. Innovations must make the interface more legible, memorable, capable, and more rewarding to use, without hiding information behind a game mechanic.

Five governing requirements:

1. **One world, different places.** Route transitions move the camera through a continuous spatial grammar rather than replace a JPEG with another JPEG.
2. **Content changes the environment.** Approved public category and release counts affect bounded anchor density and public content placement. No fabricated traffic, social proof, live players or achievements.
3. **Every control is real.** Navigation, search, creator editor, account, profile, payment and accessibility remain DOM-backed. A visual target cannot imply an action that is not implemented.
4. **Identity is verifiable.** Creator covers remain creator artwork. Earned badges are only visually upgraded after server-backed eligibility is established. Locked badges remain locked.
5. **Quality is a performance contract.** No server GPU requirement for the experience. WebGL2 runs on the visitor's device and yields to reduced motion, data saving, unavailable hardware and protected routes.

## 1. Architecture: five composited layers

| Layer | Technology | Ownership | Purpose |
|---|---|---|---|
| Environment | WebGL2 fragment/vertex shaders, evolving 3D props | `LivingWorldField`, `SceneDirectorV136` | Consistent world perspective, route identity, ambient light, real public-signal density |
| Spatial objects | Stage-appropriate 3D mesh/glTF as a later bounded layer | forthcoming artifact renderer; not yet shipped | Objects requiring true rotation, occlusion, normals and physically-based materials |
| Materials and lighting | Scoped CSS variables, SVG edge optics, composited DOM | `scene-materials-v136.css` | Dense tactile console surfaces, accessible focus, phosphor lines, beveled and frosted detail |
| Functionality | React 19 and canonical React Router, original API contracts | existing route components | Real project cards, profiles, search, Studio editing, IREN, account actions |
| Meaning | Public release data and verified permission-bound identity | existing canonical endpoints and auth | Scene evolution without manufacturing activity |

Rendering is decorative, not a second application state or auth system. The GPU never receives account identifiers, private events, unpublished projects, message contents, private analytics, reward ledger values or bank information. It receives sanitized public aggregate counts and a local ephemeral preview sector.

### Scene director: current V136.007 code

- `SceneDirectorV136.ts`: named profiles for all 13 public scene sectors, with four architectural families, distinct color/camera/signature, deterministic frame interpolation, and bounded render resolution.
- `living-world-shaders.ts`: WebGL2 shading plus analytic three-dimensional box intersections and normals, procedural material lighting, reflective edge/seam simulation, and architecture-specific forms. No external image calls or textures.
- `LivingWorldField.tsx`: one persistent canvas, morphing camera/tone/family weights, bounded DPR/frame interval, WebGL2 fallback, local input pulsing, and source-aware ambient density.
- `scene-materials-v136.css`: instrument materials and luminous seams, with explicit reduced-motion/forced-colors protections.
- Existing persistent Wayfinder #720 is a prerequisite and remains an independent review/release lane.

The four architectural families give different routes spatial identities:

| Family | Defining silhouette | Primary destinations | Interaction response |
|---|---|---|---|
| **Atrium** | Orbital heart, wide ring and traversable deck | Arrival, Research, miscellaneous public areas | Orientation, connection, entry |
| **Archive** | Perspective illuminated monoliths and retrieval portal | Discover, Libraries, Creators, Learning | Search focus, indexing, comparison |
| **Forge** | Animated faceted core with reactive energy seams | Games, Creative, Creator Studio | Making, previewing, testing, launch |
| **Relay** | Transmitter towers, luminous conductors, architectural gateways | Tools, Automation, Commons | Communication, state handoff, working systems |

The shader currently realizes these as **analytic WebGL2 geometry**, not detailed modeled rooms. This is a real intermediate rendering engine; it must not be marketed as a completed AAA-quality environment. Environment quality and content fidelity have separate acceptance checklists.

## 2. Spatial UX grammar — how it behaves

### Arrival

The arrival screen is the primary high-fidelity encounter. The environment establishes the institute's scale, a short headline explains why it exists, and two actual actions (Explore and Join) are visible without scrolling on mobile. The real public catalogue is discoverable without signup. No simulated releases or claims of site activity appear as visual filler.

The persistent wayfinder has five stations: Arrival, Discover, Commons, Creators, Studio. Mouse hover and keyboard focus **preview** the corresponding sector without changing URLs. Activation changes the route and the world interpolates to the destination, subject to motion preferences. Keyboard arrow/Home/End focus remains actual DOM focus; a gamepad adapter may call the same focus logic later, but it does not become a second navigation tree.

### Discover / Spatial Atlas

The Archive opens into a searchable public index, not an infinite art gallery. The default hero stays spacious but the real result grid is one scroll away. The sector rail previews visual environments and applies canonical query/category filters only when activated. Search semantics, query parameters, cursor pagination, price/free declarations, loading, empty and outage conditions are preserved. Creator-uploaded project covers cannot be displaced by procedurally generated placeholder art.

Suggested future innovation: **Artifact Lens** — a focused project expands into a contextual panel (creator, title, real capabilities, release state and actions) while preserving the original public URL and screen-reader reading order. The lens uses DOM elements that visually project into the GPU background; it is not a GPU-only card.

### Commons / Living Assembly

The Relay emphasizes people and conversation. Thread links and moderation boundaries retain their current data contracts. A discussion entry highlights the relevant station visually, but its content must remain readable and keyboard accessible. Ambient connective filaments may represent *publicly documented relationships only*, not inferred private social ties. DMs, staff moderation, drafts and hidden members never appear in the shared field.

Suggested future innovation: **Context Trails** — a voluntary, explicit link between a public discussion and a published project generates a route badge in both interfaces. The trail is a derived navigation affordance, not hidden behavioral tracking.

### Creators / Identity Constellation

Compact profile cards form a visual language, not separate applets. Each has a canonical identity field, verified role/achievement distinctions, user-selected presentation, public works and a compact action zone. The verified identity layer stays readable at a glance; customization modifies appearance, not proof or privilege.

Suggested future innovation: **Identity Capsule** — a small, expandable, layered card that reveals public catalogue work, recognition, and creator-selected motif without losing keyboard order. No false levels, visitor counts or implied endorsements.

### Studio / The Forge

The Studio should feel like a AAA-grade creative workstation, not a static space scene over a file upload form. Prioritize actual making: reliable files, package structure, asset preview, validation, editing and publication status. The high-contrast code/file zone borrows useful conventions from development environments: file tree and semantic icons, syntax highlighting, keyboard shortcuts, errors inline, tabs, diff/revisions and preview.

Use an embedded editor such as Monaco when the current project workflow requires genuine code editing and its bundle/performance costs are acceptable. Avoid pretending the editor exists merely because it resembles VS Code. Studio authorization and publication gates remain canonical and independent of graphics.

Suggested future innovation: **Artifact Workbench** — a single place that switches between source, generated preview, package inventory, and validation, with WebGL reserved for previews and scene response. Safe sandbox execution is a separate security project, not an implicit feature of visuals.

### IREN / Companion presence

IREN is one canonical companion, not duplicated chat widgets. A spatial waveform, mood-light and unobtrusive status rail may reflect actual assistant state or **labeled** public metrics, not fake AI awareness. Announcement and patch-note opt-ins remain explicit. IREN stays available on mobile and keyboard, and never masks the first page action.

Suggested future innovation: **Contextual Orientation** — route-specific help can highlight available commands and explain real next actions; do not silently read unpublished creator data or assume user consent to external processing.

### Supporter, Recognition, and Levels

Recognition receives high-definition canonical sigils now and true PBR 3D keepsakes later. Their engraving must be deterministic and entitlement-aware; no art regeneration changes what the user earned. Supporter purchases, bank operations and provider checkout are separate transactional systems, not part of a renderer migration.

## 3. Design tokens and materials

The world uses visual depth for *hierarchy*, not random 3D tilt. Four materials are enough to standardize the majority of pages:

- **Void**: the deep, quiet negative space behind the institute; near-black blue without pure black crush.
- **Structural alloy**: ribbed rail/edge surfaces with graphite base and cool directional highlights; used for hierarchy and machine surfaces.
- **Optical glass**: translucent navy panels with a restrained specular seam and a readable text scrim; used for information, not every wrapper.
- **Photonic signal**: bright cyan by default; route tones may introduce violet, teal, bronze or magenta for semantic differentiation, but must not imply validation or risk by color alone.

Tokens live under `data-av-parity="v136-full"`. The shader colors are numeric uniforms driven by `SceneDirectorV136`. The materials layer must not load remote typefaces or change baseline semantics. Contrast for all functional text, focus rings and error states is verified separately against actual backgrounds.

Typography: precise sans serif for interface; larger dramatic headings only where user intent justifies it. Code uses a real monospaced editor font in the eventual Studio component. Diagnostic labels are helpful when they communicate reality; avoid meaningless sci-fi microtext everywhere.

## 4. Dynamic environment model

A public, approved dataset changes the atmosphere without changing the truth. Example bindings:

`approved project count -> logarithmically bounded ambient signal anchors`  
`selected category -> scene family, accent, camera target and per-sector density`  
`published project -> stable seeded category glyph, unless it has real creator artwork`  
`server-verified badge state -> engraved sigil state`  
`hover/focus -> local preview, no analytics or server mutation`

A local visitor action may cause a temporary pulse in the environment. Pulse means "the UI responded," never "another person took an action." No generated imagery is presented as a real published project or active creator. Public counts are refreshed at the existing five-minute foreground cadence and never converted to real-time visitor claims.

## 5. Motion and input

Motion has a purpose: **focus, selection, traversal, state change and acknowledgement**. Persistent idle motion is secondary.

- Nav preview: focus changes material luminance and a spatial target; never navigates prematurely.
- Route transition: camera, geometry weights and color interpolate in the persistent canvas.
- Select/submit: a brief environment pulse confirms a local action only; success/failure uses actual DOM feedback.
- Creator workflow: motion maps to real validation or preview steps, not fictitious progress.
- Mobile: touchscreen actions and safe-area dock stay usable without precision hovering.

Reduced motion or Save-Data disables background animation; unavailable WebGL2 produces a local vector approximation; hidden tabs and protected routes stop costly drawing. Forced-colors mode hides ornamental overlays. Controls never rely on animation, canvas pixel hit testing, or color-only state.

## 6. Performance tiers (target architecture; not all shipped)

| Tier | Detection / operating posture | Visual contract |
|---|---|---|
| Static | No WebGL2, context loss, reduced motion / constrained environment | Vector environment, full functional DOM, real text, no forced animation |
| Balanced | WebGL2 present, ordinary phones/tablets/desktop | One shader canvas, analytic architecture, no remote models; mobile 24 fps, desktop 30 fps at bounded DPR |
| Enhanced (future) | Explicit device capability and measured smoothness | Scene-local glTF/PBR objects, higher-quality reflections/lighting, up to 60 fps where sustainable |

Current implementation is **balanced** with static fallback. Enhanced is an explicit future deliverable; it is not activated by merely detecting a desktop GPU.

Initial render caps: 1.8 million physical pixels on phones and 3.1 million on larger screens, with 24/30 fps. Monitor thermal behavior, input latency, accessibility, WebGL context loss, layout shifts, scene overdraw and load performance. Do not promote global 3D based on desktop screenshots alone.

Packaging direction: keep tiny shaders procedural and local; use glTF/GLB with compressed geometry and KTX2 textures only for objects that benefit from modeled detail. Asset variants should have verified real native resolution; high-definition concept boards are not proof of 4K assets. Three.js is appropriate for future model scenes and physically-based material orchestration, not required for every navigation icon or label. WebGPU may be evaluated independently; WebGL2 remains the baseline.

## 7. Implementation and release sequence

- **V136.003 (deployed):** cinematic arrival + shared header over protected frontend.
- **V136.004 (merged):** approved Discover composition, canonical query semantics and live project cards.
- **V136.005 (1% canary as of 2026-10-24):** persistent WebGL2 living world, public aggregate inputs, dynamic glyphs and recognition. Worker 52 is not globally deployed.
- **V136.006 (review):** persistent console Wayfinder and sector preview. Source PR #720; pass all exact-head checks, then merge under protected release rules.
- **V136.007 (this branch):** scene director, four architectural families, interpolated shader composition, optical material grammar, budget tests and acceptance additions. It remains source-only until review. Never conflate the new branch with the current live canary.
- **V136.008 (next):** reusable dimensional DOM panels, compact Identity Capsule and project Artifact Lens with existing API semantics.
- **V136.009:** Studio workstation typography, file inventory, semantic editor styling and actual validation/preview flow.
- **V136.010:** contained glTF/PBR object renderer for verified badges, user-opted avatar objects and creation previews, with asset metadata/provenance.
- **V136.011:** IREN contextual orientation, canonical patch notes and allowed announcement integrations.

A limited production canary can precede broader rollout *only after* fresh configuration and immutable source checks. Inactive versions, percentage traffic, CI completion and visual acceptance are distinct states. Continue collecting real mobile/tester feedback; never infer experience quality from build success alone.

### Acceptance gates for V136.007

1. Source is based on reviewed V136.006, with no backend/auth/reward ledger/finance/API migrations.
2. Every scene sector has a deterministic profile; geometry family and signature change on navigation and focus preview.
3. Shader compiles in WebGL2-capable test environments, renders all four families and has no missing/unbound uniforms.
4. Compiled Chromium at 1920/1440/1024/768/390/320 shows no horizontal overflow or covered primary actions.
5. Reduced motion, forced vector fallback, keyboard focus, Search, IREN and canonical Discover/Join paths remain valid.
6. GPU pixel budget tests pass at common 1×/2×/3× density, and animation stops in background/no-motion states.
7. Member, Creator Studio, XP, reward, privacy, permissions and data contracts remain untouched.
8. Physical iOS Safari, signed-in cross-account checks and owner concept-fidelity review are tracked explicitly, not claimed through synthetic CI.
9. Before any increased public traffic, Cloudflare route/binding/config readback and a concrete rollback version are confirmed.

**Principle:** high visual fidelity is a delivery constraint, not a reason to compromise real publishing, navigation, privacy, accessibility or verified account state.
