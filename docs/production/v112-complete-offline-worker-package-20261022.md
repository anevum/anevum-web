# Complete offline apex Worker package

Session: `ANEVUM.ANEVUM.UPDATE.2026-10-22.001.PLATFORM-COMPLETION`

The approved release contains V106–V110, but the retained V110 build includes only the frontend. V112 completes the offline package with the canonical apex gateway, its bundled Better Auth/server modules, generated root-asset configuration, immutable binding readback and rollback references. No Cloudflare upload, traffic, route, Access, member, publication or database write is performed by this change.

The source artifact is approved-branch V110 run `39870441272`, artifact `12466061529`, source `e96bea83c67883d227c8c733bba80afb95f8b633`. Its downloaded archive SHA-256 is `2525bbb3a8bcad4838be58eaaecb7cf0cb4339d7d1d53f9288c654bd76ff9105`. Every copied file is checked against its retained manifest; extra files, missing earned media, changed bytes and public source maps fail. The 395 compiled frontend files include all 152 earned-media assets. The retained 320/390/1440 root-browser results remain synthetic frontend evidence.

Runtime inputs must remain identical to that reviewed source. The checked-out packaging SHA is recorded separately from the frontend SHA. Changed tracked or untracked runtime inputs fail packaging. Dependencies are recorded in the CI artifact, and the complete Worker output and configuration receive SHA-256 hashes. A new snapshot and a newly reviewed source artifact are required if those inputs change.

Fresh read-only provider inspection on October 22 confirmed apex deployment `6372ee35-8c7d-468c-9486-536d9c4b0a0d`: original version `93cc7f07-cf39-457e-af69-c9f6f4c02d25` serves 100%, prior private candidate `6f26f0cc-6eee-483d-9f07-329e45bd5e76` serves 0%. All 40 routes and disabled workers.dev/previews are retained. The candidate's 26 binding signatures comprise 18 plain variables, five secret names, two D1 databases and ASSETS. Secret values are neither retrieved nor packaged. A subsequent authorized upload must independently verify and preserve those secrets at the provider.

The checked-in raw Wrangler configuration is deliberately not an upload source: it still differs from actual immutable flags/bindings. The generated **offline** configuration takes the exact candidate variables and database IDs from the frozen provider readback. XP test and creator uploads remain false; recognition and canonical package proof stay enabled. The existing public/gated-mode values are preserved. This configuration is an input for `wrangler deploy --dry-run` only; the workflow has no Cloudflare credential or upload step. The artifact is reviewable input for a later guarded version upload, not a production-approved release.

## Validation and remaining release work

Package regressions reject deployment/rollback/route/binding/preview drift, secret material, unexpected types, changed inventory, invented acceptance, source-map leaks and omitted earned media. Existing gateway, retired-XP and AUTH-pin regressions also run. Wrangler compiles the complete canonical gateway offline, and Node checks the emitted module syntax. Offline compilation does not establish Cloudflare runtime, real-account or physical-device acceptance.

The following gates remain explicit false values in the package manifest:

- Actual native controller AUTH pin remediation. The serving controller still pins historical `3ba8602c…`, absent from the current apex deployment. V109/V109.1 correctly block it.
- Reconciliation of the controller's staging public-publishing setting. This package makes no controller changes.
- Fresh provider readback immediately before any separately authorized inactive upload, preserved secrets, verified new version and protected routing to that exact version.
- Owner, independent reviewer, ordinary member and guest acceptance, signup/recovery, final IREN verification and physical Safari acceptance. Founder-confirmed existing private/public Uplink playback is preserved as prior evidence; it does not accept this new bundle.
- Separate XP redirect and legacy player Worker releases; Lab's separate acceptance path. Deferred iPhone Expand Player issue #631 remains deferred.
- Founder final go/no-go before public promotion. The current original 100% / old candidate 0% deployment is the rollback reference, not permission to change traffic.

Studio workspace #638 and homepage/IREN transmission #636/#637 are separate draft workstreams and are not included here. Release tracking remains #622.
