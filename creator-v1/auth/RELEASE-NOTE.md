# ANEVUM 1.0 member identity foundation — staging security gate

**Session:** `ANEVUM.WEB.BUILD.2026-10-11.004.MEMBER-IDENTITY-FOUNDATION`

This implementation adds staging-only email OTP, session-bound identity and creator-profile setup without touching the production site's D1 or the archived V5/RHEN services. It intentionally does **not** activate sign-in email delivery, publish sign-up UI on `anevum.com`, or claim that public membership is ready. Accounts are created only after validated Turnstile and Resend delivery are configured; unset provider secrets fail closed.

The tests cover account creation, incorrect/replayed/expired OTPs, brute-force and issuance limits, cross-origin requests, signed session cookies, account isolation, reserved usernames, unchanged staff controls, sign-out, missing provider credentials and provider failure. Final production sign-in acceptance requires external authentication/security review and real D1 concurrency tests. The owner-only Studio remains the only authoring interface enabled.