# ANEVUM.WEB.DESIGN.2026-10-08.003.MEMBER-PLATFORM-RHEN-COMMAND

**Date:** 2026-10-08  
**Status:** LOCKED PRODUCT DIRECTION / IMPLEMENTATION WORKLOAD  
**Supersedes:** The identity, member-account, and Command placement decisions in `ANEVUM_WEB_PUBLIC_PRODUCT_PLATFORM_DESIGN_2026-10-08.md`.  
**Preserves:** Existing production RHEN authority, private Cloudflare Access security, sanitized public evidence contract, public release/Field Notes provenance, current marks, important URLs, and the verified 2026-10-08 public-platform implementation.

## 1. Product decision

ANEVUM is an independent personal software workshop, public portfolio, and home for real applications. Projects begin because the developer wants a tool or finds a question worth investigating. Useful results are shared. Some software may remain free, some may accept voluntary support, and specific operating costs or premium functionality may eventually justify payment. No project is forced into a commercial funnel.

RHEN is the **first ANEVUM application**, not ANEVUM's whole identity. More applications may join later without rebuilding the site. IREN, GRAEN, NOSTRA, and VELUM are internal RHEN responsibilities until a separate, real product is built and registered.

The site must feel like a well-maintained independent website: restrained, practical, legible, responsive, and human. Remove the impression of an enterprise SaaS storefront, futuristic mission-control showcase, or personal celebrity homepage. Do not replace real interfaces with fabricated illustrations, charts, screenshots, or capabilities.

**Top-level experience:**
1. Public site: browse projects, read Field Notes and updates, inspect truthful public artifacts.
2. Member site: free account and a small private home for saved/followed projects, recent use, preferences, and access to applications.
3. Application workspace: a standalone shell for each actual application.
4. RHEN Command: nested inside RHEN, never presented as a website-wide public navigation item; the *existing* operational Command stays restricted to explicitly authorized operators.

The founder identity is available on About, résumé, contact/legal pages, and authored notes, but need not dominate Home.

## 2. Verified starting point (anevum/anevum-web main, 2026-10-08)

- React 19, TypeScript, Vite, Cloudflare Worker and static assets, GitHub Actions deployment, Railway RHEN runtime.
- Current public routes: `/`, `/products`, `/feed`, `/field-notes`, `/about`, and nested RHEN public evidence, architecture, and release pages.
- Public product registry exists. RHEN is the sole registered public product and currently has `hasApp: false`.
- The public homepage currently centers a RHEN evidence snapshot and various status/promotion blocks. This is to be reduced to an ordinary independent-workshop home.
- Existing `/command/*` is not a customer/member area. It uses Cloudflare Access. The Worker verifies signed Access assertions for `/api/command/*`, and Command renders the authenticated operator trading/research/system surfaces.
- Existing `AuthProvider` only resolves a Command session when path starts with `/command`; there is no general self-service member identity in the current web application.
- No new member/trading capability may be claimed already implemented merely because this specification exists.

Prior public-platform work (PRs 201-204 on 2026-10-08) is groundwork, not a reason to rebuild or overwrite it.

## 3. Non-negotiable product rules

1. Publish only projects, features, releases, screenshots, metrics, events, or user capability that really exists.
2. ANEVUM's own home must not become the RHEN trading dashboard; RHEN has its own product page and workspace.
3. Browsing public content never requires signup. An account is useful, not mandatory.
4. Signup alone confers **no** brokerage connection, live execution, deposit/withdrawal, money movement, research promotion, or private RHEN operator privileges.
5. Authentication and authorization are enforced by the Worker/backend, not by hiding links in React.
6. Keep the existing owner Command and live RHEN behavior unchanged until migrated routes are protected and tested.
7. Maintain `PUBLIC-PERFORMANCE-v1` as the safe RHEN projection: no protected broker/account/positions/orders/symbols/trade or strategy internals leak into public or ordinary member views.
8. Preserve the real ANEVUM/RHEN marks and existing approved glyph language. No generic replacement A symbol, invented product logos, fake product renders, or decorative charts posing as data.
9. Use the present stack and low operating cost. No new always-on Railway service, separate CMS, payment platform, or speculative AI agent solely to deliver the site.
10. No broad launch of multi-user auto-trading without separate architecture, risk, brokerage/legal review, and manual release authorization.

