# ANEVUM Commons-first platform — implementation and guarded launch

Canonical session: `ANEVUM.WEB.BUILD.2026-10-09.001.COMMONS-FIRST-PLATFORM`

## Product decision
ANEVUM is becoming a member-facing research platform rather than a personal portfolio homepage. The public root is a direct Commons/product entry with sign-in. A signed-in user reaching `/` is sent to `/commons`. Commons is the shared research area; Command is each member's private account; RHEN remains the first separate application. The company's existing RHEN operator terminal, orders and brokerage connection stay exclusively protected.

This change does **not** mean Commons is open in production. The attached code is an invite-only beta foundation, not an unrestricted trading or social network. It also does not change Stripe production prices, RHEN runtime, broker-write permission, or research-to-live promotion.

## UX routes

| Route | Behavior |
| --- | --- |
| `/` | Commons-first public introduction and sign-in, real Field Notes/RHEN records, no fictitious social engagement |
| `/sign-in` | Existing Google sign-in returning members to `/commons` |
| `/commons` | Separate responsive member app: research activity, type filters, invited contributor composer, invite/preparing state |
| `/commons/topic/:id` | Admitted member research record with replies and moderators' hide/restore controls |
| `/command`, `/me` | Private member profile, saved programs, settings, entitlement model |
| `/apps/rhen/*` | Private member RHEN workspace; does not inherit company brokerage |
| `/command/rhen/*`, `/api/command/*` | Company operator area remains Cloudflare Access protected and unchanged |

The existing brand marks, typography direction and light interface remain. Commons has its own navigation and application shell instead of inheriting the old personal-site navigation.

## Actual foundation delivered on this branch
- D1 migration `0003_commons_beta.sql`: admitted members, topics, replies, moderator events; foreign keys to Better Auth users; indexes, bounded lengths and visibility.
- Server module: authenticated-user-only endpoint dispatch, invite checks, same-origin writes through existing member boundary, input schemas, creation quotas (3 topics / 20 comments per user per 24 hours), member-only feed, role-gated moderation and account export.
- No publication to anonymous visitors, no direct HTML injection, no uploads or user-code execution, no rewards, no monetary balance, no broker connection, no live-trading authority.
- Empty states are honest and readable: no synthetic posts, membership counts, achievement credits or performance metrics.
- Runtime flag `ANEVUM_COMMONS_ENABLED` is **absent and therefore disabled** in committed production configuration. Schema presence is also required. Adding this migration does not activate participation.

## Invitation operating model (first ~8–12 testers)
Admission is deliberately manual at pilot size. A successfully signed-in Google account does **not** automatically become a Commons contributor. Only the server-populated `commons_members` row allows reads or writes. Grant initial invitations to verified actual Better Auth user IDs in *preview D1 only*, by a restricted D1 administrator; never copy user IDs, cookie values or secrets into code, issues, or logs. A moderator role also requires an explicit authorized DB change. No public invitation endpoint exists yet.

Avoid enabling all signed-in users, auto-enrolling via display name, or issuing administrative roles from client inputs.

## Launch and migration sequence
1. Land and test the redesign through a pull request. Existing owner and member identities remain separated.
2. Run `node --test tests/commons.test.mjs`, existing member tests, TypeScript/build, and desktop/mobile browser QA. Explicitly inspect empty states, sign-in redirect, noindex, and errors.
3. Apply migration 0003 to **preview D1 only**, with the existing `wrangler.preview-migrations.jsonc` and reviewed migration workflow. Confirm tables and foreign keys. Never run an unreviewed production D1 migration.
4. Deploy branch into the dedicated staging worker with preview D1. Set `ANEVUM_COMMONS_ENABLED=true` only on staging after schema acceptance, leaving production disabled.
5. Test two admitted users, one uninvited user, one suspended user, one moderator, and one anonymous visitor; test crossed cookies, forged roles and IDs, limits, origin checks, hidden topics, account export/deletion, and accessibility/mobile widths.
6. Review privacy notice, contribution licensing, moderation policy, records/deletion retention, illegal content/reporting workflow and posting risks. The current Terms and Privacy did not authorize this new class of stored member-generated content.
7. Only after the review, owner authorization and cost/abuse budget, separately authorize the production migration, flags, and invite roll-out. Do not merge a PR that triggers a risky production deployment until the deployment single-writer issue is resolved.

## Boundaries and limits
- Pilot posts are visible only to active admitted members, **not** a public scientific archive and not investor advice. Moderator hidden entries are visible to moderators only.
- Product achievements, reputation and bounties are **future** scope, not generated by this work. There are no rewards or financial transfers.
- Research ideas cannot change running RHEN algorithms, open orders, positions or configurations. Paper/live brokerage connections remain separate work (#235/#237).
- No user-supplied executable code, attachments or large model requests at pilot launch. Research linking can follow after isolation, data/provenance controls, and quota admission are demonstrated.
- Scaling plan: Cloudflare Workers/D1 for initial low-traffic reads and writes; move large immutable artifacts to object storage and bounded research tasks to separate worker queues later. Measure load before considering local GPUs or dedicated hardware.

## External dependencies still open
- Owner verification / isolation cutover: #235, PR #236.
- Member paper-only broker approval: #237.
- Stripe controlled sandbox acceptance and production charge approval: #241, PR #240.
- Production deployment single writer: #234.
- Commons legal/privacy text, admin invitation UI, abuse reporting, actual staging user acceptance, and load/cost measurements need their own release gates.

## Next implementation slices (after first beta)
- Explicit invitation admin UI with immutable owner/membership role binding and audit.
- Reports / abuse escalation and contributor edit/correction revisions.
- Durable experiment schemas with run/version/evidence references, plus independent review and provenance badges.
- Search, follows, saved topics, accessible notifications and revisions.
- Separate resource-metered execution research queues; no direct access to RHEN live execution.
- Contribution-derived **nonfinancial** recognition only when evidence rules and moderation have proven stable.
