# Command Operator Architecture

Status: **LOCKED**
Effective: 2026-10-05

Command is ANEVUM's private operator surface. It is designed around operator decisions and current work, not around one page per internal subsystem.

## Canonical runtime boundary

Command has one operational source of truth:

```
Command -> RHEN unified API -> RHEN Core / IREN / execution / research modules
```

IREN Command reads and writes through authenticated RHEN endpoints. Command must not depend on the retired Foundation/Postgres ingress path for live operational state.

RHEN Core is the bounded durable store for runtime/operator state in the unified deployment. PostgreSQL may be introduced where product scale genuinely requires it, but it is not a prerequisite for the single-user production Command control loop.

## Four workspaces

Command exposes four primary destinations only.

### Overview

Mission control. It answers: **What is happening right now?**

Required surfaces:
- account equity and current P&L
- current positions
- recent executions
- live system activity
- IREN state and incidents
- current work / action required
- high-level system topology

### Trading

Execution and account operations. It answers: **What is RHEN doing with the account, and is it safe?**

Required surfaces:
- private broker equity curve
- buy/sell execution markers
- cash, buying power and risk reference
- open positions
- orders and fills
- scanner decisions
- normalized performance
- execution / reconciliation / risk state

Legacy routes `live`, `performance`, `evidence`, and `rhen` resolve to this workspace.

### Research

Unified GRAEN + NOSTRA + VELUM workspace. It answers: **What are we testing, learning and rejecting?**

Required surfaces:
- current research direction
- hypotheses and experiments
- forecasts and forward outcomes
- replay / simulation evidence
- validation and holdout state
- rejected/promoted candidate families
- daily, weekly and post-event evidence

Legacy routes `graen`, `nostra`, and `velum` resolve to this workspace.

### System

Diagnostics and control-plane evidence. It answers: **Is the unified runtime healthy and why?**

Required surfaces:
- IREN control state
- RHEN runtime/module health
- infrastructure and dependencies
- telemetry freshness
- versions, commits and deployment identity
- operational diagnostics and event stream

Legacy routes `iren`, `terminal`, and `infrastructure` resolve to this workspace.

## IREN operator layer

IREN is not a fifth navigation destination.

IREN is persistent across Command as a compact operator command bar:

```
Ask IREN...
```

Expanding the bar exposes:
- operator conversation
- current objectives
- current jobs
- incidents
- actions requiring the operator
- Codex/manual software handoffs where applicable

Connection state must terminate deterministically:

```
CONNECTING -> LIVE
CONNECTING -> DEGRADED
CONNECTING -> OFFLINE
```

A request failure must never leave the UI indefinitely at CONNECTING. When prior state exists, Command preserves it as last-known state and reports DEGRADED. With no usable state, it reports OFFLINE.

## Module model

IREN, GRAEN, NOSTRA and VELUM remain named internal modules with distinct responsibilities. Their identities do not require independent primary pages or independent Railway services.

Optional modules that are intentionally disabled must not degrade the unified runtime or count as required deployment inventory.

## Privacy boundary

Private Command may expose broker/account values, positions, orders, fills and execution details.

The public trading feed remains aggregate-only and excludes:
- dollar values
- symbols
- orders
- fills
- credentials

The Command overhaul must not weaken this boundary.

## Non-goals

This architecture does not:
- change trading authority
- promote research strategies
- change risk limits
- authorize live-money execution
- make private operational data public
- require the retired Foundation/Postgres path
