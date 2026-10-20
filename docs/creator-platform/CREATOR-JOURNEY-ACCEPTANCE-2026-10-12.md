# Creator V1 — Integrated staging acceptance preparation

Session: `ANEVUM.WEB.BUILD.2026-10-12.005.CREATOR-JOURNEY-ACCEPTANCE`.  
Owner: ANEVUM Web. Source of truth: [engineering #325](https://github.com/anevum/anevum-web/issues/325), [member identity #328](https://github.com/anevum/anevum-web/issues/328), [publishing #329](https://github.com/anevum/anevum-web/issues/329), [security #332](https://github.com/anevum/anevum-web/issues/332).

## What this implementation verifies

An isolated, in-memory, deterministic SQLite fixture now runs the **same source modules** for member identity, project authoring, Access-signed Studio moderation, anonymous read-only publication and public creator directory, then uses a separate logged-in member for voting, XP, private saves and sign-out. This test extends the current member-to-publisher workflow; it does not seed production/staging with made-up accounts.

- Member A creates, edits, submits; staff requests changes, reviews, and publishes using signed Access identity and audit reason.
- Member B cannot edit A's drafts; only the published project and creator are anonymous-readable.
- A cannot self-rate; B can rate with revision enforcement and no duplicate XP, and save privately without exposing the library to A.
- Staff hide/restore actions require Access JWT and reasons, reverse/reinstate B's XP without duplication, and do not award staff privileges.
- B signs out, server revokes the session; B can no longer access the private library, XP or vote. A's session and public project are unaffected.

## What a green CI **does not prove**

- No genuine Resend OTP delivery, Turnstile pass, human browser input, invited account recovery or external browser isolation.
- No actual published project from the owner on staging. Project fixtures are explicitly synthetic.
- No real D1 concurrency, backup/restoration, network failure drills, deletion fulfillment, independent auth penetration test, OAuth approval or release to production.

## Required live acceptance before opening public accounts

1. Verify exact staging Worker versions, stage-only D1 ID, active schema migration versions 0002-0006, current staging owner protection and enabled invite allowlist **without listing private email or secrets**.
2. Select an **owner-approved actual source/demo, license, accessibility evidence, AI and human contribution disclosures**. Do not create a filler project or publish on behalf of the owner.
3. With existing invited human members, run A's real email challenge, session, draft/edit/submit, then separately authenticate into Access Studio and request changes/review/publish; log timestamps and IDs redacted of private data.
4. Independently sign in B on another browser/account. Verify rating/save, XP and achievement, moderated hide/restore, sign-out/recovery, privacy exports and cross-account boundary. Do not add outside test accounts before auth/privacy/abuse review.
5. Record desktop/mobile screenshots (320, 390, 1024, 1440), focus/reduced-motion states, failure paths, D1 snapshot/isolated restore, source SHA and rollback Worker version. Staging acceptance is distinct from production promotion.

All production `anevum.com` routes and the protected V5/RHEN `backstage.anevum.com` archive remain unchanged by this work.
