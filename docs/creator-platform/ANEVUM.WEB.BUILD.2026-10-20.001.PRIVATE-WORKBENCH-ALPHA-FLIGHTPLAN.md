# ANEVUM Creator Workbench — invite-only alpha activation

Session: ANEVUM.WEB.BUILD.2026-10-20.001.CREATOR-WORKBENCH-PRIVATE-ALPHA
Implementation PR: https://github.com/anevum/anevum-web/pull/576
Product design: https://github.com/anevum/anevum-web/pull/570
V095 canonical source: merged PR #571 on release/v084-continuance-approved-20261019.
Status: SOURCE ONLY. No staging migration, production flag, route modification, public access or deployment is authorized by this document.

## Current deliverable

This alpha uses existing Better Auth member accounts and canonical owner-bound Studio projects. A verified member can start a data-only two-scene story, edit/preview branching choices, locally undo/redo, save private revisions on the existing Studio API and export a recovery JSON. It cannot execute arbitrary HTML/JS, call AI models, publish, mint XP or alter staff roles.

A currently verified founder OWNER grant can find an existing verified member by exact handle and issue/revoke a time-bounded invitation, with an audit entry and at most ten active invited testers. Guests, non-invited and expired testers are denied server-side. The UI hides an unauthorized editor; no link secrecy is relied on for authorization. Revocation preserves saved projects.

## Feature and identity gates

Frontend compile flag: VITE_CREATOR_WORKBENCH_ALPHA=true (only for an accepted opt-in candidate).
Backend feature flag: CANONICAL_WORKBENCH_ALPHA_ENABLED=true.
Backend schema authorization: CANONICAL_WORKBENCH_SCHEMA_APPROVED=true.
Existing Studio flag: CANONICAL_CREATOR_STUDIO_ENABLED=true.

All these flags are absent/OFF by default on production; *frontend visibility is not authorization*. The server verifies the canonical Better Auth session, user emailVerified state, member ID, currently unrevoked owner grant, user-specific project ownership and invitation expiry on each request.

Invite TTL choices are 7 or 30 calendar days, using UNIX seconds. Maximum ten active tester invitations. Approval and revocation have optimistic revision preconditions and atomic SQLite audit triggers. No invites or staff grants are automatically seeded. Emails are not sent by the owner roster.

Database proposal: creator-v1/canonical-auth/migrations/0013_workbench_alpha_access.sql. This additive migration creates only access and audit records on an explicitly approved *staging* database. Do not apply to production/member D1 without a backup/restore and independent database authorization.

## Source and CI preflight

1. Verify exact branch commit SHA and ancestry against the merged V095 source, and compare latest route inventory and Worker settings. The currently inspected Cloudflare inventory has 39 routes including a.anevum.com retirement and next.anevum.com /creator staging. A host cannot be assumed to carry compatible Better Auth credentials solely because React loads; check origin issuer and currently routed worker.
2. Require exact-head Creator Workbench workflow: Node22, isolated SQLite and canonical worker-session tests, project owner isolation, no-admin privileges, optional AI off, UI flag-off, React TS check and two compiled Vite builds.
3. Require real Chromium synthetic-fixture screenshots at 320, 390, 768, and 1440 CSS pixels, guest/uninvited/revoked refusal, private save/reload, safe inert user strings, no unauthenticated API calls, and exact source-bound acceptance receipts. These screenshots do not certify physical iPhone.
4. Run the existing full Creator V1, V095 Native Creator, auth/D1, staff, package, IREN, identity and production source-guard suites. Some release guards correctly block changed source until a new immutable artifact is accepted; NEVER bypass or falsify release pins.
5. Independently review Member A vs Member B leakage, CSRF, cookie filtering, malformed blocks, stale save/409, D1 permission and audit failure, capacity race, expiry, rate limits and revocation while a tab remains open.

## Controlled alpha environment, once separately approved

A restricted canonical React path /studio/alpha may be exposed only after a reviewed hostname and route mapping is selected. Prefer the existing application/identity origin without new routing where route ownership allows it. Do not change apex or next/a staging routing solely for a friendlier URL. If the signed-in user is not invited, API returns denial and the UI does not load private data.

Back up *isolated staging D1*; test restore; inspect whether table user and canonical identities agree; apply migration 0013 only after operator approval. Confirm both audit triggers work. Enable backend and frontend flags only for that exact reviewed staging artifact. Leave every other Worker and database unchanged.

Run founder verified account sign-in: lookup exact consenting tester handle -> confirm account -> grant 7 days with reason -> tester opens Workbench -> creates/edits two-scene story -> playtests -> saves -> reloads on desktop and real iPhone Safari -> makes new revision. Second invited member cannot read/overwrite it. Uninvited/guest/reviewer without owner grant cannot issue access. Then revoke tester: next request is blocked, private draft preserved, audit recorded. Exercise expiry, two concurrent revisions, stalled network, mobile keyboard, reduced motion and account switching.

Do not represent viewport emulation as device certification. Record physical iPhone and an Android/Desktop pass as independent evidence. Real human acceptance must name source SHA, Worker version, route inventory, D1 migration/backup, tester account consent and rollback decision.

## Rollback

Turn off CANONICAL_WORKBENCH_ALPHA_ENABLED in the isolated candidate to deny pilot traffic; disable VITE_CREATOR_WORKBENCH_ALPHA in the prior accepted compiled UI if needed. Preserve user drafts, canonical Studio projects, audit entries, member accounts, published works and storage. Do not delete a shared D1 or alter owner grants; do not roll back unrelated V095/XP/IREN systems. The previous site and package uploader continue untouched.

## Alpha exit and continuation

A1 succeeds only when invited member A can actually create/save/reopen private work in a hosted *staging* candidate, while member B remains isolated, founder can revoke, mobile/desktop behavior passes, and every required gate is reviewed. It does NOT imply general source-code IDE, multiplayer, 3D engine, package publishing or model billing.

A2: optional, consent-based provider-neutral AI file proposals and human-approved patches with BYOK key vault/cost cap.
A3: exact saved build -> V005 advisory compatibility -> V004/V003 authoritative isolated package and staff review -> immutable public release only after explicit approval.
A4: typed scene operations, visual engine, timeline and external revocable agent tools when independently verified.

All activation gates remain pending; PR #576 must stay draft until accepted.
