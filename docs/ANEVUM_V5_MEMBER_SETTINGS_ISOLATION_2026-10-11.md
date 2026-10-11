# ANEVUM V5 member settings isolation

Session: ANEVUM.WEB.PATCH.2026-10-11.002.MEMBER-SETTINGS-ISOLATION
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Continuing: ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL
Master: WEB #259; website reconstruction: WEB #265
Source parent: draft WEB #294 at d47abc77c350df3247be4701f3fc761c33b7705f

## Finding and implementation

The V5 settings route still mounted one editable form across member changes.
It did not clear the previous name when a new session appeared, nor check the
member ID of the /api/member/me response. A delayed profile or save completion
could therefore leave stale editable data or feedback on a different account.
The server remains the authority for every authenticated request; this finding
concerns browser state and response verification, not a demonstrated server
cross-tenant authorization bypass.

Settings now mount an entire form tree keyed to the verified session member ID.
Unavailable/pending/signed-out states have no editable profile. Each profile
response must match that member ID before its display name becomes editable.
Loading, malformed and mismatched responses expose no name or export link and
keep save/deletion disabled. Sign out remains available for recovery.

Unmounting aborts the form's pending requests. All asynchronous callbacks check
that request scope before changing state or navigating. A successful save reloads
and verifies the persisted profile. Failed loads and saves provide a bounded
reload action. Profile submission is a real form, with a 64-character name limit.
Sign-out and deletion errors are visible; a failed response never navigates as
though the action succeeded. Permanent deletion retains explicit confirmation.

## Preserved account route parity

| Function | V5 behavior |
| --- | --- |
| Authentication | Ordinary Better Auth member session; availability checked first |
| Profile editing | Owner-matching load, name editing, submit and verified reload |
| Export | Existing authenticated JSON export, shown after profile verification |
| Sign out | Explicit account action with failure feedback |
| Delete account | Existing server action and irreversible-action confirmation |
| Staging verification | Existing staging-origin-only link |
| Command return | Existing canonical /command destination |

No server authorization, persistence, export format, brokerage or migration
contract changes. The earlier real two-user workspace/draft acceptance remains
historical evidence for its tested source; browser fixtures are not fresh real
member acceptance of this candidate.

## Validation

Local: TypeScript, production build, Foundation suite (76 tests), and the existing
member navigation/staging/sitewide route checks (22 tests). A projection test
rejects crossed identities, missing users, malformed names and missing profiles
without echoing private payload values.

CI: a new browser fixture exercises /me/settings at 320/390/768/1024/1440 widths,
real React form edits and saves, persisted-name reload, JSON export link,
cancelled deletion, disabled and signed-out accounts, failed load/retry, failed
save, malformed/cross-member data and failed sign-out/deletion. Two account-switch
cases use Better Auth's session refresh path without navigation: a held save and
an initial delayed load. The fixture deliberately completes a response after
AbortSignal cancellation to prove it cannot overwrite the next member's name,
show success there, issue another mutation or navigate away.

Fourteen screenshots are mandatory in the existing preview evidence artifact.
Exact-head run links and artifact IDs belong in the PR description. No real
member or provider requests are used by this fixture.

## Release boundary

Stacked draft development only. This does not complete the full V5 rollout or
authorize a merge, production/staging deployment, database migration, member
account deletion, social activation, reviewer repin or broker connection.
The locked Alpaca staging source and separate release gates remain in force.
Further route parity/rollback review, real owner/member acceptance of the final
candidate, actual D1 restoration proof and separately gated social/provider/RHEN
work remain outstanding.
