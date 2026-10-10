# ANEVUM V5 — retire legacy RHEN website backend

**Program:** `ANEVUM.V5.FOUNDATION.2026-10-09.001`  
**Owner decision:** Existing RHEN live execution is disarmed; no open broker positions/orders reported. Historical RHEN 4.3.2 volume evidence **may be discarded**, and Railway Pro backups are not required. This does **not** include GitHub source history, ANEVUM member identities, Commons posts, D1 databases, or the new V5 Evidence Vault.

## Cutover contract

The current website hardcodes the old Railway host in `worker.mjs` for public trading/research read APIs and all Cloudflare Access-scoped RHEN operator APIs. Deleting Railway before handling those paths would produce unbounded errors and deceptive live claims.

The temporary retirement middleware:
- Returns **HTTP 503** with stable `SUSPENDED_FOR_REBUILD` for four old public endpoints; exposes no equity, fills, prices, historic performance or fake candidate metrics.
- Returns the same state for old `/api/command/*` endpoints **only after verifying existing Cloudflare Access**. It cannot reenable, cancel orders or close positions.
- **Exempts** the existing `/api/command/session` identity check and the independent `/api/member/*` and `/api/auth/*` handlers. Member login, D1, billing and Commons features continue unchanged.
- Stops browser SSE connection attempts and repeated REST polling from the archived live hook; visible RHEN pages clearly disclose the rebuild and that live brokerage controls do not exist.
- Leaves the internal code implementing the old proxy in place behind the fail-closed gate for short-term compatibility/testing. **Do not flip the retirement constant false** when the new RHEN is launched; the new service needs independent routes and workspace-scoped broker OAuth.

## Release gate and cleanup order

1. GitHub verify workflow tests middleware path coverage, admin auth ordering, member isolation, disabled browser SSE/retry and client copy.
2. Publish this cutover to Cloudflare staging/production and verify `GET /api/public/trading/live`, `/api/public/trading/events`, `/api/public/research/readiness` all return explicit **503**. Unknown/unauthorized private RHEN endpoints stay protected. Member D1-backed auth and login still respond normally.
3. Only after live Worker is verified, retire the **old Railway rhen service**. It has no custom domain but still serves a Railway-generated hostname for the archived Command/public backend. External clients may still depend on it: native iOS prototype and old alert subscribers should treat it retired/unavailable.
4. Discard the old Railway **rhen-data** volume **only after** the service is retired, as expressly authorized. Detached `rhen44-shadow-data` was removed earlier as obsolete historical storage.
5. Continue V5 successor work in separate stacked draft PRs; **do not delete** member D1, website Workers, R2 staging Evidence Vault, GitHub source, or new workspace contracts.

No claim of historical evidence completeness is made; old local evidence intentionally will not be migrated. First V5 paper session starts at zero and must meet fresh upstream provenance and off-host archival requirements before promotion.
