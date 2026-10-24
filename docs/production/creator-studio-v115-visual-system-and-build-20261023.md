# ANEVUM Creator Studio — V115 visual system, component atlas and build sequence

Session: `ANEVUM.WEB.DESIGN.2026-10-23.001.CREATOR-STUDIO-LIVE-EDITOR`
State: SOURCE-ONLY TARGET SPECIFICATION; no released UI and no authorization to change live infrastructure.
Owner reference: October 23, 2026 floating-city Creator Studio concept. Target: same level of cinematic polish **in usable software**, not a wallpaper mockup.

## 1 — LOCKED visual system: `CONTINUANCE / INSTRUMENT GLASS`

The mark must be the existing repository `OrbitalMark` SVG, never a generated replacement. Keep ANEVUM's dark-cosmic foundation, icy technical light, selective warm archival gold and a sparing ultraviolet creation accent. Physical metaphor: an observation console for designing worlds. Information hierarchy and reading clarity take priority over glow.

| Semantic token | Value | Role |
| --- | --- | --- |
| `--v115-void` | `#06101d` | Outer matte backdrop |
| `--v115-deep` | `#091625` | Studio foundation |
| `--v115-surface` | `#0d1d30` | Panels, drawer bodies |
| `--v115-raised` | `#152b43` | Active panels, dropdowns |
| `--v115-line` | `#345470` | Readable contours |
| `--v115-ice` | `#93edff` | Focus, active instrumentation |
| `--v115-electric` | `#3ca5e6` | Selection frames and actionable routes |
| `--v115-auric` | `#eac485` | ANEVUM identity and milestones only |
| `--v115-violet` | `#c5a8ff` | Creation/IREN assistant hints |
| `--v115-ink` | `#f3f9ff` | Primary text |
| `--v115-muted` | `#b6c9dc` | Secondary text, never low contrast |
| `--v115-ok` | `#85e7c4` | Confirmed saved state |
| `--v115-danger` | `#ff9fa8` | Errors and destructive controls |

Glass: dark opaque-ish backing `rgba(9,24,39,.92)`, precise 1px bright edge and inset shadow; apply backdrop blur only to at most a few floating controls. No translucent text panels over busy scenery.

Spacing: 4px baseline, 8/12/16/24/32 steps. Radius: 8px controls, 12px tiles, 16px containers. Controls: minimum 44px touch, 36–44px compact desktop, full keyboard focus ring. Type: existing system/site typography, restrained uppercase micro-eyebrow, readable 13–15px tools, 20–28px titles; tabular metrics and timestamps. Avoid off-brand external display-font downloads.

Motion: 100–160ms control hover/focus; 180–260ms pane transitions; 300–480ms cinematic reveal, not repeated intrusive animation; only transform/opacity where practicable. Honor `prefers-reduced-motion`, visibility changes, low-end/mobile performance. Animation never masks Save/Undo results.

Distinct visual treatments:
- **World editor**: expansive full-bleed actual viewport, crisp manipulation grid/gizmo, floating camera/light controls; avoid decorating on top of selection handles.
- **Interface design**: editorial white-on-black canvas/frame outlines, responsive breakpoint badges and actionable selected-component inspector.
- **Code**: high-contrast monospaced editor with status/gutter/syntax, not a simulated code screenshot.
- **Assets**: uniform previews with type, provenance, access, and selection states; no unlabeled anonymous squares.
- **IREN**: one purple/cyan contextual panel nested into the existing assistant identity, never a second chatbot avatar.
- **Playtest**: observable runtime state with device dimensions, exit/reset and isolated code execution boundaries.

Interaction state inventory: default, hover, focus-visible, selected, disabled, loading, empty, dirty, saving, saved, save-error, revision-conflict, locked/permission-denied, viewport-offline, GPU-context-lost, unsupported hardware and reduced-motion. All must have real copy and appropriate recovery.

## 2 — Layout + component map

```text
1440 desktop / responsive Studio
┌──────────────────────────────────────────────────────────────────────────────┐
│ SHARED ANEVUM SITE HEADER + ORIGINAL ORBITAL MARK                            │
├────────┬──────────────┬─────────────────────────────────────────┬─────────────┤
│  72px  │ 224–244px    │ FLEXIBLE MAIN WORK SURFACE              │ 260–284px   │
│  MODE  │ PROJECT      │ Project title · revision · Save        │ CONTEXT     │
│  RAIL  │ EXPLORER     │ Scene / Interface / Code / Assets       │ INSPECTOR   │
│        │              │ Select Move Rotate Scale · camera      │ Object      │
│ World  │ World tree   ├─────────────────────────────────────────┤ Transform   │
│ UI     │ Assets       │                                         │ Materials   │
│ Code   │ Scripts      │ LIVE WORLD / UI / SOURCE CANVAS        │ Lighting    │
│ Assets │ Interfaces   │                                         │ IREN        │
│ Test   │ Search       │    selectable objects, context tools    │ (shared slot)│
│ Ship   │              │                                         │             │
│        │              ├─────────────────────────────────────────┤             │
│        │              │ ASSET TRAY · filter · tiles · add       │             │
├────────┴──────────────┴─────────────────────────────────────────┴─────────────┤
│ Private draft · real revision · pending changes · performance status          │
└──────────────────────────────────────────────────────────────────────────────┘
```

