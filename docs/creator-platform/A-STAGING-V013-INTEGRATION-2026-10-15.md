# A-staging V013 — Cinematic signup and Creator Studio integration

**Session:** ANEVUM.WEB.RELEASE.2026-10-15.001.CREATOR-SIGNUP-STUDIO-STAGING-INTEGRATION
**Target:** a.anevum.com, READ-ONLY public staging only; never apex production.

## Composition
- Merged V012 cinematic navigation, page treatments, real-data community/discovery, and archived Atlas redirects from #410.
- Frontend-only canonical Better Auth signup and private-first member profile design from #409. Routes: /join, /sign-in, /member, /@handle. Exact same-origin capability checks remain fail-closed when provider/DB is not active.
- Owner-approved staging /account/studio navigation and account hub from #407. Legacy Creator member session is NOT a verified Better Auth identity and cannot be bridged by the frontend.
- Private quarantine asset uploader interface from #393 is attached ONLY to a protected project editor; neither R2 nor write API is provisioned on a.anevum.com. No public file access.
- V012 look remains authoritative; V013 CSS is a scoped adaptation, not a redesign.

## Release guard
Keep a.anevum.com/* -> anevum-creator-v1-a-staging. Worker only binds ASSETS + isolated staging COMMUNITY_DB fa96e36d-6257-4883-bf15-074947e11a13.
DO NOT add canonical MEMBER_DB, R2 or auth/email secrets, enable signup/uploads, change production anevum.com/* (anevum-construction-terminal), change next.anevum.com member routes, or migrate databases here.
All new signup and upload user actions remain gated behind verified same-origin backend readiness, so the visual pages are inspectable while registration and uploads stay closed.

## Acceptance
Run exact-head TypeScript/Vite, public/member/staff/privacy tests, staged routing denial checks, V012 browser capture matrix at 1440/1024/390/320. Only then trigger the existing narrowly pinned A-staging release workflow using its release marker. Verify status 200 public pages, same-origin account endpoints 404, and unchanged Cloudflare route/bindings after staging deployment.
Real signup with two invited identities, review/moderation, account bridge, storage migration, upload scanning/privacy and owner visual signoff require separate authorization.
