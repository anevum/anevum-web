# ANEVUM — Multi-chat Workstream Consolidation
**Session:** `ANEVUM.WEB.PACKAGE.2026-10-24.001.MULTI-CHAT-CONSOLIDATION`  
**Prepared:** 2026-10-24  
**Repository:** `anevum/anevum-web`  
**Integration branch:** `integrate/parity-v136-multichat-20261024-010`

## One active frontend integration checkpoint

This branch combines **both** parallel V136.009 sources into one commit with two parents:
- Public spatial system and Artifact Lens: PR #725, source `cf40deccec01d48e34e4a44d73946a97a858ba76`.
- Authenticated private Creator Studio spatial explorer/inspector: PR #726, source `93f39f77c216c04ba65bd269e408f49585660b3d`.

The merge retains PR #725's source tree and imports PR #726's exact `Shell.tsx`, `StudioSpatialWorkspaceV136.tsx`, and `studio-spatial-workspace-v136.css` blobs. The release allowlist and compiled browser acceptance test are merged rather than overwritten. The changes from both PRs remain represented in Git ancestry.

### Existing V136 dependency graph

| PR | Responsibility | Status / treatment |
| --- | --- | --- |
| #716–#718 | V136.003–V136.005 homepage, Discover and Living World | Merged to protected V132 source; V136.005 at 1% live canary at last provider inspection |
| #720 | V136.006 console Wayfinder | Base for spatial work; draft, CI evidence must be refreshed before release |
| #721 | V136.007 public environment | Parent of #722; verify shader, tests, and protected source |
| #722 | V136.008 IREN/account console and DOM optical materials | Shared base of the two V136.009 branches |
| #723 | Alternative V136.007 scene director | Referenced and ported into #725; do not merge competing standalone renderer |
| #725 | V136.009 scene director plus public Artifact Lens | Integrated into this branch |
| #726 | V136.009 real private Studio explorer/asset inspector | Integrated into this branch |

The scene director is **one renderer**, not an additional renderer competing with the planetary shader. Public artifact details come from actual approved records. Private Studio project and attachment reads remain session-bound and never feed public world shaders.

### Other ongoing ANEVUM chats — tracked, not silently imported

| PR | Workstream | Ownership and next integration boundary |
| --- | --- | --- |
| #709 and predecessor V115–V121 | Creator Studio IDE, visual composer and concept-fidelity editor | Isolated prior source family; reconcile specific components and native creator contracts after V136 UI tests, not a blanket cherry-pick |
| #700, #710 | Compact member/forum author cards and supporter appearance projection | Verify source-of-truth privacy, public API fields and earned recognition before integrating into canonical cards; remain separate |
| #702 | IREN tester announcements and opt-in email | Independent communications service and consent schema; integrate routes/notification experience only after authorization and endpoint checks |
| #713 | ANEVUM Pay V2 / Square sandbox supporter checkout | Separate payments and ledger scope; no live charges, migrations or merchant authorization implied |
| #724 | Continuance House / family command center | Isolated personal/private application; never expose family data through public ANEVUM routes or shared WebGL |
| #685 | IREN Observatory growth and weekly signals | Distinct analytics/security review required before public dashboards |
| #694 | V132 release foundation | Protected release base; never modify server, member/XP, auth, rewards, permissions or R2 as collateral UI changes |

Earlier NEXT/legacy experiments remain reference material. **An open PR is not a verified feature, a merged PR is not a deployed site, and a synthetic browser fixture is not owner visual approval.**

### Known blockers / release invariants

1. PR #725 exact-head spatial and PARITY browser CI failed on an earlier head: a browser fixture/runtime `Cannot read properties of null (reading 'items')` at Community. The new integration preserves the explicit fail-closed fixture and includes stack reporting for the next exact-head run. Do not modify canonical Community contracts just to satisfy a synthetic test.
2. PR #726 exact-head pending at consolidation time. Its private explorer is session-gated, has cancellable read-only calls, handles empty/errors explicitly and does not authorize writing projects or publishing.
3. **Never** treat WebGL or concept artwork as proof of complete concept fidelity. Preserve real DOM controls, accessible focus, performance caps, reduced-motion and SVG fallback.
4. At last Cloudflare read, V136.003 Worker `72f35ec3-e046-4f75-ae65-19fa672b87c9` served 99%; V136.005 Worker `cf058439-2487-4b96-b183-94a5c419f3cb` served 1%. This is a checkpoint, not a promise of current allocation. No production traffic changes are included here.
5. No backend migrations, Square/Sandbox activation, family data publication, XP/earned grants, role verification changes or private content publicization are permitted as part of this frontend consolidation.

### Acceptance before any ancestor merge or release

- Latest exact-head TypeScript/Vite, V136 browser+scene QA, protected Creator V1 and auth/reward tests passing.
- Visual checks at 1920, 1440, 1024, 768, 390 and 320 pixels, including actual Community, Discover, Studio and mobile IREN overlap.
- Confirm all added files are allowlisted, and both parallel siblings' changes are materially present in the integrated tree.
- Only then supersede old draft PRs in the main release sequence. Confirm Cloudflare routes, 26 binding signatures, protected gateway hash and rollback before any provider deployment. Require additional real-account and iOS Safari checks for public rollout.

**For parallel ChatGPT sessions:** Consult this register and the current integration PR before changing `Shell.tsx`, `LivingWorldField.tsx`, `living-world-shaders.ts`, `parity-v136-release.mjs` or `parity-v136-full-browser.mjs`. Continue specialized changes on bounded branches and rebase/integrate them only after verifying the exact source.