## 4. Navigation and visual character

### Public navigation (desktop)

`ANEVUM` wordmark/mark at left; center/right links: **Projects**, **Updates**, **Field Notes**, **About**; utility action **Sign in** or a compact account avatar/menu.

Use existing implementation URLs when possible:
- Projects label maps to `/products`.
- Updates maps to `/feed`.
- Field Notes stays `/field-notes`.
- About stays `/about`.
- Home stays `/`.

No standalone public Command button. A discreet Support link appears only after a real mechanism exists. Keep footer simple: projects, notes, contact, privacy/terms, GitHub/source when relevant.

### Visual system

- Light, neutral document-like default or a similarly legible restrained theme; retain exact existing brand mark assets and restrained accent. The previously adopted graphite/blue dark palette may remain available as a dark preference, without neon or terminal-themed decoration.
- Readable system/local sans serif; normal typography scale, conventional whitespace; no giant mission statements, excessively padded dashboards, or full-screen animated background.
- Desktop reading width approximately 1100-1200px; content text narrower for comfortable reading.
- Thin border/divider organization, simple rows/lists and modest cards when a card adds clarity. Avoid a three-column grid of oversized modules simply to fill space.
- Charts belong where real data is being discussed, mostly inside RHEN. Every chart shows provenance, timestamp, period, empty/stale/error state.
- Small purposeful motion only; honor reduced motion.
- Header stays consistent. Mobile uses an accessible menu and one-column reading layout rather than shrinking desktop control panels.
- No auto-play video, fake counters, generic stock photography, or funnel copy.

### Voice

Plain first-person or studio-neutral language. Suggested home introduction:

> I build software I wish existed. ANEVUM is where I keep the projects, experiments, and tools that come out of that work. Some are useful now; others are still being figured out.

Shorten further in final UI if needed. Avoid aggressive promises or repeated founder biography.

## 5. Page blueprints

### Home — `/`

Order:
1. Compact identity: ANEVUM and one sentence about making useful software.
2. **Current project:** RHEN as an ordinary featured project row/section, with real mark, concise explanation, truthful availability, and links to its public project page and only truly available actions.
3. **Recent work:** 3-5 actual release/Field Note/update entries with dates and source links.
4. **Projects:** list from the single registry, showing only projects that exist; RHEN alone is acceptable.
5. Small explanation of why the work is public and how to follow it; voluntary support only after checkout is real.

Do not insert RHEN live P/L, a market-control terminal, or a block of sitewide KPI cards above the projects. RHEN's deeper evidence remains one click away.

### Projects — `/products`

An actual project shelf, not a store. Real registered products with short descriptions, mark, current lifecycle, availability, a useful artifact/real screenshot when available, and Open/Read more. Filters for applications, experiments, archived work only once needed. Do not show empty future product tiles or claim app availability while `hasApp` is false.

### RHEN public project — `/products/rhen`

Explain what RHEN is, its current research/trading scope and limitations, status, real public-safe evidence (when available), release notes, research updates, and a prominent `Open RHEN` action **only when a genuine RHEN member workspace exists**. A small `Explore public evidence` action is available independently of signup. Never present profitability as established without robust supporting evidence.

### Updates — `/feed`

Existing unified sourced feed. Chronological updates, per-project labels and filters, canonical links, real dates. Releases, notes, experiments and safe public runtime events are different event types. No fake user activity, social engagement counters, fabricated clocks, or notifications.

### Field Notes — `/field-notes`

Actual engineering/build/research notes with dates, reasoning, results, and limitations. First-person authorship can appear on the entries. No artificially generated filler.

### About — `/about`

Compact personal/studio story, verified experience, contact, and résumé link. No need for repeated founder portraits elsewhere.

### My Space — `/me` (signed in)

