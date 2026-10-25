# V136 unified UI controlled release

Session: `ANEVUM.WEB.RELEASE.2026-10-25.004.CONTROLLED-UI-ROLLOUT`.
Coordination: `ANEVUM.ANEVUM.PACKAGE.2026-10-25.001.UNIFIED-WORKSTREAM-CONTINUITY`.

Owner explicitly authorized integration and deployment after the verified
`34ab7886` UI checkpoint. #738 merged into the existing #735 branch at
`b63109b47db27bcb380b9a40da4024ff64f1862c`, retaining its exact tested tree.
This is a frontend-only rollout, not a public-publishing or launch opening.

The existing V136 source guard retains its sealed V132 ancestry, pinned
dependencies/scripts and protected backend boundary. Newly reviewed sitewide
media/UI/test/document paths are constrained to exact Git blobs, including
explicit generated-art deletions. Unrecognized paths and changed reviewed bytes
fail closed. Its tests also reject protected auth/API/Worker changes and all
three unapproved geometry/video flags. No directory-wide exception is added.
The frozen V132 candidate remains unchanged; it cannot represent a broad V136
frontend release. Its genuine collections/guest/disabled/earned-media contracts
run in the V136 targeted release instead.

Release compilation enables the native cinematic interface, with
`VITE_PARITY_V136_HORIZON_QA=false`,
`VITE_PARITY_V136_SHARED_SCENE_QA=false` and
`VITE_PARITY_V136_NATIVE_VIDEO=false`. The existing canonical renderer remains.
Require current-head complete regressions, full V136 interaction/screenshot QA,
Discover filters/history/outages and compiled collection/privacy checks.

Preserve the sealed V131 Worker SHA-256
`1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99`,
all 152 earned media objects, original 26 binding signatures, controller and 40
routes. Upload versions inactive; baseline HTML remains byte-identical and all
old/new immutable chunks are available to both versions. Provider preflight and
postflight must preserve original traffic until a separate rollout operation.
Capture both newly uploaded version IDs and the old deployment/versions before
changing traffic. Roll back on navigation, asset, runtime or privacy regression.

Actual package audit found four changed, non-runtime art metadata JSON records
colliding with old versions' stable URLs. Their new exact bytes are copied to
`release-records/v136-ui-004/`; old URLs retain original bytes for cached clients
and rollback. Compilation must contain no current runtime reference to those
four URLs, and metadata content hashes are pinned. The shared asset packer's
unknown/conflicting-byte rejection remains unchanged. Retained old images are
rollback compatibility assets, never artwork presented by the new frontend.

Screenshots use loopback fixtures; real account A → moderator → guest → member B,
physical Safari/VoiceOver/Xbox and final concept acceptance remain distinct.
No new payment processor, charge, trading change, account permission, database
migration, family exposure or paid service is included in this authorization.
