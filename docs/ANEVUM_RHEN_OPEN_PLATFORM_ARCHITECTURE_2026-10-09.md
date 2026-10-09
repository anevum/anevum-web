# ANEVUM.RHEN.PACKAGE.2026-10-09.002.OPEN-PLATFORM-OVERHAUL
## Technical architecture, data and security contracts

**State:** DESIGN ONLY. **Implementation target:** ANEVUM Web (React 19 / TypeScript / Cloudflare Worker / D1) and RHEN (Python / Railway) in independent flagged workstreams. **Reference:** ANEVUM_RHEN_OPEN_PLATFORM_PRODUCT_SPEC_2026-10-09.md.

### A. Verified October 9 baseline and drift warning

- ANEVUM Web main has separate production and preview MEMBER_DB D1, Better Auth member tables and a member_entitlements table; documented routes include /command, /me, /apps/rhen.
- The main wrangler.jsonc currently says ANEVUM_MEMBERS_ENABLED=true; issue #210 contains older statements that public registration is disabled. **Confirm actual live availability separately before any migration or copy edit**; never infer production activation from historical issue text alone.
- Existing billing PR #240 has migration migrations/0003_member_billing.sql and D1 tables member_billing_customers, member_billing_subscriptions, member_billing_events, member_billing_checkout_locks, member_billing_sync_state, member_rhen_beta_waitlist. The current subscription plan constraint recognizes founding/standard/unknown. Do not overload it with supporter/compute without an additive versioned migration and new tests.
- Stripe staging completed sandbox-only signed webhook delivery and 4.99 test Checkout availability according to issue #241; two authenticated member E2E and owner approval remain outstanding; production payment flag is OFF.
- RHEN issue #462/PR #463 establishes *only* an unmerged draft isolated paper kernel; existing Railway RHEN is single owner trading runtime. No member broker-write authority exists.
- Railway read-only snapshot (2026-10-09): RHEN production is one replica of service rhen with a mounted rhen-data volume (allocated 5000 MB); 24-hour metrics queried showed approximately 0.052 average CPU, 1.36 GB average memory, 2.44 GB observed memory maximum, and 1.217 GB observed disk usage. These are baseline readings, **not** capacity or incremental cost per member. One month of metered user activity has not been measured.
- Preserve publicly sanctioned sanitized company RHEN projection, owner Access gate and existing order path. No base-config mutation in this package.

### B. Bounded contexts

1. **Public content**: static, versioned lessons, references, glossary and moderated/reviewed research catalog. Served through ANEVUM Web without account, brokerage, Stripe, or RHEN private runtime dependence. Must remain available when user features are off.
2. **Member profile**: Better Auth user identity, private lesson progress, paper workspace metadata, private research drafts, consent and preference. Every query is derived from authenticated server-side member ID.
3. **Supporter billing**: new commerce-specific supporter product, independent Stripe price catalog and entitlement projection; no compute or broker permissions in the supporter grant.
4. **Compute admission**: job quotas and service-capacity leases; server-owned resource grants and durable event accounting. Admission to research/paper compute does not authorize member live brokerage.
5. **Research evidence**: private experiments plus moderated public-safe representations; submission is a deliberate rights/consent transition.
6. **RHEN shared compute**: read-only approved signal feed plus bounded stateless member paper processing, carrying server-signed tenant context. Paper executor must not reuse owner volume or credentials.
7. **Operator**: original company live terminal protected by BOTH immutable owner-member binding and independent Cloudflare Access checks after separate rollout approval.

### C. Capability policy, not a plan hierarchy

For server authorization define independent capability predicates:
- public_content.read = all users
- learning.progress.write = authenticated member, own ID only
- paper.workspace.create = authenticated member + paper pilot gate + capacity; server resolved tenant
- paper.execute = verified paper consent + admission lease + allowed approved strategy + independent paper authority
- research.draft.write = authenticated member, own ID
- research.submit = authenticated member + explicit content license/consent + rate/moderation gate
- research.moderate = role-authorized moderator, separate from payment and owner broker privilege
- supporter.cosmetics = canonical active supporter grant (or optional free preview), never controls broker.
- compute.additional = canonical measured, bounded purchased service allowance after launch; independent from supporter grant
- broker.read / broker.paper.write / broker.live.write = separately consented, approved, environment-specific broker permission, never inferred from payments.
- operator.read/write = explicit owner identity + verified Cloudflare Access, no member-submitted user/account selector.

Never write an API branch equivalent to "isPaid -> canTrade." All rights are server-derived. Use fail-closed defaults and an explicit policy decision reason in audit logs.

### D. Proposed additive D1 data design

Use the existing Better Auth user.id foreign key and existing member database migration tooling. Every table below is a DESIGN proposal; do NOT run migrations from this document.