Small, useful member home. Sections:
- Greeting/account identity and **Continue** recent apps if activity exists.
- **My applications:** starred/pinned registered apps.
- **Following:** projects with relevant real updates.
- **Recently updated:** items actually published for followed apps.
- **Settings:** display name, email, privacy, notifications, logout and delete account.

Default state for a new member is simple and honest. If they have not saved anything, show the real project directory and an unobtrusive explanation. No gamification, fabricated streaks, social ranking, or public profile by default.

### Authentication

`/sign-in` may offer Create account and Sign in within one sensible flow. Do not require an account for public Project/Notes/Updates. Initial version can use a verified social/OIDC provider such as Google, with email magic-link as an extension only after verified delivery; do not deploy a homegrown password store or a broken email verification screen.

### Each app

Apps have their own navigation and layout and may be public, member-accessible, invited beta, paid, or private according to registry + server-side entitlements. Shared ANEVUM shell provides `Back to ANEVUM` and account menu, not a global trading command bar.

## 6. RHEN as the first application

### Member RHEN workspace — proposed `/apps/rhen/*`

Member-accessible RHEN initially uses **only** the existing sanitized public evidence and honest feature-availability states. No user's live trading dashboard exists until real user-specific broker accounts and isolation are built and proven.

Initial RHEN workspace can include:
- Overview: status, purpose, authenticated member context, releases.
- Evidence: public safe performance + measured research results, with source/freshness.
- Research: published questions/notes and actual experiment status.
- Updates: RHEN-filtered feed and release history.
- Account/access: whether this user has an actual member beta entitlement; no fake connection flow.

Do not present a read-only evidence viewer as if it were an active personal trading account. Member tracking/following functionality is real only when backed by storage.

### RHEN operator Command — target `/apps/rhen/command/*`

Preserve current private operator functionality:
- Operate
- Discover
- Review
- System/diagnostics
- existing public-projection truth audit within RHEN if useful

Only an **explicit authorized operator** can see or use the existing private brokerage view, broker writes, IREN configuration actions, or research promotion gates. Operator access must remain verified with Cloudflare Access and server authorization; a general ANEVUM member cookie is insufficient.

Keep `/api/command/*` as the protected service boundary during migration. The new route path must not bypass protection or accidentally include Command bundles/private data in the member shell. Update `AuthProvider`, route metadata/noindex, Cloudflare Access path policy, Worker private-route checks, and auth tests together.

**Important UX distinction:** future RHEN members may eventually receive a **personal RHEN control console**, tied to their own brokerage account and explicit entitlements. That is a different product/permission domain from the existing owner/operator Command. Never connect all signed-in members to the developer's Alpaca account or hand them owner-level controls. A personal broker-linked console requires a separate, explicitly approved pilot.

Legacy `/command/*` paths must keep working safely throughout staged migration. Redirect only after protected target path, login/session, browser flows, and API isolation tests pass.

## 7. Proposed route map

| Route | Audience | Meaning |
| --- | --- | --- |
| `/` | Public | Workshop homepage |
| `/products` | Public | Projects directory |
| `/products/:slug` | Public | Project description and real availability |
| `/feed` | Public | Updates from canonical sources |
| `/field-notes/*` | Public | Authored notes |
| `/about` | Public | About / résumé |
| `/sign-in` | Visitor | Create or access personal ANEVUM account |
| `/me` | Member | Personal application shelf and follows |
| `/me/settings` | Member | Settings, export/delete account |
| `/apps/:slug/*` | Role/entitlement dependent | Actual application's shell |
| `/apps/rhen/command/*` | Operator | RHEN's existing private Command, after migration |
| `/command/*` | Operator | Protected compatibility paths until migration verified |
| `/api/member/*` | Member | Personal read/write data via validated session |
| `/api/command/*` | Operator | Existing signed Cloudflare Access private operations |

Preserve canonical RHEN public evidence/release URLs and all important old redirects. No arbitrary route rename that loses public links.

## 8. Roles, entitlements and truth

