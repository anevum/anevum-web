# ANEVUM V071 — Canonical Entry and Community Integration

Session: `ANEVUM.WEB.PATCH.2026-10-18.001.V071-CANONICAL-ENTRY-INTEGRATION`

Owners: [functional completion #480](https://github.com/anevum/anevum-web/issues/480), [Creator V1 board #325](https://github.com/anevum/anevum-web/issues/325).

## Why this branch exists

V067 [PR #488](https://github.com/anevum/anevum-web/pull/488) passed full source and synthetic browser verification at `407f06094c0342ecbccc4c9802a2f2b26ad3e101`, but its older V062/V065 base cannot be blindly promoted over newer V069 member-recognition production lineage. This branch applies only the independently validated functional fixes on top of V069 [PR #492](https://github.com/anevum/anevum-web/pull/492), preserving its Recognition Registry, player-card types and production-route assets.

V069's source currently has the V008 public homepage. The separate V065 first-contact asset bridge is independently deployed at `anevum.com/assets/index-*`. This change intentionally **does not replace the homepage, insert a V065-only component, or change that route**; a future sitewide release must reconcile them against the exact deployed assets.

## Source changes

- Retire the old `/community/write` Creator V1 gate: redirect its legacy link to the canonical `/community?compose=1` composer. Nothing is automatically submitted.
- Retire old `/library` invitation gate: redirect to `/saved`, which continues to enforce canonical Better Auth session and the server's disabled saved-work capability. No old identity is linked to or migrated into a new identity.
- On the forum page, recognize the deep link and open the real composer when available, and visibly explain a backend 404 as a disabled moderated forum rather than silently hiding participation. Backend role, content review, CSRF and privacy rules are unchanged.
- Restore V052 vector-native dimensional onboarding artwork/CSS without altering canonical OTP/provider/session code. Scope styling to the join page, honor reduced motion and narrow phones.
- Replace obsolete recovery guidance to retired `a.anevum.com` with canonical `anevum.com` without relaxing same-origin enforcement.
- Update old route assertions and synthetic V041/V012 desktop-phone captures to verify the new redirected and disabled states while retaining V069 recognition route/capture coverage.
- Add focused nondeploying workflow `canonical-v071-review.yml`, in addition to the repository-wide Creator V1 verification.

## Live facts at read-only audit

The current public apex Worker is `anevum-apex-prelaunch-gateway`, version `cd84468c-861a-47d5-8e64-8f8c53d51074`, 100% traffic, 24 bindings including 4 opaque secrets and 2 D1 bindings. Email registration and private Studio capability are enabled; new uploads and social providers remain disabled. Apex public forum endpoint returns 404 because no public forum enablement binding is installed. Independent IREN staff-only routes are active and return 401 to an anonymous reviewer request. Canonical MEMBER_DB contains 2 verified accounts, one public creator profile, one pending owner-authored forum thread, no published forum posts and no Studio projects or submissions. One verified owner grant and one distinct verified reviewer grant exist; real-session acceptance is not complete.

These are source and configuration observations, not approval to change production.

## Release hold

**DRAFT, SOURCE ONLY, NOT MERGED, NOT DEPLOYED.** No production database write, account signup, OTP exchange, review decision, feature-flag flip, role grant, public publication, new paid service, or site-route mutation.

Before an actual release:
1. Pass exact-head focused and full Creator V1 CI plus visual checks at 1440/1024/390/320. Review both old and new source lineages; do not assume CI means real user acceptance.
2. Obtain real authenticated owner and independent reviewer action on IREN with the reviewer explicitly accepting or rejecting a real pending item. The owner must not self-approve. Verify anti-CSRF, 401/403 boundaries, mobile Safari, report/reply/privacy behavior.
3. Compare live Worker and assets to the exact candidate, independently preserve **all 24 bindings**, four opaque secrets, both D1 databases, narrow staff routes and exact rollback Worker version. Do not use `wrangler deploy --keep-vars` on the script-API-managed gateway; that approach previously removed opaque secrets.
4. Stage a rollback-ready nondeployed Worker version, verify binding parity and public registration, and only then consider guarded promotion. Keep forum, upload, OAuth and recognition grants independent of appearance/route work.
5. Complete actual creator publishing through the separately owned [#329](https://github.com/anevum/anevum-web/issues/329). [V070 PR #499](https://github.com/anevum/anevum-web/pull/499) adds metadata-only author-consented external-work approval on the V069 recognition lineage; it is independent, not a justification to mark uploaded media or native packs public. Coordinate the final integration rather than implementing a competing public release service.

Do not solicit broad community registrations or launch paid memberships until an authentic member-to-moderator-to-guest-to-member journey passes.
