# ANEVUM V5 — Protected GitHub read-only observation (2026-10-10)

**Session:** `ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL`  
**Tracker:** https://github.com/anevum/anevum-web/issues/285  
**Parent draft:** #284 at `6612d077809239c0b3a68ef7dcad4140afd8c2ee`.

## What is implemented in this source-only draft

- A **read-only, owner-only** GitHub Actions observation at `GET /api/command/integrations/github`. The Worker calls `commandCredential(request, env)` (verified Access JWT plus the exact bound Better Auth owner-member account) **before any** GitHub fetch.
- Only `anevum/anevum-web` and `anevum/rhen` are allowlisted. Data is fetched from GitHub's public Actions API with no bearer credential or GitHub admin access. At most one most-recent workflow run per repository is displayed. An Action's branch, status, conclusion, time and URL are not claims that a production build deployed.
- Untrusted API fields are discarded. Run URLs are rebuilt using only the allowlisted repo plus a validated positive integer ID, not taken from arbitrary API link fields. An invalid API response, timeout, rate limit or missing run yields `UNAVAILABLE`/`NO_RUNS`, never a fabricated green state.
- Cloudflare public metadata fetch caching is requested for 5 minutes, the owner browser refreshes no more often than every 5 minutes, and browser responses are `private, no-store`. HTTP method GET and no query string are allowed; no write actions, secrets, member account data, broker positions or private workflow logs are returned.
- Owner RHEN Terminal's **System** page displays a small observations panel, separate from runtime health, only behind the same owner gate. The site-wide public GitHub links remain governed by the separate public collaboration/privacy review #280 and are **not automatically exposed** by this feature.

## Release gates still pending

- [ ] Exact-head full CI, staging preview, denied-anonymous/member browser smoke tests and source freshness inspection.
- [ ] Real founder + second-member acceptance with separately authorized encrypted owner member binding. A passing static test is not a live-auth proof.
- [ ] Separately authorized production release. Existing production Worker and pinned Alpaca reviewer staging must stay unchanged.
- [ ] Add Cloudflare/Railway read-only adapters with their own least-privilege authorization/credential review. They are **not connected** by this GitHub PR.
- [ ] Source history/licensing/security review before adding public RHEN repository and contribution links or publishing curated releases.

**Not authorized:** publishing full GitHub Actions logs or research artifacts; changing CI status; triggering a workflow; publishing a GitHub token; modifying Cloudflare, Railway, D1, RHEN orders, Alpaca credentials, Stripe or user privileges.
