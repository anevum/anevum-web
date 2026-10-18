# ANEVUM V072 — Creator Appeals and Independent Second Review

**Session:** `ANEVUM.WEB.BUILD.2026-10-18.021.CREATION-APPEALS-SECOND-REVIEW`  
**Date:** 2026-10-18  
**Source branch:** `build/creation-appeals-v072-20261018-021`  
**Status:** Source-only; no production migration, role assignment, public release or award mutation  
**Prerequisite:** V071 audited takedowns and V070 independently reviewed metadata releases

## Purpose

Members who have a reviewed creation removed need a private, legible opportunity to challenge that decision. The original approver, the takedown officer and the creator must **not** adjudicate the same appeal. The appeal must not silently republish an unsafe link, undo a takedown, or regrant prestige awards and XP.

## Implemented

- Additive `0013_studio_creation_appeals.sql` stores immutable owner claims, separately recorded reviewer decisions, and role-specific rate limits.
- `studio-appeals.mjs` exposes exact-path verified-session owner and second-review endpoints:
  - `GET /api/v1/member/studio/appeals`: list the signed-in creator's own takedown cases and independent findings.
  - `POST /api/v1/member/studio/appeals`: one bounded original appeal per exact takedown, with explicit reason code and 40–2000 characters of explanation.
  - `GET /api/v1/member/studio/appeals/review`: only pending cases eligible for the **separately** allowlisted reviewer; never returns member IDs, reporter identities, private files or XP.
  - `POST /api/v1/member/studio/appeals/review`: record-once second review with 40–1800 character independent explanation and a choice of `upheld` or `eligible_for_re_review`.
- A decision does **not** change the publication `withdrawn` status, undo the immutable takedown, restore medals or creation badges, or change XP. An eligible appeal simply refers the owner to a **future** independently approved publication process.
- Creator Studio adds gated `/studio/appeals` and `/studio/appeals/review` screens, visible only with actual feature readiness and verified reviewer role respectively.
- All routes use the same exact-host, HTTP method, Better Auth verified-session and same-origin CSRF restrictions as the canonical Studio backend.
- New publishing is now **blocked unless an independent appeals reviewer and its tables exist**, in addition to existing publication and takedown gates. Emergency takedowns remain separately operable when appeal processing is unavailable.
- Full V070/V071/V069 recognition and creation history remains unchanged. No retroactive issuance or account privilege escalation.

## Permission boundaries

`CANONICAL_STUDIO_APPEALS_ENABLED` must equal the literal `true`. `CANONICAL_STUDIO_APPEAL_REVIEWER_IDS` must be a deliberately approved nonempty list. Neither ordinary forum moderation, owner account age, Studio publication approval, nor safety officer status confers this role.

A reviewer is excluded from a case if the reviewer is its owner, original publication approver or safety takedown officer—even if their ID appears in the appeal reviewer allowlist. The source records the assigned reviewer's ID privately and exposes only the result to the creator.

## Evidence tests

The GitHub workflow `V072 Creator Appeals and Independent Second Review` checks:

- exact, no-duplicate owner appeal per independently documented takedown; another creator cannot file for it;
- immutable one-decision record and denial of client-supplied user IDs, XP, forged badges, invalid methods or forged appeals;
- independent second-review exclusion for owner, original approver and takedown officer;
- author-facing private outcome and restricted reviewer queue;
- no automatic publication reinstatement, award restoration, or new XP;
- filing rate limits and review limits separate from normal member activity;
- a missing redress table closes public publishing/recognition, while urgent safety takedown remains functional;
- TypeScript validation and Creator V1 frontend build, no deployment.

The pre-hardening run [39098162489](https://github.com/anevum/anevum-web/actions/runs/39098162489) passed 53 tests; use the latest successful V072 run for the final hardened source SHA.

## Deliberately incomplete / promotion blockers

1. **No production deployment:** Existing V069 continues to serve site traffic. V070, V071 and V072 must stay source-only until a formally authorized release.
2. **No production D1 migration:** First back up and verify restoration of `MEMBER_DB`, then inspect and apply **0011, 0012, 0013** sequentially in a controlled environment. Never reset XP, profile or signup tables.
3. **No implicitly appointed reviewers:** Formally assign separate publication approver, safety officer and independent appeal reviewer accounts; verify independence and scope.
4. **No automatic reinstatement:** A favorable appeal is advisory. Fresh authorship consent, independent rights checks and safe external destination verification must precede any future re-publication. Fraudulent takedown rollback and appeal escalation policy remain a separately reviewed decision.
5. **Rights complaints and retention policy:** Define complaint intake, evidence handling, retention, access logs, disputed ownership, privacy and legal escalation before broad release. Do not assume a fixed records-retention period without policy approval.
6. **Acceptance testing:** Use real verified creator and separate reviewer test sessions, synthetic creations only, confirm rollback and test desktop/mobile player cards without exposing any real member content.
7. **Asset execution excluded:** This phase does not scan, host, play or distribute uploaded ZIPs, applications, videos, music or documents. Files remain quarantined.

**Operational rule:** Keep the exact V069 Worker rollback pinned and current secrets/database bindings unchanged. Passing isolated tests is not authorization to switch on member publication or reviewer permissions.
