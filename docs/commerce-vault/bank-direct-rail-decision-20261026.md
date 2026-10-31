# ANEVUM Commerce — Direct Bank Settlement Feasibility and Decision
Date: 2026-10-26 | Status: RESEARCH/IMPLEMENTATION DESIGN ONLY, NO CUSTOMER PAYMENTS

## Decision
Own checkout, order life cycle, supporter and vault entitlements, accounting, tax/refund records, handmade-merch inventory and fulfillment. **Do not use Square, Stripe or another payments-as-a-service product.** Begin with a customer-initiated bank transfer model rather than storing card credentials or collecting customer bank login details. Only consider release when an eligible ANEVUM merchant bank account, real bank-transaction readback and required customer experience are actually available. No order can be treated as paid from self-declared status.

## A bank still has to move the money
Nacha says an ACH originator instructs an ODFI (financial institution) to send payment entries; our app cannot join ACH directly as an ordinary merchant. https://www.nacha.org/content/how-ach-payments-work
FedNow provides access through participating financial institutions, not directly to consumers or merchants; the bank must explicitly offer the merchant relevant payment features. https://www.federalreserve.gov/paymentsystems/fednow_faq.htm and https://www.federalreserve.gov/paymentsystems/fednow-additional-questions-and-answers.htm
Cards require an acquiring relationship and PCI DSS compliance even where providers host payment pages. ANEVUM will not collect card data for its first bank-transfer release. https://www.pcisecuritystandards.org/faqs/does-pci-dss-apply-to-merchants-who-outsource-all-payment-processing-operations-and-never-store-process-or-transmit-cardholder-data/

## Route ranking
1. **Customer-initiated ACH credit / bank bill-pay transfer into a dedicated approved business account** (lowest external-payment dependency). Website prepares a unique unpaid order reference and a limited-time quote. The CUSTOMER initiates transfer at their own bank. ANEVUM privately reconciles the actual credit posted in its merchant bank; do not ask for bank login, debit authorization or customer routing/account numbers. This is not universal: sending banks may not offer easy outbound consumer ACH to arbitrary businesses, and payee/memo data may be lost. Order remains unpaid if no trustworthy reference or authoritative credit is available. There is no instant fulfillment by default.
2. **Bank-offered RTP/FedNow payment request/instant credit** if the actual business bank supports it for the merchant and customers; eligibility, receiving, RfP capabilities, API delivery, pricing and coverage must be independently confirmed. This does NOT remove bank dependency and is not promised for V1.
3. **Merchant-initiated ACH debit with an ODFI** only after the bank underwrites it and authorization, returns, fraud monitoring and dispute policy are reviewed; not early-stage default. See https://www.nacha.org/content/third-parties-ach-network and https://achdevguide.nacha.org/index.php/how-ach-works
4. **Cards / own card processor / network membership** deferred indefinitely; this is not viable as a no-partner, zero-compliance, no-cost coding shortcut.

## Merchant bank account question
The business account must be legally eligible for ANEVUM commercial receipts (not personal checking), must support customer-originated transfers and transaction-reference readbacks, and must have workable statement export and/or a contracted official read API. A **bank** is not an outsourced merch company or third-party website checkout.

Chime explicitly states its checking is personal-only and business deposits may be returned: https://help.chime.com/how-do-i-open-a-chime-account-bafa327e and https://help.chime.com/hc/en-us/articles/15186056747927-Why-was-my-direct-deposit-returned-to-my-employer
A sole proprietor does not universally need an LLC or EIN to open a business account: for example Chase publicly lists SSN/ITIN/EIN alternatives for sole proprietors and requires assumed-name evidence where applicable. This is a *bank-eligibility lead, not an ANEVUM account opening, recommendation of paid banking services, or a promise that Chase exposes the required inbound transaction API*. https://www.chase.com/business/offers/business-checking and https://www.chase.com/business/knowledge-center/start/opening-a-business-checking-account
Do not enroll, submit personal tax information, incur bank fees or initiate contact without specific user authorization.


