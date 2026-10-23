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
- **Read-only Cloudflare script-settings verification:** `anevum-apex-prelaunch-gateway` has a `MEMBER_DB` D1 binding to `e1d29049-c83b-4534-8355-dc1fa36ba6d8`, and `COMMUNITY_DB` to `fa96e36d-6257-4883-bf15-074947e11a13`. No secret values were requested or logged.
- `anevum-creator-studio-staging` has `COMMUNITY_DB` bound to `fa96e36d-6257-4883-bf15-074947e11a13`; its listed script settings do **not** establish a canonical `MEMBER_DB` binding.
- Active zone `anevum.com` has a catch-all route `anevum.com/*` to `anevum-native-frame-policy-v001`, a root route to `anevum-profile-staff-access-v001`, and numerous more-specific routed scripts. In the inspected zone routes, the apex gateway is explicitly associated with `anevum.com/evolution/vectors/*`; it is **not confirmed** as the universal request handler for the public domain. A separate Worker deployment routing/serving map is required.
- **Critical clarification:** `staging` in the database name is not a safe operating assumption; the canonical member DB is attached to an apex Worker script and may be used by real members. Never apply SQL or run destructive experiments based on its label.
- Additional read-only settings: `anevum-native-frame-policy-v001` has an `UPSTREAM` service binding (target not yet resolved); `anevum-profile-staff-access-v001` has an `APEX_AUTH` service binding, `UPSTREAM` service binding, and direct `MEMBER_DB` D1 binding to `e1d29049-c83b-4534-8355-dc1fa36ba6d8`. This further confirms the protected member database participates in public-facing routing, but not yet which Worker handles each URL. Resolve service-binding target names and exact deployment traffic before migration.
- Neither the complete served Worker/route graph nor an independently restored copy of actual live-bound D1 has been validated. No Cloudflare changes were performed.

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

## 2026-10-23 continuation — routing resolved, moving release baseline
- Read-only live Cloudflare zone inspection found 40 Worker routes. The general `anevum.com/*` route targets `anevum-native-frame-policy-v001`; that script binds `UPSTREAM` to `anevum-apex-prelaunch-gateway` production, and its served Worker source executes `env.UPSTREAM.fetch(target)`. The `anevum.com/` and `anevum.com/member*` routes use `anevum-profile-staff-access-v001`; its served Worker source executes `env.UPSTREAM.fetch(request)` for forwarded requests, and its `UPSTREAM` binding targets the native frame Worker. Its `APEX_AUTH` binding targets the apex gateway directly.
- More-specific public Worker routes may bypass that chain. Read-only script-settings inspection found the protected D1 `e1d29049-c83b-4534-8355-dc1fa36ba6d8` directly bound as `DB` to unified creation routes, alpha discovery, alpha uploader/player and staff project review; as `MEMBER_DB` to IREN staff and profile staff; and as `MEMBER_DB` to apex. Thus this member D1 is used across several live route families, regardless of its `staging` database name.
- Studio-specific `studio.next.anevum.com` custom domain is currently bound to `anevum-creator-studio-staging` production environment, whose reported settings contain `COMMUNITY_DB` but no `MEMBER_DB`; do not infer V111 can operate there without isolated setup.
- The apex gateway inspected deployment is `549f57c4-3d29-4b8b-856f-9554cab437e2` (version `93cc7f07-cf39-457e-af69-c9f6f4c02d25` 100%); the native frame Worker inspected deployment is `4642758c-164d-439e-bc31-c2eb7efd793a` (version `3703ace1-745f-41f3-8fac-8eba45c99ce8` 100%). These are observed API states, not rollout authorization.
- **Moving baseline:** `release/v084-continuance-approved-20261019` advanced to `967f3358c65bf2ad38e862550fe4e71f5c965a4b`, **21 commits beyond** PR #658 merge base `356112a94575c988c28efcd9ab083277c3838b80`. PR #658 head at this checkpoint is `3b406162536ded042a56de208db12b7b33a1b105`, four commits ahead and 21 behind. Latest release changes add V118–V121 protected deployment/controller assets; their 13 changed paths have zero overlap with Studio PR's 37 changed paths, but this does **not** prove integrated runtime compatibility.
- A later exact-head CI snapshot for `3b40616` showed several still-running workflows, despite the original `f1c9269` 18/18 pass. Validate every workflow again on the final reconciled head. Do not mark merge-ready based on historical check passes.
- **Next source gate:** reconcile without force-push or overwriting V118–V121 release updates, verify current release head has not moved again, retest 18 integrated workflows and release acceptance. Keep PR draft and all flags OFF. No member data export, schema migration, traffic rollout, or service mutation was performed.
