# ANEVUM V068 — Recognition first-contact release

**Session:** `ANEVUM.WEB.PATCH.2026-10-17.017.RECOGNITION-FIRST-CONTACT`  
**Status:** **LIVE and verified** (2026-10-17 local date)  
**Production:** `https://anevum.com/recognition`  
**Source:** `patch/recognition-registry-first-contact-v068-20261017-017`, tested candidate SHA `3f654ffef47f6aad894edf225cc464ad69b1da74`  
**Review:** [PR #487](https://github.com/anevum/anevum-web/pull/487) (source/ops record; draft, not merged)  
**Cloudflare Worker:** `anevum-apex-prelaunch-gateway`

## Deployment and rollback

- **Active Worker version:** `9a93e0c0-573f-42a1-9e99-3a6b4f48d3c2` — 100% traffic.
- **Deployment:** `8e528911-33f8-4b35-8631-2c4f1186726f`.
- **Pinned previous V067:** `c5f899f2-fbf0-4d86-b476-1b478768d38e` — retained for rollback.
- **Do not promote** earlier unrouted `c19b3aeb-0478-4491-9333-615a520de148`: its workflow referenced an obsolete test path. The corrected V068 candidate has the verified 16-test issuance/identity run.
- Compared all 24 bindings against V067: unchanged names, types, plain-text values, and both D1 IDs. All four preexisting opaque secret bindings and the `ASSETS` binding preserved. `CANONICAL_RECOGNITION_ENABLED=true` remains enabled.
- **No member data migrations or XP modifications** were performed for this UI release.

## User-facing changes

- Replaced the long registry first-contact description with concise Continuance language.
- Collapsed the collection counts into one four-column row on small screens.
- Made mobile categories a single-row segmented choice: **Badges / Ribbons / Medals**, preserving the longer descriptive cards on desktop.
- Moved the two profile/level navigation actions onto one compact phone row.
- Made badge-discipline filters horizontally scrollable on phones instead of stacking them through the first viewport.
- Preserved the corrected 29px Orbit masthead, high-density artwork, native V064 Evolution assets, brand palette, and reduced-motion support.
- Kept all badge ownership, XP, role, and merit authority server-side.

## Verified browser measurements

| Viewport | Archive top | Orbit dimensions | Collections | Horizontal overflow |
| --- | ---: | ---: | --- | --- |
| 1440 x 900 | 591px | 29 x 29px | Three desktop cards, same row | None |
| 1024 x 768 | 518px | 29 x 29px | Three desktop cards, same row | None |
| 390 x 844 | 432px | 29 x 29px | Three 44px mobile tabs, same row | None |
| 320 x 740 | 438px | 29 x 29px | Three 44px mobile tabs, same row | None |

For comparison the 390px V067 archive began at **700px**. The V068 patch saves **268px** of vertical distance before the interactive archive.

## Verification evidence

- Synthetic offline visual QA and TypeScript: [run 39082453707](https://github.com/anevum/anevum-web/actions/runs/39082453707), success.
- Corrected candidate: [run 39082626565](https://github.com/anevum/anevum-web/actions/runs/39082626565), success: 16 recognition/identity tests and six native art contract tests.
- Complete Creator V1 verify: [run 39082629884](https://github.com/anevum/anevum-web/actions/runs/39082629884), success.
- Real production smoke: [run 39082927310](https://github.com/anevum/anevum-web/actions/runs/39082927310), success: 1440/1024/390/320 first-fold geometry, open email signup, anonymous recognition and progression returning 401, and native V064 WebGL/reduced-motion regressions.
- Browser console/exception collection in the live V068 geometry report: **zero exceptions**.

## Remaining verified gaps, not represented as completed

- End-to-end signed-in Player Card Studio preference save and public appearance with a real member session were not exercised by the anonymous smoke test. Do not claim this was verified live.
- A guest can still see some recognition catalog items as “Planned” until signed-in recognition availability is retrieved. Align the public status with server-enabled criteria without exposing private ledgers.
- Other badge criteria beyond the four currently issued by canonical profile/forum events and the two existing milestone awards need separately approved issuance evidence before being marked active.
- Medal/ribbon issuance, creator-publication award events, and any future cross-platform achievement API are future work. Never mint them from an unverified client event.

**Source and release policy:** The V068 deploy was a guarded Worker Versions promotion after independent binding parity checks. Maintain rollback to the exact V067 version. Do not replace the canonical Worker by a blind `wrangler deploy` or reset the D1 database.
