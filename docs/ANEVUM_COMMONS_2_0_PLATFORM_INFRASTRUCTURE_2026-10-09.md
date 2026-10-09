# ANEVUM Commons 2.0 — platform and infrastructure contract

**Session:** ANEVUM.ANEVUM.BUILD.2026-10-09.001.COMMONS-PLATFORM-OVERHAUL  
**State:** Architecture contract and incremental DRAFT branch. Not a production cutover.

## Product boundaries

ANEVUM is the independently built software platform. Commons is its public/community entrance and its identity-level social application, **not** the brokerage execution process. Command is the signed-in member's private home. RHEN is the first independently deployable application. Future ANEVUM apps receive explicit registration and their own data/permission domains rather than inheriting RHEN's auth tokens, schemas, jobs or operator rights.

| Surface | Primary hosting | Data and security scope | Scale lever |
|---|---|---|---|
| Public site, Commons, login, profiles, research, badges | Cloudflare Worker/React | Better Auth, member D1, server-verified role and account identifiers; reports and invitation gates | CDN/static assets, bounded reads/writes, pagination, caching only public immutable content |
| Member Command | Cloudflare Worker | Per-member saved apps, drafts and entitlements, no owner privileges from display name or Stripe | Account-scoped API, project registry |
| RHEN Cloud APIs | Separate isolated Railway service(s), not current owner bot | Signed member-service identity, delegated capability scope, independent vault, durable user-specific order journal | Bounded admission/queue, autosizing only on measured demand |
| RHEN owner trading | Existing RHEN Railway production service | Owner-only Cloudflare Access/operator authorization, existing volume and Alpaca broker, immutable champion release gates | **Do not multiply or reuse as a tenant worker** |
| New app runtimes | Separate Railway services/Functions or Cloudflare Workers when appropriate | App-specific credentials, tables and server-side capability checks; never owner-broker authority | Add workloads independently after utilization evidence |

## Engineering standards

1. **Shared identity, isolated authority.** Google/Better Auth authenticates the user; app-specific permissions independently authorize each action. Never accept user or broker account IDs, roles or strategy permissions from client parameters as proof.
2. **Project registry, not branching on RHEN everywhere.** Each app declares slug, routes, publicly visible capabilities, release/version, account scopes, ownership, support state and feature gates. Platform-level Commons/profile/settings cannot directly import live trade executors.
3. **Independent persistence.** D1 stores membership and community records, not high-frequency broker order state. Dedicated RHEN Cloud PostgreSQL stores durable order intents and reconciliations. Public activity projections can be published by separately approved, sanitized events. No cross-tenant SQL or shared owner RHEN SQLite volume.
4. **Operational streams.** Member events should carry monotonically increasing cursors/sequence, server timestamp, freshness and source. Prefer bounded event delivery for active terminal sessions; persist snapshots for reconnects; poll as fallback. Do not label 30-second snapshots 'realtime'.
5. **Queue and cost control.** Avoid one always-running process per member. Jobs admit under quotas, active-user capacity and cancellation limits. Separately meter CPU, runtime, storage, provider calls and notifications. Risk-reducing reconciliation must not be blocked by plan quotas.
6. **Economy and reputation.** Basic membership, learning and research remain free. Achievements reflect verifiable research, constructive review and skill-building, never raw profit, trade frequency, follower count or supporter payment. Optional financial supporters do not get trading authority or superior evidence rank.
7. **Future app support.** Add a new app by shipping its independent API/data runtime and manifest, registering routes/navigation, testing permissions, and using common profile, activity and entitlement plumbing. Avoid spinning up production services and paying fixed costs before demand.
8. **GitHub single-source and rollout.** Existing `anevum/anevum-web` and `anevum/rhen` remain separate repositories. Each retains independently tested PRs. Website UI, D1 migrations, operator worker, member broker integration and backend member trading have distinct release gates. Production Worker deployments have one guarded workflow (#234); older overlapping deploy writers must not ship.
9. **Environment separation.** Development and staging secrets, data and OAuth callback URLs are different from production. Stage schema against preview D1 and synthetic accounts. No production D1 migration in this package.
10. **Compliance.** No member live order placement without Alpaca third-party/live commercial approval, securities counsel review, secure token vault, independently verified risk limits, operational kill switches, two-account testing and explicit release sign-off.

## Design consistency

Commons 2.0 should use one responsive social-first design system: nature-inflected dark visual foundation, restrained teal/cyan highlights, calm cards and type, social feed, profiles, research notes, verifiable badges, project/app directory and supporter identity that does not impersonate a brokerage entitlement. Current Commons implementation uses a light interface; treat the full dark social visual redesign as active work, **not** as already shipped. It must apply consistently across the home, /commons, /command, profile cards, research, app directory and RHEN member terminal; owner operator views stay distinct and protected.

## Existing branch stack (do not merge as a unit)

- Website #249 Commons public/member beta -> #251 reporting/moderation -> #252 live-first member terminal and broker connection (all draft)
- Website #240 gated billing foundation and #242 RHEN Open spec are separate and may contain conflicting legacy pricing assumptions; FREE-first/optional supporters supersedes mandatory admission pricing without mutating inactive Stripe catalog.
- RHEN #463 member paper-only isolated kernel and #465 member live-only backend foundations (draft, **not running**).
- This notebook branch builds on website #252, is disabled by default even in staging, and adds `0007_commons_private_research.sql` plus owner-scoped drafts. No public publishing.

## Release sequencing

**0. Inventory and protect** existing prod RHEN/account, production Worker routes, D1 and release writers; collect rollback evidence.  
**1. Commons 2.0 design system and page templates** across public home, social feed, account, project and learning shells, then review desktop/mobile accessibility.  
**2. Invite-only community** complete schema ordering, moderation, reporting, rights disclosures, real two-account staging tests and explicit owner approval.  
**3. Member-owned research records, portfolios and verified nonfinancial badges** independently gated, per-user export/delete/revisions, no broker data sharing.  
**4. RHEN member workspace and read-only Alpaca linking** once OAuth provider, security, privacy and two-account requirements are met.  
**5. Member-specific automation service** as an independent production environment only after safe broker execution, legal/provider approvals and a staged live pilot.  
**6. New ANEVUM applications** extend the common project registry, profiles, learning and community, with independent runtime, quotas and billing where needed.

## Acceptance for this branch

- TypeScript and Workers build; Node unit/security checks; sqlite in-memory migrations including account deletion cascades.
- Two-user read/update/delete IDOR rejections, stale expected-version revision rejection and no public research visibility.
- Feature OFF by default on both production and staging; no secrets, broker tokens, live trading or D1 migration applied.
- PR based on #252 **as a draft**; never promote before parent branches and isolated staging release review.
