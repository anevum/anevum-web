# ANEVUM-owned Commerce, Creator Vault and In-House Merchandise
Session: ANEVUM.OPS.BUILD.2026-10-26.001.COMMERCE-AND-CREATOR-VAULT
Last direction: October 26, 2026

## Founder decisions and payment blackout

**SOURCE WORK ONLY / NO PAYMENT ACCEPTANCE / NO LIVE CHECKOUT / NO DEPLOYMENT AUTHORIZATION.**

- ANEVUM will develop and fully integrate its **own commerce system** before taking any customer payment. This **supersedes the prior Square-as-interim proposal**. Do not integrate, select, enable or depend on Stripe, Square or any replacement payment processor by default. No manual off-platform "supporter donations" or preorders as workarounds.
- This is ownership of ANEVUM's catalog, order state, checkout UI, accounting journal, receipts, refund/dispute states, subscriptions or finite storage passes, inventory, entitlements and compliance workflow. It is not a claim to independent financial-network settlement.
- **Important legal/technical boundary:** Card authorization, acquiring and bank settlement cannot be implemented as ordinary application code alone. Self-processing card data invokes PCI DSS and acquiring/network arrangements. Direct ACH and other bank rails require a financial institution or authorized agent. No card, bank account or payment credential collection before the lawful rail, obligations and security acceptance are separately resolved. No bank/processor partnership or financial registration is authorized here.
- Keep the public website and existing Creator Studio release path intact. Commerce work stays private/draft; no production flags or payment links are enabled.

## Approved future prices (not yet offered to customers)

- Free private Creator Vault: **2 GiB included**. Do not promise unlimited bytes, guaranteed permanent retention, or unrestricted per-file uploads.
- Optional one-time ANEVUM support: **$5, $10, $25**.
- Additional private vault capacity: **+10 GiB for $4 / 30 days**, **+50 GiB for $9 / 30 days**.
- Optional +100 GiB for $15 / 30 days is **deferred**; not an approved active catalog item.
- No pay-to-win creator progression, privileged review or exclusive access to basic community functions.
- All paid tiers must remain invisible as purchasable/disabled with transparent "not accepting payments yet" treatment until release acceptance. No automatic recurring billing without later explicit separate consent.
- After expiry, show warning, read-only/export grace and clear data retention; never silently destroy files.

## In-house physical merchandise — no third-party fulfillment

- Owner and girlfriend will make/design/package merchandise themselves using her **Cricut** and their own tools. Do not recommend or create print-on-demand providers, third-party merch storefronts, dropshipping or outside merch production/fulfillment.
- The future ANEVUM-owned storefront may manage prototypes, sizes/variants, inventory, physical orders, receipts and owner-operated packing/shipping. Do not promise stock or dispatch time until a physical sample, production capacity and stock count are verified.
- Blank garments, craft materials and postal carriers are inputs/logistics, not authorization to outsource production. No purchase, fulfillment connection or external message was approved.
- Cost per item must include blank item, vinyl/transfer/supplies, material failures, packaging, postage and owner time; merchandise revenue is separate from supporter/storage projections.
- Existing shirt designs remain candidates until physical samples, final art and founder approval.

## Current isolated source (draft PR #782)

- `src/server/commerce-contract.mjs`: exact approved future prices, quota and upload constraints, **permanent code-level checkout OFF** pending a separately reviewed implementation; no external SDK or secret binding. Fabricated settlement claims cannot issue entitlements.
- `tests/commerce-vault-contract.test.mjs`: catalog, payment-blackout, entitlement-denial and quota/media safety regression tests.
- `docs/commerce-vault/schema-v001.review-only.sql`: unexecuted proposed per-member orders, draft financial ledger, settlement event placeholders, project/vault storage/quota records. No Square-only provider field or live migration.
- `.github/workflows/commerce-vault-contracts.yml`: read-only source regression suite. Passing contract tests are **not** proof of payment compliance, authenticated functionality or restore readiness.
- The review-only schema is intentionally outside protected `migrations/` and has not touched D1.

## Implementation milestones before any money can be accepted

