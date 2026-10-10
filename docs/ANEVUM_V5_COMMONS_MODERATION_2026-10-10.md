# ANEVUM V5 — Commons moderator security and report review

**Canonical session:** `ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL`  
**Coordinating issue:** [#259](https://github.com/anevum/anevum-web/issues/259)  
**Parent:** Unreleased invite-only social draft #272. **This child is development only.**

## Owner and staff boundary

Moderation authority is not inherited from Commons membership, arbitrary email domains, rewards, paid subscriptions, or user-submitted `role` values.

A moderator API request must pass ALL checks:

1. Cloudflare Access independently verifies `cf-access-jwt-assertion` in the Worker using the configured Access application audience and signature.
2. Better Auth independently verifies an active signed-in member session, with `emailVerified: true`.
3. The Access assertion's email must EXACTLY match the verified Better Auth user's email (case-insensitive normalized).
4. The same email must be explicitly present in the server-only `COMMAND_ACCESS_EMAILS` comma-separated allowlist. **Empty allowlist always denies.**
5. V5 member preview and Commons pilot flags must both be enabled on one pinned HTTPS Workers.dev staging host.
6. All four social D1 tables must be present. Same-origin mutation validation happens before moderator endpoint dispatch.

Cloudflare Access must separately protect the moderator API path; do not rely on the public member frontend to enforce it. The owner-only RHEN operator pages remain independent.

## Available review primitives

- `GET /api/member/commons/moderation/reports`: bounded 30 most recent pending reports (oldest first) with reason and relevant post content; no reporter email, credentials, broker data, positions or account token. A full pagination/review-history UI remains future work.
- `POST /api/member/commons/moderation/reports/:report-id/resolve`: exact `{ "decision": "HIDE" | "DISMISS", "reason": "<8–500 chars>" }` body, bound report UUID; conditional pending-report resolution through one D1 batch. `HIDE` hides the published post; `DISMISS` leaves it published. A unique report-specific `commons_v5_moderation_events` entry records verified staff actor ID, affected post, report ID, action, reason and time.
- A second attempted resolution must return a conflict and cannot create a second audit event. The report audit and status are server-owned.
- Deleting a moderator account clears the staff user foreign key from retained moderation events (`ON DELETE SET NULL`) instead of erasing the action/reason/time audit. Any further retention or pseudonymization policy needs explicit legal review.
- No API can change broker or RHEN order permissions, suspend financial accounts, delete source evidence or apply a production migration.

## Release blockers

- [ ] Full exact-HEAD CI including moderator dual-auth and abuse tests.
- [ ] Independent review of Cloudflare Access policy and server-only staff allowlist; **do not put staff identifiers or JWTs into code, GitHub comments or screenshots**.
- [ ] Staging-only authorized D1 `0006` migration after reconciling 0004 workspace and independently approved 0005 OAuth ledger; backup/rollback proof.
- [x] Draft moderator UI at `/communities/moderation`: real server-backed pending queue, explicit hide/dismiss reason and audit acknowledgement; no public link or client-derived moderator role. It is inaccessible without BOTH Access and Better Auth identity gates and remains disabled under current flags.\n- [ ] Prove keyboard/mobile accessibility in exact-head browser CI; complete staff communication/appeal policy, private permissions provisioning, audit retention and revocation controls.
- [ ] Define content/moderation Terms, report handling retention and member data deletion/exposure handling.
- [ ] Real two-member/staff adversarial browser acceptance with disabled membership, mismatched Access identity, cross-user session and duplicate report resolution.
- [ ] Explicit owner sign-off before granting staff Access, enabling any staging social flag, inviting members or deploying production.

**The public/social pilot remains OFF in both checked-in Worker configurations.** This code performs no live migrations, schema writes, provider authorizations, brokerage actions or public launch.
