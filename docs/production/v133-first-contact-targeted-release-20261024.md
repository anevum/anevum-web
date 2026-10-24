# ANEVUM V133 — targeted first-contact release candidate (2026-10-24)

Session: ANEVUM.WEB.RELEASE.2026-10-24.001.V133-TARGETED-FIRST-CONTACT

Status: **isolated release candidate; offline QA and provider release acceptance pending. No public deployment authorized by the source commit alone.**

## Source and scope

Base is the accepted, immutable V131 packaging commit `ad0d3aef473e12c124b003d2c3bb45b79bff520e`. This branch ports exactly the homepage, signup and additive CSS implementation from owner-approved NEXT PR #704 onto V131 **without** including the pending NEXT Community/Living Commons changes (#676–#679). In particular `creator-v1/web/src/App.tsx`, canonical-auth, D1 migrations, package/runtime workers, routing, secrets, permissions, native player and member/staff code remain byte-for-byte identical to accepted V131. All changes must be restricted to the documented first-contact surface and its targeted tests.

New front-facing promises: understandable public games/apps/experiments, genuine public-catalogue First Look, guest exploration, free member account and actual limited creator-publishing status. No invented ratings, accounts, activity or engagement. First Look is a project-detail preview, not a claim to immediately play a hosted game. The signed-in route and Better Auth OTP flow retain their existing handlers; the extended member-benefit copy sits **below** mobile email action.

## Verified current Cloudflare production baseline before release planning

As freshly read October 24:
- Apex Worker `anevum-apex-prelaunch-gateway`: V131 immutable `44f5971b-4cc9-4e7e-ab6a-1adb6fc5c12e` **99%**, V132 immutable `de673bf1-ef05-4276-af16-2ee8713d965c` **1%**. Deployment ID `a17c98bb-e59e-4384-bdc6-1b397169d94a`.
- Public Uplink controller `anevum-package-alpha-v003-control`: V131 `b3043430-d957-441d-936a-9928c7d1a15c` **100%** with separate inactive private V132 controller at 0%.
- Apex settings have 26 bindings including `MEMBER_DB` e1d29049-c83b-4534-8355-dc1fa36ba6d8 and `COMMUNITY_DB` fa96e36d-6257-4883-bf15-074947e11a13. Full binding values, secret material, authenticated member permissions and route inventory must be read back again before upload. Never use old checked-in `wrangler.apex-prelaunch.jsonc` plain vars as actual live flags.

## Offline candidate CI

The independent `v133-targeted-offline-qa.yml` must:
1. Prove the exact checkout is descended from V131, validate the **allowlist of files** and byte-identical protected Worker, auth, App, package, migrations and routes relative to V131.
2. Regenerate all 152 preserved earned-media artwork assets (the accepted release recipe), install Node deps, TypeScript check, build **root** production assets and staging variant without external Cloudflare credentials.
3. Run V133's React source assertions, preserved OTP/IREN/sitewide/community/null-creator tests and compiled Chromium root and staged homepage/signup at **1440/390/320**. Synthetic fixture screenshots are not live data or device Safari evidence.
4. Verify no source maps and full asset integrity, perform Wrangler **dry run only** with no secrets, no Cloudflare upload, no traffic allocation/route/worker D1 changes. Retain SHA-256 evidence and artifacts at exact head.

Public release still requires: fresh authenticated provider snapshot with route and **all 26** binding identities and flags, source-bound immutable Worker upload at **0%** (NOT auto-deploy), actual public and registered non-owner tests, physical iPhone Safari/mobile player and recovery, email OTP, cross-role/auth/preview, signed owner go/no-go and rollback, and preferably measured Observatory first-contact funnel under separate privacy review. **Do not roll forward by running `wrangler deploy` with stale checked-in config.**

## Relation to PR #704

PR #704 is approved to merge to its NEXT parent to preserve future development. The NEXT parent is a draft and NOT a production candidate. Its separate noindex workers.dev review Worker contains no D1 or auth and is **not** a production release. This V131-targeted branch is the safer release line; do not fast-forward public routing to NEXT, modify the V132 1% canary or promote the read-only preview Worker in place of the real apex.

## Release status tracking

- [x] Owner approved visible V133 first-contact design and asked for merge/deploy
- [x] V131-targeted source delta isolated and verified with GitHub compare
- [ ] Exact-head targeted offline QA green and artifacts preserved
- [ ] Distinct V133 immutable 0% apex candidate packaged, uploaded and independently hashed
- [ ] Real account, cross-role, device and recovery acceptance
- [ ] Cloudflare production gate preflight / approved allocation transition and rollback
- [ ] Postflight public browser, runtime and account verification
