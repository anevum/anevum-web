# Public interface regression recovery — 2026-10-12

**Session:** `ANEVUM.WEB.INCIDENT.2026-10-12.001.PUBLIC-UI-REGRESSION`
**Cause:** Source-only PR #339 replaced the existing cinematic public page and stylesheet with a minimal new HTML/CSS shell. Deploying that candidate removed presentation, navigation, and visible feature destinations instead of incorporating them into the already agreed creator experience.

## Recovery decision
- Restore the last Orbit-branded cinematic V1 public build from source commit `5046da6bfa7447d6ab59bd962f8428f898c33f7e` while retaining the current read-only public API and deep-route Worker compatibility from PR #339.
- Keep the original approved WebP artwork assets, cinematic hero and category graphics, project listings, sidebar features, all navigation destinations, full Orbit SVG and shared design tokens.
- No fake activity, sample profiles, XP totals or unauthorized write functionality. Staged member/profile/library/authoring/moderation/voting capabilities remain in their existing separate Workers until accepted.
- Deep links `/discover`, `/projects/:id`, `/create`, `/community`, `/library`, `/account`, `/status` must continue resolving even though the recovered client navigates internally using hashes.
- Add explicit regression tests for original cinematic selectors, navigation entry points, asset count, read-only routes, CSP, canonical brand and honest feature status.
- Leave `creator-v1/site/shell.html` and `shell.css` from the rejected design in git as preserved historical exploration; these are no longer runtime sources. Do not delete the concept or revive RHEN in the public V1.

## Required acceptance
- Exact-head CI and source-level tests.
- Actual live HTML, CSS, JS, favicon and project API smoke test after deployment; cross-device screenshot and keyboard check are independent visual gates.
- Keep pre-hotfix version `14972901-389e-46d1-8022-15d724e8afee` and original V1 Worker version `3d26a4b9-70b3-4a95-8cb5-d104913b255c` for audit/rollback. These are different UI states.
- Update issue #325 and Notion launch tracker; no public signup, migrations, trading actions, or archive deletions.

## Prevention
The cinematic layout, branded art, mobile navigation and feature destinations are permanent regression assertions. Subsequent visual improvements must be incremental and additive, not a shell replacement. Any future public promotion requires cross-page comparative browser QA and evidence of what stayed, what changed, and what remains gated.
