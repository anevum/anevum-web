# ANEVUM PARITY V136.012 — Unified controller and TV continuation

Session: `ANEVUM.WEB.BUILD.2026-10-24.003.UNIFIED-CONSOLE-CONTINUATION`

Authoritative lineage: PR #727 `integrate/parity-v136-multichat-20261024-010` plus PR #728 `build/parity-v136-controller-input-20261024-001`. Do not create an alternate renderer or another Studio.

## Reconciled work

- V136.011: original Atrium, Archive, Forge, Relay GLB environments and native compressed surface materials; persistent Three.js renderer with CSP/quality fallbacks; consolidated Wayfinder, public Artifact Lens and verified-data profiles; private authorized Studio explorer and source workbench.
- V136.012: one standard Gamepad API adapter, a React shell bridge, connected/unmapped indicator, D-pad and stick navigation, bounded key repeat and A-button selection through existing DOM elements. Source-only. Xbox Edge compatibility still requires physical hardware checks.
- Continuation on V136.012: `data-av-input=gamepad` is set only upon actual allowed controller navigation/activation, cleared by pointer/keyboard input, disconnect or cleanup. CSS enlarges the existing Wayfinder, focus indicators and IREN clearance only on 1024px+ viewports when controller interaction is active. No duplicate console overlay, changes to backend permissions or global forced TV mode.

## Ownership and release gates

The PR #728 branch descends directly from PR #727's exact source, so both are in its Git ancestry. PR #727 remains the integration and V136.011 visual authority until its protected exact-head QA and visual review pass; PR #728 remains a draft and should only be advanced after its own exact-head source, compiled browser, protected checks, and compatibility review.

New in V136.012: `creator-v1/web/src/parity/ControllerBridgeV136.tsx`, `controller-input-v136.ts`, `controller-bridge-v136.css`, source adapter tests, synthetic Chromium Gamepad API acceptance, and release allowlist/workflow integration. Only public spatial routes receive automatic DOM navigation. A cross-origin creator playable iframe retains priority. Unsupported mapping is reported, never guessed. Browser-owned Xbox buttons are not intercepted.

Scope exclusions: native Xbox Store packaging, visual 3D editor, permissions and uploader, real-account test, private family spaces, Square, IREN opt-in messaging, payment, XP, moderation, D1/R2, auth, or runtime CSP. Those must remain distinct until reviewed.

## Continue in this order

1. Verify latest exact-head TypeScript, Vite, controller source tests, full Chromium synthetic Gamepad API acceptance, spatial WebGL QA, release package and protected workflows. Investigate failures; no weakening tests.
2. Obtain physical Xbox Edge and PC gamepad validation, especially browser-owned buttons, Gamepad Permissions Policy and exiting the isolated player.
3. Verify updated TV Wayfinder and IREN clearance at 1920x1080 and 1366x768, plus keyboard-only, touch, forced colors and reduced motion.
4. Advance concept-fidelity materials and detailed sculpted assets through the existing single Three.js renderer, and native Studio editing/preview only via authorized contracts.
5. Before any traffic activation, verify both live 99%/1% versions' shared assets and hash-pair packages, provider readbacks, preserved gateway and immutable bindings. WAF 1010 from the execution environment does not justify bypassing protections.

No claim of production activation or hardware compatibility is made by this source checkpoint.
