# IREN V005 — Community forum activation and real-user acceptance

Session: `ANEVUM.WEB.BUILD.2026-10-18.001.FORUM-ACCEPTANCE`

**Operational owner:** #480 Functional Completion, #373 Backstage staff, #331 Community.

## Verified configuration, 2026-10-18, read-only

- `anevum.com/*` routes to `anevum-apex-prelaunch-gateway`, deployed version `cd84468c-861a-47d5-8e64-8f8c53d51074`, 24 bindings (4 opaque secrets, 2 D1).
- `anevum.com/staff*` and `anevum.com/api/v1/member/forum-review*` route to isolated `anevum-iren-apex-staff-v002`, version `06fd21f9-0411-432a-b91c-cf4585efbe0f`. Staff has `CANONICAL_STAFF_OPS_ENABLED=true`, `CANONICAL_FORUM_ENABLED=true`, and reuses canonical D1 and signed apex session verification.
- The **public apex Worker is not forum-enabled**, so `GET /api/v1/community/threads` returns 404; turning on the staff route did **not** turn on public discussion. No feature flag or Worker was modified in V005.
- Production canonical D1 has 2 verified accounts, one claimed public creator profile, one pending owner-authored thread, no published threads/replies, one active founder grant and one distinct reviewer grant. No account identities or private content are included in this document.

## Synthetic end-to-end integration

The V005 isolated test uses **actual Better Auth OTP/session middleware**, simulated Resend delivery, the canonical apex Worker, the independent IREN staff Worker, and a disposable SQLite-backed D1 adapter. It checks all of the following without touching production:

1. Three separate genuine Better Auth sessions; two separately claimed public creator profiles.
2. Founder-only role enrollment through the staff service and reviewer least privilege.
3. Public forums closed: guests and verified members cannot create/read threads.
4. Simulated guarded public activation; member A creates a pending thread, replay safety, no guest leakage.
5. Reviewer-only queue, owner self-review prohibited, nonstaff review prohibited, cross-origin review prohibited.
6. Different verified reviewer publishes the thread, public guest retrieves real approved record with no account email/token leak.
7. Member B replies, pending reply stays private, reviewer independently approves, published reply becomes visible.
8. Member B reacts and reports; staff dismisses a report, hides a thread, leaves durable moderation log.
9. Disabling the public gate hides threads without disabling private staff queues; revocation, expired session and logout still deny access.
10. No synthetic content or fixture identities reach the public service.

This is **source-level synthetic E2E**, not live human acceptance.

## Production rollout gates

**G0: Source and backend review.** V071 frontend PR #501 is green on V069 recognition lineage but remains draft; IREN V004 is separately deployed and controlled under PR #483. V005 is stacked on that staff lineage and is review-only. Do not overwrite either lineage blindly.

**G1: Owner + distinct reviewer authenticates on real site.** Owner and second reviewer must independently sign in at `https://anevum.com/join`, then `https://anevum.com/staff` from separate browser/device sessions. Check both can view permitted staff tasks; reviewer cannot grant roles or read founder-only member metrics. Do not share OTP codes, passwords or cookies with the assistant. Record success/failure without storing private session artifacts.

**G2: First genuine review, with informed human editorial control.** The already pending owner-authored thread must be reviewed explicitly by the authorized independent reviewer at `https://anevum.com/community/review` *after the frontend and route are accessible*, or through the IREN-authorized interface. Reviewer chooses publish or reject; never auto-approve, never override author privacy. Check D1 review audit and queue state with a read-only query. The actual editorial decision belongs to that reviewer, not an automated background action.

**G3: Prepare, do not blindly flip, public forum flag.** Obtain exact live apex Worker version, hash, route table and backup/time-travel checkpoint. Verify ALL 24 bindings including both D1 IDs and the presence (but never values) of all four secrets. Reconcile the server-side `CANONICAL_FORUM_ENABLED=true` binding into a *new nondeployed Worker version* while preserving 24 existing bindings. Check 401/403, strict same-origin POST, rate limits, role separation, encrypted sessions, private drafts and 404 when disabled. Deploy only via a reversible release with clear rollback; never use the prior `wrangler deploy --keep-vars` path that stripped opaque secrets.

**G4: Public usability.** With real registered Member A and B, new thread pending → independent reviewer decision → guest public read → independent Member B reply → moderator approves reply → Member B report → staff resolution. Confirm reactions, relevant notifications, XP legitimacy, profile visibility and full mobile Safari. Preserve clear forum-off messaging if backend is still disabled.

**G5: Reddit readiness.** At least one genuinely approved public creator project and a working discussion loop; onboarding works independently on phones; accountable moderation and reporting operational. This still does not automatically release creator uploads, native packages, payments, location tracking or unreleased features.

## Stop conditions

- Role grant fails verified-session or immutable-founder audit checks.
- Reviewer equals the thread author, or unverified identity can see reports.
- Any private thread, reply, draft, raw author email or token appears in public responses.
- Worker build fails to preserve a required secret, D1 binding, asset namespace or rollback version.
- Public forum endpoint starts allowing creation before G1/G2 human acceptance.
- Staff reviewer account cannot complete actual login or moderation.
- Additional infrastructure spending or bulk user outreach would be required.

Rollback: restore pinned apex version and the prior forum OFF binding; do NOT delete canonical member records, reviewer evidence, or current staff operations. Reconcile member-visible state after rollback before retry.

## Follow-up defects found by executable acceptance

**Reviewer queue contract mismatch:** The older V041 private review API exposed flat records without a server-computed self-review flag or target publication status. The one-screen IREN docket consequently assumed every pending thread was approvable and left the report **HIDE CONTENT** button disabled. V005 now returns a backward-compatible private queue with `canPublish`, `selfAuthored`, parent-thread status, report `canHide`, bounded counts and a recent decision log. The existing independent-review POST authorization is still the final authority. The public review desk can continue to consume the V041 fields unchanged.

**Internal session rate-limit collision:** Real Better Auth `/get-session` calls from the IREN Worker previously omitted Cloudflare's client IP before passing to its private `APEX_AUTH` service binding. The 20/minute Better Auth rate limit then collapsed rapid calls for multiple staff into a single fallback IP bucket. The synthetic journey reproduced a valid reviewer receiving 401 after repeated operations. V005 now relays only a bounded IPv4/IPv6 `CF-Connecting-IP` value from an incoming request with **actual Cloudflare edge metadata**, never arbitrary `x-forwarded-for`, `x-user-id` or bearer identity claims. Production Cloudflare supplies this header on direct client requests; a forged ordinary request or missing metadata cannot inject a trusted IP. Tests cover both paths. The rate-limit policy itself remains unchanged. See [Cloudflare's current header contract](https://developers.cloudflare.com/fundamentals/reference/http-headers/) and [Better Auth rate limiting](https://better-auth.com/docs/concepts/rate-limit).

**Correction to first CI attempt:** An early synthetic reaction POST failed with HTTP 403 because the test helper omitted `Origin` on a bodyless mutation; the server was enforcing CSRF correctly. The fixture now supplies a browser-like same-origin header for all mutating methods and explicitly checks an origin-less forged reaction is still rejected. No CSRF relaxation.

These changes remain **isolated draft source**. The rebuilt IREN Worker must pass focused CI and exact-head independent staff/public tests before any human release.
