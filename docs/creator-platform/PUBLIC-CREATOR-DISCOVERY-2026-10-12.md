# ANEVUM Creator V1 — Public creator discovery

**Session:** `ANEVUM.WEB.BUILD.2026-10-12.004.PUBLIC-CREATOR-PROFILES`  
**Purpose:** Add a real, read-only path from public projects to their creators without prematurely opening member registration or a profile editor.

## Implementation
- `GET /api/v1/creators`: visible creator directory with bounded `q`, `cursor`, `limit` query parameters.
- `GET /api/v1/creators/:handle`: publicly visible creator summary. A creator must be active and must have at least one published, nonfuture project. Hidden, unpublished, suspended or deleted member accounts do not appear.
- `GET /api/v1/projects?creator=:handle`: maintains the *identical* project visibility predicate used for listing, status, categories, and detail. Can combine with category, search, cursor and limit.
- Public pages: `/creators`, `/creators/:handle`, `#creators`, `#creator/:handle`. Project cards and project details link to the real creator portfolio. The approved full cinematic Orbit layout remains unchanged.

## Privacy and safety
- Allowed public fields are **handle**, **display name**, and **count of visible published projects**; project cards remain subject to current DTO sanitization.
- No email addresses, stable member IDs, stage credentials, personal libraries, staff privileges, drafts, private projects, artificial counts or synthetic activity.
- Queries use bound parameters, exact API allowlists, case-insensitive handle comparison, escaped LIKE searches, finite pagination, same-origin responses and GET/HEAD only.
- No migrations. Staged signup, member dashboard, Studio publishing and moderation stay behind independent gates. V5 and RHEN continue archived.

## Verification
Run the existing public API fixture tests for public creator filtering, privacy, q wildcard handling, duplicate parameter rejection, public project-catalogue parity and route 404/405/CSP. Keep the cinematic design regression tests. Production release requires GitHub CI, a Cloudflare version/binding check and real page smoke tests, and a recorded prior-version rollback target.

**Follow-on P0:** Complete one real (not synthetic) creator A -> independently authenticated staff review -> member B rating/save/XP/reversal journey and security/recovery acceptance. The current feature does not satisfy that gate.
