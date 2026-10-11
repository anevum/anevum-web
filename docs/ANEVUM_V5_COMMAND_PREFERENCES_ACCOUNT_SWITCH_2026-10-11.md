# ANEVUM V5 — Command saved-project member isolation

Session: ANEVUM.WEB.PATCH.2026-10-11.004.COMMAND-PREFERENCE-ACCOUNT-SWITCH
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Parent: V5 WEB #309 at 958b41a6723d41562b5234446dc48a627f3fcc66.

This patch closes a session-change race in the member Command homepage's
**Save program** and **Follow updates** operations. Unlike the existing RHEN
draft and workspace editor, Command previously performed preferences writes
and their account-data reloads without an AbortSignal or an identity guard.
An old browser tab could send a save/follow request while the Better Auth
session changed and end up mutating or displaying a different member's state.

The Command UI now:

- Establishes a per-authenticated-member request scope and aborts it on
  sign-out, identity change, or component unmount.
- Clears member cards during session revalidation, handles a stale or
  delayed GET/JSON response only if the original member ID still matches,
  and strips untrusted/unsupported response fields before rendering.
- Requires a verified member snapshot before saving or following;
  all writes include a bounded expected-member header, credentials from
  the same origin, no-store semantics, and an AbortSignal.
- Treats HTTP success as insufficient: verifies the exact saved/follow
  acknowledgement and reloads the member state before considering a
  mutation complete. Failed verification clears stale data and prompts
  a reload rather than displaying another user's preferences.
- Keeps owner/operator access gated independently by the signed-in
  Cloudflare Access identity: Google membership alone does not enable
  the private company RHEN terminal.

The Worker compares the optional
`X-ANEVUM-EXPECTED-MEMBER-ID` header against **the authenticated Better
Auth user ID** for PUT/DELETE preference operations and denies mismatches
with HTTP 409. The header can never select a tenant; D1 reads/writes still
use only server-derived user.id. Existing clients that omit the header
remain compatible, but the new UI always supplies it. Like any browser
cancellation, aborting a request cannot undo a server mutation that
already committed; the server's comparison enforces the critical
cross-account boundary.

Adversarial tests cover missing/mismatched identity, malformed or
broker-elevated UI responses, unexpected acknowledgement payloads,
abort scope lifecycle, safe reload and independently checked operator
links. This is source-only DRAFT development. No new Google credentials,
Alpaca Connect scopes, brokerage permissions, database migration,
Cloudflare deployment or production merge.

Release gate: exact-head CI must pass; subsequent controlled beta
testing with two independent Google accounts must still verify profile,
save/follow, RHEN workspace, draft and export isolation. The separate
ANEVUM V5 production launch and external tester invitation decisions
remain unapproved.

The explicit two-real-member staging acceptance script also sends the
expected authenticated member header on reversible saved-project writes
when `--exercise-writes` is separately authorized. Synthetic acceptance
fixtures reject a stale member hint with HTTP 409, preserve the other
member's preference state, and verify test data restoration. The script's
read-only default and no-cookie-log policy remain unchanged.
