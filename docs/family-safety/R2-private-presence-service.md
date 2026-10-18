# ANEVUM Family Safety — R2 private presence service candidate

**Session:** ANEVUM.ANEVUM.BUILD.2026-10-17.003.PRIVATE-PRESENCE-SERVICE  
**Status:** implementation candidate in GitHub; unit/mocked integration only; **never deployed**.  
**Parent work:** R0 map PR #491, R1 adult-circle policy PR #496, tracker #490.  
**Target:** a separate, permissioned, opt-in adult-circle service under the ANEVUM umbrella, NOT the public Creator V1 backend.

## Working code

- \`runtime/presence-service.mjs\`: isolated HTTP router with time-limited \`PUT /v1/circles/:circleId/presence/me\`, \`GET /v1/circles/:circleId/presence/:subjectId\`, and \`DELETE /v1/circles/:circleId/shares/:sessionId\`. An observer sees location only after the server reloads adult membership, subject session, specific viewer grant and age-verification evidence. Mutations require exact origin and a deliberate custom-action header; no wildcard CORS. The service rechecks current permissions after asynchronous presence operations and never places coordinate values in HTTP errors.
- \`runtime/ephemeral-room.mjs\`: per-circle memory-only room, maximum 128 subjects, one latest position per authorized subject/session, 5-second minimum write interval, 120-second expiry; private API accepts a session ID on every read/write. Denied/expired positions are unreturned. Revoked session IDs are temporarily banned so delayed writes do not recreate a removed marker. Restart intentionally loses all positions; **no GPS history**.
- The room rejects older device timestamps within the same sharing session. Revocation fences are memory-bounded; saturation fails closed rather than dropping old-session bans.
- \`runtime/private-authority.mjs\`: Cloudflare Access audience + verified identity adapter; identities are mapped using per-environment HMAC of normalized emails into a separately provisioned, independently age-verified adult registry. Each circle/subject/viewer read is built from isolated D1 policy queries. Access proves login control **but not legal adulthood**.
- \`runtime/durable-room.mjs\`: Cloudflare Durable Object wrapper for the memory-only room; RPC methods only, no persistent Durable Object storage or WebSockets.
- \`runtime/worker.mjs\`: fail-closed candidate Worker entrypoint. Requires a *dedicated* Access application, approved origin, separate D1, Durable Object namespace, identity secret and explicit \`FS_ENABLE_REAL_GPS=true\`. There is **no Wrangler route or deployed worker** in this package.
- \`runtime/presence-service.test.mjs\`: simulated web identity and policy adapter; exact origin/JSON bounds, presence freshness, insufficient grant, cross-subject writes, revocation purge, stale reads, delayed old-session writes, throttling, and concurrent session rollover.
- \`runtime/private-authority.test.mjs\`: private registry, HMAC mapping, wrong Access audience, revoked age-verified adult, circle/member checks, source-of-truth D1 revocation.
- \`docs/family-safety/sql/001_private_circle_permissions_REVIEW_ONLY.sql\`: separate D1 schema, including \`fs_verified_adults\` with no raw emails, circle/grant/invitation tables with no GPS columns, uniqueness constraints.
- CI: Node tests for prior maps/policies and this R2 module, Python in-memory SQLite schema constraints, syntax checks for Cloudflare-only modules.

## Contract

A real read sequence:

1. Cloudflare Access authenticates the visitor to the **dedicated Family Safety Access application**; Worker confirms audience.
2. An independently verified adult registry row maps the authenticated Access email HMAC to an ANEVUM Family subject ID. **No lookup is performed using the public Creator V1 profile.**
3. The request may name a circle and target subject; their IDs have no inherent authority.
4. A separate private D1 read fetches both adult memberships, the subject's unrevoked active session, and a viewer-specific, unexpired, explicitly granted \`presence:read\` scope.
5. If authorization fails, the result has the same external structure as unavailable GPS, with no coordinates or account details.
6. If authorized, the Worker fetches only the target's matching-session latest sample from that circle's ephemeral room. It then rechecks D1 policy before returning.
7. No publicly accessible wildcard member discovery, location-history API, server-side bulk tracking or cross-circle listing exists.

A real write (future, once approved): only the authenticated subject can submit their own GPS payload, after an explicitly active sharing session. Position fields must be exactly \`lat,lng,accuracyM,observedAt\`, constrained by type, geography, accuracy, timestamp and 1 KiB body limit. Source-of-truth session is checked before and after the memory-only write.

Stop sharing: the subject issues \`DELETE\` for their own current session. Private D1 revokes the sharing session first (so further reads deny), then revokes viewer grants and removes the matching session's GPS sample from the ephemeral room. Old session IDs are fenced against late writes. Backend failures must not reauthorize denied reads. A complete linearizability/concurrency audit is **still required** before real-world use.

## Wire-up prerequisites (not performed)

1. Provision a distinct private D1 database for family identities/permissions, with new restricted service credentials and a separate migration/rollback procedure. Do not run SQL in Creator V1 production.
2. Provision a dedicated family Durable Object namespace. Map \`FS_PRESENCE\` to \`FamilyPresenceRoom\`. Confirm durable RPC support and no persistence logging/tracing of GPS payloads.
3. Configure an isolated HTTPS staging hostname with Cloudflare Access **and explicit Access AUD checking**.
4. Environment binding \`FS_PRIVATE_DB\` is the *only* D1 binding this Worker should receive. Do not bind Creator V1 public DB.
   **Revocation consistency:** Use authoritative, strongly consistent private D1 permission reads. Do not enable read replicas or cache grant/session rows without an independently validated immediate-revocation consistency protocol; stale authorization can expose a stopped family share.
5. Set \`FS_ORIGIN\` to the exact allowed HTTPS origin. Store \`FS_ACCESS_AUD\` and \`FS_IDENTITY_HMAC_KEY\` in confidential configuration; secret must be high entropy. Rotating the identity HMAC key requires carefully migrating identity lookup hashes without logging emails.
6. Keep \`FS_ENABLE_REAL_GPS\` **unset** until separately approved tests pass. The Worker has no deployment configuration yet by design.
7. Independently verify two adult pilot identities, manually insert narrow registry/membership/session/grant records in isolated test storage, with informed opt-in and documented off-switch.
8. Test real Cloudflare D1 and Durable Object service with cross-account, cross-circle, token refresh, expired consent, rapid revoke/reconnect and same-origin CSRF tests. Confirm no personal coordinates ever reach observability, HTTP logs, error tracking or backups.
9. Verify WebGL mobile Safari/Android, actual GPS accuracy, tile provider privacy, stale/unavailable copy, iOS foreground constraints and battery impact.
10. After negative-access and privacy review, decide whether to permit a tiny adult-only staging pilot. **This work does not approve any live family tracking.**

## Known limitations

- The browser map from R0 remains a **synthetic interface** and is not connected to the R2 service.
- The Worker candidate is deliberately not reachable. It does not implement registration, invitation acceptance, a permissions editor or a UI for enabling sharing; the R1 invite schema/policy is not yet a functioning enrollment service.
- D1 and room consistency/revocation under true distributed concurrency has NOT been load-tested. Revocation is enforced by DB session state for reads and RPC purges for in-flight writes. Do not state instant global revocation is formally proven.
- Cloudflare Access is suitable for a controlled adult developer trial, not the complete consumer/family identity solution.
- A PWA foreground \`watchPosition\` does not provide reliable continuous background location when the app is closed.
- Map tile provider sees the viewed region; location security includes external tile privacy and must be disclosed. No "full 100% photoreal 3D earth" claim.
- Under-18 accounts are rejected by current policy. Verified guardian/custody/child location permissions, lawful privacy notices and safety procedures are separate gates.
- GPS may be spoofed, inaccurate or unavailable; a stale coordinate is not evidence of an emergency.
- No routing/ETA, neighborhood-watch reporting, dispatch, safety claims or public person-location directory.

## Verification and release

CI and in-memory negative-access tests assess the candidate code but cannot prove Cloudflare routing, private D1 identity verification, DO semantics, log privacy, concurrency or real mobile behavior. Hold PR as **draft**; do not promote to main Creator V1 or deploy with actual GPS data without runtime integration, legal/privacy review and explicit release acceptance.