## Florida and brand-name setup (not authorized or performed)
If ANEVUM is operating as a sole proprietorship under a name other than the individual's legal name, the Florida Department of State generally requires a registered fictitious name before transacting business under that name, subject to exceptions. Current published filing fee is $50; the state also requires prior newspaper advertisement in the county and warns that filings become public records. Check whether ANEVUM already has valid registration or an exemption before acting. Do **not** file, pay, publish personal contact details, form an LLC, or obtain an EIN based on this planning document. https://dos.fl.gov/sunbiz/start-business/efile/fl-fictitious-name-registration/
Florida generally taxes retail sales of physical goods, with state sales tax of 6% plus any applicable county surtax; merchandise tax compliance must be validated before selling. Specific digital/storage taxability is not decided by this research. https://www.floridarevenue.com/taxes/taxesfees/Pages/sales_tax.aspx

## System design
- **Order draft:** server-assigned UUID, member ID from independently verified session, approved SKU/price, unique code, expiration. Public checkout and transfer instructions OFF until an accepted merchant bank rail exists.
- **Pending transfer:** externally initiated, never a debit from a customer authorized inside ANEVUM. Don't treat a customer screenshot, client event, text memo or uploaded CSV alone as bank confirmation.
- **Bank evidence:** read or attest from ANEVUM's own bank using contracted bank API or explicit back-office independent bank-portal verification. Bind institution, specific merchant account, unique bank transaction ID, posting status/time, amount/currency, reference, and a durable evidence record. Keep bank credentials server-only; log access/audits.
- **Matching:** exact order reference, amount and currency; prevent duplicate credits/replayed webhooks/duplicate orders; mismatches, absent memo and overpayment go to a staffed exception queue. Never auto-grant from a mere candidate.
- **Double-entry:** cleared funds + appropriate revenue/deferred revenue entries, immutable postings, reversals/refunds, periodic bank statement reconciliation and segregation of ops/tax/reserves. Until real evidence exists, ledgers are **synthetic only**.
- **Customer rights:** clear accepted payment methods, expected delays, expiration/refund/privacy policies, billing history, receipting, support and deletion/retention. Merely paid-looking UI is forbidden.
- **Scope:** ANEVUM sells its own supporter options, storage service and self-made Cricut merchandise only. Holding customer balances or collecting money on behalf of other creators (marketplace payouts) is **separate** and requires additional legal/regulatory analysis.
- **No launch if financial rail is unavailable:** a complete proprietary UI is not proof of a legally functioning payment system.

## Engineering status at this checkpoint
- `src/server/commerce-contract.mjs`: all money intake and paid entitlements OFF despite env flags; exact approved prices.
- `src/server/commerce-bank-model.mjs`: strict server draft and synthetic credit candidate matching, fail-closed fulfillment and balanced *simulated* journal lines.
- `docs/commerce-vault/schema-v001.review-only.sql`: unsigned and unapplied proposal.
- No actual bank account is bound, no settlement adapter is running and no customer payments accepted.
- PR #782 stays draft; do not merge, migrate D1, change traffic, open bank accounts or send outreach without separate authorization. Website/Creator V1 #325 and dates #308 remain authoritative.

## Exit gates / externally unresolved
1. Confirm eligible sole-proprietor/business merchant account and legal trading name requirements, actual charges and fees, ACH-credit posting/reconciliation evidence capability; no assumption that an existing personal account meets this.
2. Demonstrate end-to-end **actual bank-confirmed credit** only in a permitted private financial test after authorization, with two independent readbacks and replay/refund tests. No live test charge or transfer is authorized by this work.
3. Complete authenticated project member A / independent staff / independent member B journey, bank credit exception review, vault account isolation, account deletion/data export, backups, restore and rollback, fraud/rate limits and accessibility.
4. Review Florida sales-tax treatment of physical merchandise and any digital service, federal income tax, commercial refund rules and prohibited custody/payout behavior with qualified professionals before launch.
5. Separate explicit founder go/no-go for accepting real-money transactions.
