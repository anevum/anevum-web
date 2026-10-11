# ANEVUM V5 — RHEN member draft identity and response hardening

Session: ANEVUM.WEB.PATCH.2026-10-11.002.RHEN-DRAFT-ACCOUNT-SWITCH
Source parent: WEB #303 at 4ecf7d8900f7614db579c10ba774788e3a288e73
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001

The member RHEN application already remounted its private workspace when Better Auth
reported a different user ID. This patch extends that guarantee through the
draft editor's in-flight network and rendering operations. It does not create
a new member account or brokerage authorization mechanism.

- Explicitly pass the verified parent member ID to the keyed RHEN draft editor.
- Abort GET, PUT and DELETE fetches when the component unmounts or its identity
  changes. Reject stale or delayed responses, clear the editor's display state,
  and never report a successful write after cancellation. A request already
  accepted by the server cannot be rolled back solely by browser cancellation.
- Send X-ANEVUM-EXPECTED-MEMBER-ID on the editor's PUT and DELETE calls. The
  backend *compares* it to the verified Better Auth user ID before mutating
  anything. Mismatch fails with HTTP 409. This is never a user-selected
  account, authorization grant, or tenant routing mechanism: all SQL
  operations still use user.id derived from server-side authentication.
  Missing headers remain accepted for existing clients and CLI fixtures;
  this compatibility rule does not itself prove complete cross-account safety.
- Parse all successful draft responses using an exact allowlist: no broker
  secrets, additional fields, execution grants or alternate market scopes.
  Only U.S. equities/ETFs, long-only, integer allocation limits and a
  bounded draft label may appear in the member editor. Missing and elevated
  fields fail closed without rendering upstream data.
- Require a confirmed safe response before showing a saved or deleted state,
  clear stale form values after a verified empty response, and use generic
  error messages without echoing server payloads.

Added unit/security tests for valid and adversarial draft projections,
stale-member headers, unchanged server-side tenant binding, remount and abort
scopes, and never exposing operator or brokerage APIs in the draft editor.

**Release boundary:** source-only DRAFT, no merge, deploy, database migration,
new secret, Alpaca Connect activation or live/paper broker order. The
company's founder/operator account, founder personal PAPER observer and
ordinary members remain separate. Real two-account Google signup, draft
save/read/delete and cross-account acceptance must still be performed on
an approved isolated deployment; CI fixtures are not real user proof.

The existing two-real-member staging acceptance script now carries the verified expected member ID on reversible RHEN draft writes when explicitly launched with `--exercise-writes`. This permits acceptance to exercise the same browser/header consistency check after an authorized staging deployment. Its read-only default and explicit test-account restoration remain unchanged.
