# ANEVUM visual operations

Status: CANONICAL  
Updated: 2026-10-06

This document defines the active visual language for the public ANEVUM site and protected Command surface. Presentation changes do not change canonical stores, telemetry APIs, authentication, trading authority, research authority, or compatibility keys.

## Identity hierarchy

ANEVUM is the company identity. RHEN is the product and production runtime identity.

IREN, GRAEN, NOSTRA, and VELUM remain named RHEN modules and compatibility keys:

| Compatibility name | Canonical RHEN module | Responsibility |
| --- | --- | --- |
| RHEN | Execution | scanning, qualification, risk-gated broker execution |
| IREN | Control | health, incidents, scheduling, orchestration, protected release boundaries |
| GRAEN | Research | discovery, experiments, falsification, promotion evidence |
| NOSTRA | Forecast | regimes, calibration, baselines, forward measurement |
| VELUM | Replay | replay, simulation, friction/delay stress, counterfactual verification |

All active module glyphs use the RHEN blue/cyan identity family. Green, amber, red, and muted gray are reserved for state and severity.

## Surfaces

Command is the protected operating product. Its primary workspaces are Overview, Trading, Research, and System.

Public Live uses the sanitized RHEN projection. The homepage and architecture surfaces may show the named modules, but must present them as modules inside RHEN rather than independent production products.

Compatibility routes and backend keys may continue using IREN/GRAEN/NOSTRA/VELUM until data migrations are complete. Presentation translates those keys into the canonical module treatment.

## Icon roles

Three icon roles are separate:

1. **Identity glyphs** — RHEN module glyphs for Execution, Control, Research, Replay, Forecast, Core, Worker, and Command.
2. **State markers** — active, success, warning, critical, waiting, risk, and evidence semantics.
3. **UI concept icons** — navigation/actions such as account, scanner, orders, positions, telemetry, freshness, incident, job, objective, logs, prompt, copy, handoff, and refresh.

Do not use a health color to distinguish a module. Do not use a module glyph as a generic button icon. Do not create one-off Unicode glyphs when a canonical UI concept icon exists.

## Observation contract

A generic RUNNING runtime alone does not imply research, prediction, replay, or execution. Missing evidence produces Unavailable. Stale/failed refreshes cannot produce Healthy. Empty known queues differ from unavailable evidence. Raw status and runtime provenance remain accessible.

## Slack

Slack uses only two custom ANEVUM-family brand emoji: `:anevum:` and `:rhen:`.

New runtime notifications use:

`:rhen: <semantic marker> RHEN // <MODULE> // <EVENT>`

Legacy IREN/GRAEN/NOSTRA/VELUM custom emoji families are retired from new use. Compatibility parsing remains valid for historical messages.

## Accessibility and performance

Links provide accessible names and visible keyboard focus. Text accompanies color. Reduced motion disables nonessential glow, signal, queue, and arrival animations. The visual system uses lightweight SVG and CSS and requires no separate visual telemetry backend.