| Identity | Browsing | My Space | RHEN public/member viewer | RHEN operator Command | Broker writes |
| --- | --- | --- | --- | --- | --- |
| Visitor | Yes | No | Public-safe content | No | No |
| Member | Yes | Own only | Public-safe, available member functionality | No | No |
| Invited RHEN tester | Yes | Own only | Scoped/test entitlements when actually implemented | No by default | No by default |
| RHEN operator | Yes | Own | Yes | Explicitly authorized | Only under existing separately armed runtime gates |
| Owner | Yes | Own | Yes | Explicitly authorized | Only under existing separately armed runtime gates |

Supporter/paid status is an **entitlement or billing state**, never a shortcut to operator rights. Product roles and separate RHEN broker grants are enforced on every request; client-side UI only reflects them.

## 9. Technical direction and cost control

Retain React/Vite, Cloudflare Worker/static assets, Cloudflare Access for operator security, current GitHub deployment, and current Railway RHEN compute.

Recommended for new general-member identity: **Cloudflare Worker + D1** for small account/profile/library/entitlement state and a maintained, audited auth library with OIDC and server-managed sessions (e.g., Better Auth **only after a compatibility/security spike**). This avoids running a second always-on Railway service. Cloudflare Access remains the existing operator gate and must not be treated as a complete public signup/profile product.

Alternative reuse of Foundation PostgreSQL is acceptable **only** if its actual deployed ownership/tenant design is verified, isolated from live trading, and cheaper/simpler than D1. Do not speculate about a table being live just because an earlier PR proposed it.

Suggested minimum persistent entities:
- auth_users/auth_sessions/auth_identities managed by chosen library
- member_profiles: stable user ID, display preferences, created/updated
- member_saved_apps: unique user ID + registered product slug
- member_project_follows: unique user ID + project slug
- app_entitlements: user ID + app slug + capability/plan + granted-by + expiry
- user_notification_preferences: opt-in choices, no outbound email until delivery/consent actually works
- security audit events for admin/entitlement changes only, not a telemetry-based social graph

Do not store member broker credentials in the website database; don't store password hashes if using social-only identity; don't store raw RHEN account state in profile records. Keep all DB binding secrets out of public bundles and source.

### Member API sketch

- `GET /api/member/session`
- `GET /api/member/me`
- `PATCH /api/member/me`
- `GET/PUT/DELETE /api/member/saved-apps/:slug`
- `GET/PUT/DELETE /api/member/follows/:slug`
- `GET /api/member/entitlements`
- `POST /api/member/account-delete` after recent re-authentication and explicit confirmation

Mutation APIs must validate session, CSRF/Origin, slug registration, object ownership, rate limits, allowed fields, and return consistent private no-store responses. Database queries derive `user_id` from the verified server session, never a body/query parameter.

### Product registry extension

For each project track `slug`, `name`, `mark`, `lifecycle`, `visibility`, `hasApp`, `appAccess`, `routes`, `actual capabilities`, optional real release/source links. User library references this registry; it never makes up project pages. Admin-only editing can remain version-controlled—no CMS required.

### Security & identity acceptance

- Separate general-member session from Cloudflare Access operator assertion and app-specific entitlements.
- Secure/HttpOnly/SameSite cookies; OAuth state/nonce/PKCE as applicable; proper redirect allowlist; short-lived/rotating sessions supported by chosen library.
- Server authorization for every private response and mutation; direct API probes as visitor/member/tester/operator.
- No ordinary member access to `/api/command/*` or private runtime URLs.
- Disallow private route caching, indexing and public feed projection contamination.
- Rate limit auth/signup/passwordless flows and make account deletion/export real before broadly offering accounts.
- Provide privacy policy and terms approved for actual collected data, plus contact/abuse/report path before public signup.
- Confirm Cloudflare Access guards match new nested paths, previews and WebSocket endpoints. Existing live operator controls stay fail-closed.

## 10. Responsive and performance acceptance

