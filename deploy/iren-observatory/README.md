# IREN Staff Engagement Observatory

Session: `ANEVUM.IREN.BUILD.2026-10-19.001.STAFF-ENGAGEMENT-OBSERVATORY`

Production entrypoint: https://anevum.com/staff/observatory

## Status on 2026-10-19

The isolated Observatory Worker `anevum-iren-staff-observatory-v001` was uploaded and mapped to `anevum.com/staff/observatory*`. The original `anevum.com/staff*` route was rebound to the additive navigation adapter `anevum-iren-staff-navigation-v002`. Existing staff application `anevum-iren-apex-staff-v002` and project review Workers remain intact and unchanged.

Production D1 audit migration was applied successfully to `anevum-canonical-member-staging`, the database actually bound to `anevum-apex-prelaunch-gateway` (despite its staging-style name). No XP or member rows were modified.

**Signed-in owner and moderator browser smoke tests are still outstanding.** Anonymous fetch verification returned `login_required` for the Observatory and its API. Live routing and data schema were verified via Cloudflare. Do not represent this as a completed authenticated QA pass.

## Source and activation

- `src/index.mjs`: verified staff/session gate; D1 queries; owner-only member search/rewards/audit; audited aura change
- `src/ui.mjs`: compact premium single-page staff interface, mobile responsive
- `src/staff-navigation.mjs`: small expandable IREN dock injecting into the existing /staff HTML shell; upstream staff app unchanged
- `migrations/0001_staff_management_audit.sql`: additive management audit (already applied to the active database)
- `wrangler.jsonc`: isolated Observatory deployment configuration

To deploy the Observatory from this directory: `npx wrangler deploy --config wrangler.jsonc`, with correctly configured Cloudflare credentials. **Do not deploy the old root wrangler config in its place.** This repository directory was introduced without changing root app code.

Navigation adapter deployed separately through the Cloudflare API with `UPSTREAM` service binding to `anevum-iren-apex-staff-v002`; its mapping is on `anevum.com/staff*`. The current review routes are more specific and remain mapped to their existing scripts.

## Permissions and data model

Authentication is delegated to the canonical apex service; each request also queries the active `staff_access_grants` table. `owner` and `reviewer` are accepted; a regular signed-in member is rejected. Reviewer access: aggregate Overview and Moderation only. Owner access: additionally see searchable/paged member directory, email addresses, reward inventory, management audits, and member aura assignments. Moderator role management POSTs use the existing audited `/api/v1/member/staff-ops` API.

Auras support only known preset names, optimistic revision checks and hourly management rate limits; no custom privileges or XP are granted. The Observatory does not delete users, reset XP, invent unique-human metrics, or write per-click analytic records to D1.

Traffic monitoring stays linked to Cloudflare Web Analytics because no verified browser-visit dataset was available for accurate unique human visitors.

## Rollback

1. Restore `anevum.com/staff*` to Worker `anevum-staff-review-navigation-v001` if navigation misbehaves; keep the underlying staff backend untouched.
2. Remove or disable only the `anevum.com/staff/observatory*` route to withdraw the new portal.
3. Keep the additive audit table and all member, progression, project, and staff-grant records. No database rollback is required solely to withdraw the UI.

## Local verification

The bundled standalone release (separate ZIP artifact attached in ChatGPT) passed 16 Node tests for anonymous/role gating, aggregate reads, member pagination and filtering, CSRF, request bounds, aura audit behavior, and data-preserving reads. The source Worker and rebuilt artifact also passed syntax checking. The Cloudflare build accepted both production Workers with module-specific MIME types, and Cloudflare confirmed their active routes and bindings.

## Remaining production checks

Sign in as `devon@anevum.com`, open the staff portal, use the IREN dock and verify Overview, Members, Rewards and Moderation. Verify one reviewer sees only overview/moderation and receives HTTP 403 for the owner-only APIs. Finally confirm all existing project moderation actions work as before. Keep real aura grants unchanged until authenticated QA is complete.

## V002 aura preview follow-on (source-only)

Session: `ANEVUM.IREN.UPDATE.2026-10-19.002.AURA-ASSIGNMENT-PREVIEW`

The Observatory's owner-only member directory now explains the six existing cosmetic aura presets and displays a live local preview when an owner changes a dropdown. Unchanged selections cannot be submitted; selecting a new aura shows an UNSAVED PREVIEW label, then requires the existing confirmation, version check and audited POST. The server remains the authority on owner access and legal aura identifiers. Responsive member cards at narrow widths replace the 1000px horizontal-only table experience. The Rewards distribution tab now labels aura types with creative affinity and appearance.

This change does **not** grant sect membership, institution honors, staff access, XP, reputation or rewards. Aura IDs, D1 schema, app permissions and authentication APIs are unchanged. The descriptive labels intentionally mirror the companion V091 public Aura Codex (#557); those public and staff features have separate review paths.

Source-only QA: `.github/workflows/iren-aura-preview-v002-qa.yml` runs Node UI-state/permission simulations, Worker syntax checks and synthetic Chromium desktop/phone captures at 320, 390, 1440 widths. Screenshots use fabricated data and are **not proof of live authenticated owner access**. Production Observatory activation requires the guarded Staff Worker release workflow, fresh staff-session smoke, binding verification, and a matching rollback checkpoint. Until those gates pass, the currently deployed Observatory remains unchanged by V002.
