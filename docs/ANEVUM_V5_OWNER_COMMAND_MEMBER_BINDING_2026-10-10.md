# ANEVUM V5 — Owner Command dual-identity acceptance (2026-10-10)

Session: ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL
Master board: https://github.com/anevum/anevum-web/issues/259
Source parent: #283 at 51be02a7affb80461904546fa1180dd5a9612144.

## Boundaries
- The owner terminal requires BOTH a cryptographically verified Cloudflare Access JWT in the allowlisted operator identity and an independently authenticated, email-verified Better Auth owner-member session whose exact user.id equals a provisioned encrypted RHEN_OWNER_MEMBER_ID.
- A matching email alone is insufficient, and a staff credential alone is insufficient.
- All Command owner APIs share commandCredential. Member RHEN drafts, workspace APIs, rewards, and trading authority remain separate and disabled for broker execution. Member UI remounts by user ID and crosschecks member API payloads to avoid stale account data.
- Production wrangler requires ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED=true; manual production deploy checks secret name RHEN_OWNER_MEMBER_ID. Do NOT commit or paste owner member ID, cookies, code or broker credentials.
- The unchanged deployed production version remains Access-only until separately owner-approved production cutover. The pinned Alpaca paper reviewer Worker must not be replaced by this source draft.

## Real acceptance still needed
1. Identify the precise intended production Better Auth owner-member identity *privately* via its signed-in account, not by choosing the first user row or reusing a staging ID.
2. Owner explicitly authorizes setting encrypted RHEN_OWNER_MEMBER_ID for production, then confirms the ID matches its own verified Better Auth session.
3. Independently test owner Access + owner member -> owner_member_bound=true; Access + second member -> 403; Access + no member -> 403; invalid/expired Access -> denied. Recheck browser identity switching, endpoint data isolation and sensitive action guards without transmitting identifiers.
4. Confirm real authenticated two-member Command/home, saved-apps, follows, export and RHEN draft/workspace integrity before any public V5 release.
5. Separately approve migration/rollout and verified rollback. If missing config during V5 release, fail 503 rather than silently falling back to Access-only.
6. Keep Commons social writes and Alpaca live connections OFF pending independent approvals.

Current tests cover offline synthetic adversarial cases, NOT real logged-in user authorization or public deployment. No trade, token exchange or data migration is performed by this draft.