1. member_learning_progress(user_id, lesson_slug, lesson_version, stage, last_section, attempts, completed_at, updated_at): composite primary key, no PII in quiz answer history, server-scoped.
2. member_rhen_paper_workspaces(id, user_id, mode, state, approved_strategy_version, paper_starting_equity, risk_policy_json, owner_broker_connection_id NULL, created_at, updated_at): independent tenant ID, FK to user, hard environment CHECK; no broker key/token. Only internal simulation initially; external broker linking uses separate reviewed schema.
3. member_rhen_research_records(id, user_id, kind, title, private_payload_ref, submission_state, visibility, rights_version, consent_at, fingerprint, created_at, updated_at): private by default; separate reviewed redacted public projection, no raw private positions/order IDs.
4. member_rhen_research_revisions(record_id, revision_no, content_hash, sanitized_payload_ref, reviewer_id NULL, decision, created_at): append-only provenance and audit; moderation events in restricted records.
5. member_supporter_preferences(user_id, public_visibility, badge_style, theme_choice, updated_at): cosmetics/preferences only. Purchase history and grant truth come from Stripe reconciliation, never from a client-controlled boolean.
6. member_supporter_grants(user_id, provider_id, provider_object_id, grant_status, paid_through_ms NULL, last_verified_ms, created_at, updated_at): provider-backed materialized projection, unique external charge/subscription id, idempotent and monotonic updates. Do not expose customer IDs publicly.
7. member_resource_policies(policy_version, resource_code, window_seconds, free_limit, maximum_concurrency, created_at): admin reviewed config; not end-user mutable.
8. member_resource_usage_events(event_id, user_id, workspace_id NULL, resource_code, units, window_key, job_id NULL, source, created_at): append-only idempotent debit and compensation records; no transferable monetary balance.
9. member_resource_jobs(job_id, user_id, workspace_id, resource_code, state, idempotency_key, request_fingerprint, lease_owner NULL, lease_expires_at NULL, attempt, quota_reserved, billed_units, created_at, updated_at): user-scoped, unique (user_id, idempotency_key), attempt bounded, poison quarantine, cancellation/recovery. The worker queue is NOT a job ledger by itself.
10. member_research_consents(id, user_id, scope, policy_version, granted_at, revoked_at NULL): granular rights. Participation, public publishing and company use of data each require separate grants.

Do not introduce ten empty tables in a single premature migration: group by release slices. Static lesson definitions should stay in version-controlled content; D1 stores only personal progress. If large experiments require object storage, use a separate scoped store rather than overloading D1.

Before choosing any concrete migration number, inspect merged main and all staging branch migrations. Existing 0003 may not be on main; NEVER create a conflicting 0003. Prefer versioned additive migrations after whichever sequence is actually merged.

### E. API contracts (version and review before implementation)

Responses should use { data, provenance, observed_at, capability_state, limitations } where relevant, with no fake live indicators or globally scoped account selectors. Errors include stable machine code, human sentence, retryable boolean, retry-after where appropriate.

Public read-only:
- GET /api/rhen/learn: curated lesson catalog, version, last reviewed.
- GET /api/rhen/learn/:slug: lesson with citations and relevant risk notes.
- GET /api/rhen/research: *only independently sanitized moderated* public records, safe pagination.
- GET /api/rhen/research/:id: public revision/limitations, no broker/member secrets.

Member:
- GET /api/member/rhen/learn/progress; PUT /api/member/rhen/learn/progress/:slug (validated lesson version and allowed states).
- GET /api/member/rhen/research; POST /api/member/rhen/research (private draft only); PATCH /api/member/rhen/research/:id (owner-only); POST /api/member/rhen/research/:id/submit (explicit rights/consent + policy version).
- GET /api/member/rhen/usage (allowances, usage, reset_at, active jobs and exact source); POST /api/member/rhen/jobs (paper/research only; idempotency required); GET /api/member/rhen/jobs/:id (tenant-private); POST /api/member/rhen/jobs/:id/cancel (safe semantics).
- GET /api/member/support (non-sensitive, member-scoped canonical state); PATCH /api/member/support/preferences (cosmetic flags only). POST /api/member/support/checkout and /portal are FUTURE gated endpoints, not implemented by this package.
- Preserve existing /api/member/billing and Stripe webhook routes; use separately tagged support product and provider event contracts only after explicit catalog creation, schema review, and 2-account staging acceptance.

Use existing auth/cookie/CSRF, same-origin and deletion patterns; accept no user_id, stripe_customer_id, price_id or "owner" flag in client body. Public research POSTs are forbidden. Write caps apply to all draft and submit endpoints. Moderation requires independent authorization.

### F. Paper job lifecycle and server-side safety

Draft -> PendingAdmission -> Admitted -> Queued -> Leased -> Running -> Completed/Failed/Cancelled. Separate PAUSED and DRAINING for bot strategies. A pause stops new entries; a stop requests no new entries and a carefully defined safe lifecycle/flatten in paper mode. Never silently abandon residual positions. A worker crash releases a lease and resumes idempotently without duplicate orders.

Server-admission transaction:
1. resolve authenticated member ID and allowed paper workspace;
2. check consent, feature gate, strategy allowlist and paper mode;
3. atomically reserve resource units against member window AND global pool;
4. create job and outbox record with a stable idempotency key;
5. enqueue separately; workers verify signed tenant identity and lease;
6. post actual consumption as idempotent usage event, releasing unused reserve;
7. emit member-scoped completion/exception event.

