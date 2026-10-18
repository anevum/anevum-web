# ANEVUM Porchlight V002 — private-by-design participation backend

**Session:** `ANEVUM.ANEVUM.BUILD.2026-10-17.002.PORCHLIGHT-CONSENT-ORGANIZER-API`  
**Parent:** [ANEVUM Safety #489](https://github.com/anevum/anevum-web/issues/489)  
**Predecessor:** [Porchlight V001 draft PR #494](https://github.com/anevum/anevum-web/pull/494)  
**Status:** SOURCE-ONLY PROTOTYPE — **NOT DEPLOYED, NOT A PRODUCTION SAFETY SERVICE**.

The October 2026 project has one specific purpose: let a legitimately participating adult household request an event listing, and require a separately authorized organizer to confirm the home before its approved details become public. The public route provides **only** time-bounded, host-consented fields. The host can revoke consent, a reviewer can remove a listing, and a manager can pause the entire event. None of this authorizes public crime reporting, child accounts, live family tracking, neighborhood patrols, or cybersecurity testing of others.

## What is working in this source

- A constrained Cloudflare Worker-style Request/Response API using a proposed, isolated SQLite-compatible D1 schema (`schema.sql`).
- Explicit opt-in form version, adult and residence-authorization **attestations** (these are not independently verified age or property ownership), approved event-specific block list, and separate exact-address/coordinate disclosure consent.
- Verified-principal contract and server authorization using event-specific organizer grants; reviewer cannot approve their own submission; revoked organizers lose access.
- Host-only submission status and withdrawal; authorized reviewer queue; independent human verification declaration with review method, reason and audit record.
- Optimistic-revision checks, append-style audit events, transactional D1 `batch` use, and fail-closed SQL conditional updates.
- Public projection that **never returns host principal ID, private notes or private address** in block mode; exact address is copied into a separate explicitly consented public field only for an opt-in exact listing.
- No-cache responses, event publication-window checks on every public request, organizer pause, no source-level secrets, no browser telemetry, no child location history.
- Request-size caps, validation, same-origin write checks, no CORS wildcard, and a required rate-limit adapter for submission creation.

**No real host identity provider is wired.** The module's default Worker export intentionally returns HTTP 503 for every request. The reusable `createPorchlightHandler()` requires an external *cryptographically verified* identity adapter, a real D1 binding, deliberate feature activation, and a real abuse-prevention adapter; test fixtures inject mock principals. A header claiming `X-User-Id` or `CF-Access-Authenticated-User-Email` is **never** sufficient. There is no DNS route, Cloudflare Worker deployment, migration, event seeded in production, sign-in page, Resend email workflow, payment, or actual household onboarding in V002.

## Test locally

Node 22 or later is sufficient, with no package installation:

```bash
cd prototypes/porchlight-v002
node --check service.mjs
node --experimental-sqlite --test test/service.test.mjs
```

Node's SQLite module is experimental and is **only** used as an in-memory D1 test double. This does not certify Cloudflare D1 compatibility or actual Worker behavior; deployment requires an isolated actual-D1 staging integration suite.

## API overview

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/v1/events/:slug/pins` | Anonymous, approved and in-window only |
| `POST` | `/v1/events/:slug/submissions` | Verified identity, event active, quota, affirmative consent |
| `GET` | `/v1/host/submissions` | Verified identity; only the caller's submissions |
| `POST` | `/v1/host/submissions/:id/withdraw` | Own record only; idempotent consent revocation |
| `GET` | `/v1/organizer/events/:slug/submissions` | Non-revoked organizer for that event |
| `POST` | `/v1/organizer/submissions/:id/approve` | Event reviewer/manager; different person from host; property review and revision |
| `POST` | `/v1/organizer/submissions/:id/reject` | Event reviewer/manager |
| `POST` | `/v1/organizer/submissions/:id/remove` | Event reviewer/manager; approved record only |
| `POST` | `/v1/organizer/events/:slug/pause` | Event manager; kill switch for all public listings |

See [API-CONTRACT.md](API-CONTRACT.md) for payloads and [STAGING-ACCEPTANCE.md](STAGING-ACCEPTANCE.md) for unfulfilled gates.

## Source-only integration order

1. Review and accept homeowner privacy, public exact-address wording, contact route, and retention limits. Get legal/insurance guidance before paid or potentially regulated activities.
2. Create an **isolated safety staging Worker and D1**, with no shared Creator V1 identity DB writes or direct access to private manuscripts/brokerage.
3. Integrate a verified, recovery-capable adult sign-in system, with tested CSRF/origin handling and independent two-account browser tests. Keep organizer authorization in separate server-side grants; require MFA for staff.
4. Add a bounded email/organizer invitation system with no preverified ownership assumptions; organizers document their *actual* property authorization check.
5. Provide a real host UI, organizer UI, revocation link, accessible map/list, abuse report/removal workflow, event-end and data-retention jobs, provider billing/usage constraints, and tested emergency fallback.
6. Test production-like restore/rollback, independent privacy review, staging D1 authorization, stale map caches and deployment evidence. Only then consider a supervised pilot.

**Current V001 map remains deliberately disconnected from this API.** Its fictional pins and local sample routes are still useful for visual/UX review. It is not a live frontend for V002.

ANEVUM Creator V1 #325 and New Year launch operations #308 remain unchanged. The safety pilot creates no new mandatory P0 feature for Creator V1.
