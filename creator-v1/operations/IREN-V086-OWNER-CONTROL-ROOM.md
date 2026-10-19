# ANEVUM / IREN V086 — Owner Control Room and Moderator Workspace

Session: `ANEVUM.IREN.BUILD.2026-10-19.001.OWNER-MODERATOR-CONTROL`

## Current production evidence

- Public production is approved **V084**: `anevum.com`, gateway Worker version `4aaaa67a-0d67-43b6-b012-50a2a92adbf5`.
- Independent Staff Worker `anevum-iren-apex-staff-v002` runs at `anevum.com/staff*` through the reviewed navigation layer and `anevum.com/api/v1/member/staff-ops*`; Staff authority comes from verified Better Auth + the existing `staff_access_grants` D1 ledger. It does **not** come from a moderator-looking avatar, email claim, profile title, localStorage, staff-candidate outreach, or an XP tier.
- Project review is deliberately separate at `anevum.com/staff/projects*` on the original review worker. The source-only V080 staff deletion upgrade remains unpromoted until an owner-authenticated acceptance test.
- `lab.anevum.com/previews/` is a protected *synthetic simulator*; do not present it as functioning staging.
- `a.anevum.com` has been retired; do not use it as an independent staging environment.

## V086 implemented in reviewed source

- Keep the existing reviewer workspace: Communications, Team Whiteboard, Invitations, Assignments, Review, and Personnel. All staff operations continue using the canonical session, immutable owner/reviewer grants, audited grant/revoke and same-origin POST.
- Add the **Owner Control Room** as an eighth owner-only tab in the responsive, single-screen IREN console. Reviewers see the original seven, and the eighth cannot be loaded by forged query parameters.
- Member directory: authenticated **owner only**, server-side name/email/handle search, 25 records per page, explicit cursor page bound (0–100), verified status, private/public visibility, cosmetic aura preference, existing reviewer grant. No member passwords or tokens exposed.
- Moderator access: existing owner-only audited `staff-grant` and `staff-revoke`, explicit human confirmation, only real verified member IDs, cannot grant owner or change owner via the UI; granting a reviewer never auto-awards a role halo.
- Recognition: real earned milestones, granted badge/ribbon/medal records and member-chosen cosmetic aura. Missing role-halo migration is displayed as `Registry not activated`. No UI/API award-forgery, arbitrary XP grant, or fabricated reputation.
- Recognition catalog: definitions of badges and honors pulled from the deployed V084 client catalog, never treated as entitlements. Founder/admin/mod/curator role emblems are a separate, evidence-reviewed process, **not** the Staff role grant.
- Release evidence: exact real V084 production run and mobile/desktop captures, V081 awarded emblem QA, clearly differentiated from the old synthetic Lab concept.

## Still deliberately not implemented

1. A genuinely isolated `staging.anevum.com` (or owner-only Lab staging route) with its own D1, R2 and restricted test-auth account. **No functioning sandbox has been deployed by V086.** A production-accurate staging system requires a separate D1 database, safe mail testing, user/content fixtures, no production account records, feature/asset parity, and a release/rollback pipeline.
2. Real cosmetic-aura override and institutional founder/moderator halo assignment. Members currently control ambient aura preferences. Institutional role grants demand independent verified evidence, permission checks, a separate approved D1 migration and auditable dual control. The missing production `member_role_grants` table is not silently created.
3. Manual issuance of unearned evolution levels, XP, or reputation. This would invalidate the reward economy; the owner can inspect earning evidence and later coordinate exceptional, independently approved badge/honor awards without manufacturing play activity.
4. Wider staff review/project deletion promotion. This is an independent guarded release and must not overwrite the current functioning Staff/Community/Creator routing.

## Security and release gates

- Source branch `build/iren-control-room-v086-20261019-001`, based on active independent IREN source lineage `integrate/iren-apex-staff-v002-20261017`. This does not rebuild or replace the public **V084** website.
- Focused QA must pass exact-head owner/reviewer privacy fixtures, current member search+SQL escaping/pagination, real-recognition ledger inspection, authenticated reviewer promotion/revocation, TypeScript build, independent Staff bundle and responsive Chromium at 320/390/1440 px.
- Production changes are **not** authorized by this source branch. Guarded release must retain Staff Worker version, five original Worker bindings (APEX_AUTH service, ASSETS, MEMBER_DB, two flags), the original staff navigation and review paths, original account/audit rows, the public V084 gateway and its 24 bindings, and the owner-only Lab route.
- Anonymous `/staff` may present the sealed identity gate, and staff API requests without a verified session must deny access. Actual owner/member sign-in and moderator browser acceptance must be verified with real sessions; anonymous source CI cannot prove this.
- Do not grant staff to additional friends or relatives without the owner's explicit identification/authorization, and never auto-assign founder identity by email.

**Status:** Reviewable source until exact-head CI, browser acceptance and guarded Staff-only deployment are completed. No production D1 writes, staff grants, member edits, billing or Worker change from this release review.
