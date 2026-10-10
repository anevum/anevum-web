# ANEVUM V5.2 — Alpaca Connect reviewer-only paper OAuth

**Session:** `ANEVUM.WEB.BUILD.2026-10-10.001.FULL-SITE-RECONSTRUCTION`  
**Master release board:** #259; **site tracker:** #265; **integrated parent:** PR #269.  
**State:** DEVELOPMENT / PREVIEW-ONLY / DEFAULT-OFF. No approved commercial/live-trading OAuth use, broker execution, app publication, production migration or provider submission has occurred.

## Reason for this change

Alpaca's October 9 application review requests a completed OAuth questionnaire and a real, short non-Loom screen recording showing an end user connect an account. The questionnaire separately requires preauthorization disclosure and acknowledgement. A static fake "connected" mock or screenshot of an unconnected page is not evidence that OAuth works.

This slice reconstructs a **paper-account, read-only** OAuth demonstration from the retired PR #252 design without merging its conflicting database history, `trading` scope, legacy social stack or obsolete live execution experiments. It uses the authenticated F0 Better Auth account, scoped D1 state and Commons V5 UI. The disclosure includes provider-required language but the implementation does **not** ask for order placement authority. Provider documentation confirms read-only endpoint access by default when the requested OAuth scope is omitted. `env=paper` is fixed, and unexpected `trading` or `account:write` grants are rejected.

## Runtime and access boundaries

- Only exact configured HTTPS **staging** origin; `anevum.com` always denied even if an environment variable is accidentally enabled.
- `ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED=false` in both production and staging; real activation requires separate user authorization plus reviewed staging database migration and secrets.
- Never use the owner's archived Railway trading credentials, old Command operator routes, API keys pasted into forms, or a member-selected workspace ID. Every server request derives member identity from Better Auth.
- `POST /api/member/alpaca/review/start`: same-origin, verified member, exact versioned disclosure acknowledgement; SHA-256 state digest with a 10-minute one-time server-side expiry and bounded per-member initiations.
- `GET /api/member/alpaca/review/callback`: current **same authenticated member**, exact state/code, one-time state consume, server-only HTTPS token exchange to Alpaca, read-only PAPER account verification, global uniqueness of broker account assignments.
- OAuth token encrypted using AES-256-GCM with nonce and per-user/account associated data in standalone `migrations-review/0005_member_alpaca_review.sql`, **not** the automatic/default `migrations/` folder. Token/code/state are never sent to public views, exports or logs.
- `GET /api/member/brokerage`: only connection readiness, paper status and masked last 4; paper bots/live bots/orders/transfers/funding remain disabled. `POST /api/member/alpaca/review/disconnect` removes only caller's encrypted token; user separately revokes the external app with the provider. Account deletion cascades.
- Existing F0 private workspace's `execution_permission=NONE` and `broker_link_state=NOT_LINKED` **are intentionally unchanged**: this is a separate review connection, not authorization for a new production RHEN engine.

## Provider and operations blockers

1. **Provider callback:** Register exactly `https://anevum-member-staging.devonakins.workers.dev/api/member/alpaca/review/callback` on the Alpaca Connect app **only if Alpaca permits this staging redirect**. Do not use local HTTP or introduce wildcard callback hosts.
2. **Secrets:** Explicitly configure three scoped *staging* Worker secrets through provider controls: `ALPACA_CONNECT_CLIENT_ID`, `ALPACA_CONNECT_CLIENT_SECRET`, `ALPACA_CONNECT_TOKEN_KEY_BASE64` (fresh randomly generated 32-byte AES key, base64-encoded). Never put values in GitHub, browser exports or chat.
3. **Migration:** Preview D1 migration `0004_member_rhen_workspaces.sql` is not yet registered in the ledger. Review its existing two-member data before separately registering `0004`. The OAuth schema lives in **separate** `migrations-review/` and uses `wrangler.alpaca-review-migrations.jsonc`, so a manual run of the standard F0 migration workflow cannot silently apply it. Only after `0004` is registered and backed up may the separate `.github/workflows/member-alpaca-review-d1-migrate.yml` be explicitly registered/approved and manually dispatched with exact reviewed SHA, reviewed Git SQL blob, backup attestation and tenant-count/FK checks. No automatic D1 writes, and **never** apply the historical Commons `0004_commons_beta.sql`. After applying `0005`, future default member-migration lineage must be separately reconciled to recognize reviewed `0005`; it should fail closed rather than silently proceed.
4. **Activation:** Separate manual review and authorization to set the **staging-only** flag to true. Do not set production true or grant live trading. Provider approval of the Connect app and any future commercial trading use remain independently unverified.
5. **Acceptance:** Verify unauthenticated denial, session mismatch, stale/replayed state, wrong member ownership, disallowed scopes, encrypted token storage, two-member separation, account deletion and removal. Demonstrate actual sign-in → disclosure → checkbox acknowledgement → provider authorization → returned masked account status. A CI screenshot with a disabled button is only preflight evidence, **not** the requested genuine connection video.

## Alpaca reviewer packet still needed

- Complete the provider's current confidential questionnaire with **verified**, not guessed: legal entity name and type, incorporation jurisdiction, beneficial owner(s), authorized contacts, regulatory/legal status, organization chart, customer count, product model and endpoint/workstation controls.
- Attach current **PDFs** for Terms/End User Agreement, Privacy Policy, fee schedule (or accurate no-fee statement), and a cybersecurity policy addressing access management, encryption, patching, incident response, vendor risk and recovery. Request owner's review before making legal claims.
- Record a short screen capture in a non-Loom product (built-in OS screen recorder is acceptable if it produces a video) showing the real workflow without credentials, cookies, raw account IDs, internal exports or token strings. Provider required preconnection disclosure/acknowledgment must be visible.
- The Commons community must remain an independent education/research forum. No copied/mirrored trades, strategy subscriptions that automatically execute another person's orders, investment advice, financial performance guarantees or account management claims.
- The questionnaire is confidential; it is **not copied into this public repository** and is not itself a website content asset.
- No response or files have been sent to Alpaca through this development branch.

## Test evidence

`npm run test:members` includes `tests/member-alpaca-review.test.mjs`. Full GitHub Verify builds source, exercises browser QA for `/apps/rhen/connect`, checks desktop/mobile disclosure screenshots and guarantees the authorization control is off in unauthenticated/disabled states. CI does not contact Alpaca or migrate D1.

Sources: Alpaca OAuth2 Trading API guide (read-only default, paper env, exact callback and server-only token exchange); Alpaca support email dated October 9, 2026; private OAuth DDQ v3 attachment (not replicated in repo).

## Distinct migration execution authority

The original F0 workflow `.github/workflows/member-preview-d1-migrate.yml` migrates the default `migrations/` directory. The added OAuth tables are intentionally absent from it; otherwise F0 0004 approval would unintentionally execute OAuth 0005. `migrations-review/` includes exactly one SQL file and its own config for **preview D1 only**. The new workflow only runs on an exact, reviewed `main` SHA with separate explicit typed confirmation, schema blob, verified backup, preview D1 inventory, registered 0004 lineage, unchanged member/workspace/draft counts and clear foreign keys. This workflow is neither registered on main nor dispatched by creating draft PR #270. No database was changed by this PR.

**Alpaca reviewer acceptance caution:** a paper-account read-only demonstration is our safe technical first stage, not proof that Alpaca will accept paper instead of a requested live Connect-account screen recording. The provider must confirm permitted app scope, environment, and registered callback before this can count as its requested connection demonstration.
