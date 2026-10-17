# ANEVUM / CONTINUANCE INSTITUTE
## Moderator Console V043 — Review Queue Continuity

**Session:** ANEVUM.WEB.BUILD.2026-10-16.003.MODERATOR-PAGINATION  
**Status:** Implementation and isolated testing in PR #455; no staging promotion or migrations.  
**Existing deployed baseline:** V042 on \`a.anevum.com/community/review\`; private Backstage local planning at \`lab.anevum.com/projects/backstage/moderation/\`.

### Why this increment matters

V042 correctly shows real global workload totals, but only the first 50 pending
threads/replies/reports and 25 audit records. Moderators need a safe way to
reach older records without closing or rejecting content merely to uncover
the next window. This is an operational and trustworthiness gap rather
than a visual redesign.

### V043 implementation

- Add strict server-side keyset cursor reads scoped to verified, authorized
  canonical forum reviewers.
- Use ascending \`created_at, id\` for pending threads and replies; ascending
  priority (unsafe > harassment > spam > other), then \`created_at, id\` for
  member reports; descending \`created_at, id\` for decision history.
- The first V042 snapshot remains unchanged in its core fields and now includes
  per-lane continuation cursors. A lane continuation returns a fixed-sized
  page and optional next cursor, never a full unbounded collection.
- Input must be exactly \`?lane=<threads|replies|reports|activity>&after=<strict cursor>\`.
  Invalid, duplicate or unexpected query parameters fail with HTTP 400.
  Anonymous callers are still denied 401 and unauthorized signed-in members
  403 before any staff-only query.
- Client presents an explicit **LOAD MORE** affordance per lane; deduplicates
  item IDs; accurately distinguishes global counts, loaded window and local
  search results; resets cursor and local pages after a real moderation
  decision or explicit refresh.
- Reporter identities and account emails remain withheld. New pages use
  the same existing author privacy and independent-review checks, including
  parent publication eligibility.
- In-progress page reads block mutation decisions until completion so stale
  page results cannot be mixed into a just-reviewed queue.

### Acceptance gates

1. Compile TypeScript and build the React PWA without errors.
2. Test 73 pending threads with identical timestamps and distinct UUIDs:
   first 50 + remaining 23, no duplicates, no gap.
3. Test 55 replies, 57 priority-ordered reports and 51 audit decisions;
   confirm full continuation, privacy and stable ordering.
4. Test invalid cursors, repeated query parameters, external filters,
   anonymous requests and unapproved member access.
5. Render and interact with 65 synthetic pending threads in real Chrome
   at 1440, 1024, 390 and 320 pixels. The 50-to-65 Load More transition
   must work; self-authored staff content cannot be approved.
6. Pass the unchanged V041/V042 regression and on-page decision tests.

### Reviewer readiness

V043 does **not** grant anyone authority. The existing verified @devon
account is initially the only configured moderator. The author's own pending
thread requires a distinct trusted person, who must:

- establish a verified canonical member identity;
- be explicitly designated by the owner;
- receive only reviewer-scoped authorization using the versioned secret
  configuration, retaining current reviewer IDs and existing secret bindings;
- pass an authenticated two-person smoke test for approving another member's
  content and refusing their own submission;
- be given the moderation protocol covering sensitive evidence, report
  handling, privacy and consistent decisions.

Do not add a random user ID, fabricate a reviewer, publish private member
identifiers in source, or bypass the self-approval rule.

### Release boundaries

No schema mutation, data seed, DNS update, provider signup change,
real-member action, public ANEVUM launch, RHEN/Stripe operation, or
unsolicited permission assignment. Promote only after exact-head CI
and an independently guarded staging release with recorded Cloudflare
rollback version and hosted API/asset verification.
