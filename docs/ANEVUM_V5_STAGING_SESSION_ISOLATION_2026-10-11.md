# ANEVUM V5 staging acceptance — session isolation

Session: ANEVUM.WEB.PATCH.2026-10-11.001.STAGING-ACCOUNT-ACCEPTANCE-ISOLATION
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Parent: V5 WEB #301, source head 16274d84cd0f13d583ea3ed3801054ebc14d6d43.

The member staging verification screen is now keyed to the exact Better Auth member ID, just like the production member settings and beta screens. When the active member changes, its prior read-only report, workspace comparison fingerprint, diagnostics and in-flight verification jobs are discarded rather than re-used. No member identifier or cookie is ever included in a CI result or the UI diagnostic.

The read-only session acceptance contract accepts an expected signed-in member ID and rejects cross-identity session results. The optional AbortSignal is carried through each same-origin no-store probe and checked after response parsing. A client-side account switch cannot turn late old-session results into a pass.

The staging-only RHEN_NEXT workspace verifier checks the same AbortSignal before each next step, before and after network requests, and after a slow JSON body or workspace fingerprint. Aborted verification returns only fixed SESSION_CHANGED stage diagnostics and does not start subsequent workspace POSTs once cancellation is detected. An already transmitted HTTP mutation may complete on the server; cancellation is not a rollback, but the server still derives ownership from the authenticated session and rejects client-selected member IDs. No private account data or previous-member evidence is presented to the new member.

Unit tests cover two independent signed-in member IDs, a wrong user profile/export, a pre-aborted verification, an in-flight cancellation even when a transport ignores the signal, and a cancellation during JSON parsing before workspace creation. Source guards require the staging-only origin, an identity-keyed view, and explicit abortion at unmount.

Release status: source-only draft; no staging reviewer re-pin, no database migration, no new secrets, no live account access, no provider OAuth, and no production deployment. This does not replace actual two-Google-account live staging acceptance or owner-authorized release.
