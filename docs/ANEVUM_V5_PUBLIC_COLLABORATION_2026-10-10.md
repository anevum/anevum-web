# ANEVUM V5 — Public development and collaboration boundaries

**Session:** ANEVUM.ANEVUM.UPDATE.2026-10-10.002.PUBLIC-COLLABORATION  
**Program:** [ANEVUM V5 master board](https://github.com/anevum/anevum-web/issues/259)  
**Status:** Proposed contributor and publication guidance, isolated from the V5 release candidates. This document is not a production release, a change to broker authority, or an adopted legal policy.

## Purpose

ANEVUM is an independent software workshop. Public source, honest evidence, and useful community participation can make its work inspectable and easier to improve. A public repository does **not** mean every product, subsystem, dataset, or operating service is open source or open for unreviewed changes.

Keep GitHub as the technical collaboration and provenance surface. ANEVUM Commons is the intended member discussion/learning surface **when its separately gated release is approved**. Do not describe draft Commons, paper brokerage integration, member execution, moderation, or payments as already launched merely because code exists.

## Project-by-project classification

| Surface | Public collaboration | Protected boundary |
| --- | --- | --- |
| **ANEVUM website / public product surfaces** (`anevum-web`) | Apache-2.0 source, docs, accessibility, public UI, reproducible synthetic tests, privacy-safe bug reports | Member records, moderation evidence, OAuth tokens, security controls, production credentials, D1 content, private Command |
| **RHEN execution and research** (`rhen`) | Publicly visible source, architectural explanations, research questions, methodological critique, sanitized test cases | Founder account, live orders, positions, execution authority, exact protected strategy parameters, broker data and credentials |
| **RHEN Cloud / member terminals / Alpaca Connect** | Public-safe architecture and synthetic isolation/security tests, subject to owner review | Per-member private terminals, OAuth grants, trading permissions, account state, live or member broker-write paths |
| **GRAEN, VELUM, NOSTRA, IREN** | Public methodological descriptions and non-sensitive research/control interfaces when reviewed | Internal models, unpublished trials, raw evidence, protected control paths, secrets, incident telemetry |
| **Commons** | Public product design and contribution guidance; future public-safe community discussions | Identity, private posts, reports, moderation queue, deleted content, abuse records |
| **Cloudflare, Railway, databases, backups, CI/CD, integrations** | Sanitized architecture and operational design principles | Secrets, infrastructure control, access policies, database exports, backup artifacts, private logs and deploy authority |
| **Future ANEVUM products** | Decide per product at release readiness; publish only an explicit approved scope | Private by default until owner reviews code, license, data, security and sustainability |

GRAEN, VELUM, NOSTRA, and IREN are currently internal RHEN responsibilities, **not** separately launched products or repositories. Do not create independent public repositories or imply independent commercial availability solely to fill out a product catalog.

## Licensing and ownership

- `anevum-web` includes an **Apache License 2.0** and a separate [trademark policy](../TRADEMARKS.md). Code and brand permission are different questions.
- `rhen` is a public repository but **does not have a root license at this checkpoint**. Visibility alone does not grant a general right to redistribute or commercialize the code. Do not label it licensed open source or add a license without the owner's explicit decision.
- Do not apply a new license to future products, research datasets, third-party materials, or contributed work by assumption. Confirm authorship, upstream obligations, and release scope first.

## Public evidence rules

Publish only reviewed artifacts that can be sourced and explained, including limitations and whether they are live, paper, simulated, development, validation, or holdout results. Make stale, missing, incomplete, or disqualified evidence visible as such; never imply a strategy is profitable or a user capability is live based on passing CI or simulated results.

For RHEN, preserve the existing `PUBLIC-PERFORMANCE-v1` restriction: do not newly publish account dollars, individual trades, symbols, quantities, fills, raw broker state, exact protected entry/exit parameters, or personal account data. Existing public commits and docs may already contain historical detail; hiding it from a new page does **not** remove it from Git history. Review existing disclosure separately before broader distribution.

No real credentials, tokens, customer records, access assertions, private database exports, private screenshots, order logs, position details, or unredacted vulnerability reproductions belong in issues, pull requests, CI artifacts, or public posts.

## Contribution and review workflow

1. Public-safe documentation, accessibility, architecture, test-fixture, and reproducibility ideas can begin in GitHub issues or reviewed pull requests. Keep evidence synthetic or sanitized.
2. Sensitive security findings must use private disclosure as described in each repository's `SECURITY.md`, never a public issue.
3. The maintainer reviews scope, provenance, privacy, permissions, testing, and cost before accepting changes. Contributions are not a release instruction.
4. All features involving identities, brokerage, D1 migrations, moderation, payments, execution, Cloudflare, Railway, or risk controls retain their separate owner review and safety gates.
5. V5 integrated candidates [web #275](https://github.com/anevum/anevum-web/pull/275) and [RHEN #488](https://github.com/anevum/rhen/pull/488) remain independent draft release processes. Documentation PRs may be merged later only after checking for conflicts and verifying that their changes do not accidentally trigger production workflows.
6. Public release notes and Field Notes should cite factual source artifacts and distinguish proposals from verified changes. Do not promise a response time or contributor rewards that ANEVUM cannot sustain.

## Working sequence

- **Now:** add contribution entrypoints, sensitive-reporting routes, scoped PR guidance, and this service-classification policy on isolated documentation branches.
- **During V5 review:** link technical participation to the rebuilt project pages only after their routes and public-data boundaries are accepted. Review existing source disclosures and git history separately.
- **After V5 acceptance:** consider a small issue queue of genuinely useful first contributions, public-safe release evidence, and a Commons-to-GitHub path that does not expose member data.
- **Only if needed:** split a subsystem into its own repository after a real standalone product or maintainer boundary exists.

## Decisions that remain with the owner

The RHEN license and commercial reuse rights; any formal contributor agreement; brand/trademark changes; new repositories; public trading strategy disclosure; publishing private infrastructure or member features; release activation; and any financial or legal acceptance. None is approved by merging this document.
