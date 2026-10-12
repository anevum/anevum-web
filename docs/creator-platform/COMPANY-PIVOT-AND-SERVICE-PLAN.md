# ANEVUM company pivot — creator platform and legacy preservation

Session: ANEVUM.ANEVUM.PLAN.2026-10-11.001.CREATOR-PLATFORM-COMPANY-PIVOT
Date: 2026-10-11
Decision: ANEVUM company direction replaces the previous V5/RHEN-centered business; previous products are preserved for research/history, not a required component of the new public portal.

## Locked positioning
ANEVUM is a Newgrounds-inspired AI-software creator venue, with Envato-style discovery and item detail, free meaningful participation, levels, voting, creator awards, public contribution and collaboration, and eventually optional creator commerce. Owner approved cinematic gold/orange-violet visual reference in APPROVED-CINEMATIC-IDENTITY.md.

## Repository/archive snapshot performed
- Branch `archive/pre-creator-platform-20261011` created on `anevum/anevum-web`, from then-current `main`.
- Branch `archive/pre-creator-platform-20261011` created on `anevum/rhen`, from then-current `main`.
- Existing repos remain public, not GitHub-archived or deleted. Branches alone do not preserve external production databases, artifacts, workflow secrets or Railway volumes.
- New `anevum/creator-platform` repo remains absent; GitHub connector doesn't expose create-repo mutation.
- New creator preview source is on `build/anevum-creator-platform-20261011` of legacy repo. Its Worker is `anevum-community-preview`, not the existing `anevum-web-nextgen`.

## Cloudflare inventory 2026-10-11
- `anevum.com/*` still routes to `anevum-web-nextgen`; no apex cutover performed.
- `next.anevum.com` Worker custom domain goes to `anevum-community-preview` (interactive cinematic fixture-only UI).
- `backstage.anevum.com` Worker custom domain goes to `anevum-web-nextgen` with owner-only Cloudflare Access policy, but private OAuth/cookies/JWT audiences and end-to-end authentication haven't passed on new origin. Do not move production until tested.
- Pages `anevum-command` retains `command.anevum.com`; must inventory before retirement.
- Legacy D1s `anevum-members`, `anevum-members-preview`, `anevum-v5-beta-members` exist; new isolated `anevum-community-preview` exists with schema but no Worker binding.
- Old Access apps for `anevum.com/studio*` and `anevum.com/command/rhen*` remain; do not remove until alternate path is verified.
- No direct evidence that legacy Cloudflare database content has been backed up or exported.

## Railway inventory 2026-10-11
Named projects `ANEVUM Core`, `RHEN`, `RHEN Archive` remain accessible. Selected environments return zero live services/volumes/buckets and deployment queries for Core and RHEN returned zero. This is sufficient to treat Railway as unnecessary for the current static creator prototype, but not sufficient to declare every former trading process or historic export terminated. Do not incur new project/compute charges until a specific workload needs it.

## Target platform services, phased
P0:
- Cloudflare DNS/Workers (runtime), D1 (accounts, projects, votes, XP ledger, reports), R2 (bounded creator media), WAF/Turnstile/rate limiting, Access for staff only.
- GitHub: source control, CI and creator GitHub OAuth/repository linking; least-privilege GitHub App for verified repo import, not broad PAT.
- Auth: Better Auth or one reviewed equivalent with email/GitHub/Google sign-in, CSRF/cookie origin review, account recovery/delete and permission checks.
- Resend: verification/recovery/security email and opt-in notifications; sender domain setup and webhook handling.
- PostHog already installed: activation, contribution funnel, D1-backed vote integrity, creator retention; avoid sensitive event payloads.
- Error reporting/monitoring and periodic encrypted D1/R2 backup restoration tests.
P1:
- Discord bot for support, moderation alerts, jam/event announcements and optional creator roles. No Discord-only required participation.
- Dedicated project link health and security scan; external app launcher with clear trust labels. No uploading arbitrary executables to the main origin.
- Search index only when D1 queries cannot meet relevance/latency.
P2:
- Stripe/Stripe Connect for creator support, sales/payouts, taxes/refunds/chargebacks and required onboarding. Do not activate monetization before compliance, abuse policies and account controls.
- Railway for Python background tasks, workers, scanners or sandbox orchestration only when verified needs justify it; remain usage-limited and isolated.
- Optional GitHub releases integration, embed/sandbox hosting, third-party developer tools and referrals.

## Cutover gates
1. Freeze source/archive refs and export/restore legacy databases and deployment configuration. Keep rollback record.
2. Verify `backstage` identity for each owner, private endpoints, OAuth flows, cookies, CSRF, signed Cloudflare Access audience, and no cross-origin leakage.
3. New creator platform source independent from old deployment workflows, with preserved license and design provenance.
4. Choose whether apex initially ships a transparent coming-soon/preview or a functional public beta. A fixture-only site must never impersonate live social statistics; disabled functions must be visibly marked.
5. Snapshot original `anevum.com/*` Cloudflare route and recovery steps; gain exact deployment approval; cut over; verify HTTPS, mobile, redirects, signup if enabled, error logs, rollback.
6. Retire legacy public paths and old Access apps only after confirmed alternate ownership and retention compliance.

## Non-goals
No deletion of RHEN repositories or production databases, no sudden disablement of live trades based on incomplete Railway inventories, no fake activity, no paid voting/XP, no guaranteed hosting for creator submitted applications, no need to keep the RHEN product roadmap as ANEVUM's launch blocker.
