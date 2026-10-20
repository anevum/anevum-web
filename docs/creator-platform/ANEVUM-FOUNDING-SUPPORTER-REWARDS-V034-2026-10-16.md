# ANEVUM Founding Supporter / V034 Collectibles

## Principles
- A single optional supporter product at **$5 USD monthly** or **$36 USD yearly**. Both options unlock **exactly the same benefits**. Yearly payment is not an accelerated rewards tier.
- Core ANEVUM account, creator submissions (subject to general published quotas), XP, levels, earned medals, discovery placement, community communication, accessibility and moderation protections remain free.
- Subscription badges/seals are identified as supporter collectibles and are NOT part of the achievement cabinet or paid awards.
- Supporter subscription age (not lifetime purchases) unlocks additional cosmetics after 0, 90, 180 and 365 full days. If the subscription ends and restarts, the new verified start date controls the tier. No guarantee of a lifetime mark.
- Opt-in public insignia, default **OFF**; private member view can still preview and equip their cosmetics. Public profiles show paid cosmetics only when the member intentionally enables the supporter mark, the profile itself is public and the server verifies a currently active, fresh, undisputed paid subscription.
- Disputes/refunds and stale billing projections fail closed. No raw payment details or Stripe identifiers ever appear in public profile payloads.
- No separate purchasable boosts, no pay-for-reach, no ads, no premium community voice or moderation privileges.

## Cosmetic catalog (source implementation, not deployed)
| Unlock | Seal | Profile frames | Banner atmospheres |
| --- | --- | --- | --- |
| Day 0 | First Signal | Orbital Alloy, Roseglass, Lumen | Aurora, Eclipse, Ember |
| Day 90 | Established Orbit | Stellar Crown | — |
| Day 180 | Constellation | — | Nebula |
| Day 365 | Continuance | Continuance Halo | Transcosmic |

Rewards require a current verified subscription plus unlocked server ID. All designs have responsive CSS and reduced-motion behavior. Supporters can equip one seal, one frame and one aura at a time through an authenticated, optimistic-revision form. Changing cosmetics does not award XP. A member with no cosmetics or subscription gets normal profile styles.

## Stripe account configured (LIVE ACCOUNT, INACTIVE COMMERCE)
- Product **ANEVUM Founding Supporter** ID: \`prod_VS8dsmuyKtbxBe\`, \`active=false\`.
- Monthly recurring price: \`price_1UREMnDru8RvRNYoGgRoBzEg\`, USD 500 cents, \`active=false\`.
- Annual recurring price: \`price_1UREMpDru8RvRNYolKA3U5lU\`, USD 3600 cents, \`active=false\`.
- The Stripe connector has access to ANEVUM live mode only. **No test/sandbox account** is connected.
- These are inert catalog records. No live checkout session, webhook, billing portal activation, payment link, payment, charge or customer subscription created. These live IDs MUST NOT be placed into the test-mode staging environment; V032 rejects live keys and verifies Price amounts.
- Inactive live Prices and Product must remain disabled until merchant legal/tax copy, support/cancellation/refund policy, secure live environment split, browser tests and owner launch authorization are complete.

## Source architecture
1. Existing authenticated canonical staging Better Auth identity resolves member ID.
2. V032 test-mode Checkout validates price and creates sessions with same-member concurrency guard.
3. Verified raw-body Stripe events reconcile canonical D1 subscription ownership and current periods.
4. V034 stores Stripe-signed subscription start in \`started_at_ms\` and exposes a server-only eligible reward projection.
5. \`GET /api/v1/member/supporter/rewards\`: returns public catalog, owner unlock state and current selected cosmetic without payment PII.
6. \`PATCH /api/v1/member/supporter/rewards\`: same-origin, signed-in owner; checks exact whitelist, tenure unlock and optimistic revision.
7. Private account wall and opt-in public world read server-authorized cosmetic selection; no client direct writes, localStorage impersonation or grant of earned XP.

## Release blockers
- Connect a Stripe TEST mode key through secret storage and create matching active **test** prices.
- Confirm tax treatment and sales eligibility for digital membership in relevant jurisdictions. Determine whether tax-inclusive or exclusive prices are appropriate before activating live Prices.
- Install migration 0006 only in the exact canonical staging MEMBER_DB following a backup and validation.
- Verify webhooks, invoice payment failures, cancellations, resubscribe, disputes and eventual manual hold restoration; Stripe test clocks recommended.
- Ensure account deletion, GDPR/CCPA and subscription cancellation are compatible and disclosures are complete.
- Complete browser checks at 320/390/768/1440; validate screen readers, consent and mobile styles on a real device.
- Explicit authorization required before activating any live Price, creating a real checkout or replacing the public anevum.com countdown.
- Product visibility in Stripe does not mean a user can subscribe today.

Session: ANEVUM.WEB.BUILD.2026-10-16.003.SUPPORTER-REWARDS


## V034 public surfaces
In addition to the profile wall, the public member directory and activity feed now read the opt-in supporter appearance projection. A member with publicInsignia disabled is represented as an ordinary free member; no billing customer ID, subscription start, payment status, charge or refund metadata is published. The member's own composer always reflects their private selected cosmetics for accurate preview, independent of public consent.

## Scheduled status verification
The source-only staging Worker now has a daily Cloudflare Cron schedule at **05:17 UTC**, using its existing Worker and canonical D1 (no new Railway deployment).
- Reads the 40 stalest subscription projections per run when their last verified Stripe state is more than 24 hours old.
- Calls Stripe's API using only the secured sk_test_ secret bound to the existing worker and reuses the same customer/Price ownership verification as signed webhook reconciliation.
- Invalid state/Price/customer mismatches never extend access; the public appearance automatically disappears when data exceeds the 72-hour freshness window.
- Billing verification runs after successful test-mode configuration; no schedules, credentials or database objects have been installed in the existing deployed staging environment.
- Before scaling beyond 40 active subscriptions, implement batching/pagination and compare Worker/D1 request quotas to avoid silent entitlement loss.
- Do not configure a live secret until a dedicated audited live release separates test and production payments.

## Design treatment
No image generation costs, new object storage or CDN fetches are required for the initial reward art. Portrait frames and banner atmospheres use CSS materials, the existing official vector mark and semantic HTML. This is the first implementation, not a substitute for later 4K/art-director-approved masters. Future optional artwork upgrades must not be a prerequisite for delivered membership benefits.
