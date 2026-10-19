# ANEVUM V082 — Continuance Entry and Registration Availability Repair

Session: `ANEVUM.WEB.PATCH.2026-10-19.001.REGISTRATION-ENTRY-RESTORE`

Base: approved V079 release `f227ee2520f8960c14f6af365a69052a0662ebf3`.

## Incident
The current V079 /join uses obsolete Phase 1 skyward-city raster and lacks the V052 vector-native animated signup experience. The same page renders REGISTRATION CLOSED for **any** unready service. On 2026-10-19 the external registration canary reported closed service, and Cloudflare D1 returned free-tier quota error 7500. Production has CANONICAL_PUBLIC_SIGNUP_ENABLED=true; a closed health result is not proof signup was intentionally disabled.

## Scope of V082
- Restore V052 ContinuanceEntryArtwork, animation, responsive CSS and OTP progress onto the real V079 code lineage.
- Preserve Better Auth eight-digit email OTP, explicit OAuth gates, server-side verification and private-by-default profiles.
- Report **SERVICE UNAVAILABLE** when the public email-auth service or D1 readiness cannot be verified; report **REGISTRATION PAUSED** only when intentional closure is attested.
- Add manual CHECK ACCESS AGAIN retry without automatic polling or simulated success.
- Bound issuer readiness to the six relevant D1 table names, preserving the required independent issuer/migration check. Integrates the focused read-budget SQL from PR #537.
- Add offline tests for unavailable/paused distinction, fail-closed DB behavior, restored artwork, authentic OTP and bounded metadata reads.

## Release safety
No live deployment, D1 reads/writes, account changes, role changes, secrets, migrations, XP reset, payments or provider activation from this commit. Do not manually flip public signup again. Do not bypass `stageReady` or the OTP canary. Current apex Worker version and all 24 bindings (including four opaque secrets, two D1 bindings, ASSETS) must be re-inventoried immediately before any guarded rollout; the version at review time can change. Preserve 23 specialized Worker routes and all existing production features and assets.

## Acceptance
1. Exact-head TypeScript and production build, targeted `npm run test:entry-v082`, canonical auth/email safety tests and full Creator V1 suite.
2. Real responsive browser capture at 320, 390, 768, and 1440px, including motion-reduced behavior, iOS keyboard/OTP entry and no visual downgrade.
3. D1 quota recovered, live GET /api/v1/member/health returns status=ready, registration=open; /api/v1/member/auth-methods returns registration=open and email available. Confirm true production state with existing read-only canary; retain hard failure otherwise.
4. Real independent new and existing account OTP delivery, code resend, verification and profile arrival; check owner identity and staff permission separation.
5. Guarded release from the exact approved SHA only, preserve same live Worker bindings/routes/secrets, verify production smoke and revert to recorded prior version if any regression occurs.

**Status: SOURCE-ONLY until acceptance and authorized release.** Redesigning the page does not restore an exhausted daily D1 read budget by itself.