1. Create authenticated ANEVUM Commerce API behind verified Better Auth sessions, same-origin writes, authorization/audit trails and independent member A/B account isolation. Keep financial actions blocked.
2. Complete an ANEVUM-owned order engine with server-only pricing, idempotency, immutable double-entry journal, refund/reversal logic, tax/receipt/retention policy and deterministic **synthetic** settlement fixtures in isolated tests. Never classify a synthetic payment as real.
3. Build Creator Vault against private R2 with per-member object authorization, folders/projects, atomic quota reservations, version/export/deletion behavior and accurate accounting. Test existing-project A/staff/B workflows.
4. Add handmade-merch inventory and manual owner fulfillment statuses; define documented customer expectations before displaying items for sale.
5. Research legally viable banking/card settlement path and costs without integrating an external payment service or accepting money. **An actual financial rail and real confirmed clearing are an outstanding external prerequisite, not solved by the ledger.**
6. Verify full backup/restore, rollback, paid-entitlement reversal, abuse/fraud controls, refund/dispute handling, accessibility, physical-device UX, privacy and member deletion obligations. Require an explicit, new founder go/no-go before any live checkout or accepted payment.

## Financial sustainability framing

The founder prioritizes modest reliable operating support plus family/hobby income after reserves, not maximum profit. Storage cost estimates were based on Cloudflare R2 published prices, but actual free-user occupancy, requests, backups and support are not measured. The earlier $158 / $750 / $3,135 illustrative **gross** scenarios remain purely hypothetical, not forecasts. The earlier **net estimates used Square fee assumptions and are superseded** now that no rail is selected. Do not rely on them for household income, do not add unconfirmed merch revenue and do not claim future settlement fees are zero.

Maintain separate reconciled funds/reserves for operations, taxes, refunds, recovery and eventual owner draws; treat realized money rather than synthetic orders as the only basis for distributions.

## Hard release boundaries

- No Stripe, Square, alternative processor, payment link, bank details, checkout credentials, donation acceptance, fees, spending, external communications or public payment UI activation.
- No merchant checkout in production, no money collection until entire system and compliant rail are accepted.
- No production migration, R2 exposure, Cloudflare deployment, creator publishing gate bypass or owner access changes without separate authorization.
- Keep Creator V1 engineering governed by #325 and its release dates by #308; earlier #259 is historical. Preserve existing layout, cinematic visual direction and implemented staged modules.

## Current October 26 implementation checkpoint — additional engineering, no release
- The bank-authorized customer experience and banking feasibility/settlement acceptance contract are specified at `docs/commerce-vault/ux-rail-bank-acceptance-v001.md`; real RfP origination support and customer-bank reach remain unresolved.
- `src/pages/CommercePreview.tsx` and scoped `src/styles/commerce-preview.css` provide a non-indexed, responsive member-only design at `/me/commerce`, shown within the existing Commons shell. It displays exact future prices, no active bank list, a disabled purchase button, and a walkthrough explicitly marked preview-only. Linked in Command only on this draft.
- `src/server/commerce-readonly.mjs` supplies the authenticated read-only catalog only when the separate `ANEVUM_COMMERCE_PREVIEW_ENABLED` flag is explicitly true; all order, checkout and financial mutations fail. The approval and payment flags are not set in default Wrangler config.
- `src/server/commerce-bank-model.mjs` simulates reference matching, duplicate detection and balanced journal lines, but never verifies real-world bank provenance or grants an entitlement.
- `src/server/vault-projects.mjs` offers prospective private project metadata, free quota view and per-user file listing only under `ANEVUM_VAULT_PROJECTS_PREVIEW_ENABLED=true` AND explicitly applied review schema in an isolated member database. No R2 uploads/downloads or paid allowances operate. All queries scope ownership to the independently authenticated user; the member router already checks cross-origin mutations.
- `tests/vault-projects.test.mjs`, `tests/commerce-bank-model.test.mjs`, `tests/commerce-readonly.test.mjs`, `tests/commerce-vault-contract.test.mjs` and in-memory SQLite `tests/test_commerce_review_schema.py` are wired to a standalone GitHub Actions contract workflow. **A passing focused workflow does not replace full project CI or integration tests.**
- An unrelated legacy page-retention count was updated to account for the single added active route and still verifies that the new page is runtime-reachable; do not weaken the public/archived route audit.

### Critical completion gaps
A complete customer payment system **cannot** be achieved solely by programming without approved merchant banking eligibility and a supported legal settlement channel. Before launch: obtain bank RfP merchant eligibility/API terms, verified customer-bank coverage, evidence-backed credit readback, authenticated callbacks, refunds, operational security, realistic fee affordability on $4 products, first-party tax/merch policy, independent A→staff→B checks, live recovery/rollback, verified R2 lifecycle, and owner go/no-go. Avoid introducing creator-to-creator payouts or customer wallet balances into this phase.

**Status remains DRAFT CODE ONLY.** No live checkout, no bank credentials, no new business accounts, no real-money test, no live migrations, no public merch sale, no file storage release and no production change authorized.
