# ANEVUM Continuance Entry V117 — Implementation and Release Review

Session: `ANEVUM.WEB.BUILD.2026-10-23.001.CONTINUANCE-ENTRY-V117`

Status: **draft source implementation; not merged or deployed**.

## Decision

Build on the V115 discovery-first arrival and V116 unified IREN transmissions.
The canonical product surface for this work is `creator-v1/web`, not the
legacy top-level ANEVUM marketing React app. Preserve the existing Cloudflare,
auth, Creator Studio, earned rewards, member record and public-project boundaries.

Do not introduce another framework or design-system dependency simply to
change the appearance of first contact. The current React/Vite/TypeScript
site already supports the desired interface, and a narrower patch avoids
reversing in-flight Studio and release work.

## V117 implementation

1. **Homepage orientation:** add one semantic Wayfinder anchor beneath the
   existing discovery-first message, retaining the genuine Discover entrance
   and the single "Meet IREN" event. There is no promoted temporary alpha game.
2. **Member access:** expose an accurate three-step account/verification/arrival
   indicator, step-specific guidance and visible previous-step completion.
   No client-side claim that a profile is verified before the backend confirms.
3. **Verification usability:** focus the one-time-code input only after a
   successful user-initiated code request; connect the existing safety guidance
   to the input via `aria-describedby`. Hide optional provider choices while
   an email code is pending to reduce distraction, but preserve "use a different
   email" and resend actions.
4. **IREN:** add a lightweight contextual orientation button to the join page.
   It dispatches the already supported `anevum:iren-open` event to the one
   existing Shell companion. The companion can explain membership; it does not
   request, inspect or process OTPs.
5. **Visual system:** add CSS-scoped cinematic but lightweight surfaces and
   focus affordances, 44px minimum help touch target, 320/390px behavior,
   reduced-motion and forced-colors fallbacks. There is no animation-library
   or asset download.

## Immutable security and release boundaries

- Authentication availability is determined by `canonicalMethods`; UI labels
  cannot enable a disabled signup method.
- Email OTP validation continues through the canonical Better Auth methods,
  including the existing deadline, resend, rate limiting and error behavior.
- This patch never creates members, changes D1, alters roles, awards XP,
  publishes Creator Studio packages, connects LLM providers or changes Workers.
- The old `main` branch is not the applicable approved source baseline for
  the Continuance experience. This candidate is based on
  `release/v084-continuance-approved-20261019`; all source and release
  acceptance still require reviewing the actual base and current head.
- Open Creator Studio integration #658 and the V116 offline Worker release
  have their own dependencies. Do not confuse green UI tests with database
  migration permission, Worker deployment, or production traffic acceptance.

## Verification

Dedicated GitHub Actions job:
`.github/workflows/continuance-entry-v117-qa.yml`

Acceptance checks include:
- React TSX parsing and canonical route contracts.
- Existing signup availability and IREN first-contact regression tests.
- Canonical Vite production and staging-path builds and TypeScript check.
- Offline localhost React browser screenshots at 1440, 390 and 320 px.
- Browser checks for no horizontal overflow, semantic steps, legible member
  entrance, guest path and the single IREN companion on the join page.
- Synthetic fixture only; no real OTP requests, sessions or member writes.

## Next phases, separate approval and evidence

1. Measure browser Core Web Vitals and accessibility in the release preview;
   avoid WebGL on entry until low-end phone measurements justify it.
2. Reconcile typography, spacing, components and motion as sitewide tokens,
   starting with Discover, Member Space and community surfaces.
3. Evolve IREN into a state-driven character prototype using reviewed
   animation technology, keeping the one authentic signal queue.
4. Integrate Studio's professional tabs, Explorer and visual editors only
   through the existing feature-flagged Studio PR and real D1 migration gates.
5. Promote only after exact-head checks, desktop and mobile acceptance, and
   explicit protected deployment approval.

No production deployment is requested or performed by this draft.
