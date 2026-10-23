# ANEVUM V123 — Continuance Homepage, Signup and IREN Journey

Session: `ANEVUM.WEB.UPDATE.2026-10-23.001.HOMEPAGE-ONBOARDING-IREN-ALIGNMENT`
Date: October 23, 2026
Status: SOURCE-ONLY DRAFT — NOT DEPLOYED

## Existing release and parallel work (do not restart)

- V116 merged homepage + existing IREN guide + genuine verified transmission queue to approved `release/v084-continuance-approved-20261019` in PR #652.
- The exact-source V116 apex Worker was uploaded as immutable version `76b8140f-5461-4e79-8523-78bf4054958f` but not selected for public traffic (0%). It requires protected private-controller AUTH pin alignment, paired inactive acceptance, Safari/member/guest verification and a separate public promotion decision under issue #655 and prior V120–V122 work.
- Creator Studio V109–V113 source-only integration remains in draft PR #658 with flags OFF. Live canonical D1 backup restore, SQL migration `0014_private_studio_file_tree.sql` review, iPhone/member authorization and release review are separate; do not merge competing older stacked branches.
- Other workstreams are isolated: owner-only ANEVUM Sites concepts PR #593, private Lab exploration, player exit/project persistence and the retirement of temporary XP calibration.

## This V123 draft patch

1. Preserve the V116 planet/rings arrival, primary **Enter ANEVUM** discover-first action, four Wayfinder destinations, and single existing IREN character. Add one truthful secondary **Create your member space** action, which changes to **Return to my space** for a verified member.
2. Keep server-attested canonical auth availability and existing 8-digit OTP account creation/sign-in. Make email visibly first, place only currently enabled social providers underneath, focus the code field after an explicit send-code action, and clarify permanent-handle/profile-privacy expectations. Guest discovery remains open without an account.
3. Add a compact educational membership panel without fabricated traction, publishing privileges or fake achievements.
4. Offer opt-in IREN access at signup and during first handle claim, using only the existing Shell-mounted companion and its existing `anevum:iren-open` event. On /join, IREN has an explicit Join & verify topic and does not inspect the email or OTP.
5. Add a scoped high-definition Continuance style layer with mobile, keyboard focus, reduced-motion and high-contrast accommodations. Visual IREN motion, position, verified notification queue and authority remain unchanged.
6. Add V123 source contracts and a PR-only CI workflow with TypeScript, root/staging build, and authentication/home/IREN regressions.

This PR **does not** alter canonical auth Worker, cloud routes or bindings, D1 data, roles, secrets, XP grants, reward ledger, social authorization, publishing, payment providers or production Cloudflare traffic.

## Release acceptance required

- Require full exact-head CI and V123 + legacy V116 first-load/IREN and signup tests to pass.
- Visually review the actual compiled React UI at 1440/390/320 widths. Confirm the hero CTAs do not overlap IREN's live orientation console, mobile signup progression stays readable, keyboard and OTP focus work, and motion preference is respected.
- Test guest; invited eligible new account; returning verified account; unverified OAuth account; wrong/expired eight-digit code; OTP resend/cooldown; intentionally paused registration; D1/auth unavailable; owner vs non-owner profile claim; and accessibility on physical iPhone Safari. Use authorized synthetic or invited testers, never disclose codes or user identities in screenshots/logs.
- Verify there is exactly one IREN companion; opt-in only; queued authentic XP/update signals still survive an open guide; hidden IREN still respects existing quiet-notification fallback; signup never requests any code in IREN.
- V123 is not included in the already source-locked V116 Cloudflare version. Promotion of V116 cannot be represented as shipping V123. Rebuild and reverify a fresh exact-source artifact only after approved merge and protected acceptance.
- Do not apply Creator Studio D1 migration `0014`, grant permissions, enable publishing, merge PR #658, or alter public traffic as a side effect.
- Obtain founder visual acceptance and separate explicit release authorization before production.

## Active sequence for today

P0: V116 protected release readiness; this independent V123 homepage/signup/IREN review; actual auth/user flow.
P1: Creator Studio PR #658 D1 restore/migration planning and browser acceptance, no unauthorized activation.
P2: outstanding player immersive-view regression, profile polish, XP test-control cleanup and Observatory validation.
P3: ANEVUM Sites and Lab owner-only demos; defer deployment and public promotion.
