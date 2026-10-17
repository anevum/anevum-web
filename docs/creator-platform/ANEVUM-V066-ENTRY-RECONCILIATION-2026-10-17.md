# ANEVUM — V052 sign-in reconciliation on V064

Session: `ANEVUM.WEB.PATCH.2026-10-17.001.SIGNIN-V052-V064-RECONCILIATION`

## Incident

The V052 public join-page release completed successfully at 2026-10-17 16:06 UTC, but later site builds served the older join-page artwork and form. The active V064 Worker deployment is recorded at 2026-10-17 20:03 UTC, version `80c6f0d1-c35b-4524-b97d-7cffdd4063d5` (100%).

## Patch

Start from V064 source and restore V052's React join page, resolution-independent orbital SVG, and scoped CSS. Retain V064's backend and progression sources unchanged. Include V052 contract tests in the canonical signup test suite. This patch must not replace the entire active Worker with the old V052 Worker.

## Required release gate

This patch is **source-only** until a safe deployment mechanism has been verified. The active Cloudflare Worker has 23 bindings, including 4 opaque `secret_text` bindings and 2 D1 databases. A previous `wrangler deploy --keep-vars` operation removed secrets from this script-API-managed Worker. **Do not use that deployment method.**

Prepare a nondeploying candidate Worker version; verify it retains all existing bindings without exposing secret values; verify worker code, generated assets, and exact currently live version against the V064 baseline; then deploy through a reviewed Workers Versions release with rollback to the prior known-good version. If production changes meanwhile, rebase and rerun checks.

Required tests: typecheck/build, canonical email OTP, 320/390/1024/1440 responsive visual snapshots, active 30-stage Evolution WebGL/optical fallback and community/card regressions, signed-out API 401 behavior, origin/cookie protections, live `/join` orbital artwork and email flow. A `200` response alone is not sufficient. Confirm Cloudflare asset route `anevum.com/assets/index-*` preserves sitewide style overlay.

This change does not activate new OAuth providers or modify member, database, email, account, level, or Stripe configuration.

Source lineage: [V052 signup](https://github.com/anevum/anevum-web/pull/473); [V064 optical art](https://github.com/anevum/anevum-web/pull/477).
