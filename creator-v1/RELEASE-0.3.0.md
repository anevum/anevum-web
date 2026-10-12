# ANEVUM V1 — Member Projects and Editorial Review

Session: `ANEVUM.WEB.BUILD.2026-10-11.006.MEMBER-PROJECT-PUBLISHING`
Date: 2026-10-11 (America/New_York)
Status: Staging candidate (production unchanged)
Target: January 1, 2027 public opening

## Shipped in source

- Authenticated project workspace under `next.anevum.com/api/v1/member/projects/manage`, using the approved cinematic ANEVUM design; no fictional project activity.
- Owner-scoped project list, private detail, create draft, revise and submit routes under `/api/v1/member/projects`. Existing signed-in staging identity, strict origin checks and database rate limiting are reused.
- Revision numbers prevent stale saves; only drafts and requests for changes are editable. A submitted project cannot be edited until staff sends it back.
- Project metadata validates title, handle-scoped URL slug, category, declared free access, optional license, public HTTPS demo/source URLs, AI and human contributions.
- Staging DB migration 0004 adds a monotonic project revision and auditable member-to-staff project workflow events.
- Studio remains behind Cloudflare Access on `studio.next.anevum.com`. Its new separate member review queue is available only to signed owner staff. Staff can publish, request changes, or reject with a meaningful reason. The review decision uses the current revision and produces an audit event in the same database transaction.
- Member detail includes the latest staff feedback without exposing staff email. Public project search and category counts still select `published` projects only.

## Verification

- 38 local Node 22 tests passed: original member authentication (20), original protected Studio authoring (9), end-to-end project/queue workflow (9).
- The 9 integration tests use an isolated SQLite database and simulate signed member sessions, a Cloudflare Access RS256 assertion, two independent creators, draft/approval/rejection, revision conflict, forbidden cross-account reads/edits, and public catalogue visibility.
- Generated client JavaScript for both member workspace and Studio review queue passes `node --check`.
- **Not yet evidence of real owner-browser acceptance or live Cloudflare publication.** That needs separate staging checks after deployment.

## Deployment sequence

1. Confirm `anevum-creator-v1-staging` is the only target D1 (never production / legacy).
2. Apply `creator-v1/auth/migrations/0004_member_project_workflow.sql` once; confirm `revision`, new audit table and schema_migrations marker.
3. Deploy all `auth/worker.mjs`, `auth/join.mjs`, `auth/projects.mjs`, `auth/projects-ui.mjs` modules to `anevum-member-auth-staging` with inherited pepper/Turnstile/Resend/invite secrets and isolated staging D1.
4. Deploy `authoring/worker.mjs` and `authoring/review-snippets.mjs` to `anevum-creator-studio-staging` with inherited Cloudflare Access app settings and staging D1.
5. Verify routes, bindings and signed owner session; test a real invite-code session followed by a member submission and an owner review. If email delivery or owner credentials are unverified, do not enable public signup or production writes.

## Next acceptance gates

- Complete real invite signup/email delivery/Turnstile and a second browser's non-owner denial.
- Evaluate replacing the custom authentication prototype with an audited provider before general registration.
- Confirm account export/delete and email changes; add publication appeals and operational moderation monitoring.
- Test mobile keyboard/accessibility, rate limits under concurrent D1 load, backup restore and rollback.
- After verified first-party and invited creator submissions, expand genuine project discovery, voting, XP and collections. Keep paid vote weight and hosted untrusted execution out of V1.

## Protected systems

`anevum.com` remains the read-only public creator foundation. The old V5 site remains archived behind Backstage. No RHEN, broker, Railway or legacy credentials participate in this work.