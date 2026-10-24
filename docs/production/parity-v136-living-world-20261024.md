# ANEVUM PARITY V136.005 — Living World architecture

Session: `ANEVUM.WEB.BUILD.2026-10-24.001.PARITY-V136`.
Development PR: #718 stacked on Discover PR #717. Production reference: verified V136.003 / Worker `72f35ec3-e046-4f75-ae65-19fa672b87c9`, deployment `319d9632-5c88-4d41-a3de-849a29e96b98`. No later live allocation may be inferred without a fresh provider readback.

## Owner direction

ANEVUM must behave as one navigable, seamless, console-grade universe. The approved V136 direction **replaces fixed AI cinematic artwork** with programmatically rendered content-responsive environments. This includes permission to update themes, iconography, institutional mark, badges, rewards and visual models; it is not authorization to award entitlements, impersonate achievements, alter private/member data or change financial systems.

## Render paths

1. `LivingWorldProvider` reads only canonical `/api/v1/status` and `/api/v1/categories` aggregate public counts. Refresh is foreground-only every five minutes and on visible-tab return. Invalid, negative, oversized, missing or unavailable counts are not invented or represented as confirmed activity.
2. `LivingWorldField` is mounted once in the shared React shell, outside page outlets. A WebGL2 full-screen shader renders a mathematical orbital architecture, perspective navigation deck and light anchors. The visible sector changes with `/discover?category=...` or home navigation, without unmounting the renderer. Anchors use a bounded logarithmic mapping of **approved public catalogue totals**; they are graphic density, never claimed concurrent users.
3. `LivingWorldGlyph` replaces original template/category illustrations with deterministic SVG geometry seeded by public category or project identifiers. Category tones and optical forms are stable; density evolves from canonical aggregate data. Project records and real creator covers remain distinguished.
4. Existing authenticated/private or creator-uploaded images are not silently overwritten. Unverified artwork remains labelled as a generic, generated visualization. There are no external image generations, telemetry sinks or network rendering services.
5. `LivingRecognition` generates high-resolution badges from the **recognized** badge catalogue and the explicit earned/preview/locked state. It does not mint a badge. Member cards may use verified-level sigils only when a canonical-member source and validated visible level are supplied; all other levels retain server-authorized original media. Founder, staff and moderation roles remain server verified. This is visual-only.
6. Navigation icons and the orbital mark use upgraded vector instrumentation under the PARITY build flag. Original source definitions remain available if full PARITY is disabled.

## Performance and accessibility

The WebGL2 renderer caps display-pixel budget, uses low-power context preference, throttles its atmospheric animation, and falls back to original locally generated SVG geometry on loss of WebGL2. Reduce-motion, Save-Data, hidden tabs, pause and protected legacy destinations stop background animation. Real controls, labels, input, navigation, member profiles and rewards remain HTML/SVG and keyboard-operable; no canvas hit-testing or accessibility tree duplication.

## Protection boundaries

* No Worker changes, schema changes, private session reads in the world renderer, reward ledger or XP writes.
* No changing the sealed V131 gateway, 40 routes, 26 binding signatures, owner controller, original earned-media assets, or real creative records.
* No false live-users, likes, releases, reviews or contribution events embedded in the shader.
* Private creator drafts, DMs and gated achievements are never fed into the shared public environment.
* Do not merge source stack #715 / NEXT ancestry directly to production.
* Retain original earned media in the release package even when redesigned UI presentation is used. Remove obsolete files only in a separately verified migration.

## Release acceptance

Exact-head TypeScript, production Vite build, protected data/reward/auth contracts, compiled Chromium across 1920, 1440, 1024, 768, 390 and 320 pixels, generated art and public-content evolution checks, keyboard focus, true error/empty catalogue behavior, unsupported WebGL and reduced motion, current provider deployment/binding/route preflight, immutable version upload and distinct traffic activation. Physical iOS Safari, actual-account cross-user testing, performance traces and owner concept acceptance are independently tracked; synthetic fixture passes are not proof of real-user acceptance.

The next structural increment should add a staged dynamic reward model gallery, 3D content scene grammar for the Creator Studio and shared route camera transitions. Those increments must not block finishing the running Discover release or destabilize protected member workflows.
