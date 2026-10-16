# ANEVUM / CONTINUANCE INSTITUTE
## Community Integrity Lab / Moderator Console V042

**Canonical session:** ANEVUM.WEB.BUILD.2026-10-16.002.MODERATOR-CONSOLE  
**Lab identifier:** LAB.WEB.COMMUNITY-INTEGRITY.V042  
**Status:** Active development / draft review. Not deployed.  
**Working source:** build/community-moderator-console-v042-20261016  
**Pull request:** https://github.com/anevum/anevum-web/pull/451  
**Established baseline:** V041 staging forums on a.anevum.com, source merged in PR #449.  
**Route after a future gated release:** /community/review

### Intent

Provide real staff a compact but capable operational workspace to oversee community
conversations before broader access opens. Continue the established ANEVUM
community experience and member cards rather than building a parallel identity
or a new lab-only moderation database.

This release **does not** redefine the unrelated legacy trading experiment
page at src/pages/Lab.tsx. "Lab" here means an isolated development workstream,
with synthetic QA and a separately authorized staging release.

### Locked integration boundaries

- Retain Better Auth canonical member identity; the real review authorization is
  server-side: a verified session plus membership in
  CANONICAL_FORUM_REVIEWER_IDS, which remains secret.
- Continue the live V041 MEMBER_DB schema and its existing audited mutation
  endpoint. V042 adds no schema migration, secrets, roles or permission grants.
- All exposed reviewer author identities use public profile representation when
  available, with earned levels and chosen awards from the existing progression
  model. Private profile images, rewards and level data are not exposed.
- Reporter identities, member email addresses and canonical internal user IDs
  must never appear in the review payload.
- Every action is confirmed in a modal, executed server-side, and written to
  the existing audit log. The UI is not the authorization boundary.
- Reviewers cannot publish their own threads or replies; authors and parent
  discussions must still be public and verified when publication happens.
- No XP awarded for submitting, approving, reporting, hiding or dismissing.
- No automated moderation decisions or inferred safety-risk score.
- No change to public signup, launch timing, public home page DNS, RHEN,
  billing, financial or production systems.

### V042 interface

1. **Overview** — real open-record totals, oldest work timestamp and a short
   preview of highest-priority reports and oldest pending submissions.
2. **Thread queue** — full body and author card, independent approval guard,
   explicit publish/reject decisions.
3. **Reply queue** — member card, parent topic and title, parent link,
   publication eligibility, publish/reject decisions.
4. **Report triage** — ordered by user-selected safety reason (unsafe, harassment,
   spam, other), original reported content excerpt up to 600 characters,
   publication/parent status, original author context, hide/dismiss actions.
   Reporter identity withheld.
5. **Decision ledger** — latest 25 audit records with reviewer public handle,
   action, target category and time, explicitly labeled as a limited snapshot.

Review lists are capped at 50 records per category per fetch. Totals are
full-database counts, not mistaken for 50-item totals. Search filters only the
currently loaded review window. Empty states represent actual empty results
rather than seeded activity. Manual Refresh fetches current server state.

### Staff safety protocol

- Do not approve a record simply because it is in the queue; inspect its
  actual author and content, applicable rules and parent context first.
- A self-authored pending record shows **SECOND REVIEWER REQUIRED** and the
  approve button disabled; the server independently refuses the action.
- Hiding an already published item resolves existing open reports on that
  exact target. Dismissing a report does not unpublish content.
- A report can be read after its author changes profile visibility; any
  public member view continues to respect the author privacy opt-out.
- A stale review returns 409 and does not silently overwrite another reviewer.
- No appeals, sanctions, account bans, automated strike history or global
  profile lockouts are implemented in V042; these require a separate policy
  and explicit due-process design.

### Build and verification

- Node tests: creator-v1/test/forum-review-console-v042.test.mjs
  (reviewer authorization, reporter privacy, full queue totals, prioritization,
  independent approval, private/invalid authors and audit persistence).
- Browser fixture: creator-v1/test/capture-moderator-console-v042.mjs,
  loopback-only with synthetic Better Auth member session, reports, threads
  and moderator; responsive snapshots at 1440/1024/390/320 pixels.
- GitHub Actions: .github/workflows/creator-v1-verify.yml; use the final
  exact-head result, not older successful runs, before merging.
- No browser fixture or synthetic member records are uploaded to canonical
  staging D1. Screenshots are labeled synthetic acceptance, not live usage.

### Next release gate

Complete offline UI/API tests and visual QA. Obtain explicit staging release
approval; take a live Worker rollback checkpoint and confirm both D1 bindings,
existing authentication secrets, active V041 forum feature flag, current
Series One artwork and apex route. Deploy exact-reviewed source to
a.anevum.com only, verify real signed-in reviewer A versus author B with
permission isolation, and roll back if access or member profile behavior
changes unexpectedly.

### Future work, not in V042

Multi-reviewer case claims/assignment, explanatory internal moderation notes
with durable encrypted/audited storage, appeal workflows, search across the
complete queue, richer report evidence preservation, optional community
transparency metrics, and later a member-facing community guidelines center.
These should be scoped as separate additions after this console is stable.
