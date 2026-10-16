# ANEVUM V025 — Canonical Account Erasure Acceptance

Session: `ANEVUM.WEB.BUILD.2026-10-15.005.CANONICAL-ACCOUNT-ERASURE-GUARDS`

## Decision and boundaries

- Public ANEVUM registration remains intended to be open and free; testing with invited accounts is temporary.
- Account deletion must be self-service after verified identity, recent reauthentication, and explicit confirmation.
- No account can delete another account; the server decides ownership from a verified canonical Better Auth cookie.
- Founder/owner protected identities must be refused. If the protected-account list is missing, refuse deletion.
- This is **canonical `MEMBER_DB` erasure only**. Do not imply deletion of unrelated Creator V1, V5, RHEN, broker, staff, or third-party records. Identity linking between these systems is not approved.
- Existing `a.anevum.com` V024 deployment and `anevum.com` countdown are unchanged; V025 is review-only and must remain disabled in runtime.

## V025 implementation

1. New hidden `POST /api/v1/member/account-delete` route; route returns 404 unless `CANONICAL_ACCOUNT_ERASURE_ENABLED === "true"`. The flag does not exist in existing staging bindings and was not added to any deployed configuration.
2. Reject GET, foreign-host and foreign-origin operations. Existing same-origin CSRF and cookie filters remain authoritative.
3. Require a verified Better Auth session created within 10 minutes; reject stale/missing/unverified sessions. Do not treat activity-updated timestamps as renewed authentication.
4. Reject protected email identities; demand exact email and confirmation `DELETE MY ANEVUM ACCOUNT` in a bounded JSON request, with no arbitrary member ID, role or other browser-supplied selector.
5. Internally call native Better Auth `/auth/delete-user` using the authenticated session and a normalized empty body. The raw native destructive route remains outside the public API allowlist.
6. Native `user.deleteUser` is also disabled unless the same feature flag is explicitly enabled; native `beforeDelete` checks owner protection again.

## Read-only production-provider schema evidence — October 15, 2026

Isolated canonical staging D1 `e1d29049-c83b-4534-8355-dc1fa36ba6d8`, **queries only**:

| Table | Foreign key | Delete policy |
|---|---|---|
| `session` | `userId -> user.id` | CASCADE |
| `account` | `userId -> user.id` | CASCADE |
| `member_creator_profiles` | `user_id -> user.id` | CASCADE |
| `member_creator_edit_limits` | `user_id -> user.id` | CASCADE |
| `verification` | None | Separate lifecycle review required |
| `rateLimit` | None | Separate retention review required |

`PRAGMA foreign_key_check` returned no violations. These facts are **not** a real deleted-user test on remote D1.

## Acceptance and remaining blockers

- Disposable in-memory SQLite exercises two independent OTP-authenticated member sessions, handle claims, owner guard, exact confirmation, native deletion of only member A, A session revocation, preservation of member B, and deletion disabled by default. All simulated Resend calls are intercepted; none transmit mail.
- Independent guard tests include absent owner denylist, stale sessions, wrong email, invalid confirmation, oversized requests, unexpected body keys, disabled flag and missing verification.
- Full exact-commit CI must be green before treating the branch as review-ready.
- **Do not activate** until retained canonical D1 backup and independently verified disposable restore exist, two consenting real users complete browser/OTP/profile acceptance, age/privacy/terms and erasure scope are approved, verification/rate-limit record cleanup and retention are defined, and owner approves staging-only destructive tests against disposable records.
- Backups, email provider logs, compliance retention, archived data, external apps and anonymized moderation records require a precise deletion and retention policy. Do not promise instant global erasure until these systems are accounted for.
- The V025 code is not a replacement for a live response-to-deletion workflow or a production launch go/no-go.

## Release discipline

Keep PR #419 draft and unmerged. Run all tests against an exact SHA. Do not execute destructive operations on existing staging users. The publicly visible `/member` account page must not advertise a deletion control until the related legal/retention/restore checks and staged owner UX review are complete.
