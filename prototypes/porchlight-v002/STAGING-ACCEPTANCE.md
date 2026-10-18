# Porchlight V002 — staged release gates and incident handling

**Not approved for production or real household data.** This checklist distinguishes verified local code behavior from integration work not yet completed.

## Local evidence

Run `node --experimental-sqlite --test test/service.test.mjs` in Node 22+. The tests use **fake** adult identities, two fictional event organizations, server-approved fictional block labels, and sample addresses in an in-memory SQLite D1 simulation. Coverage includes:

- Disabled default Worker and feature flag / missing trusted identity adapter.
- Forged identity headers and foreign/missing write Origin rejected.
- Required versioned affirmative adult/property/consent attestation, field allowlist, size bounds and XSS text checks.
- Pending submission withheld from public, organizer can view only event-scoped private review queue.
- Cross-host record isolation, different-event reviewer denial, revoked grant denial, self-approval denial.
- Human authority check declaration and current revision required for approval.
- Exact address and coordinate opt-in separate from default block mode.
- Public response projection, no-store and direct DB visibility checks.
- Host revocation, idempotent withdrawal, rejected/removed listings, resubmission rules.
- Audit records, stale/replayed decisions, active submission uniqueness.
- Event manager pause, event-end expiry, closed/draft nonpublication.
- Quota adapter fail-closed behavior, malicious URL rejection, approved event block lookup.

## Production gates still OPEN

1. **Verified identity and recoverable access.** Provide genuine email/GitHub login with verified session and correct logout/revocation. Organizer MFA, separate staff grant review, account-switch tests, and two physically independent users. Do not trust raw `CF-Access-Authenticated-User-Email` without cryptographic verification.
2. **Residence authority.** Define who can list a home (owner/resident authorized to participate), how staff confirms it, fraud/deletion escalation, organizer conflict rules, and accessible withdrawal if the user has lost login access.
3. **Actual legal privacy consent.** Finalize jurisdiction-specific terms/privacy and clear labeling of exact public address/coordinates versus a general block marker; clear contact routes; guardian-focused product without child signups; no real-time child tracking.
4. **Staging Cloudflare verification.** Independent Worker+database with exact migration record, isolated secrets, real D1 transactional `batch`, network routing, verified domain/Origin, edge rate limiting, CSP, error monitoring, dedicated backups, tested rollback and disaster recovery.
5. **Safe public reporting.** Add reported-pin removal with verified human triage and rate-limited external reporting method; preserve only necessary evidence. No public allegations, person identifiers, cameras or policing functions.
6. **Time and cache behavior.** Real October 31 timezone/event hours, visible from an owner-approved publication date, end-time enforcement, no caching at Cloudflare/CDN/browser, link withdrawal, live browser refresh tests and a kill switch operable during provider outages.
7. **Retention/deletion.** Approve and implement private-address deletion, consent/audit retention durations, exports, backup lifecycle and incident policy. Automatic public expiry alone does **not** delete personal records.
8. **Maps, accessibility and budget.** Provider/license agreement, exact-vs-block marker placement, accessibility, 320px phone usability, 2D fallback, reduced motion, no 3D requirement, and budget controls. Do not assume free commercial map tiles.
9. **Event operations.** Confirm St. Cloud/Osceola event rules, neighborhood operator coverage, staff escalation, prompt complaint removal, appropriate insurance, and no public claim of safety certification, emergency response or official government partnership.
10. **Owner acceptance.** Real independent two-account adversarial audit, sign-off on exact source/route/schema, documented no-spend/paid-services approval, and written deploy authorization. Protect Creator V1 production branch and release gates.

## Event incident playbook (planning draft, not staffed)

- Suspected fake/unsafe home pin: authorized event reviewer removes affected listing. If mass abuse or response cannot be guaranteed, manager pauses the full event.
- Identity provider down or staff cannot safely manage the site: disable `PORCHLIGHT_DATA_ENABLED` at the Worker configuration/release layer or remove the Worker route, and replace the interactive map with an information-only page. Disabling may require a platform propagation window; do not promise instantaneous worldwide cache invalidation without evidence.
- Report involving immediate physical danger: direct reporter to 911; do not claim ANEVUM dispatches help. Never publish accusations, footage or identifying records to other households.
- Privacy request: remove a host's listing immediately through an authorized route, then follow a separately approved deletion process for private and backed-up records. Keep audit material only if there is a justified, disclosed retention basis.
- After event: API stops returning pins at `ends_at`; remove public URLs and exported lists and run the separately implemented purge process. Document actions and resolve complaints.

**Design limitation:** although `GET` checks the DB and sets `no-store`, the implementation is not proven safe against all external edge caches, offline downloaded screenshots, or people copying a listing before it is withdrawn. Public notices must state this clearly.
