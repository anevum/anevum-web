# ANEVUM V038 — Verified Financial Transparency Publisher
Date: 2026-10-16.
Status: DRAFT SOURCE ONLY. No live Stripe billing or financial reports published.
Parent: V037 supporter transparency PR #444; also relies on V036, V035, V034 and V032.

## Purpose
The /support page already shows verified staging infrastructure facts. Operating costs, supporter income, processing fees and funding goals remain NOT VERIFIED until a reconciled source exists. This system publishes only reviewed aggregate figures from a PRIVATE ledger, never individual invoices or payment details.

## Private ledger contract
- JSON schemaVersion 1, YYYY-MM period, ANEVUM_CORE scope and USD currency.
- Reporting mode either closed-month (reviewed after month end) or month-to-date (reviewed during that month, and never annualized).
- Expense invoices grouped into seven allowed categories: hosting, storage, delivery, email, moderation, software and other. Every amount is integer US cents with a unique private reference and SHA-256 evidence digest.
- Supporter-only Stripe balance movements: positive charges, negative refunds, negative dispute reversals, and zero-amount fee adjustments; processing fees separately recorded and signed for adjustments.
- Official Stripe gross/fee/refund/dispute/net totals MUST match the private entries; otherwise approved public aggregate generation fails closed.
- Separately review remaining sales-tax liability already collected for government authorities. Tax reserve evidence, an explicit review flag and a verified nonnegative cents amount are required before calling any Stripe cash spendable or showing operating-cost coverage. Avoid double subtracting remittances already withheld by the processor.
- Owner/reviewer attests source completeness, reconciliation, active supporter count and any approved funding goal independently. Incomplete financial metrics remain null; missing revenue is NOT zero.
- The public output is strictly allowlisted. Raw invoice IDs, transaction IDs, evidence hashes, customer names, emails and financial account credentials never appear in the public JSON.

## Usage
1. Collect actual ANEVUM expense invoices and supporter-only Stripe settlement records for the reporting period. Exclude personal, RHEN, loans, taxes belonging to others and unrelated payments.
2. Compile the input ledger in a private directory OUTSIDE this Git repository. The synthetic ledger fixture in creator-v1/test/supporter-finance-v038.test.mjs shows only fictional test amounts.
3. Independently verify reconciliation and expenses; mark reviewer approval only after authorized human review. The code cannot itself authenticate the original invoices.
4. Run from the repository checkout, using ABSOLUTE paths:
   node creator-v1/finance/build-public-report.mjs --input /private/anevum-ledger.json --output /tmp/anevum-finance-preview.json
5. The CLI rejects private inputs and outputs inside the repository, never overwrites earlier files, emits only aggregate data, makes no network calls and does NOT auto-publish.
6. Human-review the preview before creating a separate code review for the PUBLIC JSON file creator-v1/web/src/data/supporter-public-finance-v038.json.
7. Validate page wording, identity isolation and financial period in CI and browser before owner-authorized staging deployment.

## Financial disclosure semantics
- Stripe settled cash before taxes = supporter charges less Stripe processing fees, refunds and dispute reversals for the stated period. Spendable supporter cash = that settled cash minus the independently reviewed REMAINING tax liability reserve; unreviewed tax treatment keeps spendable cash and the coverage meter UNKNOWN.
- Annual subscription payments appear only as cash received in their actual period. These do NOT constitute twelve guaranteed months of sustainable recurring income. Monthly recurring run-rate needs its own independently verified subscription report.
- Operating expense totals must come from actual invoices; never derive them from database bytes or Railway CPU activity.
- Cost-coverage meter requires a separately verified expense denominator and spendable supporter cash AFTER the remaining tax reserve for the SAME period; a zero expense denominator or unknown data produces no percentage.
- Verified zero differs from a missing record.
- Review dates and published periods must remain visible, with month-to-date amounts clearly distinguished from closed-month results.
- Supporter data is a commercial service, not a tax-deductible donation or investment return.
- Do not claim live telemetry; updates require explicit new evidence, aggregation and a reviewed publication.

## Open gates
- Real Railway, Cloudflare, transactional email and related ANEVUM recurring invoices not yet verified by this workflow.
- Stripe Sandbox with isolated keys and actual test checkout/refund/dispute cycles still unavailable through current connection.
- Legal tax, cancellation, refund and support disclosures still need owner approval.
- No schema migration, staged release, Stripe price activation or public homepage promotion is authorized by this V038 draft.
