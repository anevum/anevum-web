# ANEVUM V040 — Public transparency privacy and cache integrity

Date: October 16, 2026. Status: **DRAFT SOURCE ONLY**.
Parent: V039 aggregate telemetry PR #446, V038 finance PR #445, V037 transparency PR #444.

## Reason
An early staging community is extremely small. Publishing exact signup totals, per-person uploads, or image bytes would make a "transparent" public page unnecessarily revealing. Even aggregate counts can identify an individual's activity when only one or two creators exist.

The privacy contract is deliberately stricter than the original V039 proposal.

## Reporting policy
- Live cached community counts have a **minimum of 25 distinct contributors** relevant to the metric. Small cohorts are **null**, not zero.
- Member accounts and creator profiles require at least 25 qualifying accounts/profiles, independently.
- Wall activity counts **only posts on publicly visible member walls**. Additionally, at least 25 distinct authors must contribute before a count is released. A prolific single author cannot meet the threshold by posting 100 times.
- Profile-media object counts and image-byte totals require at least 25 DISTINCT media owners, not just 25 files uploaded by one account.
- Eligible counts are **rounded DOWN in groups of 25**, displayed as lower bounds such as "25+" rather than exact totals.
- Eligible image bytes are rounded DOWN in whole mebibytes. Exact bytes, avatar counts for tiny cohorts and per-user storage remain private.
- The public static JSON no longer contains exact staging member, profile, post, media-object or media-byte totals. It keeps the independent dated Cloudflare D1 file metadata and R2 bucket facts, which are not member activity telemetry.
- The public "image slots filled" fraction is removed. It could imply exact private usage or misrepresent coarse ratios as accurate.
- No production members, payments, personal identifiers, financial data or private wall posts leave the aggregation endpoint.

## Cache discipline and authorization
- Endpoint `GET /api/v1/public/supporter/metrics` remains disabled by default under `CANONICAL_SUPPORTER_PUBLIC_METRICS_ENABLED`. Its existence alone does not publish data.
- Response contract is now **schemaVersion=2**, source `canonical-member-d1-privacy-aggregate`, with an explicit privacy-policy section.
- V040 moves the edge cache key to `?policy=v2` and requires exact version, header, aggregate field names, step validation, and an age at most 900 seconds. V039/v1 cached exact data is never accepted.
- The server still has one fixed SQL query, a 900-second edge cache, and no caller-defined filters or SQL. Cache absence/write failure returns 503 instead of uncapped D1 reads.
- The browser also checks schema, age, threshold policy and coarse field types before replacing the dated source fallback.
- Cloudflare Workers Cache API caches locally at the data center and is not guaranteed globally synchronous. Do not call this live streaming or a global meter.
- No flag, route activation, D1 migration, Stripe secret, purchase, checkout, production deployment or apex countdown change is part of this PR.

## Acceptance tests
- Population below 25 yields withheld community/media values even when 24 people uploaded 24 objects.
- 25 owners can release only coarse lower-bound counts and mebibyte bands.
- 100 posts from one person are still withheld until 25 separate public wall authors contribute.
- Private walls are excluded from public wall counters.
- Boundaries at 25, 49 and 50 members do not disclose exact additions.
- Cached v1 and malformed v2 payloads cannot bypass the new policy.
- Stale and invalid caches are rejected, failures do not publish raw D1 results.
- The static public source contains no exact small-cohort member activity.

## Remaining release gates
1. Full Creator V1 CI (TypeScript, end-to-end aggregate contract and existing browser captures) must pass at V040 HEAD.
2. Review the published D1 file footprint as separate engineering metadata, not a measure of available storage or per-member usage.
3. Decide if even 25+ staging counts should be publicly exposed before January 1. Keeping the flag OFF is the default recommendation.
4. Inspect the Worker cache behavior in an approved test deployment without touching current users or enabling payments.
5. Keep the actual monthly invoices/revenue/funding goal UNKNOWN until independently verified. This privacy work must not loosen the V038 finance rules.

**None of the V032–V040 supporter draft branches are a deployed or chargeable feature.**
