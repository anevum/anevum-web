# ANEVUM Creator Studio V053 — Implementation Handoff

**Branch:** `design/creator-studio-v053-launchpad-20261016`  
**Base:** deployed V052 staging baseline (`release/a-studio-v052-integrated-20261016`)  
**Environment:** GitHub source review only; **not deployed to `a.anevum.com`**.

## Actual implementation in this branch

- `/studio` becomes a beginner-first **Launchpad** for verified signed-in members.
- Primary path: enter a creative idea, select **Capture My Idea**, and create an actual owner-only, revisioned canonical draft via `studioCreate`. The title, summary and URL slug are derived and sanitized client-side, then validated again by the existing trusted server.
- Five editable starter outlines (story/zine, gallery, audio release, branching narrative, interactive experiment); all are **text project scaffolds** in the existing database, not rendered games, media players or a WYSIWYG block system.
- **Bring My Work** path supports a title, category and optional canonical public HTTPS link; it creates a private project. Uploading user bytes remains disabled, and the UI states that openly.
- **Returning creator** path lists, searches and filters real private projects; project cards open their same canonical editor URLs.
- **Progressive project editing:** existing work opens in Simple mode (title, category, summary, private notes); advanced mode exposes slug, free-access intent, URLs, copyright/license and contribution/AI disclosures. Submission readiness, audit receipts, moderation tools, file restrictions and backend safety checks are preserved.
- **Unauthenticated discovery:** anyone may explore static starter options and write a local-only scratchpad idea. Explicit copying is available. The scratchpad is kept in component memory only; it is not sent to ANEVUM or silently carried through login.
- **Styling:** Transcosmic/Continuance dark institutional/teal/rose language, responsive layout at phone/tablet/desktop, accessible focus states, obvious pressed options and reduced-motion fallback.
- **Core API remains unchanged.** No migration, Cloudflare binding, authorization change, upload flag, user XP, public project hosting, payments or apex route changes.

## Source files

| Path | Purpose |
| --- | --- |
| `creator-v1/web/src/pages/StudioLaunchpad.tsx` | New signed-in Launchpad and public guest discovery |
| `creator-v1/web/src/pages/studio-launchpad.css` | Responsive, isolated UI styling |
| `creator-v1/web/src/lib/studio-launchpad.ts` | Versioned starter definitions and pure draft-building helpers |
| `creator-v1/web/src/pages/CanonicalStudioPage.tsx` | Integrates Launchpad on `/studio` and progressive Simple/Advanced editor |
| `creator-v1/web/src/pages/canonical-studio.css` | Editor mode styling |
| `creator-v1/test/studio-launchpad-v053.test.mjs` | Beginner flow, validation, access and security expectations |
| `.github/workflows/studio-v053-verify.yml` | CI only: checks, builds, tests; no deployment |

## Manual acceptance checklist (requires an authenticated browser for signed-in paths)

1. **Guest:** load `/studio` signed out. The starter gallery must render without API errors; text input must not send network requests; copy action must either copy or provide clear fallback.
2. **New verified member with handle:** capture `A mystery story about strange signals`; confirm server-created private project and redirect to `/studio/:id` with the original notes and generated slug.
3. **Starter:** choose branching narrative; confirm a private project with an outline, not an executable game or published release.
4. **Advanced creator:** bring an existing work with a valid public HTTPS link; verify the URL is treated as metadata and neither fetched for preview nor considered publication.
5. **Existing drafts:** verify legacy V052 projects and review receipts survive; search/status filters find them. Open existing project in Simple mode and toggle Advanced without changing saved data.
6. **Rights:** a private draft can be saved without a license or AI explanation, but cannot be submitted for review until all V050 validation checks pass.
7. **Guest account boundary:** unauthorized users cannot read, modify or delete another member's private project. `/studio/review` remains separately role-gated.
8. **Uploads:** private upload controls remain disabled on staging when `CANONICAL_CREATOR_UPLOADS_ENABLED=false`; no public HTML5 execution or media streaming.
9. **Devices:** keyboard-only, focus states, reduced motion, screen reader labels and widths 1440/1024/390/320 must be verified before deployment.
10. **Rollout:** promote only from the deployed V052 baseline with exact-head CI, screenshot/manual browser QA, backup/rollback and explicit release acceptance. Keep public signup, moderator V044, supporter systems and apex unchanged.

## What this is not

V053 does not yet include a structured visual block editor, live rendering of templates, saved anonymous guest drafts, user collaboration, community-linked Seeds, approved releases, public uploads or game execution. Those should be implemented in V054–V058 as separate reversible increments with appropriate permission and moderation models.

**Reference design:** `docs/creator-platform/CREATOR-STUDIO-V053-LAUNCHPAD-PRODUCT-DESIGN.md` in this branch.
