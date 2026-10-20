# ANEVUM V1 0.6.0 — Account privacy and session controls

Session: `ANEVUM.WEB.BUILD.2026-10-12.003.ACCOUNT-PRIVACY-FOUNDATION`
Scope: isolated ANEVUM creator staging. **Not public production signup or full erasure acceptance.**

## Implemented

- Signed-in member privacy dashboard at `/api/v1/member/privacy/manage`, with existing cinematic design and navigation from member signup and creator pages.
- Account export with private data sections: account/profile, own projects (including drafts), releases, library, own votes and vote history, XP ledger, authored reviews, reports, and project submission history.
- Paginated, owner-scoped, parameterized JSON exports (50 records per page); browser can download each category. No session token hash, secret, staff role, foreign member account data, or unrelated moderation internals in returned export.
- Sensitive exports and changes require an authentication session created within the last ten minutes. Users can re-verify their email through the existing OTP flow.
- Member deletion **REQUEST** creates an idempotent pending record, requires exact email and `DELETE MY ACCOUNT` confirmation, and may be cancelled while status is `requested`. It does not disable or erase an account or project. There is no hidden automatic purge.
- Revoke all other signed-in devices while retaining the current session; requires fresh session and explicit confirmation. No ability to revoke somebody else's sessions.
- An owner-only, **read-only** queue in Cloudflare Access-protected Creator Studio lists pending deletion requests and requester email addresses. It has no destructive or fulfillment action.
- Non-destructive staging migration `0006_account_privacy.sql` creates `member_deletion_requests` with unique active requests. No other tables altered.

## Security boundaries

- Every account mutation and data read uses the signed-in member resolved from the server-side hashed session cookie, never a caller-provided member ID.
- POST methods inherit Origin and Fetch Metadata protections from the member Worker. No cross-origin CORS added.
- Request data is strictly typed, bounded and explicitly checked; no HTML injection through untrusted text.
- The staff queue is only reachable after the existing Cloudflare Access JWT signature and owner provisioning checks, and its API supports GET only.
- Every sensitive response uses `private, no-store`; privacy HTML is inaccessible without a session.
- No changes to production D1, archive V5, RHEN or the public homepage.

## Local verification

- **91/91 tests pass**: 73 prior identity/publishing/voting/profile tests plus 13 new privacy/account tests and 5 staff queue tests, using SQLite foreign keys and real route handlers.
- Browser QA: 1440px desktop, 390px mobile and 320px small mobile. No horizontal overflow or JS errors; JSON download simulated with explicit fixture account data. These are **local UI checks**, not real user data.

## Honest limits and next gates

1. Full erasure, depublishing, ownership transfers, review of retained moderation/audit records, deletion confirmation emails and retention policy are **not built**. Submitting a request queues it; members are explicitly told that it is not completed.
2. Export includes enumerated user-facing data sections. Large histories are paginated; separate data-access requests may be needed for retained internal audit records. This is not a legal compliance certification.
3. Independent review of the bespoke OTP/session system and real signed-in owner browser acceptance remain outstanding.
4. Do not open public signup or claim completion until permanent erasure, backup and rollback, and consumer support workflows are tested.
5. Do not seed fake member history or delete any real accounts during stage testing.