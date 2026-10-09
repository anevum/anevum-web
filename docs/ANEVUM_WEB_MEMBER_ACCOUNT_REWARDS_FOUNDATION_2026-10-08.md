# ANEVUM.WEB.BUILD.2026-10-08.001.MEMBER-ACCOUNT-REWARDS-FOUNDATION

## Implemented on feature branch

Existing Command stays the ANEVUM member portal at /command; /me stays compatible. The protected founder RHEN Terminal remains under /command/rhen/* and /api/command/* behind Cloudflare Access. Live Railway RHEN and Alpaca authority are unchanged.

- /me/rewards: truthful public-facing explanation of a possible future rewards program, with authenticated read-only status via /api/member/rewards.
- /apps/rhen/account: authenticated RHEN member brokerage-readiness view backed by read-only /api/member/brokerage.
- Shared status contracts return no balance, no earnings, no connected account and no trading, funding, or payout permissions.
- The member Command links to the rewards explanation and RHEN workspace includes a brokerage tab.
- No schema migration, external financial API or secret, trading permission, transfer, member signup activation or live reward ledger is introduced.

## Locked financial product direction and boundaries

ANEVUM remains an independent developer workshop; purchases/support may eventually help fund an optional discretionary reward pool from actual available business surplus. There is no promised distribution amount, annual yield, growth, profit share, or transferable reward today. RHEN member accounts must stay user-owned and isolated. Broker OAuth and any trading discretion require legal/broker approval and independent per-user risk, quotas, execution attribution and audits. The owner's existing personal brokerage account is not, without separate account ownership arrangements, ANEVUM's corporate account.

## Later development release gates

1. Complete independently verified staging security tests, production D1 migration approval, and production member OAuth activation using the existing member rollout issue #210.
2. Build actual per-member broker OAuth, credential storage, execution isolation, revocation and paper-only test environment; leave member live orders disabled until explicitly approved.
3. Separately establish business legal structure, entity-owned brokerage/banking accounts, operating surplus accounting, real payments ledger, tax/compliance review, consumer reward terms, and broker-approved payout rails.
4. Only after funding and legal approval add append-only reward transactions with tenant-scoped balances, reconciliation, antifraud/idempotency, consent and payout states. Release cash payouts independently of trading.

Do not equate the current closed financial capability contract with a funded rewards wallet or a live brokerage integration.