Exact behavior:
- **Navigation rail:** 72px fixed on desktop; keyboard roving arrow support, labels in tooltip and accessible name; existing app navigation not duplicated across the site shell.
- **Project explorer:** searchable, hierarchical, owner-authorized V111 items; 224–244px resizable later, 1st-level folders/actions available immediately.
- **Central work surface:** min-width 0, no sideways overflow; scene fills remaining height and width. Modes are exclusive views of the same selected project (not six disconnected products).
- **Top command strip:** selected project status + Save Revision only when truly backed by V111; undo/redo/selection/transform; no fake Apply/Publish action.
- **Right context slot:** Inspector OR existing IREN dock, not two persistent 260px columns. Selection-specific controls, undoable edits, informative empty states.
- **Assets bottom tray:** 144–172px, collapsible with accessible expand control; per-asset type/provenance/preview, add only on supported document types.
- **Status:** true read-only/source-only flags and actual saves. No fabricated FPS or network-connected status.

Breakpoint rules:
- 1440 and above: all three columns visible, optional drawer collapse, canvas dominant.
- 1024–1439: optional inspector/IREN slide-over and compact explorer, scene always retains useful width.
- 641–1023: one side drawer at a time, tabs replace icon-rail dependency, tray hidden until opened.
- 320–640: a single canvas or document view + 44px device tool strip + full-width bottom sheet with Objects, Inspector, Assets, IREN. No squeezed desktop columns, no critical offscreen Save button, safe-area padding, keyboard overlap handling.
- 320/390 visual and interaction acceptance, 1440 desktop, tablet landscape, physical iPhone Safari, reduced-motion and 200% zoom.

Major component boundaries:
```
CreatorStudioWorkspaceV109 [existing auth+tabs]
  StudioVisualSystemV115 [scoped CSS variables/theme]
  StudioChromeV115 [shared visual shell, project/title/status and mode switching]
    StudioNavigation [World, Interface, Code, Assets, Playtest, Publish]
    StudioExplorer [existing V111 project tree bridge]
    StudioViewport [V115 WebGL2 engine later; accessible fallback always]
    StudioToolStrip [selection, mode, camera, undo/redo]
    StudioInspector [context-aware fields; never unverified saves]
    StudioAssetShelf [local vetted prototypes then backend asset service]
    StudioAssistantSlot [one original IREN entry point later]
    StudioStatusBar [actual revision, backend capability and dirty state]
  StudioFileWorkspaceV111 [unchanged private revision source of truth]
  StudioSceneComposerV112 [unchanged branching text scene]
  StudioInterfaceBuilderV113 [unchanged declarative UI document]
```

## 3 — Phased implementation (dependency-respecting, no dates invented)

**P0 — Design fidelity, isolated review (NOW).**
Scoped visual token sheet, real DOM React preview of the chrome, responsive mode navigation/drawers/inspector/asset shelf/scene illustration, synthetic project data explicitly labeled; actual working control state. Preview has no writes, GPU engine, new dependencies, or publication. Default-OFF flag. CI/accessible screenshots at 1440/390/320. This validates the screenshot quality and information architecture without confusing a concept scene with a live renderer.

**P1 — Functional GPU world editing.**
Introduce a renderer-agnostic `ANEVUM_WORLD_V1` declarative document contract; stable Three.js/React Three Fiber WebGL2 rendering after pinned dependency review; actual orbit, selection, gizmos, snap, light inspector, undo/redo, procedural Sky Archipelago starter. Browser's own GPU only. On unsupported devices a real 2D scene hierarchy/inspector remains available. WebGPU enhancement is opt-in future.

**P2 — Private persistence.**
Bridge `.world.anevum` documents into existing V111 revisioned files only after independent D1 backup/restore, isolated migration 0014, member-role validation and separately approved activation. Save, reload, revision conflict, trash/restore and account switch are enforced. No silent new storage scheme.

**P3 — Asset Foundry / real project pipeline.**
Validated GLB/glTF/texture/audio, bounded GPU memory/geometry, creator ownership/rights, asset references and measured rendering budgets. R2/object storage and quotas only after separate infrastructure approval. Code preview runs in a hard-isolated origin/sandbox rather than in Studio origin.

**P4 — IREN, creator achievements, collaboration and release.**
One original IREN companion proposes validated, reviewable typed changes, without a paid API by default. Existing #682 achievement designer links only after its independent release/ledger gates; no official XP mint. Collaboration requires scoped permissions and an explicit real-time service. Existing private playtest and moderated release remains the sole publishing path.

**P5 — Optional frontier features, not initial cost.**
WebGPU opt-in, advanced post-processing, procedural terrain, animation/physics, AI-generated 3D and cloud GPU jobs, multiplayer authoring. Each carries isolated quality, privacy, quota and spend approvals.

## Existing projects and non-release guarantees
- Extend [Studio #658](https://github.com/anevum/anevum-web/pull/658); preserve existing actual V109–V113 implementation.
- Preserve [Achievements #682](https://github.com/anevum/anevum-web/pull/682) independently.
- Preserve [NEXT Commons #679](https://github.com/anevum/anevum-web/pull/679) and the accepted V131 release [#655](https://github.com/anevum/anevum-web/issues/655).
- Keep migrations 0014/0015 unapplied and no protected Worker/D1/payment/XP/live traffic changes.
- Do not claim that a visual prototype is a working 3D editor. The reference image is a target, not proof of present functionality.

## Definition of success
Visual parity means a real, legible, beautiful application shell at 1440/390/320, with genuine active/hover/focus/disabled/empty/error interactions, no overflow or broken small-screen layout, original ANEVUM mark, true project data when authorized, and no major frame budget regression. Functional parity requires separately verified actual WebGL manipulation, versioned saves and published playtests, not simply imagery. Each phase must produce screenshot evidence, tests, exact code head and a written residual blocker before advancing.
