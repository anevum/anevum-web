# RHEN Terminal — guarded rollout

Session: ANEVUM.RHEN.BUILD.2026-10-13.001.PRIVATE-TERMINAL-OBSERVER

## State

- UI source cutover candidate at /projects/rhen/; old paper/source console retained at /projects/rhen/research/.
- No running Railway RHEN production services. Scanner and execution are OFFLINE.
- Read-only browser polling every 15 seconds; all balances, orders, positions and equity samples are absent until configured. Chart samples are in-memory session observations only, not durable performance history.
- No order, cancel, withdrawal, transfer, strategy, or deployment control endpoints.
- Provider endpoint disabled unless all of RHEN_LAB_BROKER_VIEW_ENABLED=true, RHEN_LAB_BROKER_MODE=paper|live, RHEN_LAB_BROKER_KEY_ID and RHEN_LAB_BROKER_SECRET_KEY are present as Worker secret bindings. Do not set keys in GitHub. Readonly operations in code are GET /v2/account, /v2/positions, /v2/orders and /v2/clock.
- Access application must stay scoped to lab.anevum.com and the single verified owner identity. workers.dev and preview URLs remain disabled. Host allowlisting is defense in depth, not independent authentication.
- Keep public anevum.com and production/creator-v1 untouched. This branch does not approve a RHEN live trading runtime.

## Validation and deployment gate

1. Run Node syntax checks for all new .mjs, test-worker and browser flows (including desktop and iPhone viewport). Explicitly verify the old research console remains accessible.
2. Before Worker upload, recheck Access allow policy, subdomain flags and custom-domain scope. Verify no broker secrets are present in Worker source or responses.
3. Bundle worker.mjs, fold-snapshot.mjs, rhen-snapshot.mjs, rhen-ui.mjs, rhen-terminal.mjs, rhen-terminal.css.mjs, rhen-terminal.js.mjs and rhen-observer.mjs together. Cloudflare multipart Worker deploy; do not use the public Worker script.
4. Confirm Cloudflare deployment reaches 100%, recheck attached domain and access boundaries; test owner session and unauthenticated rejection externally.
5. Initially test entirely disconnected. Only after independent signed review of key scope and broker account identity, authorize the restricted observer secret configuration separately. Display PAPER/LIVE from actual source, not browser preference.
6. Separately build and verify RHEN successor paper service, journaling, reconciliation and safety before discussing live Alpaca trading, with independent owner approval for funded execution.

## Important consistency

The interface is an *observation terminal*. Showing live brokerage data does not prove RHEN strategy authority or an active scanning engine. Unattributed brokerage orders are not labeled RHEN orders. Day P/L is broker account equity minus previous-day equity when Alpaca reports both; it is not strategy P/L. No invented prices, equity history, scanner signal, model confidence or trade fills.
