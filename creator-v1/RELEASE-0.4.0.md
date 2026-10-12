# ANEVUM Creator V1 — Community Votes and Earned Levels (0.4.0)

**Session:** `ANEVUM.WEB.BUILD.2026-10-12.001.COMMUNITY-VOTING-LEVELS`
**Target:** staging only, `next.anevum.com` and staff `studio.next.anevum.com`
**Public apex:** `anevum.com` remains the approved read-only V1 catalogue; no release cutover.

## Delivered

- Signed-in member votes on **published projects only**; one score from 0 to 5 per member/project, editable by revision without creating extra ratings.
- Reject votes on one's own project, on drafts/archived projects, by suspended/incomplete members, or on unmoderated content. A rating never deletes content or confers editorial permissions.
- Publicly visible **rating count and mean** for each published item with accurate small sample count. Private voter IDs and email addresses are not returned by public endpoints.
- First successful eligible rating grants **2 XP once per project**, with a maximum of five awarded first votes per UTC day (10 XP/day). Unlimited changes to an existing rating confer no additional XP, and members can still rate after reaching their daily XP cap.
- Append-only vote audit and XP ledger; optimistic score revisions, database transactions, uniqueness guards, and rate limits prevent accidental duplicate awards.
- Earned levels 1–60, quadratic threshold `20 * (level-1)^2`, and sixty distinct **working collectible artifact names**. These names are a provisional backend catalogue, not final graphical artwork or approved brand icons.
- Staff-authenticated, origin-protected moderation with written reasons. Hiding/removing an abusive rating also reverses any previously earned XP, and a successful appeal restores at most the original XP. Administrative capability is not derived from account level.
- Original cinematic, responsive community listing and level card at `/api/v1/member/community`, with honest zero-project state, accessible rating controls and no fabricated creators or reviews.
- Owner Studio's existing signed Cloudflare Access surface gains rating moderation. Public members have no access to staff endpoints.
- Non-destructive staging D1 migration `0005_voting_progression.sql`; staging has its own D1 separate from production.

## Routes

- `GET /api/v1/member/community` — cinematic staging experience
- `GET /api/v1/member/community.css` and `/community.js` — locally served assets
- `GET /api/v1/member/community/projects` — published catalogue and aggregated ratings, no private metadata
- `GET /api/v1/member/community/projects/:id` — published item and vote stats
- `POST /api/v1/member/community/projects/:id/vote` — authenticated same-origin member submission `{score,revision}`
- `GET /api/v1/member/community/me` — authenticated XP, earned level and artifact
- Studio: `GET /api/community-votes?project=:id`; `POST /api/community-votes/:projectId/:memberId/hide` or `/restore` with reason

## Tests and deployment gates

- Node 22 local verification: **58 automated tests passed** across existing auth, owner Studio, member publishing and 20 new voting/progression/moderation tests.
- New tests include anonymous/cross-origin denial, exact integer score bounds, idempotency, optimistic revisions, daily cap, self-vote, unpublished filtering, cross-member isolation, suspended creators, staff Access denial, reason validation, hide/reinstate ledger math, no XP for capped awards, and uniqueness of 60 object names.
- Node syntax validation includes Worker entrypoints and extracted interface JS.
- Before staging deployment, record Cloudflare D1 Time Travel bookmark; check versions 0001–0004, apply 0005 once, confirm account/project counts unchanged.
- Deploy stage Member Worker with preexisting invitation-only, email, Turnstile and auth pepper secrets inherited. Deploy protected Studio Worker with previous Access issuer/audience/allowed email bindings inherited. No changes to apex route or production D1.
- Browser-check staging new route and anonymous login denial; real signed-in voting walkthrough and browser mobile accessibility acceptance remain required.

## Unresolved product/security work

- **Security:** previously exposed staging Resend API credential must be revoked after owner confirmation; rotating only the Worker binding does not revoke the compromised credential. Do not publish unrestricted signup or wider invites until rotation is complete.
- Public auth implementation is a custom WebCrypto prototype; independent review or migration to a proven library is required before production registration.
- Staff-assisted moderation currently requires a project ID; more advanced report workflow, appeals, rate-limiting and risk scoring are future tasks.
- Project screenshots, external demo security verification, real creator onboarding, professional artifact art, challenge rewards and accepted written-review XP are not yet complete.
- Beta users must test real end-to-end project submission, editorial approval, voting and appeal flows before production promotion.