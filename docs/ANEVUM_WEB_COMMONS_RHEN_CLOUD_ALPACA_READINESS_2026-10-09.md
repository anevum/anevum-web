# ANEVUM.WEB.PACKAGE.2026-10-09.002.COMMONS-RHEN-CLOUD-ALPACA-READINESS

**Session:** ANEVUM.WEB.BUILD.2026-10-09.002.MEMBER-LIVE-ALPACA-CONNECT  
**Audience:** Founder, future ANEVUM contributors and Alpaca application reviewers.  
**State:** DEVELOPMENT / RELEASE GATES CLOSED. No production promotion or financial orders were authorized by this package.

## The product we are building

**ANEVUM Commons** is a free-to-enter research community and home for useful independent software, with RHEN as the first application. The public entrance explains the service without income claims, performance guarantees, luxury marketing, forced subscriptions or misleading customer accounts. Free public learning and verified project evidence are available without claiming that private trading is ready.

Members have one authenticated ANEVUM identity, one private Command workspace and separate application areas. Community questions, research notes and peer-review threads belong in Commons; program settings, live brokerage records and broker connection consent belong in each member's **private RHEN Cloud terminal**, not Commons.

ANEVUM's current trading bot, strategy champion, Alpaca account, orders, balances, Railway deployment and operator Command remain personal/company-owned and entirely separate. The original terminal is accessible only through its existing independently controlled operator route. Do not use that executor as a shared tenant service.

RHEN Cloud is **live-first**: eligible members will eventually authorize their own Alpaca account using approved Alpaca Connect OAuth. A public paper-trading product is not required to enroll, though fake-broker tests and isolated simulations are essential prelaunch validation. Initial execution design is U.S. equities/ETFs, long-only, whole-share LIMIT/DAY regular-session trading, no leverage expansion, shorts, crypto, options execution or member funds movement. Research-only option studies can remain in ANEVUM's separate research programs.

Membership and learning are intended to be free. Optional supporter contributions or subscriptions may be developed separately, without implying investment returns, privileged trading information, brokerage access or higher limits. Rewards/micropayments and gamification remain future ideas, not active balances or entitlements.

## Information architecture

| Surface | Route(s) | Permissions | Reliable contents |
| --- | --- | --- | --- |
| Public landing | `/` | Public | Commons entry, real projects, published notes; no performance claims |
| Learn | `/learn` | Public | Rule-set definition, backtest/holdout hygiene, costs, risk and reproducibility |
| Commons | `/commons`, `/commons/topic/:id` | Admitted beta members for reading/writing | Research questions, research notes, replies, role-based moderation and report queue |
| Command | `/command` | Member; distinct owner operator controls | Private profile, saved programs, follows, app directory |
| RHEN workspace | `/apps/rhen` | Member | Entry to member tools, genuine shared evidence and build notes |
| My RHEN terminal | `/apps/rhen/my-terminal` | Member | Own verified broker account snapshot when approved; positions, order history, private limits; no synthetic balances |
| Brokerage | `/apps/rhen/account` | Member | Approval/link status, personal Connect/Disconnect flow |
| OAuth disclosure | `/apps/rhen/connect` | Public read-only disclosure; authenticated consent required for active OAuth | Exact Alpaca text, honest disabled state and consent barrier |
| Bot settings | `/apps/rhen/setup` | Member | Private long-only risk preferences, validated and saved; never execution permissions |
| Private owner terminal | `/command/rhen/*` | Existing operator restrictions | Current real RHEN trading and company account; never exposed through member terminal |

## Implemented in staged draft branches

1. Web #249: Commons-first landing, invite-only research, real project/notes routes and controlled beta data.
2. Web #251: topic/comment reporting, moderator-only review and account-export constraints.
3. Web #252: live-first Alpaca OAuth connection and disclosure, encrypted member token record, owner broker exclusion, duplicate account constraints, rate-limited and one-time OAuth state, per-user consent and disconnect; default OFF.
4. Web #252 follow-on: personal RHEN terminal with account-derived read-only snapshot, positions and recent orders; snapshot cannot submit orders, transfer funds, impersonate owner or fabricate balances. Explicit `ANEVUM_ALPACA_LIVE_SNAPSHOT_ENABLED=false` in production and staging. Broker data is a 30-second-polled snapshot, **not realtime streaming**.
5. Web #252 follow-on: free `/learn` research primer, guided rule-set review template in Commons, revised member navigation, drafted Terms/Privacy updates. Legal text still requires owner and counsel review.
6. RHEN #465: entirely separate `member_live` contracts, default-OFF broker adapter, pre-trade caps and account isolation, member draft risk policy compiler, deterministic order IDs, SQLite test journal and PostgreSQL durable journal. PostgreSQL schema is kept **outside the owner RHEN migration directory**; CI uses a temporary test DB only.

