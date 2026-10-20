# ANEVUM V039 — Public supporter infrastructure telemetry

Status: DRAFT SOURCE ONLY, explicitly disabled in staging by default.
Parent: V038 PR #445, V037 PR #444.

## Endpoint
`GET /api/v1/public/supporter/metrics` is routed through the existing canonical staging Worker ONLY when its explicitly configured `CANONICAL_SUPPORTER_PUBLIC_METRICS_ENABLED=true` gate is enabled. This flag is NOT currently included in the deployed Worker and is not added to the checked-in production/staging Wrangler environment in V039.

The canonical issuer/schema validation must pass before any D1 query runs. The endpoint uses one fixed aggregate-only SELECT on canonical MEMBER_DB and requires a functional Cloudflare edge cache. Success responses are cached for 900 seconds; no dynamic query parameters, customer information, personal profile contents, image bytes, or payment information are returned.

## Scope and field meanings
- Scope is always ANEVUM_STAGING_ONLY.
- Member account counts, creator-profile counts, wall-post counts, and profile-image object/byte counts refer only to the isolated canonical staging D1.
- Image bytes are included INSIDE the D1 canonical member database footprint; do not add them to D1 file bytes.
- Image slot occupancy is a staging ratio (two slots per staging member), **not** a global storage utilization meter.
- The response includes UTC dataAsOf, source, cache TTL, and an explicit list of excluded measurements.
- Provider D1 file size, R2 objects, actual account-wide Railway charges, gross supporter payments, taxes and financial goals are NOT queried by this endpoint. Those remain from dated snapshots or a separately reviewed offline finance report.

## Availability and privacy
- Read only, no authentication session required and no public individual account details. The worker retains canonical origin and schema isolation.
- No private posting text, member handles, member IDs, contact data, account cookies, billing identifiers, raw files or image URLs.
- All storage queries use a hard-coded SQL statement. No user-provided filters or table names.
- No successful uncached response: cache failures report 503 to avoid repeated public database work.
- Missing/invalid DB values return 503 and leave the static fallback untouched.
- The supporter page fetches this only when available, uses the latest cached aggregates for relevant staging cards, and continues using the October 16 dated snapshot for everything unavailable.
- Small staging population totals can be sensitive despite being aggregates. Keep this **flag OFF** until owner approves publishing early adopter/test-account counts; consider minimum cohort suppression before public deployment.

## Next validation
- Review exact commit CI, check display at phone and desktop widths.
- Simulate Cloudflare Workers Cache API in preview and verify real 900-second TTL / no-cache failure behaviour before owner-authorized staging deployment.
- Verify private production tables and public site are entirely untouched.
- Do not turn this into live financial telemetry by attaching Stripe/customer database tables.
