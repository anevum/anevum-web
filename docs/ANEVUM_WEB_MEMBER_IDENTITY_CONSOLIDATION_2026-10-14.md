# ANEVUM — canonical member identity and signup integration

Session: `ANEVUM.WEB.BUILD.2026-10-14.001.MEMBER-SIGNUP-EXPERIENCE`
Status: source-only proposed integration contract. No migration, secret change, signup activation, deployment or production promotion authorized.

## 1. Locked environment and identity boundaries

- `anevum.com` remains the coming-soon page until owner-authorized launch (target January 1, 2027).
- `a.anevum.com` is the canonical redesign staging site. No staging-to-production promotion without explicit owner approval.
- The existing Creator V1 read-only Worker exposes approved public listings only. Its private route gate remains closed.
- The isolated Creator identity service at `next.anevum.com/api/v1/member/*` uses HMAC-hashed email OTP sessions in its own D1 database, with Turnstile, Resend, invitation allowlist and profile ownership enforced by its Worker.
- The separate V5 Better Auth member service provides Google authentication, member settings, export, deletion and account-specific workspace guards in a different D1 database.
- Draft PR #318 adds flag-gated GitHub OAuth and email OTP to **Better Auth**, not the Creator V1 identity database; it is unmerged.
- Draft PR #390 adds an honest Creator V1 signup entry. It does not grant an account in the other service.
- Founder/owner identity, staff permissions, Studio, Command, RHEN and brokerage connections are always derived from verified member IDs plus independent access checks—not chosen in frontend fields or copied across systems.

## 2. Technical recommendation: one reviewed identity provider

Use the existing, reviewed Better Auth stack as the **proposed canonical authentication engine**. This is an implementation recommendation, not authorization to redirect traffic or merge databases. Do not extend the independent Creator V1 OTP prototype into a separate full social-auth provider.

Stage a dedicated Better Auth environment for `a.anevum.com`, isolated from the live V5 owner account and D1 data until independent acceptance. Map Creator V1 membership tables to the canonical Better Auth user ID through a migration plan; a successful login alone is not proof that two legacy records are the same person.

Do not let the current Cloudflare subdomain adapter copy cookies, relay raw session tokens, or bypass the application's exact-hostname/origin verification. Any member API rollout needs a same-origin router with its own reviewed credentials, configuration, callback URLs and sessions.

## 3. Provider roadmap and safeguards

| Provider | Status | Rollout condition |
| --- | --- | --- |
| Google | Existing V5 Better Auth | Reuse only after isolated staging callback and non-owner acceptance |
| GitHub | Source in unmerged PR #318 | Separate least-privilege login OAuth app; no repository write scopes |
| Email one-time code | Existing Creator invitation prototype; separate Better Auth draft | Verified sending domain, hashed expiring OTP, Turnstile, delivery/abuse review |
| Passkey / WebAuthn | Not implemented | Install and migrate verified passkey plugin storage, exact origin/RP ID, add/remove/recovery and multi-device tests |
| Microsoft | Future | Separate OAuth provider and verified identity claim policy |
| Apple | Future | Provider enrollment and relay-email account recovery testing |
| Discord / LinkedIn / Reddit | Conditional | User demand, reliable verified identity claims and provider policy |
| SMS / phone | Deferred | Billing, fraud controls, rate/region restrictions and recovery model |
| Alpaca Connect | Not member login | Post-login, separately authorized brokerage connection only |

Better Auth documents `account.accountLinking.disableImplicitLinking: true`. Preserve that setting. It rejects same-email social login collisions unless the user explicitly links a provider while authenticated. Passkey requires its own credential table and origin-bound WebAuthn challenges; it cannot be enabled as just another UI button.

## 4. Account recovery, linking and migration

1. Inventory existing record counts, account ownership relationships and uniqueness constraints in each *isolated* D1 store; do not export tokens or personally identifying information to logs, GitHub or public artifacts.
2. Establish and test a canonical user table and provider account table. Identify collisions from non-sensitive counts and hashes only. Do not infer ownership from shared names, emails, handles or phone numbers.
3. Require an existing authenticated Creator session **and** an existing authenticated canonical session before recording a migration link. Where both cannot be proven, use a private support/manual recovery workflow with explicit owner authorization.
4. Record migrations with a unique legacy-system plus legacy-member-ID key, verified canonical member ID, audit timestamp and one-time proof state. Apply all data moves in transactions with rollback/restore evidence.
5. Move saved items, creator profile, handles, project drafts, published associations, discussion authorship and XP ledger only after testing per-account isolation. XP must never be recalculated on login or duplicated during migration.
6. Preserve existing owner ID bindings, and keep staff/RHEN permissions behind independent checks. Never migrate privileged roles from a user-selected profile field.
7. Expose an authenticated security settings view: connected login methods, explicit link/unlink flow, device/passkey list, active sessions, recovery controls, email verification status, export and delete.
8. Make signup configurable by environment: `closed`, `invite-only` or `open`. Frontend method buttons become active only after the **same** member backend attests provider readiness; false or missing signals fail closed.

## 5. Approved first-session experience

- No account required to browse, read public projects or use the free learning paths.
- Optional account: verified sign-in -> existing session recognized -> profile setup if no unique handle -> personal home.
- First profile: handle, display name and optional biography. Public visibility notice before saving, with no public email leakage.
- Home: saved library, followed projects, contribution history, verified achievements/XP and available creator workspace. Zero XP is a genuine empty state, not mock points.
- Actions such as posting, uploading, approving or voting remain feature-gated by the backend and moderation policy.
- No default paid upgrade, no brokerage request, no forcing project creation, no fabricated presence or rankings.

## 6. Required acceptance before public registration

- Exact branch CI: TypeScript, build, the Creator V1 tests, static auth/privacy policy assertions and browser checks at desktop/390px/320px.
- Two distinct ordinary member accounts with matching and differing email providers; no cross-tenant profile, saved content, XP or project access.
- Owner account regression: no owner-to-ordinary downgrade, no ordinary-to-owner elevation, no leakage from RHEN, Command, Lab, Studio or billing.
- Passwordless email: provider outage, failed Turnstile, wrong/replayed/expired code, resend throttle, invitation denial, cookie scope, signout and recovery.
- OAuth: wrong callback host/state, denied scopes, email-not-verified, provider timeout, same-email collision and intentional link/unlink flows.
- Passkey: origin/RP ID mismatch, missing credential, counter replay, registration from signed-in session, lost device and recovery.
- Exports, deletion, retention, abuse controls, moderation and D1 backup/restore tested against isolated staging.
- Record evidence and secure owner signoff for each enabling provider, migration and Cloudflare route.
- Do not merge PR #318 or #390, change public DNS or activate signup solely because source tests pass.

## 7. Current deliverable

PR #390 creates `/join` and `/atlas/join` with an honest, server-gated method catalogue; members who already have a Creator V1 session can proceed to their account or first-time profile. It also exposes read-only `/api/v1/member/auth-methods` on the Creator staging Worker, returning only methods that *that* service can execute. Public production remains read-only, and all cross-system linking is disabled.
