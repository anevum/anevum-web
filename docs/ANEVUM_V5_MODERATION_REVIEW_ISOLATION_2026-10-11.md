# ANEVUM V5 moderation review isolation

Session: ANEVUM.WEB.PATCH.2026-10-11.003.MODERATION-REVIEW-ISOLATION
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Continuing: ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL
Master: WEB #259; website reconstruction: WEB #265
Source parent: draft WEB #295 at 24176cecf9ff1cbe2d2194fe76928198fc236d85

## Finding and behavior

The moderator form retained local reason/decision state across member changes
and accepted boolean audit acknowledgements without verifying the returned
report, decision or reviewer. Queue responses were cast without validating
their contents. This is browser isolation and response-contract work; no
server authorization bypass has been demonstrated.

The complete review tree now mounts by the verified session member ID. Pending,
unavailable and signed-out sessions expose no queue. Each scope aborts requests
on unmount and checks cancellation after awaited responses, including responses
that complete despite cancellation. Switching accounts discards the queue,
reason, decision, working state and feedback.

The server's private/no-store queue and successful decision response now include
the additive schemaVersion anevum.commons-review.v1 and trusted reviewerMemberId.
The browser verifies both before displaying any queue or accepting success.
Queue validation bounds the page to 30, validates UUIDs, unique reports, reasons,
timestamps, post content and schema statuses, and discards extra private fields.
A capped queue carries an explicit warning that further reports may exist.
The reviewer ID is used for verification and never rendered in the review UI.

Success requires the exact report and submitted decision, resolved=true,
moderationAuditRecorded=true and executionEnabled=false. Failed, malformed,
crossed, conflicting or uncertain acknowledgements retain no success claim and
lock further decisions until an explicit authorized queue reload. Authorization
denial clears the queue. Reload never automatically repeats a mutation; a lost
response may already have committed, so the server's fresh queue is authoritative.
Documented reasons use the existing 8–500 character/control-character contract.

## Validation

Local TypeScript and production build, Foundation suite (80 tests), four new
contract tests and six existing moderation authorization/audit tests. Server
tests verify that the identity envelope derives from the authorized user and
that hide/dismiss audit behavior and duplicate-resolution rejection remain intact.

CI browser fixtures exercise the real route/form at 320/390/768/1024/1440 widths,
documented reasons, visible keyboard focus, hide submission, recorded acknowledgement
and queue removal. Negative cases cover signed-out/disabled accounts, dual-auth
denial, unavailable pilot, malformed and crossed queue envelopes, 30-report cap,
wrong report/decision/reviewer acknowledgements, missing audit, execution-enabled
acknowledgement, conflict, uncertain network completion followed by authoritative
reload, revoked access, delayed initial load and pending decision across accounts.
Late-response fixtures intentionally ignore cancellation and refresh Better Auth
without navigation to verify old content/form/success cannot reappear.

Twenty-two cases and 27 mandatory screenshots include five form states before
submission and five verified outcomes. Fixtures use synthetic identities and
intercepted browser requests only. They are not real staff/member acceptance,
Cloudflare Access provisioning evidence or proof of a deployed social pilot.

## Release boundary

Stacked draft development only; social migration 0006 remains unapplied and the
pilot stays OFF. Independent Access plus verified Better Auth and the explicit
server allowlist remain required. Audit transaction and rights/export/retention
contracts are unchanged. Deploy the server envelope and UI together in any
separately authorized candidate; the new UI deliberately rejects old responses.

No merge, production/staging deployment, migration, staff provisioning, broker
connection, Alpaca reviewer repin or RHEN runtime activation is included. Final
candidate owner/member acceptance, actual D1 restoration proof, social policy,
privacy/retention approval and real staff/adversarial acceptance remain separate
release gates. This does not complete the full V5 rollout.
