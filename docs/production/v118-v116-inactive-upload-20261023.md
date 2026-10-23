# V118 — V116 complete Worker inactive upload

Session: `ANEVUM.WEB.RELEASE.2026-10-23.001.V116-INACTIVE-UPLOAD`.

V116 first-load/IREN source merged as `a3c94b3ebdc6103347e76f8a5234904978da67e3`. V117 merged complete offline Worker source `356112a94575c988c28efcd9ab083277c3838b80`, passing workflow run `39889939571` and generating artifact `12474282482` with 395 frontend assets, 152 earned-media files and gateway.js SHA-256 `1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99`.

Read-only Cloudflare inspection on 2026-10-23 confirmed public apex deployment `549f57c4-3d29-4b8b-856f-9554cab437e2` at original public `93cc7f07-cf39-457e-af69-c9f6f4c02d25` 100% / earlier protected `86dc4b9d-4020-432a-8a15-e65606f31316` 0%; 26 bindings (five secret names without secret values), two D1, 40 routes, workers.dev and previews disabled. The `anevum.com/*` frame-policy v001 Worker has an `UPSTREAM` service binding to the apex; do not reassign the route. The private version override selects six existing 0% versions under a bounded, token-protected rule; do not renew or modify the protected selector here.

This PR adds source-locked offline verification plus an explicitly gated **inactive-only** upload job. The upload is allowed only when the exact marker-only commit, actor, repo, branch, source ancestry, exact artifact, CI checks, live deployment ID, unchanged settings, routes, exposure, secret names and Worker version resources all match. A new version is never deployed by this job; postflight verifies public 100% unchanged, rollback intact, 0% candidate, no D1 or role mutation.

Only a separate deliberately reviewed approval-marker commit may trigger the credentialed upload job after this source passes CI and enters the approved release lineage. The approval marker must be `.github/release-approvals/v118-v116-inactive-upload.json` with exact operations SHA and `allowInactiveUpload:true`; all other writes false. No approval marker is created by this PR.

**Not yet public release:** inactive upload does not activate V116. Physical Safari plus authenticated founder, member, reviewer, guest and Studio/IREN acceptance and controller AUTH pin compatibility remain mandatory before any new public Worker deployment. Preserve the previous version for rollback and retain all public/private routes, records and progress. Tracking issue #655.
