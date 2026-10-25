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
