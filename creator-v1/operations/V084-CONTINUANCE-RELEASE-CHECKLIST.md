# ANEVUM V084 — Continuance member, emblem, and authentication reconciliation

Session: `ANEVUM.WEB.UPDATE.2026-10-19.001.V084-CONTINUANCE-RECONCILIATION`

**Review-only integrated source**, descended directly from production-approved V079 through V083 authentication/D1 recovery. It combines three previously reviewed but separate workstreams without choosing an obsolete source branch for the public site.

## Locked functionality
- V079 Wayfinder homepage, compact navigation and V078 player-card positions
- V080 contextual IREN field assistant, opening from the shell; dismissible, keyboard-usable and mobile-tested; real onboarding progression
- V081 30 earned Evolution of Everything front-facing 2D/vector emblems, no active WebGL mini-icons or unearned full gallery; original historical native 3D assets stay in source for recovery
- V081 player cards everywhere, privacy-respecting founder/admin/moderator/curator *verified display* halos, activity-earned aura, independently chosen ambient cosmetic aura, verified reputation and non-fabricated contribution counts
- V082 dimensional Continuance sign-in and actual Better Auth eight-digit OTP; truthful registration service availability and explicit retry, no bypass
- V083 efficient D1 schema metadata checks, same-binding Better Auth engine reuse (never session caching), XP aggregate read support with legacy fallback

## Deliberate conflict resolutions
1. V083 `canonical-auth/policy.mjs`: six-table identity metadata query cached positive-only 30 seconds; canonical issuer remains checked against D1 **every request**. Existing staff grants, session revocations, and member authorization are never cached.
2. V083 `canonical-auth/space.mjs` cache plus V081 gated `memberReputationMap` private/public projection; no public stats if member opts out.
3. V083 `web/src/lib/canonical-beta.ts` registration status plus V081 verified role/reputation/earned-aura types; does not claim moderation authority.
4. V080 `MemberSpaceDashboard.tsx` with guided toolbars and member onboarding plus V081 2D level and privacy-respecting role/reputation wall identity.
5. V081 earned reward media test assertions plus V083 correct legacy missing-XP-aggregate-table fixture.
6. V083 sign-in styling and V080 IREN CSS are both imported in `main.tsx`. V081 card CSS is imported through `CompactMemberIdentity.tsx`.

## Guarded rollout prerequisites
- Exact-head full Creator V1 + all focused V080/V081/V082/V083 and React browser tests green
- Real iPhone owner signup/OTP/session → /member → /staff role gate confirmed by owner; public anonymous health alone does not prove this
- Preserve current 100% Cloudflare apex Worker, all secrets/24 bindings, original D1 and R2, 23 specialised routes, existing functional uploads; preserve independent post-V079 deployments and avoid old-asset overrides
- No role/reputation grants, reset all XP, billing changes, deletion, staging/prod switch, or migration in this integration PR
- `CANONICAL_REPUTATION_ENABLED` stays off until separate authorized D1 schema migration and data quality/privacy check; verified founder/moderator badges must not be inferred from account email or client role
- Two additive migrations `0011_member_xp_totals.sql` and `0011_verified_roles_v081.sql` **must not be applied blindly**. Resolve migration numbering, backups, idempotence, staging data parity and controlled production sequencing in a separate authorized operation

**State:** source integration for QA, not a production deployment. Do not advertise changes as live before the actual signed-in browser and live asset verification.

Original workstreams: PR #531 (IREN), #532 and #534 (V081 insignia), #536 (D1), #539 (sign-in), #541 (V083 auth).
