# V129 — V125 protected release evidence (review-only)

Session: `ANEVUM.WEB.AUDIT.2026-10-23.001.V125-PROTECTED-RELEASE-EVIDENCE`.

V125 UX, IREN, and signup source is still draft #669 (`6aff161a60d2e86310acf25df4265a8bab326f7d`), with 11/11 passing checks. Its exact offline Worker exists in draft #670 (`1bc20950c71b5b2e0a2f6a3b9fe13f2cb849fd69`), with 5/5 passing checks. Credential-free upload rehearsal draft #671 (`39aceb7d6e7d8246df85e93128afd9a9e3b5697e`) has 5/5 passing checks. None of these are an uploaded V125 Worker, selected version, or public deployment.

The separate V128 proposal for **one inactive version upload** remains in a local hardened review ZIP because publishing its credentialed workflow was blocked. V129 does not work around that restriction. It introduces only a pure, testable acceptance-evidence contract and a no-token GitHub Actions job. No Cloudflare requests, Worker upload, Access modification, D1 operation, traffic change, or release privilege is possible through this V129 workflow.

## Why this is useful

A green GitHub run and synthetic Chromium screenshots are not genuine signed-in/member-account or physical iPhone Safari acceptance. The pure `assessReleaseEvidence()` gate keeps each independent requirement explicit and returns `BLOCKED_AWAITING_PROTECTED_ACCEPTANCE` until actual version receipts, the 13-binding V125-pinned private controller, bounded Access acceptance, real founder/reviewer/ordinary member/guest privacy checks, physical iPhone Safari evidence, rollback rehearsal, and a separate owner go/no-go are recorded.

Even a fully populated evidence envelope is **self-reported**, not cryptographically authenticated by this pure function. Its strongest result is `ELIGIBLE_FOR_SEPARATE_PROMOTION_REVIEW`, never authorization to deploy. A separate owner-controlled release process must authenticate receipts against providers and decide whether to promote traffic. Existing V116 and older protected acceptance tests continue to apply separately; do not relabel them as V125 device/account proof.

## Invariants

- Exact V125 source, V126 Worker ZIP and V127 verified source pins are immutable.
- Original public apex and controller immutable versions must remain at 100% until separately authorized promotion.
- New V125 and matching private-controller version IDs must be genuine distinct UUIDs, uploaded yet unselected at 0%, and preserve disabled public publishing.
- The new controller must pin the **new** V125 immutable version ID, not the previously inactive `86dc4b9d...` or an old uploaded V116 version.
- Protected Access must be exercised with genuine authorization, checked CSRF and privacy controls, a maximum four-hour review window, and an explicitly closed selector after acceptance.
- Founder, reviewer, ordinary member and guest acceptance require real account/guest evidence and isolation. Synthetic screenshot tests cannot substitute for a physical iPhone Safari keyboard/reduced-motion review.
- Retain previous production rollback and prevent Creator Studio #658, Discover/Community #667, migration 0014, XP changes, or unapproved routing/Access bypass.

The evidence gate intentionally runs with no account credentials, requires no additional packages, and evaluates synthetic fixtures only in its own unit tests. Store no real member email, tokens, or secret data in GitHub test artifacts or PR comments.

Owner acceptance and actual V128 upload remain blocked/separate. Track release #655 and canonical coordination #325.
