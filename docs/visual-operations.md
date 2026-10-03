# ANEVUM visual operations

Built on PR #114, without changing canonical stores, telemetry APIs, authentication, trading, or research authority.

## Surfaces

Command overview uses a compact global strip and IREN-centered system array. Each subsystem opens a dedicated instrument, owned work queue, recorded activity, incidents, and expandable runtime provenance. RHEN's Live, Performance, Evidence and Research routes remain available.

Public Live uses the sanitized projection. The homepage retains its editorial structure with a compact array. Products share the locked marks, palette, and current public observations.

## Observation and motion contract

| Visualization | Canonical inputs | Meaning |
| --- | --- | --- |
| IREN control core | IREN state/operator, incidents, active jobs, objectives, blocked objectives, requires_human | Coordination, health, and operator attention |
| RHEN market engine | systems.RHEN; telemetry event/scan/reconciliation/error counts; operational.latest_scan.observed_at | Observed scanning and durable event volume, never inferred trades |
| GRAEN research lattice | systems.GRAEN; owned RUNNING jobs; public research focus/status, questions and decisions | Research activity only when explicitly supported |
| NOSTRA branches | systems.NOSTRA and owned jobs/runtime observations | Availability and forecast activity; paths contain no predicted values |
| VELUM temporal tracks | systems.VELUM and owned replay work | Replay availability/activity, separate from execution |
| Signal arrival | New observation timestamps / IREN revision | Arrival of an observation, not a broker event |

A generic RUNNING runtime alone does not imply research, prediction or replay work. Missing evidence produces Unavailable; observations expire after the existing 180-second freshness window. Stale/failed refreshes cannot produce Healthy. An explicit offline state remains visible. Empty known queues differ from unavailable evidence. Raw status and runtime identity remain accessible.

## Identity, accessibility and performance

Locked SVG marks remain unchanged. IREN blue, RHEN space/navy/ice, GRAEN bronze/ivory, NOSTRA violet and VELUM teal distinguish the systems. Native emoji supplement rather than replace those marks; the repository does not ship Slack custom emoji assets.

Links provide accessible names and visible keyboard focus. Text and symbols accompany color. Reduced motion disables instrument, signal, queue and glow animations. The visuals use a small fixed SVG tree and CSS opacity/transforms; they add no animation package, WebGL, or telemetry backend.

## Verification

ANEVUM Verify runs canonical boundary tests, visual-state regressions, typecheck/build, Cloudflare preview, route/metadata/privacy probes, existing browser checks and all nine visual routes at 1440×1000 and 390×844.

Protected browser fixtures intercept only the test browser's fetch. They do not change server authentication or submit production commands. Public screenshots use the real sanitized feed. Full-resolution captures and contact sheets are retained in the ANEVUM preview artifact; production deployment also checks the three public visual surfaces and retains screenshots.