A failed enqueue or execution cannot leave a permanent quota reservation. Pending work must have recovery sweeps, bounded retries and quarantine. A background quota reset cannot make duplicate job commits possible. D1 consistency and transactional admission must be tested; don't assume a storage callback or queue delivers exactly once. Market-data license conditions may forbid multi-user fanout.

**Shared signals are not shared accounts.** Only approved versioned strategy signals may be shared. Each paper account has separate cash, positions, allowed symbols, limits, audit and operation status.

### G. Free and paid compute economics

Initial pilot numbers are *examples*, not promises: one private paper workspace, at most one simultaneously admitted hosted bot, a handful of short-window replay jobs per seven days, bounded data ranges, global concurrency cap, and wait-list admission when demand exceeds capacity. Choose actual limits after load and 2-user adversarial testing.

Record per admitted job and member:
- consumed CPU-seconds, peak memory, runtime, storage bytes/retention, network bytes and data-provider/API call count;
- cost attributed to shared feed versus marginal per-user execution;
- completed, blocked, timed out, retried and safely cancelled jobs;
- source-feed delays, failures, support work and refunds where applicable.

Pricing equation: NET per purchase = gross - card processing - recurring billing fees - refunds/fraud allowance - attributable compute/data/storage/network/support/tax obligations. A $1 payment processed at an illustrative 2.9% + $0.30 card rate plus 0.7% billing fee yields approximately $0.664 before any other expenses. $12 annual on the same example yields approximately $11.268/year before costs, or ~$0.939/month equivalent. These are **illustrative US fee assumptions**, not the verified fee schedule or profit of ANEVUM's account.

No promise that a $5 Railway plan caps expenses. No unlimited hosted bots at $1 unless measured marginal costs support it. Treat optional support and usage access as independent ledgers. Support never purchases trading performance or research standing.

### H. Threat model and mandatory negative tests

- **Owner bleed:** member B has a cached valid Cloudflare Access owner cookie but another Better Auth identity. Must not receive a founder-terminal link, stream, company broker private metrics or operator actions.
- **IDOR:** swap URL user, workspace, research, Stripe and job IDs. Server derives tenant; reject cross-member reads, mutations, cancellation, export.
- **Bad webhook:** forged, wrong-mode, wrong-price, duplicate, late, reordered, refunded and deleted Stripe events. Verify signature, customer mapping, latest canonical status; no support grant from redirect success alone.
- **Quota race:** two parallel job submissions at boundary; both cannot spend the same available unit. Retry returns one idempotent job.
- **Worker crash/replay:** no duplicate simulated orders; release stale lease, finalize safe state and account reconcile.
- **Moderation bypass:** private draft cannot appear in public catalog via crafted publish query, URL or stale cache; public research cannot include raw broker references.
- **Data consent:** revoke public submission permission and company research sharing; future access/data handling follows published retention/rights rules. Never infer consent from completing onboarding.
- **Market data:** do not redistribute broker data beyond licensed rights; sandbox or mocked data for public examples unless rights confirmed.
- **Account deletion:** cancel paid renewals first where applicable, revoke tokens, prevent new work, drain safe positions, mark pending jobs, remove eligible personal data without orphan recurring charges.
- **Stale status:** real-time label always tied to source timestamp and confidence; never fake smooth lines or infer missing fills.

### I. Feature gates, deployment and rollback

Planned gates default OFF: RHEN_LEARN_PROGRESS_ENABLED, RHEN_MEMBER_PAPER_ADMISSION_ENABLED, RHEN_RESEARCH_SUBMISSIONS_ENABLED, RHEN_RESEARCH_PUBLICATION_ENABLED, RHEN_SUPPORTER_CHECKOUT_ENABLED, RHEN_COMPUTE_PURCHASES_ENABLED. Public static educational pages need not be tied to a paid/member gate.

Release in this order: content-only public pages; private learning progress; user-private research drafts; free metered paper admission and observability; closed moderated research submissions; optional supporter sandbox; optional commercial supporter release after approval; optional compute purchases; independently gated broker-authorized live pilot.

Never touch current owner Railway broker-write path in the same deployment that introduces member jobs. Keep independent staging resources, queue isolation and rollback capability. Flag OFF does not automatically cancel recurring Stripe subscriptions; preserve portal, webhook reconciliation and explicit cancellation/refund procedures. Rollback of paper admission must stop NEW entries while preserving protective drains and reconciliations.

### J. Dependencies and acceptance

Website: issue #210 member/OAuth proof, #235 owner/member identity, #237 paper OAuth, #241 sandbox billing, PR #240. RHEN: issue #462 and draft PR #463. Owner live performance/research unaffected.

Acceptance at every stage: green static/type tests, privacy and noindex checks, accessible mobile/desktop, two real member identity adversarial tests, isolated D1 migration verification, exact feature flags, stable API contract tests, resource/queue failure recovery, cost reporting, explicit owner authorization for payment/broker changes.

No research community public submissions, money movement, trading authority, Stripe product activation or publication is authorized by this design document.
