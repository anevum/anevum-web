# ANEVUM V5 — moderated Commons discussions (pilot foundation)

**Session:** `ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL`  
**Master queue:** [#259](https://github.com/anevum/anevum-web/issues/259). **Website tracker:** [#265](https://github.com/anevum/anevum-web/issues/265).  
**Base:** existing private RHEN integration draft #271, itself stacked on #270/#269/#266.  
**Status:** DRAFT / DEFAULT-OFF / NOT DEPLOYED / NOT A PUBLIC SOCIAL LAUNCH.

## What this code actually implements

One first-party authenticated discussion interface integrated into the Commons V5 topic page, with no invented members, engagement, transactions, reputation, brokerage claims or public post data.

- Authenticated member GET topic-filtered latest published discussions (bounded to 30); real D1 rows only. This is not the complete historical feed or a pagination launch.
- Member creates a topic/title/body discussion; strict exact JSON, length and control-character validation; atomic max 3 posts/member per rolling 24 hours.
- Members retrieve replies and write up to 12 per rolling 24 hours on an existing published post.
- Post owner may soft-remove their own content (text overwritten with an explicit removal notice). Another member cannot remove the post.
- A different authenticated member may report a published post once, choosing a bounded reason. Reports are durable, pending independent moderation.
- No author ID/email is returned in the feed or replies. UI labels an author only as `Commons member`. It does not yet imply a public profile.
- The existing personal account export includes the caller's own post, reply and report content if social tables are present; foreign keys cascade on account deletion.

The server routes sit below the existing Better Auth identity and same-origin mutation checks. No URL or JSON parameter may select a user, owner, workspace, strategy, brokerage, order or monetary authority.

## Schema isolation and shutdown

The schema is contained **only** in `migrations-social/0006_commons_v5_discussions.sql`, separate from both ordinary member F0 `migrations/` and Alpaca reviewer `migrations-review/`.

Both committed Workers contain `ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED=false`; production `anevum.com` is hard-blocked even if a flag is accidentally enabled. For staging, the exact expected HTTPS Workers.dev origin must match `MEMBER_PREVIEW_ORIGIN` and `ANEVUM_MEMBER_PREVIEW_ENABLED=true`. All four dedicated tables must exist before any social call succeeds.

**No workflow migrates or applies `0006` yet.** Before any pilot activation, `0004` and `0005` must be independently reconciled with the preview migration ledger. A distinct reviewed backup/SHA/rollback-authorized pilot migration and owner acceptance are needed before any database write. The existing two-member staging data must be preserved.

## Release blockers still outstanding

- [ ] Finish private moderator authentication/role assignment, queue, review actions, audit retention, abusive content removal, appeals and incident response. The schema includes moderation events but no moderator write endpoint yet.
- [ ] Independent moderation and content/privacy/attribution Terms review, community rules, user consent and safe account deletion acceptance.
- [ ] Handle pagination, stable feed cursors, notification preferences, full replies lifecycle, rate limits across other social actions, member profiles/consent and search.
- [ ] Genuine two-member signed-in preview tests, including denied cross-ownership, report dedupe, suspended/uninvited member blocking and sign-out/session expiry.
- [ ] Review export completeness, nontrading privacy, staff audit privileges and data retention before participant enrollment.
- [ ] Test mobile 320/390/768/1024/1440, keyboard/screen reader, loading/error and browser states. CI with the flag OFF is not real social posting acceptance.
- [ ] Explicit owner approval for pilot D1 migration, staging flag, invitations, production release and rollback.

## Safety boundaries

Commons is an education/research community, **not** investment advice, copy trading, mirrored trades or an execution coordinator. No member content can grant RHEN trading permissions, auto-promote strategies, cause orders or access another account. No orders, funding, Alpaca OAuth, Stripe, Railway, production D1, or external service activity are initiated by this draft.

No public rollout can occur merely because build/tests are green. All user-generated content is private to the invite-only test stage until moderator readiness and separate release authorization are confirmed.
