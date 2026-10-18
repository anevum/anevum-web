# Porchlight V003 - Identity boundary and release contract

**No live identity integration is active.** This is a checklist for the separate future review. It is not an assertion that ANEVUM already supports qualified adult accounts for a safety application.

## Trust adapter requirement

The existing `createPorchlightHandler({resolveActor, authorizeWriteQuota})` requires a resolver that returns `{id, verified:true, emailVerified:true, adultEligible:true}` **only if** all of the following hold:

1. Server-side signature/session lookup succeeded using an allowlisted identity issuer and audience, correct service origin, valid unexpired server-side session and revocation check. A decoded JWT string, copied email header or client-side user object is never sufficient.
2. `id` is a stable, non-reassignable issuer-subject binding. ANEVUM public usernames, XP, creator profile IDs and staff badges cannot be used as organizer credentials.
3. Email-verification state comes from the trusted provider's own session data, not an arbitrary request body or application checkbox.
4. Adult eligibility must be established through an approved method and the basis documented by the privacy/legal owner. `adultAttested:true` on a host form is an extra representation, NOT independent identity or age verification.
5. Authentication and role revocation are enforced on every private request. Roles are event-scoped rows in `porchlight_organizer_grants`, with MFA and account recovery for organizers.
6. Secure HTTPS same-origin cookies must be `HttpOnly`, `Secure`, and `SameSite=Strict` wherever compatible, using adequate session rotation, CSRF origin checks, short idle lifetime and complete logout/revocation.
7. Data is scoped to an isolated Porchlight DB and does not inherit unrelated Creator V1/RHEN/staff privileges or share private account records without explicit reviewed integration.
8. No change to the default 503 fail-closed Worker until an independent reviewer verifies these gates on isolated staging.

### Current ANEVUM staging identity is not a shortcut

Creator V1 canonical Better Auth was drafted separately under PR #401 and uses a different issuer, stage domain, cookie isolation and invited-registration boundary. Its existence is not permission to forward cookies from `a.anevum.com`, equate a Creator account with a verified Porchlight adult, grant moderator privileges, or open public signups. Verify actual current deployed auth state and account policies before designing any connector.

### Test-only identities

`test/preview-server.mjs` is gated by `PORCHLIGHT_FIXTURE_TEST_ONLY=1`, binds loopback exclusively, generates nonpersistent unguessable fixture cookies and maps them to synthetic adult/provider claims in server memory. It has no verification of email, age, household control or identity. It is **never** a production authentication or enrollment solution. Do not deploy it as a Worker, publish its test tokens, or turn it into a general signup endpoint.
