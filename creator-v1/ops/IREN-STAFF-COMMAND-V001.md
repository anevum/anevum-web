# ANEVUM / IREN — Staff Command V001
Session: \`ANEVUM.IREN.BUILD.2026-10-17.001.MODERATOR-COMMAND-PORTAL\`
Status: SOURCE-ONLY, DRAFT, FEATURE OFF / NOT DEPLOYED (2026-10-17)
Owner: ANEVUM / IREN

## Purpose and UI
A dedicated authenticated moderator/staff room at \`/staff\` on canonical Creator V1.
The physical page viewport never scrolls. Its record panes can scroll internally.
The layout has a persistent left terminal rail, a central active module, and an
activity + peer bridge panel. Mobile replaces the rail with seven compact
single-screen tabs; voice/video appears in a dock on the Comms pane.

Seven modules:
- Overview: actual canonical member count/verified count (owner only), case counts,
  manually recorded outreach, tasks, staff signal.
- Comms: operations, moderation and projects staff text rooms.
- Whiteboard: normalized, bounded drawing events and channel-specific clears.
- Invitations: manual founder outreach aliases, channel, stage and short notes.
- Assignments: open/in-progress/blocked/done shared priorities.
- Review: existing server-authorized forum-review decisions; full pagination
  remains in /community/review.
- Personnel: verified canonical member IDs in trusted server-side allowlists.

## Source and dependencies
- Frontend: \`web/src/pages/StaffCommandPage.tsx\`,
  \`web/src/pages/staff-command.css\`, \`web/src/components/StaffBridge.tsx\`.
- Source-protected API: \`canonical-auth/staff-ops.mjs\`,
  \`canonical-auth/worker.mjs\`; same-origin composer \`web/a-canonical-stage.review.mjs\`.
- Schema: \`canonical-auth/migrations/0010_staff_command.sql\`
  on the isolated canonical \`MEMBER_DB\` ONLY.
- \`web/a-staging-worker.mjs\`: grants document-scoped mic/camera browser
  *permission prompts* only on /staff and /moderators when feature gate is ON.
- Existing authenticated independent review: \`/api/v1/member/forum-review\`.
- Tests: \`test/staff-command-v001.test.mjs\`, \`npm run test:staff-command\`,
  plus the full Creator V1 test suite, TypeScript check and Vite build.

## Trust model
The authoritative account is the verified Better Auth \`user.id\`; no access via
handle, email, localStorage, OAuth guess, referral, supporter purchase, XP,
or "staff-candidate" outreach stage.
\`CANONICAL_STAFF_OWNER_IDS\`: explicit founder/owner immutable user IDs.
\`CANONICAL_FORUM_REVIEWER_IDS\`, \`CANONICAL_FORUM_ADDITIONAL_REVIEWER_IDS\`:
explicit verified reviewer IDs; existing independent-review rules remain.
\`CANONICAL_STAFF_OPS_ENABLED\`: must be \`true\` to use the new API,
otherwise every request returns a closed 404.

All staff can post to staff channels and create/update tasks, use whiteboards
and direct peer calls. Only the owner sees overall signup totals, and only
the owner can create/update friend outreach records. Outreach records are
visible to authorized staff; entries are **manual statements, not confirmed
signups** and never initiate mail/OTP or grant a role. This first version
has no untrusted public-facing invitation endpoint.

Only signed-in, verified, authorized staff can read API data. Writes use
same-origin CSRF checking at the canonical Worker. No SQL error/details,
member email list, bearer token, raw DB row or moderation reporter identity
may escape in responses. Public routes continue to deny camera/microphone.

## Staff collaboration: release limitations
- Persistent staff messages and tasks in D1; poll interval is approximately
  6 seconds on active Comms/Whiteboard panes, 20 seconds otherwise, paused
  when tab is hidden. **This is not WebSocket-based instantaneous messaging.**
- Whiteboard uses bounded event logs with a 240-entry latest event window;
  snapshots/compaction must be developed before large workshops or long-term
  diagram storage. No embedded files or image uploads.
- Voice/video is an explicit mic/camera opt-in with a separate incoming call
  Accept/Decline step. This pilot uses browser WebRTC and same-origin
  D1-based offer/answer/ICE signaling for **one-to-one calls only**.
  STUN alone does not work on all carrier/corporate networks. No recording;
  it is *not* guaranteed encrypted end-to-end from infrastructure-specific
  metadata. Multi-user rooms, robust mobile call handoff and TURN/SFU
  need a separately evaluated media infrastructure service.
- Only configured verified members may appear in the staff roster, with a
  bounded 40-user snapshot. No in-browser role elevation.
- Default-off retention job clears SDP/ICE call signaling older than
  10 minutes and stale presence/limits **when scheduled maintenance is actually
  triggered**. Current stage Wrangler source may not configure a cron trigger:
  verify this explicitly before enabling calls. Without a trigger, old signals
  are only purged opportunistically on a new offer. Do not describe them as
  automatically short-lived until retention is operational.

## Required release sequence — stop on failure
1. Run full GitHub Actions source verification and unit/security tests, including
   the owner-only log and camera policy checks; visually inspect 320, 390,
   768 and 1440 width, including internal scrolling and accessibility.
2. Back up and identify the **canonical staging** MEMBER_DB and apply only
   additive 0010 migration after schema review. Never use a legacy Community,
   Creator, RHEN, or apex production database.
3. Confirm the exact current staging Worker route, account, D1 bindings,
   existing signup/Stripe/Studio settings and rollback Worker version before
   release; perform no unapproved change to these.
4. Configure immutable staff owner ID(s) through protected Worker settings.
   Retain both existing reviewer-ID secrets without resetting them. Do not
   expose full IDs in logs, pages, PRs or browser local storage.
5. Release under the existing guarded stage workflow after updating its
   source/rollback pins and checks; activate \`CANONICAL_STAFF_OPS_ENABLED=true\`
   only after D1, authorizations, and dry-run verification are ready.
6. Test with founder and second authorized reviewer: read access, owner
   invitation-only control, real forum report decision + audit, chat,
   two-device whiteboard, voice/video permissions + incoming consent,
   logout and revoked-member rejection, network interruption, rate limits.
7. Reject deployment if failed health, permissions-policy, mobile overflow,
   browser access, audit mismatch, D1 cost or missing reversible rollback.
8. Move the approved same-origin setup to \`anevum.com\` **only as part of a
   separately verified canonical apex cutover**, preserving identity/CSRF
   boundaries and media permissions. Do not point public pages to a staging
   session through a cross-origin proxy.

## Expansion path
Priority next modules: staff assignment ownership and shifts; triage
escalation/SLA; invitations linked to accounts only with an explicit referral
consent flow; staff-only file room; shared meeting notes; read-only system
status; moderation appeal queue; audit export; bot-assisted flagging without
autonomous destructive actions; Durable Objects realtime event fanout;
durable canvases with compaction; and standalone TURN/SFU conferencing.
Respect budget: avoid continuous high-frequency whole-table polling or
paying for media servers before users need them.
