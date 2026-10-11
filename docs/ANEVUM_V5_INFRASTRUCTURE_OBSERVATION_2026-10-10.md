# V5 read-only owner infrastructure observers — Cloudflare + Railway

Session: ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL
Tracking: https://github.com/anevum/anevum-web/issues/285
Parent: WEB draft #286 at 9e8f4c33258a75c9af290239a4e5a343f44d2f80

## Security model

- GET /api/command/integrations/infrastructure is guarded by commandCredential BEFORE any provider read; in future V5 deployment this requires independently verified Cloudflare Access and exactly the designated signed-in Better Auth owner-member account.
- No provider token, project ID, Cloudflare account ID, member ID, account name, email, billing data or raw API error returned to browser. No GraphQL mutations, credential creation, database queries or deployment writes.
- Defaults are NOT_CONFIGURED until specifically authorized **encrypted Worker secret** bindings are provisioned. Draft PR creates NONE and leaves Cloudflare production, review staging, RHEN and D1 unchanged.
- Cloudflare: CF_INFRA_ACCOUNT_ID (opaque account ID) and CF_INFRA_READ_TOKEN (separate, Worker Scripts Read permission) are optional at source level; GET /accounts/{account_id}/workers/scripts/{name}/deployments?per_page=1 for exactly the production and Alpaca-review staging Workers; returns only validated deployment UUID and timestamp. Metadata for settings, tokens, D1, R2 and logs is NOT exposed.
- Railway: RAILWAY_INFRA_PROJECT_TOKEN, RAILWAY_INFRA_PROJECT_ID, RAILWAY_INFRA_ENVIRONMENT_ID are optional encrypted/configured bindings. The adapter uses a project/environment-scoped token and GraphQL QUERY operations only, first confirming exact project/environment token scope, then validating project/environment name production and bounded service inventory. Service deployments are read only via the official serviceInstance query. Project tokens may have write powers in Railway even though THIS CODE only queries; do not provision broad account/workspace tokens or claim provider-level read-only enforcement.
- Four-and-a-half second timeouts per call, no redirects, no retries, no cache for authenticated provider requests. Client polling is at most once every five minutes per view. Security/authorization failures and HTTP 200 GraphQL errors yield unavailable, not a false healthy signal.
- An honestly empty verified RHEN production Railway project is NO_SERVICES. A Worker without a deployment record is NO_DEPLOYMENTS. Source read success is OBSERVED, not a promise that HTTP traffic or replicas are healthy.
- No account IDs/credentials or provider access may be acquired automatically just because integration UI is in a development branch.

## Gates before any release

- Full exact-head CI and browser regression, expected missing-secret/no-provider-query behavior and actual provider API read tests once separately authorized.
- Real owner Access + exact owner Better Auth account, second-member and signed-out denial.
- D1 state/backup, public website/Alpaca staging isolation and reviewer non-interference.
- Specific owner authorization to provision least-privileged credentials and to ship the V5 production cutover. Until then, status shows NOT_CONFIGURED, never sampled data or guessed service health.

Later work: authenticated D1/R2 recovery summaries, Cloudflare Access assurance, Railway cost/replicas/cron telemetry, and provider freshness policies after explicit approval. Do not add these prematurely to make the UI look busier.

## Retirement-gate routing regression fix

The combined V5 Worker runs `retiredRhenBoundary(pathname)` BEFORE the new owner observer route handlers. Previously the catch-all `/api/command/*` rule returned SUSPENDED_FOR_REBUILD for `/api/command/integrations/github` and `/api/command/integrations/infrastructure` before either provider adapter could execute. Handler-local tests could pass despite these endpoints being unreachable.

The retirement gate now exempts only the exact session, GitHub observation, and infrastructure observation routes. Their respective handlers still require GET, reject query parameters, and independently check cryptographic Cloudflare Access plus the exact Better Auth owner-member identity before any upstream read. Every legacy RHEN stream, trading/control, IREN, or unregistered integration route still returns SUSPENDED_FOR_REBUILD. No site, provider secret, D1 or RHEN deployment changes occur in this source-only fix.

A standalone regression test now exercises the retirement boundary and confirms the worker dispatch order and protection of both observer routes. Full exact-head CI remains required; this is not a real authenticated two-user/owner acceptance or a production release.
