# ANEVUM V124 — reconciled public arrival, signup, and IREN member guidance

Date: 2026-10-23
Session: `ANEVUM.WEB.UPDATE.2026-10-23.001.HOMEPAGE-ONBOARDING-IREN-ALIGNMENT`
Status: DRAFT / SOURCE ONLY — this is not a packaged Worker, merged release or deployed feature.

## Why this integration exists

Two independently tested branches overlap in the same first-contact source files:
- #665 V123 provides discovery-first homepage member entry, email-first canonical signup, one contextual opt-in IREN guide, private first member claim, and real browser capture.
- #666 V117 provides an anchored Wayfinder shortcut, accessible step-aware form progress, screen-reader OTP help, no provider choices competing during OTP, and its own responsive QA.

They cannot be merged blindly, nor should two separate IREN help panels be mounted. This integration uses the **exact V123 head** `780b37d3d5008755d30891676d73edc5cb358697` as its source parent, then selectively ports the independent V117 improvements rather than overwriting V123 component files.

## Combined behavior

1. Home retains the V116 Continuance Institute animated environment, the genuine Discover first action, V123 member entry and single original IREN console. V117's `Find your direction` link jumps into the existing actual Wayfinder, never a second page.
2. Join retains email-first canonical OTP, server-attested social methods and registration availability, resend and account-linking recovery. A real `role=list` progress sequence labels the active account/verification step and offers plain context, including when signup is unavailable.
3. Once a code is requested, the input receives keyboard focus, accessible instructions are connected to it via `aria-describedby`, and social-method alternatives disappear until verification or changing email; no auth API, email content or provider flag is changed.
4. The one existing V123 `ASK IREN` action stays; the redundant V117 signup guide component is intentionally omitted. The existing IREN companion explains registration without reading email or OTP fields and remains available for first permanent-handle setup.
5. Reconciled CSS is appended to the existing V123 source-local stylesheet. No duplicated global theme, new browser dependency, remote image or fake project appears.

## Acceptance and gates

- Validate exact-head TypeScript, root/staging builds, V114–V116 homepage and IREN regressions, V082 canonical signup state tests, V123 and V124 source tests.
- Run the V123 existing real-React browser captures at 1440, 390 and 320px and inspect output. Verify Wayfinder hash jump, progress labeling, IREN panel focus, no horizontal overflow, reduced motion and virtual keyboard.
- Protected live authentication must separately verify a genuine invited-eligible new signup and first member claim, existing verified member, non-invited guest, unavailable and paused signup, incorrect/expired code, resend throttle, OAuth cancellation and account-not-linked handling. Never include real OTP in screenshots/logs.
- V116 immutable apex Worker `76b8140f-5461-4e79-8523-78bf4054958f` remains uploaded at 0%, not serving public traffic; **it does not contain these draft changes**. AUTH controller reconciliation, Access-protected staging, real iPhone Safari and founder go/no-go under #655 remain requirements.
- Creator Studio integrated #658 remains default OFF. Real canonical member D1 backup restore and migration 0014 review remain separate.
- Preserve distinct public workspace PR #667 without changing its Discover/Community files and do not combine unrelated ANEVUM Sites, Lab, Stripe or XP reset work into this code review.

## Supersession instruction

Once the combined branch passes all required checks, treat #665/#666 as its source history, not two separate independent release candidates. Do not mark them merged or release them until a separate reviewed integration and owner authorization have taken place. Record the new exact source SHA and CI evidence before any future packaging or Worker upload.
