# ANEVUM V5 — reviewed public source pointers

Session: ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL
Parent draft: WEB #287 at a3696f376dcb790f65432ead1c2d22c962e16f64
Backlog: WEB #280 (public collaboration), #285 (service integrations), #259 (V5 release board)

## Verified source classification (2026-10-10)

- `anevum/anevum-web`: public repository, root `LICENSE` is Apache License 2.0. Source link in the About page.
- `anevum/rhen`: public repository; no root `LICENSE` or `LICENSE.md` found in reviewed default branch. Link on RHEN product and project cards expressly says public visibility does **not** mean permission to reuse, redistribute, or operate RHEN. The code contains unmerged experiments, not an approved trading product.
- GRAEN / VELUM / NOSTRA are RHEN internal research modules; IREN V5 is deferred, not a new public repository or a separate paid app.
- Do not publish raw activity/PR streams, broker operations, secrets, investor promises, member account data, or sensitive contributor information in Commons.

## Scope

Adds a static, allowlisted published-source registry and truthful links using existing V5 styles. No GitHub write/app credentials or public API fetch; no new URL route, data migration, social post, billing, broker connection, staging repin, or deployment. Current CI status in private System still lives in separate authenticated provider observers and must not be mistaken for runtime health.

## Release acceptance

- [ ] Full exact-head TypeScript, unit and browser CI, and source-link keyboard/mobile checks.
- [ ] Owner public-content acceptance including unchanged correct licensing status and history/privacy disclosure review.
- [ ] Check that `anevum/rhen` has not gained a new license or exposed unintended private data before publication.
- [ ] Separate production authorization. Documentation PR #279 and RHEN contributor PR #489 remain unmerged and are NOT silently incorporated by these links.

Source-only draft, no deployment.