- Small-phone (320px), ordinary phone (390px), tablet (768px), desktop (1280px+) without horizontal overflow or impossible tables.
- Keyboard and screen-reader navigation, visible focus, WCAG 2.2 AA target, labeled form errors, contrast and non-color-only status, reduced motion.
- Real user content remains readable; avoid full-screen page transitions and huge JS dependencies.
- Lazy load RHEN Command and heavy charts only in RHEN, not on public Home/Account.
- Public pages load if RHEN telemetry is offline; stale modules clearly indicate failed source without synthetic replacements.
- Authenticated pages do not leak PII through feed, HTML metadata, cache, error or browser analytics.

## 11. Phased workload (safe implementation order)

### Phase A — baseline & contracts

Audit merged PRs 201-204, production pages, marks, route redirects, CI privacy and existing CF Access policy. Record baseline screenshots, main SHA, RHEN API/trading status. Add tests for proposed role boundaries before moving Command. No production trade path change.

### Phase B — ordinary public experience

Implement the small neutral public shell, nav labels Projects/Updates/Field Notes/About, non-dashboard Home, existing real project registry, sane mobile layout. Preserve current public-data and release sources, links and all valid content. No fake login controls yet.

### Phase C — signup and My Space behind gate

Choose/verify auth integration and storage; migrations; sign-in callback; member sessions; account editing/deletion; saved/followed projects; entitlements. Test multi-account cross-user access, login CSRF/session handling, auth redirects and rate limiting. Pilot with explicitly permitted users first.

### Phase D — app platform and RHEN member shell

Introduce `/apps/:slug/*` routing, product entitlements and useful member features backed by actual data. RHEN opens inside its own shell. Do not show placeholders as operational controls. Public evidence stays sanitized.

### Phase E — RHEN Command relocation

Keep original private Command live while adding nested operator-only RHEN Command. Update Access policy and Worker auth rules with direct deny probes; preserve all current Operate/Discover/Review/System behavior and broker-write authority. Introduce legacy redirects only after parallel testing. Zero disruption to the live RHEN strategy.

### Phase F — QA and publication

Desktop/mobile visual reviews; real route traversal; privacy leak tests; inaccessible/expired/revoked session tests; performance budgets; SEO/robots and redirect coverage; branch preview; staging acceptance; deliberate merge to main; production smoke checks. Only then publicly announce member signup/app availability.

### Separate future initiative — personal RHEN brokerage accounts

Design user-specific RHEN broker connectivity, tenant isolation, economic/legal/compliance constraints, funding policies and simulations independently. Test with a bounded paper pilot before any external person's live trading is enabled. Nothing in the general ANEVUM login gives that permission.

## 12. Definition of done

- Home looks like an independent maker's real website, not a SaaS/futuristic trading landing page.
- Existing ANEVUM/RHEN marks are preserved and visuals use actual assets/evidence.
- Non-members can browse all public projects, updates and notes without auth.
- A user can self-register and later sign in/out safely; their `/me` is private and persistent.
- Users can save/follow actual projects, discover apps, and open any genuinely enabled app.
- RHEN is the first app, with distinct member/public view and operator-only Command.
- Operators have all existing capabilities after migration; nonoperators cannot see or call them.
- No RHEN brokerage/private telemetry is accessible because of signup or paid status.
- No fabricated member activity, app features, RHEN performance or product releases.
- Existing live trading behavior and permission gates are unchanged.
- Mobile, desktop, accessibility, privacy, session, routing, and deployment tests pass.
- Public support/billing only appears after real payment infrastructure exists.

## 13. Scope boundaries

**Locked now:** ANEVUM's workshop identity, honest understated design principle, public project/notes/feed structure, free member area, product-owned app workspaces, RHEN as first app, operator Command nested inside RHEN, privacy/trading separation, no marketing fabrications.

**Implementation choices to validate:** final neutral-light/dark tokens, auth provider/library and D1 versus verified existing identity storage, availability of non-operator RHEN interactive features, legal/privacy copy, final route redirect dates, future paid/broker-linked entitlements.

**Not authorized by this design document:** production signup announcement, migration of real trading accounts, payment processing, new consumer broker write access, public release promotion, automatic research/strategy promotion, disabling or replacing current RHEN operator endpoints.

This is an implementation contract; creation of this file does not mean the member area or new routes have been built or deployed.
