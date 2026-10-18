# ANEVUM Family Safety — R1 private circle permission foundation

**Session:** \`ANEVUM.ANEVUM.BUILD.2026-10-17.002.CIRCLE-PRIVACY-FOUNDATION\`
**State:** implemented prototype policy and REVIEW-ONLY DB schema; **not connected to users or deployed**.
**Program:** ANEVUM Family Safety #490
**Dependency:** isolated 3D map R0 PR #491.
**Scope:** independently authenticated adults only until separately approved child safety and lawful-guardian workflow exists.

## Implemented code / verified guarantees

- \`creator-v1/family-safety/presence-policy.mjs\`: pure deny-by-default server-side permission rules.
- \`creator-v1/family-safety/presence-policy.test.mjs\`: cross-circle denial, identity verification, explicit per-viewer grant, revoked / expired consent, server self-write gate, location timestamp/accuracy validity, recent vs stale vs unavailable, and no child account support.
- \`docs/family-safety/sql/001_private_circle_permissions_REVIEW_ONLY.sql\`: review-only design for isolated D1 circle membership, invitations, share sessions, viewer grants, access audit. **No GPS columns**. Must NOT run in the existing Creator V1 production D1.
- \`docs/family-safety/sql/test_schema.py\`: SQLite constraints, single-use invitation consumption, no location-grant inheritance, and foreign-key isolation.
- \`prototypes/family-safety-3d-map/index.html\`: *fictional* adult-circle preview with static A/B markers, camera framing, stale indicator, simulated revoked share, visual states; still no actual family accounts and no backend traffic.
- \`.github/workflows/family-safety-3d-map.yml\`: Node behavior/policy tests and Python in-memory schema tests.

### Truth-in-location states

- **Recent:** latest accepted position <=30 seconds old. This only means a recent report from a device; it does NOT certify safety.
- **Stale:** accepted report is >30 seconds old and <120 seconds old; display the age/accuracy, do not trigger "child missing" language.
- **Unavailable:** position absent, revoked, too old, malformed or denied. Denials return identical external shape to absent data to prevent account enumeration.
- Only show precise coordinates after the server confirms current circle membership, verified adult identity, matching subject/viewer sharing grant, unexpired explicit subject session, and no revocation.
- A different household, public ANEVUM profile, invited-but-not-yet-accepted account, or moderator does not gain precision location by membership.

### Child accounts — explicitly deferred

Any real minor GPS use requires legal privacy review (including COPPA where applicable), verified guardian authorization, custody/conflict resolution, child-appropriate controls, reporting, redress, deletion, and abuse resistance. Do not relabel minors as adults to bypass the gate. Features like household "guardian" labels do not automatically permit unilateral tracking. This initial policy denies minors entirely.

## Secure Worker boundary (future integration contract)

The server must derive \`actorId\` from a cryptographically verified session. **Never trust IDs, consent booleans, timestamps, verification state, or permissions from client JSON.** The server retrieves circle/membership/session/grant from isolated authoritative storage; re-evaluates \`mayReadPresence\` and \`mayWritePresence\` on each request and each realtime message; and validates positions with \`sanitizePosition\` or \`admitLocationWrite\` before a write.

Endpoints planned, NOT created:
- \`POST /api/family/v1/circles\` — create private circle for verified adult.
- \`POST /api/family/v1/circles/:id/invitations\` — 24-hour invitation token issued by adult, only its digest stored. Do not publish tokens.
- \`POST /api/family/v1/invitations/accept\` — verified adult + digest match + **atomic** single-use consumption. Membership approval is separate from a GPS share grant.
- \`POST /api/family/v1/circles/:id/shares\` — verified subject actively chooses named viewers and expiry (maximum 1 hour).
- \`DELETE /api/family/v1/circles/:id/shares/:sessionId\` — revoke immediately; invalidate all viewer grants and subscriptions.
- \`PUT /api/family/v1/circles/:id/me/position\` — only subject with active explicit session can send sanitized samples; rate-limited; no persistent GPS history.
- \`GET /api/family/v1/circles/:id/members/:subjectId/presence\` — policy-gated latest sample; never list arbitrary residents.
- \`GET /api/family/v1/circles/:id/live\` — optional authenticated realtime subscription; every event must re-check current grants, not just the WebSocket handshake.

**Do not implement public wildcard route or connect this contract to the creator profile API.** Separate D1 namespace, Worker bindings, Access policy, and app-specific session scope are required.

## Architectural trust and data boundaries

1. **Web map:** browser map may request third-party tiles, exposing viewed approximate region to providers. Provider selection, privacy disclosures and optional self-hosted tiles must be reviewed before household use.
2. **Location collection:** explicit on-device foreground consent for prototype; do not claim reliable background iOS tracking from PWA. GPS accuracy can be imprecise or spoofed.
3. **Public community:** only individually verified, voluntarily opted-in \`community_place\` records can be shared; cannot directly reuse person coordinate records.
4. **Short-lived private presence:** planned 120-second TTL in separate private runtime storage; no position history or analytics.
5. **Permissions:** every reading viewer needs specific current grant; role labels and ordinary account membership never imply GPS access.
6. **Audit:** restricted event-only metadata; no coordinates, URL tokens, device GPS, addresses, or private messages in logs; retention/deletion must be approved.
7. **Invitations:** server-generated high-entropy bearer token, digest-only storage, identity-bound destination, <=24-hour expiry, rate limiting, atomic consume and replay denial.
8. **Emergency limitations:** map freshness does not establish an emergency or person safety; emergency services are separate.
9. **Deletion:** revocation must remove the latest location, terminate subscriptions, and block reads before returning successful response. Retention and deletion must be tested at service level, not just pure functions.
10. **Public developer workflow:** no production keys, real family identifiers, precise home positions, or session tokens may be committed.

## Remaining release blockers

- Real user identity authority, signup/deletion and verified household membership.
- Actual D1 schema application only to independently provisioned private database, with reviewed migrations/rollback.
- Secure ingress/cache/streaming service and full replay, CSRF and subscription revocation tests.
- Abuse, custody, child safety, legal and privacy assessment; clear user-visible controls.
- Private-hosted mobile Safari + Android device verification including loss of signal, background pause, battery use and reduced-motion.
- Genuine place/event data source, rights, moderation, routing data and server-side geographic disclosures.
- Approval to roll out an isolated opt-in adult test circle. **No live tracking, no deployment and no payment commitments today.**

### Acceptance sequence

1. Verify R0 map UI in a protected, synthetic-only HTTPS preview.
2. Connect two **separately authenticated adults** to a nonproduction isolated database; prove cross-circle denial and revocation under concurrent streaming.
3. Verify that a new invitation never creates a location sharing grant.
4. Verify no stale or denied location can be leaked by cache/reconnect/lost session.
5. Review privacy and threat cases before any household pilot.
