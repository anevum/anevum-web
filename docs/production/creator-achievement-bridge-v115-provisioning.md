# ANEVUM Achievement Bridge V115: Review & Provisioning Guide

Session: ANEVUM.WEB.BUILD.2026-10-23.002.ACHIEVEMENT-BRIDGE-V115
Status: source-only, draft PR #686, all flags default OFF.

## Trust boundary

The creator backend is the only component entrusted to report creator-attested gameplay events. An ANEVUM publisher registration exists **only after** a publicly approved project and exact release mapping are reviewed. Private Studio draft rows, filenames, URLs, and self-reported client milestones must never automatically activate the publisher. This pilot never issues universal XP or official ANEVUM medals.

A member actively visits the ANEVUM consent screen to receive a short-lived one-time code. The approved creator backend exchanges it using its confidential publisher credential. The returned opaque link ID identifies the member to that particular project without exposing their ANEVUM account ID. Game events are bound to that link, the approved release and an immutable achievement snapshot. Each unique event increments by exactly one; a project-stable mark grants only once across release revisions.

## Staff approval: no public API or automatic migration

1. Verify source ownership and a current accepted public project release through the actual public catalog, not private Studio status. Review creator rights, safety, age/privacy policy, release integrity, callback security and every proposed mark.
2. Provision a publisher record only in a restored/staged MEMBER_DB with the exact independent release reference and HTTPS callback URI under staff-controlled SQL. Create a 256-bit random publisher secret and a fresh UUIDv4 key ID in a password manager/credential vault; put its SHA-256 hexadecimal digest, expiration and project scope in member_mark_publisher_keys. **Do not commit secrets or place any secret in browser assets, CI logs or tickets.**
3. Copy the reviewed, versioned achievement snapshots into member_mark_definitions. A subsequent project revision requires independent review; it cannot silently alter original earned content. Newly approved definitions must have an independent immutable ID and stable key; old member awards remain intact.
4. Verify publisher service credentials stored only in creator server-side environment bindings, exact registered callback and its CSP/referrer policy, secure in-game session mapping and event-proving logic. No client events to ANEVUM publisher API.
5. Confirm consumer-facing distinction: "Creator-reported Project Mark · From [project]". It is not a platform-verified medal, experience XP or guaranteed fulfilled in-game entitlement.
6. Restore an independent MEMBER_DB backup into isolated staging, perform migration and rollforward rehearsal, verify account closure/user exports, publishing reversals, staff suspension, duplicate/race replay and Chrome/physical Safari 1440/390/320 consent. Do not create real issued marks until these acceptance gates are met.
7. Default-off flags: CANONICAL_CREATOR_STUDIO_ENABLED, CANONICAL_CREATOR_ACHIEVEMENTS_V114, CANONICAL_PROJECT_MARK_BRIDGE_V115, VITE_PROJECT_MARK_BRIDGE_V115. No switch is approved by this handoff.

## Required future operational implementation

The current source has intentionally no public publisher-registration, secret-creation or privileged moderation route. Prior to any real pilot, implement staff RBAC, independent dual-approval audit trail, strongly controlled key rotation and revoke controls, scoped rate limiting at the edge, event abuse appeal/takedown UI, account export/deletion verification, monitoring, and a browsable creator developer dashboard. An accepted public release mapping to the private Studio project must be independently verified.

## Member boundaries

- Consent is required on a verified ANEVUM member session, with no arbitrary redirect destination. The code is SHA-256 hashed at rest, has a 120-second TTL and is one-time.
- Revoking an individual game link halts future events. Previously earned marks remain historical until moderator reversal.
- Public display defaults hidden; the member explicitly pins up to six earned active marks. A public query rechecks profile visibility, verified identity, review/suspension state and mark revocation.
- Never return Better Auth user IDs, email, raw game evidence, credentials, or secret hashes to the browser.
- Do not modify the institutional badge/medal ledger or XP balances from these publisher events.

## Current limitations (not launch-ready)

- No live creator SDK package published or hosted integration.
- No actual public-release adapter or staff provisioning authority; test fixtures insert synthetic approved registration.
- Backend game integrity remains creator-attested, not independently verified.
- No moderator reversal/appeal route or audit trail yet.
- No full real-device/user acceptance, browser account switching or independent security review.
- Source-only 0016 migration remains unapplied. V131 production unchanged.

Related GitHub issues: #325 engineering; #337 XP/recognition; #344 creator-hosted-first; #655 V131 production. Parent #682.
