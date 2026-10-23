# Creator Studio V109–V113 — Release readiness and independent database gate

Session: `ANEVUM.WEB.BUILD.2026-10-23.001.CREATOR-STUDIO-INTEGRATION-READINESS`

## Verified source and integration
- Candidate: PR #658, original integration SHA `f1c9269ed74e110e8b329674f315130f783f3d14`.
- Approved release baseline at integration: `356112a94575c988c28efcd9ab083277c3838b80`.
- All **18/18 exact integration-head GitHub Actions workflows passed** before adding this document.
- Preservation audit: 36 Studio-only source-file changes, zero path overlaps with release-side changes; no release files missing. Cinematic homepage, IREN guided component, web main entrypoint and creator package file unchanged by byte SHA.
- Feature flags: `CANONICAL_STUDIO_FILE_TREE_V111`, `VITE_CREATOR_FILE_TREE_V111`, `VITE_CREATOR_VISUAL_SCENE_V112`, `VITE_CREATOR_INTERFACE_BUILDER_V113` default OFF; OpenAI agent still disconnected.

## D1 identity verified by read-only Cloudflare inventory
- Account ID: `2f7ee83107240152097efd956a4e8335`.
- Database `e1d29049-c83b-4534-8355-dc1fa36ba6d8` is named **`anevum-canonical-member-staging`** by the Cloudflare API. Do not claim its name or prior use proves whether production traffic binds to it.
- Read-only `sqlite_master` query confirmed existing `member_studio_projects`, `member_studio_assets`, `member_studio_submissions` and review support; no V111 `member_studio_file_nodes` / `member_studio_file_versions` tables yet.
- This DB is **not disposable**; prior operational work established it contains member data. Protect it regardless of its `staging` name.
- No production Worker binding inventory or independently restored live D1 snapshot has been verified in this task.

## Mandatory acceptance before writing any non-disposable D1
1. Establish the exact worker/account/database binding for currently served `anevum.com` and staging. Distinguish production Worker, inactive deployment packages, Pages assets and canonical D1 by actual bindings, not database labels.
2. Check canonical member identity and D1 schema inventory immediately before migration. Confirm foreign keys, migration number ordering, source hash, node indexes and trigger compatibility.
3. Obtain a time-stamped, independent, encrypted export/backup of **the identified live bound DB**, outside the source database. Do **not** put raw member data or backup exports in GitHub Actions artifacts, repository, logs or chat.
4. Restore that backup into a distinct, isolated D1/SQLite database with no real service binding and prove schema, `integrity_check`, `foreign_key_check`, representative row counts and targeted profile/project/reward preservation. Retain rollback instructions and verified artifact references in a secured operator record.
5. Apply migration `0014_private_studio_file_tree.sql` only to an approved isolated staging target after explicit authorization. Assert both file tables, indexes and four triggers exist and current member rows remain intact. Re-run negative tests with a real invited creator and a distinct ordinary member; unauthenticated, wrong-owner, review-locked and missing-schema requests must fail closed.
6. Test 320px/390px Safari, 360px device preview, create/edit/reload, conflict, history, Trash and restore. Verify existing onboarding, homepage/IREN, legacy player, review, uploader and publication.
7. Retest the exact release head and all integrated CI. Preserve production deployment identifier, traffic split, secrets and rollback reference. Promote only through a separate release approval.

## Strict hold
- Source integration CI success **does not** authorize schema creation, backup import, Worker publication, traffic changes, new permissions, app runtime, or paid OpenAI API calls.
- No migration or rollout was performed by this preparation.
- A local disposable SQLite backup-and-restore rehearsal did pass CI, but **does not satisfy** the independent real D1 backup requirement.
- Stop and return to source-only work whenever a binding, restore, migration, authorization or Safari acceptance gate is missing.

## Rollback boundary
- Before schema activation: leave flags OFF and release unchanged.
- If isolated staging migration fails: disable preview flags, preserve snapshot/revision evidence, recreate the isolated target from independently restored backup. Do not try ad-hoc destructive cleanup of the shared member DB.
- If later production authorization is separately granted: publish only a verified artifact/version with a documented previous deployment and a guarded traffic-revert procedure. Database rollback must follow separately validated restore controls, not a source-only Git revert.
