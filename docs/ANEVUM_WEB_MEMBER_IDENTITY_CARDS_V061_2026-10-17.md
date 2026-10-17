# ANEVUM V061 — Member Identity / Evolution Specimen Cards

Session: `ANEVUM.WEB.BUILD.2026-10-17.010.MEMBER-IDENTITY-EVOLUTION-CARDS`

Date: October 17, 2026. Source commit deployed: `5d6df0da5baa4bb62fad98656186ef0b5b0b8605`.
Source branch: `build/member-identity-evolution-cards-v061-20261017-010`.

## Status

V061 is deployed to the canonical apex `https://anevum.com`. The Cloudflare Worker `anevum-apex-prelaunch-gateway` is serving version `0b8838ab-d7d4-44e5-8c50-362913a4bab7` at 100% traffic.

Previous safe version: `82d3de5e-0913-40fe-9cb3-7d6833cd2641` (V060).

## What changed

- `CompactMemberIdentity.tsx` pairs every displayed profile photograph with the user's *actual earned* Evolution miniature when `show_stats` is enabled, plus the level number/name and up to three chosen earned awards. Existing supporter aesthetics are preserved.
- Native 3D scene geometry is exported as true-alpha high-resolution artwork. The compact card uses the 128px render and subtle CSS orbital motion for performance, with `prefers-reduced-motion` support. It does not create a WebGL canvas per feed item. Live interactive 3D inspection remains at `/evolution/?level=N`.
- Shared card appears in forum threads, reply author headers, member directory, public member activity, and private/public member-wall post bylines.
- Canonical `public-member-card.mjs` uses the member XP event/milestone ledger and V060's `75*(L-1)^2` thresholds, capped at level 30, rather than the retired /25 XP curve.
- The server only returns public profile identity for verified opted-in members. Level visibility respects user preferences; featured awards must be genuinely earned, explicitly selected and restricted to three. Public APIs never leak account emails, owner IDs or raw XP.
- No XP event or award history was modified or reset. No purchase creates a level, award or voting authority.

## Privacy and live verification

The production member directory and public activity API return authorized public identity fields including level and featured award selections. A read-only live check confirmed the known public account's level 2 and avatar. The member auth-methods endpoint reports open registration with email enabled. Anonymous progression remains a 401.

Forum UI reuses the same card, but publishing depends on the separate moderated forum backend; at this verification time its public endpoint returned 404/disabled. Do not open moderation controls solely to show member cards.

## Deployment incident, remediation and future safety

The original V061 CI workflow successfully built and tested the app but its `wrangler deploy --keep-vars` overwrote a script-API-managed Worker and generated a new version without its four `secret_text` bindings. The guard rejected it and automatically rolled production back to V060.

We then created a **non-deployed** new version using Cloudflare's Worker Versions `PATCH /accounts/{account_id}/workers/workers/{worker_id}/versions/latest`. This selectively inherited the four opaque secret bindings from the explicit known-good V060 version (`82d3de5e-0913-40fe-9cb3-7d6833cd2641`) and retained all non-secret bindings, D1 bindings, code and static asset references from the tested V061 candidate. Provider verification confirmed all 23 original bindings and the same compiled script ETag as the built V061 candidate, before promoting the repaired version via `POST /accounts/{account_id}/workers/scripts/{script_name}/deployments` at 100% traffic.

Secrets were never read, revealed, reconstructed, regenerated or entered into the release scripts.

**Do not use the original Wrangler deployment workflow again for the apex Worker.** Its GitHub workflow file was replaced with a read-only smoke test. For V062 and later, upload an unrouted/nondeployed Worker version; inherit required secrets from an explicit good historical version with Cloudflare Workers Versions API; validate all bindings, code and D1 IDs; only then promote the version with a preserved rollback version. The public signup/email secrets must be a hard failure gate, not an eventual correction after deployment.

## Follow-up quality assurance

Perform real iPhone Safari visual review of cards at 320–430px widths, with 10–25 stacked posts, reduced-motion preference, dark/light OS changes, slow connection and automatic image fallback. Verify framing, depth and tap targets from device screenshots without claiming to have done manual device checks.
