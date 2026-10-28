# ANEVUM.WEB.RELEASE.2026-10-28.001.V142-BRAND-NAVIGATION

**Status before this release attempt:** Cloudflare production Worker `anevum-apex-prelaunch-gateway` at V69 (version `f30caf48-f56f-4209-be51-f029559d1cc0`), deployment `1d965db3-68f0-431e-bc88-dbb7ef337101`, 100% traffic. Preserve its rollback.

### Verified source and approvals

- V140 cinematic public website live, original gateway SHA256 `1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99`.
- V141 original ANEVUM orbit/homescreen icon/share card branch `release/v141-severance-icon-share-20261027-001`, source `8a246f141e7b8d8704c7930ac021b9d0485308aa`. Inactive Cloudflare V70/V71 uploaded successfully under CI run [40627822021](https://github.com/anevum/anevum-web/actions/runs/40627822021), with exact paired artifact #12789858557; **these are not live**.
- V142 source [PR #787](https://github.com/anevum/anevum-web/pull/787) merged into the single V141 owner branch with merge commit `732f170552ea1089ead4766c3d34fdcccdc336f7`. Prior reviewed PR head `08b826cbb6a5c9b3a29971f7bf9cf18c012f0307`.
- Live read-only 41-route/84-screenshot audit [40630437774](https://github.com/anevum/anevum-web/actions/runs/40630437774), zero observed broken/unknown links or horizontal overflow, plus V142 production-flag compiled browser/mobile review [40635183038](https://github.com/anevum/anevum-web/actions/runs/40635183038) **PASS**. The latter verifies revised navigation, retired public checkout and mobile game-switchboard non-overlap after the observed overlap was corrected.
- Original first-party V139 cinematic media artifact #12785837975 from CI 40617882293, not downloaded from third-party media providers.

### Release content

- Preserve the exact user-approved gold/ivory ANEVUM orbital mark; add V141 new versioned home-screen icons/manifest and dark horror-themed SEVERANCE share image. New V142 HTML includes correct `og:image`, Apple touch icon and manifest.
- Keep all V140 gameplay-in-development disclaimers, existing HTML routes, original private Studio, accounts, production API, Worker gateway, all 26 bindings/45 Worker routes and controller Worker unchanged. No playable-game/server claims.
- Remove **obsolete** duplicate DEV LOG button, misleading How publishing works Field Guide link, stale Home "Studio" sublabel, generic default quick-switchboard links, public outdated supporter prices/Stripe checkout buttons, and obsolete Supporter Studio/member promotion. Keep valid routes and old inbound redirects.
- Correct mobile quick-switchboard grid card min-height/scroll instead of overlapping text, verified at 390px and desktop widths.
- Historical subscriber records, private cosmetic account fields, database state, rollback/version files, and all old user-cached file paths stay intact. No D1/R2 writes, new checkout implementation, member permission changes, payment transactions, or schema migrations.

### Guarded package and release sequence

1. Exact-source release branch from merged V142 commit; only this doc, isolated read-only packager/provider script and isolated release workflow can differ. No competing app rebuild.
2. Download immutable V141 baseline package, V139 media, compile exact production app with approved V141 art and V142 source, run source/TypeScript/compiled browser regression, verify no undocumented public asset collisions.
3. Construct *two* sealed Worker versions sharing the identical complete V69/V141 cached asset superset plus new V142 hashed frontend and cinematic files. Baseline keeps V69 HTML, candidate uses current V142 + V141 icon/share HTML.
4. Upload baseline and candidate **inactive**, after exact V69 100% provider preflight. Check expected version annotation, gateway checksum, 26 bindings, 45 routes, unchanged controller and zero live traffic change.
5. Separately verify inactive receipts and the current production deployment. Promote baseline to 100% (shared assets), canary candidate 10% with 90% baseline, validate real live HTML hashes and routes, then promote candidate to 100% only on clean readback. Retain V69 and baseline for rapid rollback.

**Any failed checksum, CI, changed Cloudflare provider state, identity binding, incorrect default icon/share metadata, unaudited asset collision, or public route regression must stop the release.** Do not claim live until exact Cloudflare readback and public HTTPS acceptance succeed.
