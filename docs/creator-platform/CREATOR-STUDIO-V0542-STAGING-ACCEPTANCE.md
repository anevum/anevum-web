# V054.2 Real Member Staging Acceptance

Session: ANEVUM.WEB.DESIGN.2026-10-17.001.CANVAS-FIRST-CREATOR-STUDIO

**Target:** https://a.anevum.com/studio
**Branch:** `design/creator-studio-v0542-canvas-first-20261017`
**State:** Pending. Current live Worker is NOT assumed to be this candidate; no write-capable staging session was used in CI.

## Completed automated verification
- Exact-head Studio browser and API contract tests passed on 4b8f03e6f8dd18fad5e0c86be96abc25078f09a4.
- Synthetic authoring tested 1440 / 390 / 320 px, multiline text, scene navigation, private revision saves and hostile text escaping.
- The separate read-only live preflight may confirm feature readiness and unauthenticated 401 boundaries. It does **not** verify that owner A cannot read owner B's project.

## Required authenticated acceptance
Use two **consenting, disposable verified staging accounts** A and B with no private production content. Capture timestamp, candidate deployed Worker version, expected and observed results for each case. Do not record codes, session cookies, emails, access tokens, or original personal work in artifacts.

1. Confirm the actual deployed bundle hash matches the intended reviewed candidate; otherwise STOP. Never interpret tests against the older V054 bundle as acceptance of V054.2.
2. A: visit Studio, create blank canvas, type title + two passages, save using Ctrl/Cmd+S (or Save on mobile), reload and verify exact text, ordering and increased revision.
3. A: create a choice starter, preview, navigate scene choice, return to Make, save, reload and confirm the branch structure.
4. A: edit a previous draft, navigate away without saving, reject the leave confirmation, remain in place with unsaved content; then save and reopen.
5. A: open About work / Rights & release, update a harmless summary, save, verify that licensing remains voluntary during drafting but gates review.
6. B: Studio list does NOT contain A's project. Direct GET/edit/delete/review/submission endpoints for A's project ID must be denied. B's own drafts still work. Do not attempt requests against unrelated members.
7. Anonymous: verify project list/review endpoints return 401; public read pages remain functional.
8. On all viewport widths check touch target visibility, no horizontal clipping, readable text, and accurate save status. Confirm reduce-motion preference.
9. Staff review remains limited to the configured reviewers; ordinary members cannot access staff review records.
10. Confirm uploads remain disabled, no executable media runs in private preview, and no XP/public publish/billing mutation was added.

## Deployment gate
The existing V054 workflow pins an **obsolete active Worker version**. The read-only Cloudflare check on 2026-10-17 showed active version `f5df3330-7db7-4718-93a4-bac0cf47579f` with uploads disabled, rather than the workflow's pinned `c6f651f0-9afa-4314-9aca-6c062bf1fb78`. Do **not** reuse the old release workflow or force it past its drift checks. Re-pin actual deployments/routes and compare complete binding inventory, secret presence, rollback revision, asset hash, exact-head CI, and hosted smoke tests in a separate guarded release PR.

**Signoff needed:** Verified real A/B acceptance evidence, deployment dry-run, user approval to promote. This note does not certify those checks or deploy anything.
