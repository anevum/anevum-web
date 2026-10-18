# ANEVUM V070 — Reviewed Creation Publication Evidence

**Session:** `ANEVUM.WEB.BUILD.2026-10-17.019.CREATION-PUBLICATION-EVIDENCE`  
**Review:** https://github.com/anevum/anevum-web/pull/499  
**Current production:** V069 at `anevum.com`  
**V070 state:** Source implemented, **feature disabled in production**; migration 0011 **not applied**.

## Decision: publication must precede earning

Existing Creator Studio only holds private projects, frozen review receipts, quarantined files, change requests and rejections. There is no public publish action, so neither a submitted draft nor a completed private upload is proof of a creation published to ANEVUM.

V070 adds a separately gated **external metadata-only** release path. Nothing here makes a game playable, serves original files, scans quarantined bytes or permits downloads through the site.

## Source modules

- `creator-v1/canonical-auth/migrations/0011_studio_publication_evidence.sql`: additive consent, independent review, public metadata and unique normalized external-link evidence. Source-only: no automatic D1 changes.
- `creator-v1/canonical-auth/studio-publications.mjs`: opt-in, reviewer workflow, author withdrawal, reviewed public projection, audited achievement statements.
- `creator-v1/canonical-auth/studio.mjs`: human review decision, independent staff gating, hides published projects from the regular pending queue.
- `creator-v1/canonical-auth/worker.mjs` and `creator-v1/apex-prelaunch/platform.mjs`: exact-origin API routing and existing verified session, CSRF and method boundaries.
- `creator-v1/canonical-auth/recognition-catalog.mjs`: creation marks become “issuable” only when the service, migration, and recognition are activated.
- `creator-v1/web/src/components/StudioPublicationPanel.tsx` and `CanonicalStudioPage.tsx`: separate author consent, withdrawal and three-part staff checks.

## Protected routes

| Route | Audience | Allowed methods | Authority |
| --- | --- | --- | --- |
| `/api/v1/member/studio/projects/:id/publication` | Verified creator | GET / POST / DELETE | Owner-scoped frozen submission, exact consent, backend D1 |
| `/api/v1/member/studio/review` | Verified allowlisted Studio reviewer | POST `publish_external_metadata` | Independent reviewer, three explicit rights/content/external-link attestations |
| `/api/v1/creations` | Public, only after release flag | GET / HEAD | Only independently reviewed, consented external metadata |
| `/api/v1/creations/:uuid` | Public, only after release flag | GET / HEAD | Same visibility/consent/security projection |
| `/api/v1/public/recognition/catalog` | Public | GET / HEAD | Conditional issuability, not member awards |

## Earned marks and safeguards

- **First Creation** — first independently reviewed external metadata release.
- **Five Worlds** — five distinct consented, reviewed, publicly listed original projects.
- **Architect of Worlds** — twenty distinct qualifying original projects.
- The server derives all recipients and award IDs. Grants use idempotent `(user_id,kind,recognition_id)` uniqueness; matching notifications come from actual grant rows.
- Claiming the same normalized external link under a different project slug cannot farm the next badge.
- No release or award is possible from an unverified member, hidden profile, self-review, incomplete rights disclosure, missing author consent or snapshot containing even one quarantined/private attachment.
- A creator can withdraw public metadata and consent without erasing the internal audit. **Historical earned badge grants remain** after voluntary unpublish; moderator takedown and fraudulent-grant revocation require a separate audited service before broad public rollout.
- **No new XP awards**, no medals, no service ribbons and no permission upgrades.

## Test evidence

- V070 security review `creator-v1/test/studio-publication-evidence-v070.test.mjs` runs with actual SQLite and the original 0008–0011 migration sequence, combined with V069/V066 recognition tests.
- Verified: owner consent, independent reviewer role, correct/rejected publication, hidden profiles, withheld assets, zero public bytes, duplicate external work rejection, public projection privacy, author unpublishing and first/five/twenty award thresholds.
- V070 Creator UI is compiled and validated by the same branch CI; no real member credentials or production sessions are used.
- GitHub Action [V070 Studio Publication Evidence Security Review](https://github.com/anevum/anevum-web/actions?query=workflow%3A%22V070+Studio+Publication+Evidence+Security+Review%22) must be green at the final source SHA.
- [Full Creator V1 verification](https://github.com/anevum/anevum-web/actions?query=workflow%3A%22ANEVUM+Creator+V1+Verify%22) should also be green before any Worker candidate.

## Promotion prerequisites (unmet)

1. Assign an explicitly approved **Studio publication reviewer**, separate from author rights; production currently has no `CANONICAL_STUDIO_REVIEWER_IDS` binding. Existing forum moderator status must not grant this automatically.
2. Establish the abuse/rights takedown path with audited revocation for fraudulent or removed public works.
3. Back up canonical `MEMBER_DB` and verify a restoration option. Apply the additive `0011` migration **only once** after inspecting 0008–0010 schema, foreign keys, and record counts. Never reset XP or member accounts.
4. Independently verify the exact Worker routes, 24 legacy bindings (including four opaque secrets), both D1 IDs, static assets, and the current V069 rollback version.
5. Only then create an **unrouted** candidate with the opt-in `CANONICAL_STUDIO_PUBLICATION_ENABLED=true` flag. Test verified creator consent/revocation, independently allowed staff review, a real external HTTPS release, public listing, and earned first badge using test accounts without influencing existing members.
6. Promote with a pinned rollback and monitor content/rights reports. Never self-award, bulk-backfill or invent medals.

## Scope explicitly not complete

- No media hosting or malware scanning.
- No video processing, native app/game execution or isolated player deployment.
- No automatic rights clearance or automatic staff approvals.
- No moderation takedown/appeal/revocation UI.
- No real production signed-in end-to-end tests.
- No automatic membership or Constellation group affiliations.

**Operational rule:** Keep V069 live and V070's publication flag closed until the reviewer, migration and takedown controls are deliberately approved and verified.
