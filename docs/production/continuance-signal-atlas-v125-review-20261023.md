# V125 — Continuance Signal Atlas homepage experience

Session: `ANEVUM.WEB.UPDATE.2026-10-23.001.HOMEPAGE-ONBOARDING-IREN-ALIGNMENT`
Date: 2026-10-23
Status: SOURCE-ONLY DRAFT. No Worker upload, member/data mutation, or public deployment.

## Goal
Elevate the approved V116–V124 Continuance Institute arrival to a visually distinctive, responsive, refined interactive first contact without losing honest product messaging or adding dependencies.

## Changes
- Keep existing atmospheric planet/rings, authentic public index, verified creator identities and current routes.
- Add a high-resolution vector-based `ContinuanceSignalAtlas`: orbital ticks, graduated rings, waypoints and a decorative sweeping scanner. The graphic claims no real telemetry. It makes no network requests.
- Introduce an opt-in visitor control to pause/resume hero animation; `prefers-reduced-motion` disables animations by default. Single existing IREN companion remains unchanged and "MEET IREN" opens it.
- Refine the hero composition and add a separate editorial charter after actual public discoveries, with a genuine field-guide navigation link.
- Use one scoped stylesheet; no new JavaScript packages, external assets, auth/permissions, member roles, XP activity, custom worker, D1, payment, login method or publishing behavior.

## Verification
- Exact-source `ANEVUM V123 Homepage Signup IREN Continuity QA` now includes V125 structural checks and root/staging builds.
- Review actual screenshots at 1440, 390, and 320. Confirm 320px legibility, click targets, contrast, no horizontal overflow, no visual obstruction by IREN, real Wayfinder navigation, keyboard focus, motion paused and reduced motion.
- The full Creator V1 Verify workflow's read-only live signup canary remains a separate health gate. Its previous V124 failure reported `LIVE_PROBE_FAILED`, not an app-code regression; do not bypass it.
- The old V116 uploaded Worker does not include V124 or V125. Do not merge or promote based on source-only tests. Preserve earlier 100% serving version, settings, 0% protected candidate, Access, D1 and rollback; follow #655.
- Creator Studio #658 remains feature OFF and D1 migration 0014 remains unapplied; public workspace #667 remains a distinct candidate.

## Next gate
Use compiled browser captures to review the hero with actual rendered layout, then correct any mobile/focus/overlap defects. For a combined public release, require fresh integration QA, protected account acceptance, actual iPhone Safari and independent owner go/no-go before traffic promotion.

## Continuation 002 — compiled review and bounded repairs
Session: `ANEVUM.WEB.UPDATE.2026-10-23.002.HOMEPAGE-ONBOARDING-IREN-ALIGNMENT`

- Initial V125 head `60fadbd` failed four workflows because two older tests required the pre-V125 hero class string byte-for-byte. `9b79e86` repairs those assertions while retaining the canonical section/class prefix and all behavioral guards. Its compiled captures were actually inspected at 1440/390/320 (home run 39988446121, signup run 39988446167).
- Desktop and 390px arrival were readable. At 320px the utility row wrapped, lengthening the hero and leaving the IREN orientation below the first screen. The shorter Wayfinder label and explicit utility columns address that observed defect. The motion control now also pauses the charter instrument. OS reduced motion shows an honest static label rather than an ineffective pause button.
- Signup remains email-first and server-attested. Shorter progress copy brings the form forward, the primary Verify action precedes recovery actions, recovery targets are at least 44px, and requesting a code intentionally focuses/positions its field below the fixed navigation. Paused and unavailable access states receive accurate step context. No authentication, resend, eligibility, rate-limit or privacy contract changes.
- The existing IREN panel returns keyboard focus to the invoking page control on Close/Escape, with its dock as fallback. No second companion, tour, member identity or sign-in system is added.
- Browser QA now exercises pause/resume, reduced motion, focus and narrow utility layout using the actual compiled app. Signup QA adds isolated synthetic send/resend/rejected-code/change-email cases at 390/320 with a 460px viewport. Auth POSTs are intercepted and fulfilled only inside that browser test; no email is sent and no account/session is created. These are layout/interaction checks, not proof of a physical Safari keyboard or real account acceptance. No code/request body is recorded in evidence.
- Final-head CI and captures must be rechecked after these repairs. #325 holds the final source SHA, exact run links and remaining gates. #658 stays draft/default OFF, #667 stays separate, migration 0014 remains unapplied, and #655/#622 release safeguards remain in force.

The first short-viewport run on `4761a4a` caught a real dock/Verify overlap (423px button bottom in a 460px viewport). Aligning the code below navigation reserves room for the primary action; the collision assertion stays mandatory. The same review caught pausing the entrance fade before full contrast: paused hero copy now renders at its completed state. Final 320px review additionally requires the homepage IREN orientation action to be visible and clear of the dock.
