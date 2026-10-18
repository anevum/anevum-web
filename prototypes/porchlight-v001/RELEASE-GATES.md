# Porchlight V001 - Security and Release Gates

Status: **UNSATISFIED** for real-world event listings as of 2026-10-17. Owner approval must be based on live evidence, not this checklist alone.

| Gate | Required evidence | V001 status |
| --- | --- | --- |
| Written scope | Single event, neighborhood, eligible adult participants, responsible organizer | Planned only |
| Legitimate host consent | Versioned affirmative field-specific approval and organizer verification | Not implemented |
| Host revocation | Proven immediate unpublish, cache invalidation, accountability | Not implemented |
| Organizer identities | Unique verified accounts, MFA, resource-scoped server authorization | Not implemented |
| Threat model | Doxxing, fake pins, unauthorized access, harassment, XSS and reports | Drafted below |
| Public API | Published consented pins only; no private addresses/contact in public payload | Not implemented |
| Event expiry | Automatic unpublish and deletion according to reviewed policy | Not implemented |
| Abuse workflow | Remove/report path, rate limits, audit, reachable human operator | Not implemented |
| Privacy/terms | Written notice, appropriate legal check and compliance | Not implemented |
| Location provider | License/usage budget, attribution, accessibility, safe fallback | Not selected |
| Acceptance | Two-user isolation, revocation, mobile, a11y, backup/rollback tests | Not performed |
| Release authorization | Exact reviewed source, production/preview separation, owner go/no-go | Not granted |

## Data objects (proposed; do not migrate production yet)

- `events`: public summary, region, start/end, published/closed state, moderation owner, emergency disclaimer.
- `host_submissions`: **private** applicant and contact, authorization assertion, selected details, consent timestamp/version, pending status.
- `event_pins`: approved public label and explicitly consented public coordinates only, event-scoped, moderation state, expire timestamp.
- `organizer_grants`: approved organizer member identity, event scope, permission set, revoked timestamp.
- `safety_reports`: private accuracy/abuse reports, evidence minimizing sensitive detail, triage state and resolution.
- `audit_events`: actor, reason, action, target, before/after state, time and correlation ID.
- `retention_jobs`: scheduled public expiry, cache purge, private data removal verification.

State machine: `pending -> approved -> published -> expired`; alternate terminal paths `rejected` and `withdrawn`. A withdrawn/rejected/expired listing must never be publicly returned, even by old caches or stale session. Unconfirmed submissions remain private.

## Security acceptance scenarios

- Attempt to create or modify host B's submission as host A: deny and audit.
- Attempt to publish an unapproved or revoked house via request modification: deny.
- Anonymous users can retrieve only current event-approved public fields; never private contact information, unpublished records or exact location for those who declined pin sharing.
- A user cannot create pins by repeatedly pressing a browser button or supplying a different event ID.
- Suspicious/fraudulent address submission: held for human review; cannot auto-publish.
- Withdrawal during cache outage: fail closed or remove the full affected event map until consistency is restored.
- Event end and forced cancellation: public listings are unavailable immediately.
- Accessibility: use a list equivalent to the map; controls work via keyboard/screen reader at 320px; high-definition visual effects do not suppress readable safety information.
- Retention: no stored child GPS traces, family walking routes, biometric identifiers or camera feeds, and no transfer of data to ad networks.

## Cybersecurity service separation

The proposed Security Lab is **not part of the Porchlight pilot**. No network scanning, home-camera integration or testing of neighbors' devices is authorized. Later cybersecurity consulting must use explicit client authorization and defined scope; later physical patrol/investigation offerings require separate Florida legal/licensing review.

## Decision log

- 2026-10-17: Keep Creator V1 launch scope and production isolation intact.
- 2026-10-17: Reuse 3D visual research later; not needed for a consent-safe first public event map.
- 2026-10-17: Prototype entirely synthetic and offline, with no geolocation, tracking, live homes or public claims of safety.