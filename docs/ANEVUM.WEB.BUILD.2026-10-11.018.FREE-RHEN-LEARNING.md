# ANEVUM.WEB.BUILD.2026-10-11.018.FREE-RHEN-LEARNING

## Scope and checkpoint

Continue V5 from main `5c53fa530a495f022094fe3cc4903b43a8fc138c` after the deployed website cutover. Parent #259; RHEN Open R2 #244; meaningful free participation #306; January 1 launch #308. Studio #320 and authentication #318 are independent and remain untouched. No new infrastructure, dependencies, database schema, credentials, account data, broker permissions, pricing, or production release.

## Implemented source

- `/learn` retains its research loop and genuine Field Notes, adding two substantive public lesson cards.
- `/products/rhen/learn` provides a free curriculum index.
- `/products/rhen/learn/market-orders-and-quotes` explains bids/offers, spreads, order instructions, fill risk, timestamps and the distinction between simulated and real execution.
- `/products/rhen/learn/risk-math-and-strategy-evidence` covers explicit net expectancy, trading costs, historical-test limitations, chronological holdouts and a no-money research worksheet.
- Versioned typed lesson registry with primary-source references, original synthetic worked examples, glossaries and seven native expandable self-checks. No learner answers are collected, no false completion certificate, and no persistent account progress is implied.
- Existing public Commons routing and shadow-scoped styles; Worker/client metadata and sitemap records; a missing-lesson state that remains noindex.
- Source/content tests and real Chrome route, metadata, narrow-layout and keyboard self-check verification in the existing browser suite.

The lessons are first-party educational drafts pending editorial and release approval. Review dates record source checking, not human expert approval. No claim of strategy profitability or live RHEN functionality. Public browsing and self-checks require no account, payment method or funded broker. Account-scoped saved progress remains R3 #245 and is not faked with shared browser storage.

## Primary references checked October 11, 2026

- SEC Investor.gov Understanding Order Types, updated August 18, 2026: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-14
- SEC Investor.gov Types of Orders: https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders
- SEC Investor.gov Online Investing: https://www.investor.gov/introduction-investing/getting-started/investing-your-own/online-investing
- SEC Investor.gov Extended-Hours Trading: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-42
- SEC Investor.gov Performance Claims: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-47
- FINRA Rule 2270 risk disclosure: https://www.finra.org/rules-guidance/rulebooks/finra-rules/2270
- scikit-learn cross-validation/time-series evaluation documentation: https://scikit-learn.org/stable/modules/cross_validation.html

## Build and verification boundaries

The development container cannot resolve GitHub. A branch-scoped, temporary source-assembly job applies reviewed exact-parent replacements and runs the dedicated Node content tests before uploading only Git blob objects. It does not move refs, merge, deploy, obtain provider secrets, or access user data. Assembly files are excluded from the final source tree; the final candidate ref is updated through the GitHub plugin with a head lease. Normal PR verification then tests the complete source and renders desktop/mobile pages.

Do not treat compilation, source tests or public CI preview as production deployment, real signed-in account acceptance, or complete V5. Record actual exact-head results in the PR and #259. No public lesson release occurs without the existing owner-controlled release gate. Final acceptance for #244 requires real published URLs after that approved release; F-01/F-05 evidence can be advanced but #306 cannot close until its complete member journey passes.
