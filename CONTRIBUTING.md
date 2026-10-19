# Contributing to ANEVUM Web

ANEVUM is an independent software workshop. This repository holds the public website and source for protected member/operator experiences. Suggestions and focused public-safe improvements are welcome, but not every internal product or feature is open for external contribution.

Start with [ANEVUM V5 public collaboration boundaries](docs/ANEVUM_V5_PUBLIC_COLLABORATION_2026-10-10.md) and review the current [V5 master board](https://github.com/anevum/anevum-web/issues/259) before starting work. Active V5 integration work is in draft PRs; a passing build is not evidence that member features are deployed.

## Suitable first contributions

- Documentation clarity, typos, accessible wording, keyboard navigation and visual accessibility.
- Public information architecture, performance and compatibility issues that do not expose member information.
- Reproducible bugs using local, synthetic, or otherwise explicitly public-safe test data.
- Small build/test improvements without infrastructure authorization changes.
- Public research and product explanations that cite actual evidence and limits.

For larger features, open a public-safe proposal first. The maintainer may defer work rather than promise to review everything.

## Do not include

- Keys, tokens, OAuth redirects containing codes, session cookies, database exports, private user content, broker details, account statements, moderation records, or unredacted logs.
- Live trading, member order-execution, sensitive authentication, privileged administrative changes, real migrations, deployments, or financial actions as part of ordinary community contributions.
- Claims that draft Commons/social/brokerage features are already live.

For suspected vulnerabilities, use [private security reporting](SECURITY.md) instead of a public issue. For names, logos and forks, read [TRADEMARKS.md](TRADEMARKS.md).

## Pull requests

1. Check for an existing issue or overlapping draft, especially [V5 web #275](https://github.com/anevum/anevum-web/pull/275).
2. Keep one bounded problem per PR; explain what changed, why, and what evidence supports it.
3. Run `npm install`, `npm run check`, and `npm run build` when practical. If any check is not run, state why. Add/adjust focused tests for behavior changes.
4. Use synthetic accounts/content for screenshots and fixtures; redact personal data.
5. Document whether the patch touches public UI, private member logic, schema, OAuth, integrations, or build/deploy workflows. Higher-risk paths require separate maintainer authorization.

The repo carries the [Apache License 2.0](LICENSE); it does not grant use of ANEVUM marks or endorsement. The maintainer decides whether and when to merge, release, or deploy a contribution. Public PRs cannot authorize production actions.
