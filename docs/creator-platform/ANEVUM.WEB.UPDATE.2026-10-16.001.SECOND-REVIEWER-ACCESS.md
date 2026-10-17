# ANEVUM / CONTINUANCE INSTITUTE
## V044 — Second Trusted Reviewer Access

**Session:** ANEVUM.WEB.UPDATE.2026-10-16.001.SECOND-REVIEWER-ACCESS
**System:** Canonical forum at a.anevum.com, staging only
**Base:** V043 moderator queue pagination; existing Cloudflare Worker, verified Better Auth identities and review audit schema

### Owner-approved scope

The owner designated one existing verified account as the second trusted
moderator. The account is identified privately via an exact case-insensitive
email lookup against canonical staging MEMBER_DB at provisioning time. Neither
the email nor the immutable user ID will be included in committed code,
GitHub Actions logs, build artifacts or public API payloads.

This account currently has no creator profile or public handle. Moderation
authorization requires a real, email-verified Better Auth session, **not** a
creator profile. The person may create their member card voluntarily.

### Privilege boundary

- Preserve original \`CANONICAL_FORUM_REVIEWER_IDS\` without reading,
  replacing, resetting or removing the existing secret.
- Add the second user ID through a separate secret binding,
  \`CANONICAL_FORUM_ADDITIONAL_REVIEWER_IDS\`.
- Server-side access is the union of the two configuration sets, but only
  after the existing Better Auth verified-session gate.
- All V041/V042/V043 restrictions remain, including:
  independent approval (no self-publication); author/profile and parent
  eligibility; report identity privacy; pagination auth; CSRF/mutation checks;
  audited publish/reject/hide/dismiss operations; no XP or bank effects.
- The secondary binding is optional and defaults to empty, making deploying
  source **before** granting the new credential safe.
- No blanket moderators, auto-approval, new public signup access, or new D1
  migrations. Never create or modify the user's account or consent settings.

### Two-phase rollout

1. **Source gate:** merge V044 source only after exact-head CI with verified
   primary and secondary auth tests, missing-profile acceptance, unverified
   rejection, self-approval denial, and V043 pagination authorization.
2. **Staging gate:** deploy the exact reviewed V044 source on a.anevum.com
   with the original V043 Worker as its rollback checkpoint. Confirm all
   old Worker secrets and two D1 bindings remain.
3. **Privilege activation:** requery the designated email in MEMBER_DB
   immediately before setting the secret. Abort unless there is **exactly one**
   existing verified account. Put its immutable Better Auth user ID in the
   new additional reviewer secret, without echoing that ID.
4. Verify the original primary reviewer secret remains bound, the new
   additional reviewer secret exists, V044 is active and both domains retain
   their original routing. Anonymous reviewer access must still return 401.
5. A true two-account hosted review requires the new moderator to sign in
   herself and inspect the first queue item. The owner-authored pending
   thread is never auto-published as part of granting privileges.

### Rollback and revocation

The original reviewer secret is never overwritten. On an issue with the
second authorization, revoke only the new additional reviewer binding and
restore the V043 Worker if needed. Existing audit records are retained.

### Acceptance status

No authenticated live session for the designated secondary user is available
to these server-side deployment tools. A successful server configuration
check is not a substitute for her real-world acceptance or interactive login.