All values in public RHEN project evidence must come from existing verified sources; none from the new member terminal are exposed to Commons or public feeds.

## What remains REQUIRED, not merely nice-to-have

### Provider and legal
- Alpaca Connect application submitted by owner on 2026-10-09; approval and third-party live commercial/trading rights remain unverified. Keep provider approval flags OFF until written confirmation.
- Register exact stage and production callback URLs, confirm data licensing, scopes, auth-code and refresh/revocation behavior, and maintain a provider-safe compliance record.
- Owner review and qualified securities-counsel opinion on managed/discretionary algorithmic trading for others, SEC/state adviser issues, compensation, disclosures, recordkeeping and marketing. No implicit self-authorization.
- Publish reviewed Terms and Privacy only after acceptance, including tokens, brokerage data, retention, consent, incident response and support channels.

### Production engineering
- Do not enable direct member execution in the current personal Railway RHEN service.
- Secure cross-service session attestation, audited encrypted OAuth token vault, token rotation/revocation and separation of duties; never pass access tokens through browser JS or community storage.
- Independently authenticated broker-source account/clock/position/open-order/quote stream; maintain fill, cancel, partial-fill, price-staleness, drawdown, daily realized/unrealized loss and market-halt controls.
- Atomic multiworker risk reservation coupled to the PostgreSQL journal, process fencing, complete order state machine, outage/timeout recovery and duplicate dispatch prevention. A durable journal alone is **not** the full solution.
- Approved/cryptographically signed strategy releases and operator-imposed ceilings; no automatic research promotion or LLM on live order path.
- Explicit member setup, disclosure consent, separate arm/pause/stop controls and account-level emergency disablement before any live execution.
- Multi-tenant penetration tests, signed-in session revocation, two-account adversarial acceptance, security audit and staged rollback plan.
- Operational capacity and support processes for users on shared infrastructure, without member-facing claims of guaranteed realtime/availability.

### Alpaca application screenshot packet
- Actual ANEVUM public/home, RHEN, Terms and Privacy screenshots are available from real development-browser QA.
- Exact required disclosure is rendered on `/apps/rhen/connect`; automated local Vite browser CI captures the genuine 880×495 read-only view with disabled broker authorization.
- After a reviewed stage deployment, capture all remaining genuine signed-in member screens at Alpaca's requested format; do not invent balances, positions or trading returns.
- If Alpaca requests follow-up information, respond factually about prototype state and approval gates.

## Release progression (no implicit promotion)

**Gate A — Commons public/invite-only beta:** full branch CI and website browser QA, migration order and staging D1, sign-in/authorization checks, moderation/report handling, accessibility/mobile, owner legal content approval. Does not require member trading approval. User decides public rollout.

**Gate B — Alpaca account linking/read-only pilot:** Gate A plus explicit Alpaca Connect approval, callback verification, secrets in Cloudflare, approved staging migration 0006, two-member encrypted token lifecycle, account exclusion, revoked-state test and read-only position snapshot acceptance. No trades permitted.

**Gate C — Restricted live RHEN Cloud pilot:** separate backend, counsel/security clearance, broker-observed risk data, signed strategy/code release, completed multiworker journal/reservations, verified account-specific order/fill/cancel reconciliation, live order incident drills, manual owner authorization and consenting pilot member(s). No automatic promotion.

**Gate D — Broader member release:** documented compliance and operating readiness, support/cost controls, monitoring, capacity and rollback, reliable disclosures and transparent performance. A payment or supporter badge never bypasses prior gates.

## Work references

- [Commons entry #249](https://github.com/anevum/anevum-web/pull/249)
- [Commons safety #251](https://github.com/anevum/anevum-web/pull/251)
- [RHEN live OAuth and member terminal #252](https://github.com/anevum/anevum-web/pull/252)
- [RHEN Cloud execution foundation #465](https://github.com/anevum/rhen/pull/465)
- [Alpaca provider/regulatory release gate #253](https://github.com/anevum/anevum-web/issues/253)

**Handoff rule:** Keep branches draft, production keys/flags unchanged and company trading untouched until independent tests and explicit promotion authorization. Update this package after each gate.
