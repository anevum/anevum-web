# ANEVUM — Canonical Account Authority Contract

**Decision date:** 2026-10-18  
**Status:** Proposed application contract for review. Not a production entitlement change.  
**Applies to:** Member identity; Creator Studio; moderation and IREN staff operations; Backstage; Lab; GUARDIAN; future family and neighborhood applications; owner-only research and finance consoles.  
**Existing work:** #328, #480, #373.

## Identity boundaries

1. **Intended founder identity:** `devon@anevum.com`. This is the canonical human-owner sign-in identifier, **not** a claim that every underlying authentication database already has a verified session or user record for this email.
2. **Member/QA identities:** Every test or ordinary profile is a distinct account with ordinary member rights. Creating a profile, being the first user, using a familiar display name, or testing a creator feature **must never confer founder, staff, finance, infrastructure, or family-network privileges**.
3. **Delegated operators and service accounts:** Studio service identities, moderators, and reviewers have explicit, revocable, scope-limited grants, independent of founder access. Do not conflate an SMTP sender, a Cloudflare account, a GitHub login, and a signed-in member account.
4. **No identity replacement shortcuts:** Never rewrite an existing member email, mark `emailVerified` true manually, merge test and founder profiles, or reuse a test account session to satisfy owner enrollment.

## Authentication vs authorization

- Cloudflare Access is an outer perimeter only. Privileged backend endpoints must independently validate the expected Access issuer/audience/host where applicable and a verified first-party session.
- A verified email is a prerequisite for identity binding, not sufficient for a privileged role. Each app must check role and resource ownership server-side at request time.
- Deny missing, expired, switched, stale, revoked, cross-account, or mismatched identities; do not infer access from a client-supplied email, profile handle, or role field.
- The founder's Access allowlist should use the intended address. Test accounts may be invited only to ordinary test/member paths, never owner/service-access lists.
- High-risk staff operations, payments, account recovery, moderation, or guardian access must retain an audited, least-privilege authorization layer. Compatible MFA is required before live family data or privileged production access.

## Founder-member recovery gate

Owner authority may be transferred **only after** a fresh, independently verified first-party founder login and a documented, reviewed recovery. Keep existing owner-protection database constraints in force; do not drop triggers or bypass them through an unreviewed SQL shortcut. Record before/after evidence, authorization, rollback plan, and affected active sessions privately.

If no independently authenticated owner is available, **deny/contain privileged staff operations** while keeping ordinary member participation unaffected. Do not designate an arbitrary early signup as a replacement owner.

## Cross-product acceptance requirements

- Founder signs in as the intended identity, completes OTP/OAuth verification, and has a uniquely bound member record; service accounts and QA identities remain separate.
- Ordinary test accounts can create/edit their own profiles but cannot access `/staff`, `/api/v1/member/staff-ops`, `/api/v1/member/forum-review`, Studio owner tools, GUARDIAN operator functions, protected Lab/Backstage, or owner finance APIs.
- Moderator/reviewer access only to assigned functions; cannot grant founder authority or bypass private-family boundaries.
- Two independently authenticated member sessions, owner vs ordinary member, reviewer vs ordinary member, logout/session-switch, revoked-grant, CSRF/origin and IDOR tests pass against the exact deployed version.
- Migration and rollbacks preserve identity primary keys and ordinary member content; no user profile or email address is overwritten to create an owner.
- Public website and ordinary member signup remain available when unrelated staff operations are restricted; private family data and real-user safety notifications stay disabled until approved safeguarding/privacy tests.

## Release and incident discipline

Track account mismatch corrections and evidence in private operations records. **Do not post personal test-account emails, session tokens, database IDs, or security-sensitive account weaknesses in public issues or commits.** Any production permission mutation requires exact-target verification, audit evidence, and human acceptance of the resulting role state.
