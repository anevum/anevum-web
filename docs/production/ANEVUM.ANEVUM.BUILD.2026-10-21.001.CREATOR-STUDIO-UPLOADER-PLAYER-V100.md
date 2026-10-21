# V100 continuation: implementation and release evidence

Session: ANEVUM.ANEVUM.BUILD.2026-10-21.001.CREATOR-STUDIO-UPLOADER-PLAYER-V100

Release branch: `release/v084-continuance-approved-20261019`. Source merge,
inactive version upload, protected test selection, and public release are
separate operations. No passing synthetic test counts as human acceptance.

## Verified environment on October 21, 2026

- Apex deployment `46b2baba-1622-4b91-b27e-a0446ab92720`: original
  `93cc7f07-cf39-457e-af69-c9f6f4c02d25` at 100%, protected V100
  `ed44a70c-2adb-4048-a7a5-82e7a457528d` at 0%.
- Legacy Command public `62692eef-e7fb-479d-88fe-62c5fcaff5f9` at 100%,
  canonical redirect candidate `4699cfd9-d9d0-44f2-b1b2-f56a4627f429` at 0%.
- Forty existing Worker routes; staff-ops and forum-review remain under the
  existing Access application. Tester routing retains caller-override stripping.
- Canonical Studio enabled; canonical creator uploads disabled. Existing 26
  binding signatures, original D1 identities and `nodejs_compat` retained.
- Read-only D1 inspection confirmed founder account email verified with active
  owner grant. It wrote zero rows. Studio projects/assets/submissions tables exist.
- Neither `member_role_grants` nor Workbench invite/audit tables exist in live
  MEMBER_DB. Public role designations and Workbench cannot be declared activated.
- Previous private QA entry expires October 21 at 6:47:35 p.m. Eastern. A later
  candidate needs a newly verified bounded window, not an unbounded bypass.

## Canonical implementation inventory

| System | Current source and disposition | Remaining gate or work |
| --- | --- | --- |
| Better Auth and staff access | Preserve canonical identity plus server-verified, nonrevoked `staff_access_grants`. Founder shortcut and Observatory recovery are integrated. | Actual owner/reviewer/member and physical Safari acceptance. |
| Review Desk | #604 merged; distinguishes exact member/role errors, Access challenge, invalid response and outage. Verification opens only a protected non-queue suffix. | Real Access handoff and read-only queue loading, issue #603. |
| Legacy Command | #605 merged; exact legacy paths redirect through native verified staff entry. Protected candidate prepared. | Real Command API loading behind the separate unchanged Access layer. |
| My Space | #606 merged: wall and space load independently, stale responses are rejected. V103 bounds read time to 15 seconds. | Live account switching and physical-device visual acceptance. |
| Studio project records | Existing canonical project, revision, asset quarantine and review-snapshot APIs. V103 adds account/mode/project remounts, bounded reads and explicit retries. | Uploads remain paused; documents/assets are not automatically playable or publishable. |
| Playable uploader | V003 is the canonical service, presented in native React V095. #607 merged V005 local compatibility analysis using the existing V003 ZIP parser. | Real isolated pilot upload/rights/recovery/review acceptance, no public flag change. |
| Hosted player | Existing isolated origin, exact release, private expiry and immutable approved pointer. #609 adds honest frame progress, restart and same-frame phone-width/fullscreen controls. | Real iPhone Safari execution/performance, independent review. Frame load is not proof of app execution. |
| Restricted Workbench | #608 reconciles #576 into `/studio/workbench`, preserving `/studio/alpha`. Same canonical projects, verified invite/owner gate, branching editor, undo/redo, preview, versioned private saves and export. | Source integration checks, additive 0013 rehearsal and approval, invite/account acceptance. All activation flags OFF. |
| Guest local lab | Existing V096 `/studio/alpha`, local HTML/CSS with script-disabled sandbox and local export. | Preserve route ownership; never substitute this for private Workbench. |
| AI-assisted/code Workbench | Existing design and disabled connection pane, not a working AI/code-build environment. | Provider/spend decision, reviewed file-change protocol, isolated build service, budgets and real acceptance. Do not claim React-source compilation or AI calls exist. Browser-ready React exports use the uploader. |
| Player identity | Existing earned assets, Aura, badges, public profile and server-derived roles; no UI-derived staff permission. | Separate 0012 designation ledger and independently reviewed issuance. Owner clearance is not automatically a public Founder mark. |
| PWA / immersive packages | Browser exports may be validated and played under existing isolation. | PWA install/service-worker permissions, Unity/Godot/WASM and device support are conditional and not certified by local detection. Do not weaken sandbox to claim support. |

Historical #562/#569 isolated staging/reviewer systems are not the canonical
uploader. Preserve them as reference until their nonoverlapping changes are
reviewed. Do not merge main-based branches wholesale or create another account,
project database, uploader, player or public alpha route.

## V103 implementation and validation

The shared read deadline aborts underlying reads and also settles a UI boundary
when an uncooperative fetch or response body ignores abort. It never retries or
wraps a mutation. Account disposal preserves AbortError; current server denials
remain current server denials. Resource dependencies hide old data during the
account-changing render, before effects run.

The root browser harness imported `resolve` from `node:url`, which has no such
export; that harness defect is repaired. Chromium fixture cleanup now waits for
process exit and retries directory cleanup rather than failing on a timed race.

Validation is tracked in the source-linked PR checks and V103 evidence artifact.
Initial local checks: TypeScript passed; 92 integrated privacy/auth/Studio/
compatibility tests passed. Additional compiled-browser evidence must identify
the checked-out source and remain marked synthetic. Local dirty-tree captures
are diagnostic only and are not an immutable release attestation. A disposable
SQLite backup/restore rehearsal also verifies 0012 and 0013 independently:
existing accounts/projects/assets/receipts are preserved, migration retries are
idempotent, no grants are issued, integrity and foreign keys pass, invitation
and audit writes roll back together, and a pre-migration backup restores the
original schema and data. This does not certify a live Cloudflare D1 restore.

## Migration and release boundaries

1. Rehearse 0013 on a disposable copy with export/restore and integrity checks;
   preserve the current Studio tables. Obtain explicit schema approval before
   setting Workbench schema/activation flags or applying it to live MEMBER_DB.
2. Rehearse 0012 separately. Do not apply 0011 reputation/index changes merely
   to create designation tables. Do not invent an independent reviewer or grant.
3. Build a new immutable root-path candidate from the final integrated source,
   retain all 152 earned assets, run browser/root/negative auth checks, and verify
   all original bindings, runtime, routes, exposure and public traffic before and
   after inactive upload. Historical V100 is not evidence for changed app bytes.
4. Protected candidate selection must keep the original public version at 100%,
   preserve Access and bounded opt-in routing, and retain exact rollback IDs.
5. Actual owner, separate reviewer and ordinary-member isolation, private upload,
   independent review, and physical Safari remain human acceptance gates. No
   moderation decision or publication on real content is authorized by this QA.
6. Public rollout requires separate approval after evidence is complete. Keep
   `v091-authenticated.json` false until real evidence exists; never manufacture
   acceptance to make a deployment guard pass.

Rollback changes the selected immutable versions and presentation flags. It must
not delete projects, accounts, media, revisions, rights receipts or earned marks.
For the current apex pair, retain the previous deployment
`00c314cf-899b-4b2d-8540-51300bee3f7d` and original public version above. The
existing protected candidate can be deselected without moving public traffic.
