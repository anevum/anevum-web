# ANEVUM.WEB.BUILD.2026-10-09.002.MEMBER-LIVE-ALPACA-CONNECT

**Status:** Draft, gated-OFF account onboarding only. It does NOT activate live orders, RHEN Cloud live execution, payments, or the existing company RHEN executor.

## Product direction

Members will connect their own real Alpaca brokerage account and eventually opt into approved RHEN Cloud strategies under account-specific risk limits. We are building live-first, not requiring a public paper-trading trial, while still validating via simulated transport and a restricted staging/test workflow.

ANEVUM must first obtain Alpaca Connect application approval for live third-party trading, plus written commercial-app approval as required by Alpaca terms; review applicable investment-adviser, disclosures, regulatory and security obligations before allowing live member orders. A live OAuth grant does not itself enable trading.

## Implemented identity connection

- `0006_member_alpaca_live_connect.sql` creates isolated, user-keyed OAuth state and live-connection tables with uniqueness across user and broker account; foreign-key cascade on account removal. Tokens are persisted as AES-256-GCM ciphertext with random IV and per-account authenticated data, never plaintext in D1 or exports.
- All endpoints are under Better Auth's authenticated member API; start and disconnect require same-origin mutation checks. The OAuth callback is validated by a cryptographically random, one-time 10-minute state digest tied to the authenticated user ID.
- The approved OAuth URL explicitly requests `env=live` and `scope=trading`, matching one exact HTTPS callback. The token exchange happens only on the Worker server, with secrets from Worker bindings. Live account verification calls `https://api.alpaca.markets/v2/account`, checks account identifier, ACTIVE status and trading/access block flags.
- The known company owner brokerage account is explicitly blocked from use as a member connection. `ANEVUM_OWNER_BROKER_ACCOUNT_ID` is a required secure backend binding; missing this value prevents linking.
- Every account's broker ID is unique, so a second ANEVUM member cannot attach another user's account. A connected member may disconnect: local encrypted token data is deleted and the UI instructs the member to revoke the authorization in Alpaca. Direct provider-side token revocation is not yet implemented.
- `GET /api/member/brokerage`: owner-scoped account linking status, last four characters of broker ID when linked. All broker execution, transfers, funding, paper trading and withdrawals remain `false`.
- `POST /api/member/alpaca/live/start`: verified member starts one-time OAuth. `GET /api/member/alpaca/live/callback`: same member finishes with valid state, code and broker verification. `POST /api/member/alpaca/live/disconnect`: deletes only that member's local encrypted grant.
- Account export includes live broker connection **metadata only**, never access tokens, encryption nonce, state or credentials.
- The RHEN member brokerage page displays accurate linking readiness and, after explicit later approval, a Connect button. No input field for Alpaca API keys and no order-submit button.
- User-reported token, client secret, provider authorization code and login cookies must NEVER be pasted into ChatGPT, GitHub or logs.

## Deployment gates

Production and staging both explicitly contain `ANEVUM_ALPACA_LIVE_CONNECT_ENABLED=false`, `ANEVUM_ALPACA_PROVIDER_LIVE_APPROVED=false`, `ANEVUM_ALPACA_COMMERCIAL_USE_APPROVED=false`. Enabling them is separate from CI and must not be done before documented provider authorization.

Cloudflare Worker secrets (to configure after approval):
- `ALPACA_CONNECT_CLIENT_ID` and `ALPACA_CONNECT_CLIENT_SECRET` issued to ANEVUM Connect app
- `ALPACA_CONNECT_TOKEN_KEY_BASE64`: randomly generated 32-byte AES key encoded in base64; establish a rotation and revocation procedure before real members
- `ANEVUM_OWNER_BROKER_ACCOUNT_ID`: company broker account ID blocklist; keep it server-only

No placeholder credentials and no production D1 migrations are authorized. Preview-only D1 migration 0006 follows Commons migration 0005; billing migration 0003 is separately staged and must preserve migration order if later merged.

Before enabling, test a registered OAuth callback on a dedicated ANEVUM staging origin with separate credentials. Validate two real consenting members plus third-party unauthorized users; state replay, forged user/session/origin, account uniqueness, missing scope, revoked OAuth, account deletion and wallet no-access. Verify encrypted-token rotation, CSRF, account exports, cancellation, support, consent and privacy text. Do not activate any broker-order endpoints through the website before the separate RHEN Cloud live execution release is reviewed.

## Remaining execution integration

The isolated RHEN Cloud live order path lives in https://github.com/anevum/rhen/pull/465. It must receive **trusted, signed, short-lived server-side account authorization**, receive decrypted credentials only via a dedicated audited broker service/vault boundary, produce broker-observed risk snapshots, and use a multi-worker durable PostgreSQL order journal. The website and owner operator API must never directly proxy raw member orders to each other.

References:
- https://docs.alpaca.markets/us/docs/about-connect-api
- https://docs.alpaca.markets/us/docs/using-oauth2-and-trading-api
