# ANEVUM / CONTINUANCE NEXT — sitewide cinematic interface specification

**Session:** `ANEVUM.WEB.DESIGN.2026-10-23.001.SITEWIDE-CINEMATIC-VISUAL-FIDELITY`  
**Status:** owner-requested direction with an isolated, interactive HTML specimen; **not an integrated React release**.  
**Reference:** Creator Studio world-composer artwork supplied by the founder in the design discussion; the supplied image is a *design reference*, not evidence that its depicted editor already functions.

## 1. Non-negotiable identity

ANEVUM should feel like entering the Continuance Institute: cinematic, transcosmic, independent-creator-focused, and usable. Preserve the repository's canonical `OrbitalMark` SVG geometry and existing wordmark decisions; the generated reference image's approximate logo is not the canonical mark. The original 03 Orbital Underground decision, mark optical acceptance and final production tokens remain controlled by [owner review #335](https://github.com/anevum/anevum-web/issues/335).

The public site should be more spacious and editorial than the high-density Studio. Deep blue-black atmospheres, premium original environment art, glass/instrument surfaces, aged copper, warm bone, deliberate cyan focus and restrained violet create a single family rather than an indiscriminate neon SaaS theme. Visual effects support information and never disguise empty feeds, fake metrics or unearned progression.

## 2. Reference design tokens (prototype only)

| Token | Value | Job |
|---|---|---|
| Void | `#060a11` | deep backdrop |
| Deep | `#0a1220` | primary canvas |
| Panel | `#152238` | work surfaces |
| Glass | `#111c2cd9` | translucent overlays |
| Border | `#436078` | clear structural separation |
| Bone | `#f6f0e7` | primary text |
| Mist | `#c9d3db` | paragraphs |
| Muted | `#9aacbf` | context |
| Copper | `#efc993` | institutional emphasis |
| Signal | `#8fe8ff` | functional focus/hover |
| Lilac | `#c9b3ec` | occasional atmospheric accent |

Dense UI still requires readable body text, real semantic labels and 44px-class touch targets; mockup-scale microtype must not drive essential functions. Separate atmospheric art, overlays, structural frames, data, and interaction/focus layers. Animation should be paused by reduced-motion preferences and optionally by an explicit user control.

## 3. Sitewide information architecture

1. **Arrival:** the exceptional opening visual, big message, clear Enter ANEVUM and optional Studio route, guest-access transparency and one contextual IREN invitation. Preserve V131's genuine publication state, onboarding and single IREN.
2. **Discover:** cinematic masthead plus functional category navigation, search, grid/list selection, creator attribution, project provenance, real publication state and honest loading/error/empty views. Avoid fabricated sample projects in real routes.
3. **Living Commons:** work-first Signal Board by default; optional District Atlas with equivalent accessible list; People & Worlds directory; contextual help which cannot invent network/community activity.
4. **Member Worlds:** creator identity, public cover/avatar, provenance, clearly separated private editor settings, curated creations, four straightforward shelves: Saved Work, Creators, Creations, Recognition.
5. **Evolution:** earned and server-verified levels, XP, badges, distinctions and creator-defined achievements. No unearned/restricted artifact previews; no implicit payment, permissions or moderation authority.
6. **Creator Studio:** dense professional project surface with scene hierarchy, canvas/editor, inspectable object settings, asset shelf, responsive mode selector, opt-in single IREN copilot, context-safe preview/edit and release gates.
7. **Join:** high-impact prologue followed by verified email-code onboarding with proper errors, recovery, keyboard clearance and consent. Never force account creation merely to browse.

## 4. Practical layouts

**Desktop 1440px:** primary site navigation, content-wide compositions, spacious environmental hero, rich cards, two or three columns only when task complexity warrants. Studio alone supports left module rail + project tree + central workspace + inspector.

**Tablet 768px:** top navigation becomes compact; Commons context moves under the content, Studio inspector moves below the main editing surface, Discover categories become horizontally scrollable.

**Phone 390/320px:** visual art crops retain a text-safe area; main action remains prominent; five-way thumb dock; all information fits one readable column; Studio tabs become horizontal mode navigation with a single central viewport and separate project tree/inspector. Honor device safe areas.

**Large desktop 1920px:** atmosphere may scale, but paragraphs, work columns and navigation must retain rational line lengths; do not spread essential controls to opposite extremes.

## 5. Creator Studio depth and interaction contract

**Scene:** toolbar modes, clearly selected objects, demo scene tree, lighting slider, atmosphere, previews and asset shelf. The specimen viewport is an original illustration composition, not a functioning WebGL simulation.

**Interface:** editable HTML/CSS plus responsive preview inside a **sandboxed iframe with scripts disabled**. This is a local visual interaction example; do not mistake it for V113's authenticated, revisioned persistence. A real product editor must isolate untrusted content, enforce CSP and ownership, and require explicit save and publish.

**Scripts:** readable code panel, future diagnostics/revision metadata, no execution in the design specimen. **Assets:** real uploaded media later, visually curated concept examples now. **Playtests:** accessible breakpoint, interaction and sandbox diagnostics. **Publish:** permission, rights, moderation and intentional review/confirmation before irreversible changes. The design review's publish action is disabled.

**IREN:** provide in-context entry, but reuse the single existing assistant and permission boundaries. Suggestions require target, proposed differences, user consent, audit/undo and clear failure messages.

## 6. Implement on top of real source, not parallel infrastructure

- Homepage: `CinematicLandingPage.tsx`, existing `ContinuanceSignalAtlas` and IREN tour from #669.
- Global navigation: existing `Shell.tsx`, `OrbitalMark.tsx`, canonical authentication member indicator, existing Wayfinder.
- Discover: `DiscoverPage.tsx`, `ProjectCard`, `CreatorPackageGallery`, existing public catalogue APIs, #667.
- Commons: isolated compiled React NEXT work in [#679](https://github.com/anevum/anevum-web/pull/679), inheriting #676–#678, with the real API privacy/moderation rules.
- Profiles and Evolution: `Phase1PublicMemberPage.tsx`, `LevelsPage.tsx`, `EarnedRewardVault`, `CompactMemberIdentity` and verified progression.
- Studio: [#658](https://github.com/anevum/anevum-web/pull/658) / [#687](https://github.com/anevum/anevum-web/pull/687), staged V109–V115 work. Avoid a competing visual identity or a duplicate editor/IREN/backend.

Reusable engineering pieces should be opt-in `AtmosphereLayer`, `SceneHero`, `SurfaceFrame`, `ContextLens`, `DataView`, and `ActionBar`. **Do not** import the standalone specimen into `main.tsx` or the production shell. Translate its design into existing React components only on a separately reviewed successor branch.

## 7. Rendering strategy

Most visuals need **no server GPU**: responsive WebP/AVIF art, SVG orbital geometry, layered HTML/CSS, selective GPU-composited transforms and scoped blur. High-resolution source art can be progressively delivered with smaller responsive derivatives. A future real world composer can use WebGL2/React Three Fiber lazily under a separate resource and permission budget, with WebGPU later only where broadly supported, robust static/mobile fallbacks and explicit context-loss recovery. No global WebGL backdrop on every route by default.

## 8. Acceptance and release boundary

The attached `creator-v1/web/review/continuance-sitewide-cinematic/index.html` is **unmounted and review-only**; self-contained art and interaction fixtures never call canonical APIs, create user records, earn XP, send model requests or publish. Local Chromium review exercised seven screens at 320/390/768/1440/1920, project-category/search/grid states, Commons modes, theme choice, Studio scene/assets/tool state, local HTML/CSS, iframe isolation, Playtests/Publish controls, Wayfinder and motion. The original local review runner/report and editable sources remain in the conversation package. Local browser success **does not prove exact GitHub-head CI, WebKit, physical iPhone Safari, voiceover, authentication, performance or production acceptance**.

Before product integration require desktop/phone source-bound before/after captures, owner visual review per #335, explicit current-head workflow results, iPhone Safari/screen reader, true public/private data boundary tests, reduced-motion, screenshot regression and performance budgets (LCP/INP/CLS). Preserve V131 rollback and existing release approvals. Do **not** merge/release by default; no Cloudflare, auth, D1 migrations 0014/0015, payments, XP resets, or provider changes.

**Coordination:** [engineering board #325](https://github.com/anevum/anevum-web/issues/325), [visual approval #335](https://github.com/anevum/anevum-web/issues/335), [V131 release #655](https://github.com/anevum/anevum-web/issues/655), [NEXT #679](https://github.com/anevum/anevum-web/pull/679), [Studio #687](https://github.com/anevum/anevum-web/pull/687).
