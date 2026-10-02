# ANEVUM Operator Runbook

This is the owner-facing recovery reference for the current ANEVUM stack. It is intentionally operational: identify the failing boundary, restore fresh evidence, and verify recovery before changing anything else.

## Trust order

1. IREN canonical control state
2. Foundation data/evidence freshness
3. Individual runtime health and deployment identity
4. Public/Command projections

A successful Railway deployment is not proof that a subsystem is healthy. A healthy process can still have stale work, failed evidence writes, or a broken dependency.

## Normal operating state

A normal ANEVUM observation should show:

- IREN state HEALTHY and not stale
- canonical runtime inventory complete
- Foundation/data-plane dependency RUNNING
- scheduler RUNNING with recent success
- RHEN telemetry fresh
- no increasing dropped-event count
- no open critical incidents
- protected execution/research boundaries unchanged

Research-only services may be idle between jobs. Idle is not failure when their health contract explicitly reports readiness.

## First response sequence

When Command reports a problem:

1. Open Command -> System and identify the affected runtime or dependency.
2. Record the incident key, current revision, deployment ID, and observed revision SHA.
3. Check freshness. If IREN itself is stale, repair IREN/Foundation first.
4. Check the affected Railway service deployment and recent logs.
5. Check its direct dependencies before redeploying.
6. Repair the root cause.
7. Wait for a fresh IREN observation.
8. Confirm the incident transitions to recovered and data resumes moving.

Do not clear an incident by changing strategy, risk, broker, spending, or promotion policy.

## IREN / Foundation stale

Meaning: Command can no longer trust the canonical control snapshot.

Check:

- rhen-research-scheduler is running
- Foundation ingest is reachable
- Railway PostgreSQL is reachable
- IREN observations are committing
- the last scheduler run did not fail or lose its lease

Recovery criterion: Command receives a fresh timezone-aware IREN observation and the next control cycle completes.

## Service health incident

Meaning: a runtime health endpoint is unavailable or reports unhealthy.

Check:

- current deployment status
- startup logs
- service health endpoint
- required environment variables by name
- network reachability to dependencies
- deployment revision matches expected source

Do not infer health from container uptime alone.

## Evidence delivery incident

Meaning: RHEN is alive but durable evidence is not moving correctly.

Check:

- Foundation ingest
- RHEN evidence spool
- last_sent_at
- dropped_count
- last_error
- PostgreSQL availability

Recovery criterion: new events are durably accepted, last_sent_at advances, and dropped_count does not increase.

## Scheduler/workflow incident

Check:

- latest run status
- error_classification
- lease_until
- workflow version
- dependency health

Retry only work that is explicitly idempotent and only after the dependency is healthy.

## Configuration drift

Do not immediately accept the new configuration.

Compare the current protected configuration identity with IREN's recorded baseline. Determine which deploy or operator action changed it. Accept a new baseline only when the change was intentional and verified.

## Safe maintenance boundaries

Read-only actions are always preferred first.

The following remain protected and must not be used merely to clear health indicators:

- broker orders
- strategy promotion
- risk changes
- infrastructure changes with destructive impact
- spending changes
- publication

## Recovery definition

A repair is complete only when:

- the affected service is healthy
- its dependencies are healthy
- fresh work/evidence is visible
- IREN observes the recovery
- the incident closes through the normal recovery threshold
- no protected boundary was weakened
