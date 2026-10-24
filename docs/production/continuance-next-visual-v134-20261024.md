# ANEVUM NEXT V134 - Unified Visual System and Design Fidelity

Session: ANEVUM.WEB.BUILD.2026-10-24.002.UNIFIED-VISUAL-SYSTEM
Status: Source implemented on isolated NEXT branch; draft review, not deployed.
Parent: draft NEXT Living Commons PR #679 after merged V133 first-contact PR #704.
Protected release: V131 live and founder accepted, recorded in issue #655.
Boards: #325 engineering and #335 owner visual acceptance.

## Design objective

The generated promotional concept is a fidelity target, not a product screenshot. Advance the existing React platform toward one coherent high-resolution visual system. Address public feedback about excessive serif and italic type, too many boxed cards, repetitive overlines, uneven SVG fidelity and text-heavy first contact. Preserve actual product data and real permissions.

## Implemented in this V134 source slice

1. Opt-in visual stylesheet at creator-v1/web/src/continuance-next-visual-v134.css. Activation requires VITE_NEXT_VISUAL_SYSTEM=true. Styles are scoped beneath html[data-av-next-visual=v134], or within the gated visual lab. Default V131-compatible builds keep it off.
2. Shared cosmic tokens: deep blue-black surfaces; cool white typography; restrained copper accent; cyan, violet and blue focus lights; fine hairline borders; intentional glass blur on floating layers; layered shadows and subtle orbital depth.
3. Actual shared navigation and page treatments across the Shell header, search, menu, quick launcher, first-contact hero, featured public work, Discover cards, Commons/Community, public creator tiles, member and signup panels, and existing Studio surfaces. These are scoped CSS enhancements, not a claim that every nested component has been rewritten.
4. Real local interactive React design lab at /__review/visual-system in flagged builds only. Three accessible file tabs, keyboard navigation, color-coded filenames, editable HTML/CSS/TypeScript samples with syntax colors, gutter line numbers, scroll syncing and reset.
5. A sandboxed HTML/CSS render that updates from the local sample editor, plus native CSS orbital material variations reusing the real ANEVUM OrbitalMark. TypeScript is highlighted but never executed. Code is not stored server-side, published or attached to an account.
6. Responsive rules at tablet and phone widths, visible keyboard focus, forced-color support, and reduced-motion behavior. No duplicate IREN assistant, new marketing statistics, telemetry, payment, API endpoint, or database write.
7. Read-only CI for source contracts, true frontend typecheck, normal-build isolation, opt-in build, actual compiled Chromium interactions and PNG captures at 1440px, 1024px, 390px and 320px. No Cloudflare credentials or deployment action.

## Safety boundaries

- V131 Worker versions and rollback are untouched. Do not merge this draft into its frozen publication path.
- PR #679 is still draft. Its frozen OV03 cumulative source-only guard is not modified or waived.
- Studio V109-V113 work in separate draft PR #658 is NOT merged. Its richer persisted IDE, language services, scene authoring and private-file permissions are not claimed as features in this lab.
- D1 migration 0014 remains unapplied. No creator publication permission, XP or recognition grants, auth policy, session data, member records, private API requests, AI key integration, or payment changes.
- V133 first-contact copy and genuine public project data remain canonical. Do not substitute invented screenshots, creator profiles, review totals, likes, or fictitious published content.
- The lab is local, ephemeral and intentionally cannot execute its sample scripts.

## Exact-head acceptance

1. Node source contract tests for preview isolation, the authentic mark, accessibility, and the no-write sandbox.
2. Actual React TypeScript check.
3. Default build with VITE_NEXT_VISUAL_SYSTEM=false excluding V134 assets.
4. Flagged build with VITE_NEXT_VISUAL_SYSTEM=true including the visual system and review route.
5. Chromium review of responsive layout, functional tabs, editable syntax colors, CSS live preview, blocked TypeScript execution, material switching, reset and no browser errors/external requests.
6. Real Home, Discover and Community route captures at desktop (1440px) and phone (390px/320px), with actual Shell treatment, honest offline API state and no horizontal overflow.
7. Source-bound screenshots and JSON report retained by GitHub Actions. Review must be green at its actual head. All tests are read-only.

## Remaining work - not delivered by this slice

- Owner comparison of actual compiled 1440/1024/390/320 screenshots with the concept in issue #335.
- Remove duplicate legacy style overrides and progressively migrate pages to shared reusable React primitives and material tokens.
- Author actual optimized high-resolution visual assets and interactive scenes; do not advertise fabricated concept artwork as production interface screenshots.
- Reconcile protected Studio V109-V113 separately and only after migration, auth, restore, privacy and role requirements are independently satisfied.
- Complete authenticated A/B role checks, physical Safari/VoiceOver, tablet, high DPI and performance coverage, plus final protected NEXT production release approval.
- Full visual fidelity requires component-by-component implementation and QA, not simply applying the first CSS layer.

No public production deployment is authorized or performed by V134.
## Visual QA follow-up

Desktop and original phone PNG inspection identified excess blank editor height on small screens. The 430px and 760px breakpoints now compact the source editor; file badges use more intentional folded-file silhouettes. The compiled suite was extended with 1024px workspace and first-viewport Home/Discover/Community captures at 1440px, 390px and 320px. Those route captures use offline API responses, not invented published catalogue entries. They are for layout acceptance, not marketing.
