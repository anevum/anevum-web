# Command 4.4 shadow visual implementation

Extends existing Command V4. Production release metadata remains 4.3.2.
No redesign or parallel dashboard has been introduced.

All paths default disabled:

```
VITE_COMMAND_LIVE_STREAM_ENABLED=false
COMMAND_LIVE_STREAM_ENABLED=false
```

The build-time flag enables the private Operate visual surface; the worker flag
enables its same-origin Cloudflare Access WebSocket proxy. The upstream RHEN must
also enable its own gated observer and Command endpoint in isolated staging.
`RHEN_COMMAND_STREAM_BASE` is a protected worker environment setting for that
staging upstream; credentials are never put in browser URLs or query parameters.

One socket provides ordered generation-fenced snapshots/deltas and critical
broker observations. Reconnect requires a snapshot. Last known values freeze
and show stale on disconnect/heartbeat loss. Ring buffers are bounded to 2400
points. Candles preserve timestamp gaps and source provenance. Forecast paths
require point-in-time lineage, horizon/version/expiry and exact uncertainty
bounds; forecast appearance differs from observed candles. Missing data is
explicitly unavailable. Replay/performance producer integration remains pending.

The old 4.3 panels keep their existing behavior when the feature is disabled.
In shadow mode the REST account/evidence snapshot becomes a 60-second diagnostic
audit; it is not presented as sub-second stream truth. Existing account/public
performance/IREN reads remain separate legacy diagnostic projections pending the
full canonical live publisher integration. No claim is made that every legacy
panel is already event driven.

Backend status and per-slice blockers are in `anevum/rhen/docs/rhen44/STATUS.md`.
No production visual acceptance or real-data screenshots are claimed without an
authorized session and active staging feed. The surface contains no invented
market points and no broker controls.

The second integration adds source-volume histograms, completed rolling-bar VWAP
(DERIVED, explicitly a rolling window), observed broker position average-entry and
actual open-order stop/limit levels, and actual fill markers with broker identity.
Broker levels expire visually after 150 seconds without a fresh reconciliation.
The performance view shows actual observed broker equity samples; it makes no
claim of normalized returns, daily drawdown, profitability, or validation success.
30/60/120 completed-bar window controls use the available bounded source history.
The source remains gated and requires isolated live-data and authorized visual QA.
