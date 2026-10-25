# ANEVUM Feedback Relay V001 — source-only contract

Session: `ANEVUM.OPS.BUILD.2026-10-25.001.FEEDBACK-RELAY`. Owner: OPS; future presentation belongs to the existing staff-only IREN Observatory. See [tracking issue #744](https://github.com/anevum/anevum-web/issues/744), [feedback evidence #719](https://github.com/anevum/anevum-web/issues/719), and [Observatory #683](https://github.com/anevum/anevum-web/issues/683).

**Status: draft implementation.** This directory is deliberately offline. It adds neither a scheduled job, an external API connection, a live feedback form, a database migration, a deployable route, nor a public analytics claim. The normalizer has no network, database, or side-effect calls.

## What works in V001

`normalize.mjs` produces a deterministic, staff-only receipt with:
- An allowlisted source platform: Reddit, Facebook, LinkedIn, or ANEVUM.
- Canonical HTTPS source links with ordinary tracking parameters removed.
- A Reddit email-notification redirect parser that operates on strings only and never requests the external link.
- Facebook comment ID and permalink query preservation where applicable.
- LinkedIn `commentUrn` preservation where actually supplied by the link.
- Deterministic source receipt keys for deduplication across screenshots, notification emails and manual links when a source ID or URL exists.
- UTC event/capture timestamps, explicit provenance and `unknown` respondent counts.
- Non-executable external feedback text, no automatic moderation or publishing action.

Run locally from the repository root:

```sh
node --test tests/feedback-relay.test.mjs
```

The source-only test suite includes Reddit email links, mobile-report deduplication, Facebook and LinkedIn permalink retention, anti-spoofed-host checks, invalid timestamps and prompt-injection-as-data handling.

## Source connection boundaries

**Reddit:** The connected Gmail account has already received useful notification messages with links to comments on the October 24 voluntary tester post. Reading notification messages is not proof of full Reddit comment coverage. The future Gmail adapter must be read-only, allowlist real notification senders, respect user email consent, retrieve only relevant ANEVUM threads, dedupe and provide a deletion process. A direct Reddit OAuth application needs separately authorized API access, rate limits and platform terms compliance.

**Facebook personal-profile posts:** A general private/personal Facebook comment feed cannot be assumed available through a Meta Page API. Use an iPhone share-link intake for the founder, optionally notification email if actually present. Do not ask for browser cookies, credential scraping, or private message access.

**Facebook ANEVUM Page:** Page comments and Page Insights may be integrated if an authorized Page administrator explicitly connects a supported Meta account and the app has the right permissions.

**LinkedIn personal-profile posts:** LinkedIn notification email is a potential partial signal (in the sampled inbox, recent emails were mainly general notifications, not proven ANEVUM post-comment alerts). Share-link capture is the fallback. Member feed/comment APIs are restricted; don't assume full access.

**LinkedIn ANEVUM Company Page:** An authorized admin and separately approved LinkedIn Community Management/API access may support organizational post/comments and approved metrics. Keep Company Page and personal-profile sources separate.

**ANEVUM website:** A future voluntary feedback form must be privacy-noticed, rate-limited, protected against spam, and separated from unrestricted user uploads.

## Required implementation before activation

1. Authenticated staff-only intake endpoint, private controlled storage and migration reviewed independently; *never put raw feedback, URLs with private identifiers, or account-linked profiles in this public repository*.
2. Explicit source adapter, trust boundaries, sender/webhook verification, timeouts, storage limits, idempotent delivery and source-deletion handling. Treat every quote and link as untrusted data, not instructions to IREN or automation.
3. Real responder identities stored only if necessary and authorized, in a separate restricted table. Multiple findings from one person are not multiple testers.
4. Staff-only Inbox inside the **existing** Observatory, with source evidence, deduped comments, theme clusters, triage status, tester opt-in and a human-approved link to existing GitHub work.
5. Release controls: no auto-posting, no surprise social-account data collection, no auto-granted Creator Uplink permissions, no public dashboard display and no inferred web/sign-up conversion metrics.
6. End-to-end tests for imported email, share-link data, deleted posts, multiple edits, unauthorized access, account consent, user-agents/mobile layout, and no unexpected writes.

Until those steps are explicitly approved and completed, use the existing sanitized feedback ledger and manually approved issue updates as the durable research index.

## Analytics evidence V001 (source-only, October 25, 2026)

Three additional source-only modules now define the evidence path from ANEVUM production sources to future private IREN Observatory reports:

- `analytics-evidence.mjs`: read-only D1 aggregate queries for account creation, verification, creator profiles, private Studio records, submitted/published Uplink packages, forum and community records. Cloudflare Analytics SQL templates for RUM *sampled page loads*, grouped referrer host, route class, device, and edge HTTP requests. All parameters are constrained to canonical UTC dates. No personal identifiers, raw request URLs, account records, or individual content are selected.
- `analytics-report.mjs`: combines only whitelisted numeric aggregates into provenance-labelled reports. No-account-source means `UNAVAILABLE`, not a fabricated zero. RUM beacons remain `PARTIAL_SAMPLED`; `uniqueHumanVisitors`, social conversion, active people and retention remain null while unmeasured. Private/staff routes are bucketed separately, and non-staff routes are **not automatically public content**.
- `tests/analytics-evidence.test.mjs` and `tests/analytics-report.test.mjs`: regression tests for the historical date-storage error, account denominator integrity, invalid UTC parameters, mismatched creator states, anonymous RUM aggregation, duplicate buckets, sensitive-field leakage and missing data.

Run the combined offline test suite from the repository root:

```sh
node --test tests/feedback-relay.test.mjs tests/analytics-evidence.test.mjs tests/analytics-report.test.mjs
```

**Verified baseline evidence (historical, not a constant in code):** A read-only D1 inspection at 2026-10-25 16:26 UTC found 8 registered records, 8 email-verified records, 2 account creations in the prior 24h and 5 in the prior 7d; seven creator-profile records, one Studio project, one pending Studio submission and one published Uplink package record. This does not prove 8 independent public users, nor identify who registered from which social source. Cloudflare RUM SQL returned 29 captured page-load samples for October 18–24, with 18 samples on staff/Access/workspace routes and 11 on other routes. No usable distinct-human visitor denominator or social referral conversion is established.

**Correction that must remain locked:** `user.createdAt` is ISO-formatted SQLite TEXT. Earlier analytics incorrectly compared it against numeric epoch seconds and reported no new users. Always use `unixepoch(createdAt)` for rolling windows and `date(createdAt)` for daily groups. Never reintroduce numeric comparisons without first verifying underlying storage.

**Limits and next approval gates:** Query templates and report composition have no provider credentials or live hooks. Only a reviewed staff-only ingestion adapter may execute them against governed sources, with least-privilege bindings, rate limits, secret handling and audits. No production event collector, OAuth consent, direct Facebook/LinkedIn personal-profile ingestion, user tracking, billing, D1 migration or deployment is included in this source-only PR. New behavioral events require a documented privacy/consent design, test-account exclusion and independently approved release.
