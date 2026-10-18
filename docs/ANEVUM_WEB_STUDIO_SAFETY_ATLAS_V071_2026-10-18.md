# ANEVUM V071 — Verified Creation Atlas and Independent Safety Ledger

**Session:** `ANEVUM.WEB.BUILD.2026-10-18.020.CREATION-TAKEDOWN-AND-PUBLIC-BROWSER`  
**Date:** 2026-10-18  
**Source branch:** `build/creation-takedown-browser-v071-20261018-020`  
**PR:** [#504 — source-only, draft](https://github.com/anevum/anevum-web/pull/504)  
**Production:** **V069 remains live. V070/V071 are NOT active**. No new D1 migration, Cloudflare binding, creation badge, reviewer privilege or public content has been released.

## Completed

- Author consent and independent rights review remain inherited from the V070 private Studio pilot.
- New additive `0012_studio_publication_takedowns.sql` defines immutable publication takedown evidence, creation award revocation audit, and independent safety officer rate limits. SQL is source-only.
- `studio-safety.mjs`: verified-session, separate `CANONICAL_STUDIO_SAFETY_REVIEWER_IDS` role; author and original approver cannot take down their own publication; strict justification and reason code required; at most ten review decisions per hour; raw award IDs, account IDs and XP cannot be chosen by the client.
- Takedown works for a currently listed record **or** a previously creator-withdrawn record. Voluntary withdrawal stays private and keeps historical badges unless the original release is independently disqualified.
- Removal, immutable takedown evidence, First Creation / Five Worlds / Architect of Worlds reconciliation, revocation reasons, and removal of obsolete award notifications are in one D1 transaction. Tests exercise audit-sink failure and prove the transaction rolls back.
- Creator Studio ordinary project deletion cannot cascade away previous reviewed-release evidence after unpublishing. Account privacy/closure flows remain separate.
- The system can award a previously revoked threshold again, but **only** when a new distinct eligible reviewed publication restores the legitimate count; unique grant keys and permanent revocation records are retained.
- The public `/creations` archive and `/creations/:id` detail page use canonical `CompactMemberIdentity` player cards: verified public display name, avatar status, 30-level Evolution specimen, three user-visible earned badges, medal/ribbon selection and aura.
- The public projection strips private IDs, evidence, reviewer identity and quarantined-file data. Only independently approved creator-supplied external HTTPS links appear; no uploaded media or packages are executed.
- Closed-by-default UI: author consent, reviewer publication, independent safety desk and public creation listing require explicit Worker flags, approved reviewer IDs and both additive D1 migrations. Without activation, the public archive shows an accurate closed state rather than fabricated projects.

## Routes

| URL | Access | Purpose |
| --- | --- | --- |
| `/creations` | Public when activated | Verified external-metadata releases |
| `/creations/:uuid` | Public when activated | Original creation detail and universal player card |
| `/studio/safety` | Separately allowlisted signed-in officer | Evidence-backed takedown desk |
| `GET /api/v1/member/studio/safety` | Verified safety officer | Up to 50 eligible releases, including withdrawn historic evidence |
| `POST /api/v1/member/studio/safety` | Verified safety officer + same-origin CSRF | Exact publication ID and timestamp; reason code and 25+ character evidence |
| `GET /api/v1/creations[/:uuid]` | Anonymous after release flag | Read-only metadata projection |

## Security invariants

1. No automatic role elevation from forum moderation, support, signup status or ordinary Studio reviewing. The safety officer and release approver must be distinct people for the same work.
2. No fake member awards, profiles, works, vote scores, review approvals, grants, XP, levels, medals or ribbons in live production.
3. No quarantined storage R2 keys or binary assets in public responses.
4. A withdrawn public work may not be destroyed by ordinary project deletion when its verified release has historical award evidence.
5. A failed evidence ledger insert must roll back the takedown and every corresponding award mutation.
6. Release is **fail-closed** if recognition schema, Studio 0011, safety 0012, publication reviewer role or safety officer role is absent.

## QA evidence

- [V071 SQLite + TypeScript review](https://github.com/anevum/anevum-web/actions/runs/39097045026): **34 passing tests, 0 failures**, includes V070 consent and V069 recognition regressions, audit rollback, historical takedown, independent safety roles and 1/5/20 badge count reconciliation.
- [V071 Creator Atlas synthetic Chromium review](https://github.com/anevum/anevum-web/actions/runs/39097069551): **pass** at 1440, 1024, 390 and 320 pixels; renders two distinct fake-only user cards, one with earned badge + level specimen, one with neither; detail links external-only; mobile no horizontal overflow; reduced motion honored; 0 uncaught exceptions.
- [Full Creator V1 verification](https://github.com/anevum/anevum-web/actions/runs/39097183866) **PASSED** at exact PR head `25de2f60e04644091e233750589940d9d8238a7a`. It includes frontend build, member integration, sitewide desktop/mobile captures and production read-only signup canary.
- The two fixtures are explicitly synthetic and never bundled into Cloudflare production.

## Still needed before activation

1. Explicit selection and independent authorization of publication and safety reviewer accounts; do not infer identity from family or previous moderator privileges.
2. Formal rights complaint, appeal, reinstatement and audit-retention policies with a second-review path.
3. Back up MEMBER_DB and verify a restore process. Inspect current 0008–0010 before applying **0011 then 0012**, once, against the correct production database; do not overwrite member data.
4. Configure and review exact Cloudflare Worker safety/publication flags and 24 existing bindings without leaking secrets. Produce an unrouted Worker candidate with native 30-level artwork.
5. Test real signed-in creator consent, independently authorized release, staff removal, level/award card views, email/signup protection, origin/CSRF, 390px/desktop mobile pages and rollback before **any** 100% traffic promotion.
6. Native games, videos, ZIP scanning, payments and external achievement API remain outside the V071 metadata-only release.

**Deployment rule:** No promotion, account privilege grant, worker flags or D1 writes merely because this source branch and synthetic QA are green. Keep the exact V069 production Worker pinned for rollback and normal site operations.
