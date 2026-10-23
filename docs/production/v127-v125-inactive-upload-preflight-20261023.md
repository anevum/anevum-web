# V127 — V125 immutable upload-command rehearsal (offline only)

Session: `ANEVUM.WEB.PACKAGE.2026-10-23.002.V125-INACTIVE-UPLOAD-DRYRUN`

## Immutable inputs and provenance

- Owner-reviewed design: V125 draft PR #669 at `6aff161a60d2e86310acf25df4265a8bab326f7d`; compiled and responsive browser verified, not merged or released.
- Separate exact-source offline Worker: draft PR #670 at `1bc20950c71b5b2e0a2f6a3b9fe13f2cb849fd69`, 5/5 GitHub workflow runs green.
- Source-bound V126 workflow run `39997196812`, artifact ID `12521290324`, ZIP SHA-256 `2ca669eca2bd337f282e7007baeac0ed955e14c91e0b635f4fa184f147e6607f`.
- Worker `anevum-apex-prelaunch-gateway`, offline compiled `gateway.js` SHA-256 `1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99`, 395 frontend files including 152 earned-media assets, all byte hashes checked.

## This change

V127 validates the actual retained V126 Worker ZIP and its manifest, synthetic Chromium acceptance record, exact root asset paths and every byte in the compiled UI and Worker bundle. It refuses unexpected archive files, missing assets, source maps, symlinks, altered checksums, simulated provider approval, changed versions, and expired or divergent readback when supplied. It reconstructs a local-only no-bundle Wrangler config from reviewed V117 frozen Worker settings (26 binding identities, two D1 IDs, 40 route owners, five secret **names** only), then executes `wrangler versions upload --dry-run --no-bundle --no-upload-source-maps` with Cloudflare credentials explicitly empty. The generated config is deleted before uploading only a non-actionable, no-token receipt.

The source guard admits exactly four additive V127 documentation/workflow/preflight/test paths since the V126 head and rejects any UI, authentication, Worker, canonical routing or other changes. No new feature flag is enabled.

## True status and blockers

The dry run checks local packaging/CLI compatibility **only**. It never demonstrates a Cloudflare version upload, endpoint behavior, binding persistence at the provider, changed controller AUTH pin, protected Access release, live signup, or physical Safari. All of those are independent release gates. The output must say `safeToRunActualUpload:false`, `providerSnapshotFresh:false`, `immutableV125VersionId:null`, `publicDeploymentAuthorized:false`, and `requiresSeparateOwnerApproval:true`.

Production baseline as last verified October 23, 2026: public apex version `93cc7f07-cf39-457e-af69-c9f6f4c02d25` at 100%, old private `86dc4b9d-4020-432a-8a15-e65606f31316` at 0%, 26 binding identities. Public package controller `9851d9c5-6270-4c4e-a70e-1b82451b170d` at 100%, old private `b957257c-d265-4656-bd97-db6b5da81b71` at 0%, 13 bindings; its private AUTH pin still points to the **old** apex version. Existing publishing remains disabled. A dry run cannot rebase that pin or select the new V125 release, and V116 uploaded earlier is not V125.

## Future gated release sequence

1. Receive explicit owner approval for a separately reviewed **inactive immutable V125 upload only**. Require fresh GET-only Cloudflare readback (<=10 minutes), full version/resource/binding/secret identity and 40-route diff, immutable artifact provenance, a one-use authorization marker and an upload-only workflow that cannot deploy or modify traffic. Take an after-upload version receipt, fail closed on any drift and preserve old 100% and 0% versions.
2. Rebuild the private controller from reviewed source with 13 authentic bindings and a **new immutable V125 version ID** in `PACKAGE_CANONICAL_AUTH_VERSION`, retain public publishing false, confirm all secret/D1/R2/service identities, and upload as another inactive version only after independent owner-gated review.
3. Stage paired apex/controller versions at 0% behind verified short-lived Access entry and selectors; protect CSRF, roles, privacy and D1 boundaries. Test physical iPhone Safari and genuine founder/reviewer/ordinary member/guest flows on the exact version, including signup, IREN, legacy playback and creator surfaces.
4. Obtain owner's visual and release go/no-go, then use a separate controlled promotion procedure with the old public version retained as rollback; read back exact asset and route behavior afterward.

Creator Studio draft #658 and Discover/Community draft #667 stay separate. Migration 0014 remains unapplied. No Access, routes, D1, permissions, XP, publishing, Worker upload or public traffic are changed by V127.
