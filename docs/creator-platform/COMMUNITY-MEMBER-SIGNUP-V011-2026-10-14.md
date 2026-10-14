# ANEVUM Community V011 — member signup entry reconciliation

Session: `ANEVUM.WEB.BUILD.2026-10-14.007.MEMBER-SIGNUP-RECONCILIATION`  
Review branch: `build/creator-v1-member-entry-reconciliation-v011-20261014`  
Review stack: #388 cinematic → #392 Community V007 → #395 member V008 → #396 recognition V009 → #398 chosen award V010 → V011.  
Source: selectively reconciled existing draft #390, **not** merged into public production. Release authority: #325 and #328.

## What is now implemented in V011 source

- Adds the cinematic Creator V1 `/join`, `/sign-in`, `/atlas/join` sign-in information experience with mobile/desktop layouts, existing branding and artwork, accessible guest browse paths and account/profile return routes.
- Adds a visible JOIN link in the current community-first shell and its compact mobile menu/footer, keeping the already-approved V005–V010 navigation, no founder portfolio links, original project feed, level indicators and member-selected award picker.
- Adds the existing Creator V1 invitation-only `GET/HEAD /api/v1/member/auth-methods` endpoint from #390 to the **same** staging Member Worker. This Worker currently advertises only email code if its *own* D1, identity key, Resend, Turnstile, invite allowlist and enabling flag are available. Google/GitHub/passkey/Microsoft/Apple cannot be impersonated by old V5 backend flags.
- The public client requests capabilities anonymously, only same-origin, no redirects/cookies and no browser token storage. A new strict response normalizer treats missing, stale, malformed, non-invite or foreign-provider capability JSON as closed, and strips unsupported provider readiness.
- An existing authenticated Creator V1 member returns to their own workspace; a member without a handle is directed to the existing member-owned profile editor. Verified profile edits continue to save on the authoritative staging Member Worker. Protected recognition/featured award, independent project association and XP are unchanged.
- The **unrouted** production-readiness candidate serves only an inert static `/join` page; deeper `/join/*`, `/api/v1/member/*`, Studio, Command, RHEN, staff and POST/PATCH remain rejected. No production/DNS routes were modified.

## Identity reality and consolidation

Two unrelated credential systems still exist. Creator V1's isolated `next.anevum.com/api/v1/member/*` email-OTP Worker stores its own member IDs/sessions in isolated D1. The older V5 Better Auth stack is distinct, including Google sign-in, and optional GitHub/email proposals in historical draft #318. They **must not** be merged by matching email/handle or forwarded cookies.

As of this source change, `a.anevum.com` has not been verified to serve the *same-origin* canonical Member Worker. Its join entry therefore fails **closed**, and displaying an account page is not proof signup functions on that host. Do not advertise public registration as live. No account records have been migrated or linked. Preferred **proposed** next direction: reviewed Better Auth as the single canonical identity engine, with isolated test environment, explicit consent-based account linking, independent owner/ordinary-member isolation and a same-origin adapter/route; see `docs/ANEVUM_WEB_MEMBER_IDENTITY_CONSOLIDATION_2026-10-14.md`.

## Verification included

Source tests from #390: `auth/tests/signin-capabilities.test.mjs`, `test/join-entry.test.mjs`, updated anonymous production candidate routing, Atlas navigation, member onboarding and browser capture of `/creator/join` at 1440/390/320 pixels. V011 adds `test/signup-integration-v011.test.mjs` with invalid/forged provider payload handling, strict credential omission, authenticated session fetch, preserved V010 protected recognition and no client-side session fabrication. Previous V007–V010 regressions continue running.

CI evidence is valid only for the exact V011 head and synthetic/anonymous fixtures. **Real external email receipt, Google/GitHub OAuth, two independently authenticated test members, staff approval flow, deletion, account linking and migration remain unaccepted.**

## Remaining critical actions before launch

1. Owner-reviewed identity architecture: Better Auth version/provider callbacks/cookie scope, exact canonical member ID mapping, staged D1 design, existing owner account preservation, no RHEN/broker privileges from generic member roles.
2. Read-only provider audit of actual `a.anevum.com` and the isolated Member Worker routes; verify domains, D1 IDs, staff privacy guards, email sender, Turnstile challenge, provider flags, account/deletion status and current backups. Do **not** export credentials or PII to source control.
3. Isolated staging canonical auth adapter and two-session proof. Verify member A can sign in, create handle, draft/submit authentic safe project; separately authenticated staff reviews; anonymous guest sees only published work; independent member B reviews and saves; account switch cannot leak projects, XP, awards, sessions or owner privileges. Apply proposed V010 migration 0014 **only after** authorized isolated D1 backup/restore trial.
4. Recovery, revocation, deletion/export/retention, moderation abuse handling, accessible mobile verification and written owner authorization for each provider and environment change.
5. Protect `anevum.com` coming-soon launch page until explicit authorization for January 1, 2027 opening. Do not merge/deploy stacked drafts or enable public signup because code CI passed.

Status: draft code/CI review only; no migrations, identity/account mutations, real emails, auth providers, DNS, Cloudflare routes or production release.
