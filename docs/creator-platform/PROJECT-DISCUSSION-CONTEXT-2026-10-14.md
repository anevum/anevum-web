# Connected project discussions and creator activity

Session: `ANEVUM.WEB.BUILD.2026-10-14.002.PROJECT-COMMUNITY-CONTEXT`.

Continue draft PR #386 on `build/creator-v1-connected-community-20261014`, based on the active Morph community front page #384. The recovered head `ed4e92ddc6e24f1ec15fcf517715c3907bbdce30` passed Creator V1 Verify run 38587736515. This increment remains source/review work under #325, #329, #331, #332 and #335. It does not promote the parallel dashboard #385 or member-world integration #381.

## Resulting journey

An approved project has a bounded panel of its approved discussions. An invited member can open the existing private composer with that exact project selected; the server independently validates current public visibility and atomically records the pending post and project association. Staff sees the project context and must supply a moderation reason. Publication is refused if the linked project or author is no longer eligible. A public discussion links to the current project passport. A creator channel shows recent approved discussions authored by that creator, including project links where applicable.

Association does not assert project ownership, creator endorsement, resolved feedback or collaborator credit. Genuine contributor recognition needs its own verified acceptance evidence; authorship and reaction volume cannot substitute for it. Quality rankings remain unavailable.

## Read and moderation contracts

- `GET/HEAD /api/v1/community/posts` accepts bounded `project` and `creator` filters alongside `sort=hot|new` and `limit=1..24`. Parameters must be unique; invalid references are rejected. Unknown/private project filters return the same empty public result. Bodies and metadata are always whitelisted.
- Context uses the current catalogue visibility predicate. Withdrawn, future-dated, missing or suspended-creator projects suppress their linked discussions across the global feed, project/creator views, detail and reaction endpoints. An orphaned project reference stays recorded after deletion, preventing a post from silently becoming general public content.
- Public reaction totals and hot ordering exclude self-votes and suspended voters. Reply counts and ordering use the same publication/active-author requirements as the public reply reader; hidden and future replies cannot influence those counts.
- `features.projectDiscussions` is a read-capability flag derived from available schema. It never authorizes signup, posting, XP or public rollout. Missing context schema preserves pre-existing general posts but rejects new project associations. A migration marker with a missing context table fails closed.
- Public/staging gateways admit only the added read routes. Member and staff paths, cookies and caller authorization stay outside the anonymous public handler. Corrected the existing discussion entrypoints from the nonexistent `/community/new` to the registered `/community/write` route.

## Staging schema and rollout

`creator-v1/auth/migrations/0013_community_post_projects.sql` is **unapplied**. It requires `0007_community_post_stream` and intentionally leaves `0010`–`0012` reserved for #381's worlds/follows/forum work. Reconcile one exact candidate and its migration manifest before applying anything. Do not run a directory-wide migration command against production or merge the parallel forums into this stream by name alone.

Require a staging checkpoint, isolated restore and deletion/retention review before applying the additive relation table. Deleting a project leaves a suppressed context reference; deleting its post cascades only that reference. Never drop the relation table or deploy an older context-unaware reader as an assumed safe rollback. A rollback must retain the context-aware reader or hide linked posts with an audited reason first, followed by an independently checked restore. Provider rollback and retention are not accepted by the SQLite tests.

Real invited author → independent authenticated staff → guest → independent member acceptance remains required. Include project withdrawal between submission/approval, member switching, post privacy export/deletion, reports/appeals, moderation operations and nonpublisher public author-profile resolution in that acceptance. No migration, member invitation or production deployment is part of this increment.

## Verification

The new SQLite integration suite checks absent schema, strict public-project eligibility, private submission isolation, atomic association rollback, exact project/author filters, publication races, current metadata, withdrawal/suspension/deletion, visible reaction/reply totals, read-only gateways and missing-schema fail-closed behavior. Existing frontend builds, public/member/staff suites and generated Worker checks run on the candidate.

The existing CI browser capture now additionally exercises project → discussion → creator context at 1440, 390 and 320px, with the existing default empty/gated scenarios retained. Its scenario switch and sample posts exist solely in the watermarked loopback fixture; they are never bundled into the application or written to a provider. Browser fixtures do not count as real-member or owner design acceptance. Exact CI and screenshot results belong to the PR's source SHA.

Local checkpoint: frontend typecheck and both Vite builds passed; the full public test command passed, as did all 111 member/integration tests, readiness checks, generated Worker syntax checks and local public/member/staff bundling. Browser checks require exact-head CI evidence on PR #386. The owner subsequently authorized the public source upload, PR update, merge and deployment. Provider/schema, privacy/retention, independently authenticated member/staff and owner visual acceptance remain open; those gates still govern opening member writes and applying migrations. Any authorized public release must preserve the read-only account boundary and record its exact source and hosted verification.
