# ANEVUM V5 — RHEN workspace creation and two-member staging isolation

Session: ANEVUM.WEB.PATCH.2026-10-11.003.RHEN-WORKSPACE-SESSION-BOUNDARY
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Source parent: V5 WEB #304 at b6db0f49e1a475e34056c6318e988fca6e1e9bf1.

The RHEN workspace was already keyed by a verified Better Auth member identity for reads.
The browser's **Create private workspace** POST was not bound to a lifecycle
AbortSignal and had no defensive stale-tab account consistency check.
The patch now closes those two gaps:

- A per-member AbortController wraps workspace creation and is aborted on
  identity change/unmount. Responses arriving after cancellation cannot
  populate an unrelated account, display a successful provisioning result or
  change the new member's UI state. A POST already received by the server
  cannot be undone by browser cancellation.
- The browser sends an optional X-ANEVUM-EXPECTED-MEMBER-ID header. The Worker
  compares it to its independently verified Better Auth member ID *after the
  workspace feature gate* and responds with HTTP 409 when it differs.
  The header is never used to select a tenant; all D1 reads/inserts still bind
  user.id from the server session. Legacy header-free clients remain supported.
- A successful workspace allocation is projected through the existing
  member-private RHEN_NEXT v1 allowlist, with execution NONE, broker NOT_LINKED,
  and exactly VIEW capability before the UI displays it.
- The staging workspace verifier now sends its verified member's ID for its
  two authorized idempotent POSTs, while the forged-member body rejection
  remains an independent negative check.

The optional real two-member acceptance script now reads the existing private
workspace independently under two authenticated test-account cookies and
confirms each member's corresponding export. If both workspaces exist it
requires different random IDs and correct member ownership, but returns only
a Boolean **workspaceIsolationProven** and safe check labels. If one account
has not yet created a workspace, the run can pass its other read-only checks
but explicitly reports workspace isolation NOT VERIFIED; it does not silently
provision new workspaces or claim the isolation acceptance gate is complete.
Wrong owner, unexpected extra fields, forbidden broker/execution state or
shared IDs always fail the test.

Unit tests cover current and stale expected-member comparisons, source ordering
before D1 mutation, browser abort and signal routing, real two-member lookup,
export correspondence, distinct and swapped workspace IDs, and incomplete
proof when a workspace is unprovisioned.

**Release state:** This is a source-only draft. No member signup was performed,
no secret or connection was provisioned, and no Cloudflare D1, staging reviewer,
or production service was modified. The company RHEN operator, founder private
PAPER test and ordinary member workspaces remain distinct. Actual real member
Google signup, persistent private workspace testing and explicit release signoff
remain necessary before launching the ANEVUM V5 non-trading beta.
