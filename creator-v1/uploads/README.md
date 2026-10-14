# ANEVUM Creator V1 — Universal Creator Uploads

**Status:** draft implementation, private staging pilot. NOT deployed or ready for public use.
**Owners:** #329 publishing; #332 security; #325 Creator V1 board. Source: draft PR #375 stacked on React review PR #347.

## Product

One creator account owns projects. Each project may ultimately contain many assets, releases and viewer types: playable browser games, galleries, audio, video, documents, 3D and downloads. The project link must be stable across releases and independent of the underlying object-storage URL. Not all uploaded programs are browser-executable. Untrusted games and browser apps must eventually run on a separate registrable content origin, never the authenticated ANEVUM site.

## Implemented in the private pilot

The reusable CreatorAssetUploader appears in the React editor after an authenticated member has created a private draft. It supports drag/drop, a file picker, local-only image/audio previews, private attachment lists, forced downloads and removal. All other existing submission fields and staff moderation remain unchanged.

The isolated member Worker supports:
- GET /api/v1/member/projects/:projectId/assets: only the owner can list files
- POST /api/v1/member/projects/:projectId/assets: server-owned upload reservation
- PUT /api/v1/member/projects/:projectId/assets/:assetId: capped binary upload
- GET /api/v1/member/projects/:projectId/assets/:assetId/file: authenticated forced download
- DELETE /api/v1/member/projects/:projectId/assets/:assetId: remove R2 and its owned database record

All writes require an authenticated session, valid same-origin request and editable project. Storage records use generated private quarantine keys. SHA-256 and file signatures are checked, but NO malware scanner exists yet. Uploaded bytes must not be rendered inline, executed, made public or treated as staff-approved. An expired reservation is cleaned after 24 hours; an upload lease expires after 15 minutes. A bounded scheduled reaper removes stale private data.

**Not provisioned:** migration 0007, private CREATOR_ASSETS R2 binding and CREATOR_UPLOADS_ENABLED flag. Until the reviewed staging configuration exists, the upload UI fails closed. No live upload claim.

## Format roadmap

| Medium | Private prototype | Later publishing feature |
| --- | --- | --- |
| Artwork | PNG, JPEG, WebP, GIF | Safe gallery, zoom, variants, improved scanning |
| Audio | MP3, WAV | Track and album players, transcoding and metadata |
| Documents | PDF, TXT, Markdown | Sanitized document or chapter reader |
| Games and apps | ZIP quarantine only | Archive inspection, isolated HTML5 build hosting and player |
| Video | Not yet supported | Resumable uploads, transcode, captions and bandwidth controls |
| 3D and models | Not yet supported | Validated GLB/glTF viewer with size limits |
| Source code / assets | Text or ZIP quarantine only | Safe source/asset preview and verified downloads |
| Native executable apps | Not supported | Reviewed downloads; browser execution not promised |

Pilot limits: 20 assets per project; 100 MiB total reservation/storage per member; image and PDF up to 10 MiB, MP3/WAV/ZIP up to 20 MiB, TXT/MD up to 1 MiB. Later media services require separate cost and safety approval.

## Project publishing plan

A released project should reference an immutable approved release manifest: exact file hashes, owner, license, disclosures, supported devices, primary viewer and optional external links. The staff review process must explicitly approve assets, not just project descriptions. Support reporting/takedowns, release rollback, permanent profile/project URLs, safe previews and editor revisions. Only then may internal media satisfy the current source/demo-link requirement.

While this is incomplete, creator-hosted demos and GitHub source links remain the honest public Try/Play/View-source path. Uploaded ZIP is NOT a playable game; uploaded PDF is NOT a public reader.

## Required next steps

Pass exact-head CI. Obtain independent security review, R2 quarantine and D1 restore acceptance. Integrate account privacy export/erasure, malware and archive scanning, immutable release manifests, staff asset review and a content viewer registry. Keep production anevum.com untouched until accepted staging member A -> moderator -> guest -> member B testing and owner release approval.
