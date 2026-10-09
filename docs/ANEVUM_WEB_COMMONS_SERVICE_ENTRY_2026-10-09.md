# ANEVUM Commons: Service Entry and Invite-Only Research Foundation

**Session:** `ANEVUM.WEB.BUILD.2026-10-09.001.COMMONS-SERVICE-ENTRY`  
**Status:** Build on isolated branch. Production community posting is OFF; owner approval and staging acceptance pending.  
**Scope:** ANEVUM Web and member D1 only. No live RHEN trading, broker OAuth, Stripe billing, rewards payouts, or production data migrations are authorized by this change.

## Locked product decisions

1. ANEVUM Commons is the service's primary member experience, not a secondary forum or a replacement ANEVUM product. RHEN is the first distinct application.
2. The public `/` route is an account-oriented service entrance, not a founder portfolio. Signed-in sessions go to `/commons`. The Google sign-in callback also lands in Commons.
3. Commons is a real application with its own responsive navigation and member identity. `/command` remains each member's private program/account home. `/apps/rhen` remains the member RHEN application.
4. Owner-only `/command/rhen/*` and `/api/command/*` remain protected. Never reuse company strategies, broker credentials, balances, trade streams, or live execution authority for members.
5. Invite-only access is enforced on the server for all Commons research reads and writes, not just hidden UI. General ANEVUM account creation does not grant Commons participation.
6. RHEN findings are not backfilled with fake experiments, members, badges, replies, performance, or author identities. Only existing published Field Notes are presented outside Commons.
7. No payments, subscription purchase, cash points, transfers to brokerage, user-code execution, AI model spend, referral rewards, or direct strategy promotion are introduced in this foundation.

## Route map

| URL | Experience | Access |
| --- | --- | --- |
| `/` | Consumer-facing ANEVUM Commons service entrance | Public; signed-in visitors redirected to Commons |
| `/sign-in` | Existing Google account entry, updated CTA | Public |
| `/commons` | Structured topic feed and composer | Signed-in ANEVUM identity; invited contributors for private data |
| `/commons/topic/:id` | Member topic, replies, moderator actions | Invited active Commons members only |
| `/command` / `/me` | Private account, programs, settings | Existing Better Auth member |
| `/apps/rhen/*` | Personal RHEN app surfaces | Existing member authority only |
| `/command/rhen/*` | Company RHEN operator terminal | Existing owner Cloudflare Access, later dual-auth cutover separately |

The public header links to Commons, Updates, Research and RHEN; project history and About remain accessible but are no longer the homepage identity. Commons private HTML and APIs are noindex and no-store.

## Data model and authority

`0003_commons_beta.sql` extends the existing member D1 only:

- `commons_members`: immutable authenticated user ID, manually admitted role, active/suspended state and invitation attribution.
- `commons_topics`: id, author ID, question/research-note kind, subject, title, body, private/hidden visibility and creation timestamp.
- `commons_comments`: topic-scoped authored replies with moderation visibility.
- `commons_moderation_events`: attributed hide/restore actions for traceability.

Existing `user` foreign keys cascade on account deletion, including authored topics and dependent replies. Account export includes member's Commons membership, authored topics and authored replies when the schema exists.

All membership, author and moderator identity is derived from verified Better Auth server sessions. No account, role, invite, trading capability or broker ID is accepted from the client. The member API's existing verified HTTPS origin and same-origin mutation checks apply before every Commons route.

Allowed subjects at pilot: markets, algorithms, software, mathematics. Maximum three topics and twenty replies per user per trailing 24 hours, enforced by conditional D1 inserts. Text and request payload sizes are bounded. Content is rendered as escaped text, not executable HTML. Moderator actions cannot grant roles or change trading/billing authority.

For launch at small scale, invite admission is an explicit, administrator-reviewed D1 operation against a known `user.id`. Do not infer the owner from an email address or use a public invite API until invitations, abuse controls and audit procedures are implemented and tested.

## Feature gates

| Deployment | ANEVUM_MEMBERS_ENABLED | ANEVUM_COMMONS_ENABLED |
| --- | --- | --- |
| Production web Worker | existing enabled member auth | `false` |
| Dedicated member staging Worker | existing enabled preview member auth | `true` after the isolated preview migration |
| Unknown origin / unconfigured Worker | fail closed | fail closed |

On production with Commons disabled, a signed-in user can reach the new account-facing Commons screen but sees a truthful "in preparation" state. They cannot read private contributions or publish. On staging after preview migration, an uninvited signed-in account sees a truthful invitation-only screen, while an admitted test account can create and discuss research.

## Required staging release sequence

1. Keep changes on an isolated PR; run `npm run test:members`, the full typecheck/build, existing public/owner tests, and new Commons isolated tests.
2. Review privacy and participation-term updates. The new Commons paragraphs are proposals, **not** independent legal approval. No actual private member content should be admitted before review.
3. Complete or separately isolate the outstanding production-deploy race and owner RHEN cross-account protection findings (#234 / #235). Do not bypass the guarded production deploy path.
4. Apply migration `0003_commons_beta.sql` to **preview D1 only**, using the explicit preview-only workflow. Check exactly 4 new Commons tables, foreign-key integrity and existing core/draft tables.
5. Deploy branch to **anevum-member-staging** only with preview database and `ANEVUM_COMMONS_ENABLED=true`. Do not use production credentials for test users.
6. Verify anonymous rejection, uninvited rejection, suspension, author isolation, cross-member read permissions, invalid payload/ID rejection, moderation, per-account throttles, export/delete cascades and private no-cache/noindex headers. Test on desktop and mobile.
7. Admit two dedicated staging user IDs using a reviewed D1 command; grant one moderator role. Do not copy session cookies or user credentials into issues or CI logs.
8. Confirm signed-in `/` redirects to Commons and signed-out `/` shows the public service entrance. Check RHEN member and owner terminals do not change.
9. Only after documented evidence, owner approval and a separate deployment decision: migrate production D1 and consider opening a **small** invite list (8–12 people). Production flag stays false until these gates pass.

## Deferred work (not represented as built)

- Paper-trading experiment attachment integration with RHEN/VELUM, reproducibility checks, citations, revision history.
- Editorial guides with peer review and moderation/reporting escalation.
- User-facing invitations, notifications, search, saved topics, anti-sybil trust and stronger abuse protection.
- Reputation and achievement ledger with fraud-resistant rules.
- Paid RHEN Cloud entitlements and resource-based quotas after existing Stripe sandbox acceptance (#241).
- Financial bounties, taxes, member rewards and brokerage credit arrangements only after explicit legal and payment-rail review.
- Dedicated hardware, GPU inference, native mobile clients and desktop packages after demand and measured cost warrant them.

## Current engineering dependencies

- #210 production member rollout history
- #234 guarded single-deploy correction
- #235 and PR #236 owner terminal isolation / dual-auth
- #237 personal Alpaca Connect, paper/read-only
- #241 and PR #240 RHEN Cloud Stripe sandbox
- RHEN research runtime and live broker process: **unchanged**

## Acceptance definition

A first-time visitor should immediately recognize ANEVUM as a service with a community and working applications. A signed-in member should land in the Commons application, understand what is actually available, and reach Command/RHEN without crossing account boundaries. Admitted testers should be able to post bounded questions and research notes, reply, and see accurate provenance. Uninvited users must never see private research. Failures must never be papered over with fixtures or fictional activity.
