# V100 continuation: implementation and release evidence

Session: ANEVUM.ANEVUM.BUILD.2026-10-21.001.CREATOR-STUDIO-UPLOADER-PLAYER-V100

Release branch: `release/v084-continuance-approved-20261019`. Source merge,
inactive version upload, protected test selection, and public release are
separate operations. No passing synthetic test counts as human acceptance.

## Verified starting environment on October 21, 2026

This baseline is superseded by the final protected checkpoint below.

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
| Restricted Workbench | #608 reconciles #576 into `/studio/workbench`, preserving `/studio/alpha`. Same canonical projects, verified invite/owner gate, branching editor, undo/redo, preview, versioned private saves and export. | Live D1 rehearsal/schema approval and invite/account acceptance; source and SQLite rehearsal passed. All activation flags OFF. |
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


## Final protected checkpoint — October 21, 2026, 7:04 p.m. Eastern

Merged source: #607 (local compatibility), #608 (canonical restricted Workbench),
#610 (bounded reads/account isolation), and #611 (restricted native frame policy).
Release branch integration is `f831375d35f883c0f4a5129750d05e117068c7e5`.
The frontend candidate was built from exact reviewed head
`04960a1b7540d9e33af1d4e9773f8e6cc9d7c2ba`; frame source is
`f1d27cb4d64debed2b282cd2ba17f89e96bedd00`.

All thirteen exact-head recovery workflows and all six frame-policy workflows
passed. Compiled Chromium exercised 28 native/recovery cases, 320/390/768/1440
layouts, root-path JavaScript/CSS, same-page account switching, timeout/retry,
isolated execution, stale release refusal, private expiry and review boundaries.
Four additional frame tests plus 30 retained backend/bridge tests passed locally.
The two additive migration rehearsals preserved existing rows, verified integrity
and foreign keys, issued no marks/invites, and restored a pre-migration SQLite
backup. They do not certify a live D1 restore.

**Deployment gap found and repaired privately:** the live V003 controller and
route bridge did not contain the previously merged native V095 code, and the
outer HTML wrapper could not frame the isolated runtime. Matching immutable
candidates now use the same original Worker names, databases, R2, secrets,
canonical identity, pilot/reviewer lists and runtime origin. Existing public
versions remain 100%; every new application/backend version is 0%.

| Worker | Private immutable version | Current deployment |
| --- | --- | --- |
| Apex | `7b9dbcdf-0fbd-4cbc-8e98-184724324553` | `a63cfbf0-2217-40c8-b6a9-17e026453094` |
| V003 controller | `2720ea00-2030-43ff-84fc-8d6faf4d003b` | `6306bbbf-7954-4f91-850c-9b0edf89dca4` |
| Existing creation bridge | `7e281e4e-893c-4f59-977d-895c7ee616b4` | `b4ebd6d9-e77d-4e1e-8843-5f6f7a72f3fa` |
| Existing frame wrapper | `20652959-0acb-4a53-bf59-1b80da1c0a55` | `4642758c-164d-439e-bc31-c2eb7efd793a` |
| Legacy Command | `4699cfd9-d9d0-44f2-b1b2-f56a4627f429` | Existing `78d0afa5-31e7-4b50-8b41-4393667ebf7d` |

Apex bindings/runtime are identical to the previous protected candidate; canonical
creator uploads remain OFF and Workbench remains OFF. Each of the three backend
candidates preserves every original binding and adds only its private native
presentation flag. Public backend versions do not contain that flag. No candidate
preview URLs were enabled; the controller's pre-existing workers.dev host was
preserved. No migration, grant, invitation or publishing decision was performed.

The existing protected entry is
[anevum.com/__enter/v095-v096](https://anevum.com/__enter/v095-v096).
Entry version `27befdc9-5238-40e7-b9de-3c2acd542309`, deployment
`14e85ac8-b185-44a4-9374-d4c96c1cb898`, uses the original Access protections
and inherited secret bindings. Ruleset version 10 preserves caller-override
stripping and the same routing cookie; it pins the six matching private
application/Observatory/Command/backend versions. The test window expires
**October 21 at 10:58:05 p.m. Eastern** (October 22 02:58:05 UTC).

Independent final Cloudflare readback passed 13 invariants. All 40 routes remain;
both Access applications retain explicit owner allow rules with no bypass.
The live ten-path signed-out perimeter passed again. Anonymous native requests
and caller-spoofed version overrides both received the unchanged public
controller's HTTP 403 denial. Signed-out entry requests still redirect to Access.

The frame candidate was removed and restored as an actual preparation rollback
rehearsal: rollback deployment `a6d254b4-125d-437b-92f8-bd0a84b828cd`, then
restored deployment `4642758c-164d-439e-bc31-c2eb7efd793a`. The original public
version remained 100% throughout. No database was involved.

### Remaining acceptance and scope

Use a physical iPhone Safari with the genuine authorized founder session:
activate the protected entry, confirm My Space/Founder Console live data,
Command's protected API handoff, read-only Community Review Desk queue, and
Studio/Playable builds/native private-player loading. Use the approved pilot
path for a private upload/recovery test. Do not approve or publish real content
as part of this read-only staff acceptance. A separate genuine reviewer and
ordinary member must prove positive/negative isolation and independent review.

Live designation migration/independent issuance, Workbench schema activation and
genuine invited-account acceptance remain unperformed. Connected AI, metered
model execution, source-code builds and general PWA install/service-worker
capabilities remain future implementation, not hidden completed features.
Public rollout remains unapproved.

To withdraw this private test, restore entry deployment
`5afab7d5-5622-4c4b-b133-b774d376ab28` and ruleset version 9 (both old windows
are expired), restore the apex prior 100%/0% pair from deployment
`46b2baba-1622-4b91-b27e-a0446ab92720`, and return backend selections to their
original public versions only: controller deployment
`cc2f0694-7f2a-49c0-8cf8-7906d9cabe59`, bridge
`d0c9d0c9-eb49-49d6-9dca-e63c8948d700`, frame
`bc151f5f-f2bd-44c1-bdfe-ad8b178f5838`. Restore version selections with the
existing API/workflow; do not delete versions or data. No schema rollback is
needed because no live schema change occurred.
