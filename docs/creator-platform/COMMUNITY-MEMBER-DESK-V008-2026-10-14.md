# ANEVUM Community V008: invited member desk

**Session:** ANEVUM.WEB.BUILD.2026-10-14.004.COMMUNITY-MEMBER-DESK-V008  
**Review branch:** build/creator-v1-community-member-desk-v008-20261014  
**Depends on:** Community V007 draft PR #392; member signup proposal PR #390 is separately gated.  
**State:** Source in review. This file is not launch or identity authorization.

## The experience

- A compact signed-in contribution panel takes the place of the static invitation placeholder inside Community.
- Public visitors can browse without creating an account, opening an email signup, sharing brokerage credentials, or paying.
- When the current exact-origin member Worker is healthy, verified and invitation-enabled, a guest may use the pre-existing invited email sign-in route. Otherwise the UI remains closed.
- Authenticated members with a verified handle can navigate to the protected discussion submission form, private projects, and their account. Members who still need a handle go to the existing guarded profile editor.
- The member desk lists up to three private discussion submissions and their actual review states from the existing member-scoped API. It never publishes pending work or substitutes synthetic counts, achievements, or user identities. The full list remains available through the guarded discussion editor.

## Security and product constraints

1. No new identity system: the same-origin member health and session endpoints are the sole access signals. The frontend does not link Better Auth with Creator V1 identities.
2. Only a known healthy Creator V1 staging service can return an invited/member presentation. Missing service, unknown service, or authorization failure leaves member participation closed.
3. Private discussion status is loaded only following authenticated ownership confirmation, and cached result rendering requires the response to belong to the current member ID.
4. Writing, publishing, approving, reactions, XP and privilege enforcement stay on existing server-controlled routes. No guest writes and no client-side privilege grant.
5. Do not use this component to open public registration; do not promote the construction page or move Cloudflare Workers.
6. The 60-level artifact/award presentation in community bylines is **not** claimed implemented by this patch. It needs published-safe, server-verified per-creator presentation fields and moderation/privacy review; do not substitute fake art, invented badges, or sample level scores.

## Verification

Required checks: V008 TSX syntax, TypeScript+Vite compiled builds, previous V007 release contracts, integration tests for member, staff, privacy and moderation, and actual browser captures at 1440, 1024, 390, and 320px. Automated screenshots may contain labeled synthetic offline catalogue fixtures; they are visual regression evidence, never real member sign-in acceptance.

Before enabling public participation: review PR #390's identity provider strategy, canonical member ID mapping, dual-identity account-linking rules, consent/privacy, real two-user staging access tests, D1 backup/restore, negative permission cases, provider outage, and owner authorization.  
