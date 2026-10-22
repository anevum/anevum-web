# ANEVUM platform completion and alpha release record

Session: `ANEVUM.ANEVUM.UPDATE.2026-10-22.001.PLATFORM-COMPLETION`  
Target: January 1, 2027 alpha. Current state: **protected candidate available; public release hold**, October 22, 2026.  
Operational record: [issue #622](https://github.com/anevum/anevum-web/issues/622).

## Verified checkpoint

Production apex remains `93cc7f07-cf39-457e-af69-c9f6f4c02d25` at 100%; the verified recovery candidate `6f26f0cc-6eee-483d-9f07-329e45bd5e76` is selected at 0% in deployment `6372ee35-8c7d-468c-9486-536d9c4b0a0d`. The existing Access-protected opt-in path was renewed for four hours. All 40 routes, Access policies, database records, entitlements, purchases, recognition and public traffic remain unchanged.

The genuine founder browser loads the existing homepage, older Creator Studio and Observatory with owner clearance. Observatory has no test-XP counters or controls. Homepage still features Single Drift with the description “This is a test game.” This is an editorial blocker, not permission to silently publish replacement content.

D1 readback: six members; seven legitimate milestones (115 XP total); three active independent recognition grants; zero synthetic XP events; zero obsolete level notices; ten award notices. The 1,783-event recovery snapshot and the trigger preventing new test-button events remain intact. Issues #619/#620 are closed as obsolete; do not run #616 or activate the global reset.

## Integrated implementation

[PR #612](https://github.com/anevum/anevum-web/pull/612) merged as `f14ee877f6aa4c66ce555d43ef23a18572544d88` after all 12 exact-head workflows passed. Exact application source `7630a8b2fef77571862a51417499021d4c162bd2`.

This source combines current release code, V104 Studio navigation/IREN frame recovery, #621 calibration retirement, and public profile/mobile recovery. The retired XP API was additionally removed from the Worker allowlist so guests and all methods receive 404 before authentication or D1. Its inner handler also remains permanently disabled.

Local validation: TypeScript and feature-enabled root Vite build passed; 35 integrated recovery tests, 21 progression/auth tests, 134 creator lifecycle/permission tests under Node 22.23.4, and 27 asset/release guard tests passed. Some suites overlap; these counts must not be added into a claimed unique total. Node 24 produced an asynchronous synthetic multipart-stream error; the pinned Node 22 suite passed without altering upload behavior.

The existing inactive-upload workflow and guard were reused on `ops/platform-candidate-20261022-001`. Exact application bytes remain pinned to `7630a8b2fef77571862a51417499021d4c162bd2`; the successful upload packaging is `e30ab2034cebb0be07d78de59a44bf3d9d8ad85b`. The guarded public-production workflow remains unchanged.

## Protected deployment checkpoint — October 22, 2026

The first upload attempt stopped at the source-CI dependency while those checks were still running and wrote no Cloudflare resources. The successful guarded [upload run 39798435382](https://github.com/anevum/anevum-web/actions/runs/39798435382), packaging `e30ab2034cebb0be07d78de59a44bf3d9d8ad85b`, rebuilt and verified the exact immutable root assets, all 152 earned assets, mobile/desktop root rendering, unified Studio and IREN silent-GPU fallback before uploading. A direct Cloudflare readback independently confirmed the new version, 26 bindings, root asset runtime and retired XP flag false.

- Apex candidate: `6f26f0cc-6eee-483d-9f07-329e45bd5e76` at 0%; original public version remains 100%.
- Existing entry: `f1fd80b0-9121-4dc8-a0b8-b35161c2b726`, deployment `9c0312b8-4356-40bd-8419-d9bc6158f2e9`.
- Bounded testing expires October 22 at **2:53:43 p.m. Eastern** (`2026-10-22T18:53:43Z`).
- Existing Transform Ruleset version 11 still strips caller overrides, preserves the same protected opt-in cookie and the four existing private backend/Command pins, and selects the new apex plus the **currently live V104 Observatory**. This avoids routing testers back to the obsolete V100 Observatory.
- Both existing Access applications retain explicit founder allow policies and no bypass rules. No Access policy changed.
- Post-deployment D1 readback again confirmed six members, zero synthetic events, seven milestones, three grants, zero level notices, recovery rows 1,783, and the insert-blocking trigger.
- The current public /thebutton browser navigation reaches /member, so the required /levels redirect is **not yet publicly released**. A public GET to the retired API returns 404; all-method candidate and authenticated visual verification still require protected sign-in.
- Fresh Cloudflare Access sign-in blocks the protected browser entry. The secure sign-in request was rejected by automatic approval review because the workspace was out of credits; no sign-in action executed. No workaround or Access bypass was used. No real-account, physical Safari, visual or public-promotion gate has been claimed complete.
- Reverified at `2026-10-22T17:57:15Z`: the same public 100% / candidate 0% deployment, all 40 routes, all preservation counts and the insert-blocking trigger remain intact. D1 readback wrote zero rows.

The checked-in entry bundle is the existing tested acceptance handler with only the immutable source/candidate pins and review-window copy updated. Its SHA-256 is `8523c9572da29d8732a497f18a43712b8eb26785255e5f77dbee86fd3afc64ab`; twelve retained protected-entry tests passed.

A further compiled-browser regression on the packaging branch exercises a one-time wall HTTP 503 and successful manual retry at 1440/390/320. It verifies that identity remains visible and successful profile/space reads are not repeated. Hosted Creator V1 run [39800486308](https://github.com/anevum/anevum-web/actions/runs/39800486308) passed this regression. The broader synthetic recovery artifact contains 31 passing cases, including saved drafts, private playback, account switching, permission isolation, independent review and bounded retries. These results are separate from genuine account/device acceptance.

## Release-readiness checklist

A source test is not live acceptance. Every live result must record source, immutable version, account role, browser/device, time, evidence and outcome.

| Gate | Required evidence | Current state |
| --- | --- | --- |
| XP data | Rechecked milestone, recognition, recovery and synthetic-event counts | Verified |
| Observatory retirement | Genuine owner engagement/member views without test controls | Verified live |
| Retired public routes | Selected release: /thebutton reaches /levels; xp-test returns 404 for every method and session state | Source tested; live release pending |
| Exact build | Complete CI, root assets, private earned media, immutable candidate receipt | Verified; candidate selected at 0% |
| Studio consolidation | /studio is the single front door; records, builds, upload and review use the existing services | Integrated; live candidate pending |
| IREN | Visible animated frame, silent-GPU/context-loss fallback, motion preferences, usable controls | Hosted pixel/GPU fallback tests passed; candidate/device review pending |
| Public profile | Wall outage/timeout/retry preserves public identity; private and missing profiles stay nonrevealing | Integrated; candidate verification pending |
| Responsive experience | 320/390/768/1440, keyboard, focus, readable type, touch targets, no overflow or dock obstruction | Hosted checks passed; founder visual acceptance pending |
| Identity | Actual owner, independent reviewer and ordinary member; account switch and expiry reveal no stale private data | Source tested; final real-account acceptance open |
| Signup | New independent tester receives OTP, completes onboarding, signs out/in and recovers access | Live health ready/open; full journey pending |
| Creator lifecycle | Private upload -> exact playtest -> save/reload -> submit -> independent review -> founder-approved publication | Synthetic lifecycle passed; genuine acceptance pending |
| Player/discovery | Approved exact release plays on isolated origin and appears in Discover/profile; private/rejected/expired content does not | Source tested; final live journey pending |
| Data recovery | Reviewed backup/restore and version rollback retain projects, originals, receipts, purchases, recognition and entitlements | Prior evidence retained; final-release reconciliation pending |
| Content | Replace public test copy/artwork with founder-approved accurate material; verify ownership/rights | Founder editorial decision required |
| Alpha communications | Final live capability list, deep links, screenshots, feedback route and founder go/no-go | Drafts only |
| Public promotion | Complete real acceptance, reviewed current baseline, rollback IDs and guarded release | Hold |

## Private communication drafts

These are proposals for founder review. They are not sent, published or launch approval.

### Progress / feedback invitation

I'm building ANEVUM as a home for independent creative work—games, stories, worlds, and the people making them.

I'm working toward a January 1, 2027 alpha. Right now I'm focused on making the experience clear and useful: finding something to explore, creating your identity, and moving through the site without getting lost.

If you try the current build, I'd like specific feedback. What did you expect to happen? What actually happened? What device and browser were you using? A screenshot or short recording helps.

ANEVUM: https://anevum.com

Before posting: confirm the current release is suitable for outside testers, approve the feedback destination, and identify which creator capabilities are actually available. Do not imply the gated uploader, publishing workflow or Workbench is publicly open.

### Reddit feedback post

**Proposed title:** I'm building ANEVUM, a creative network for games and independent projects. I'd like feedback on the first visit.

I'm Devon, the founder of ANEVUM. I'm building a place where independent creative work can connect: games, stories, worlds, and the people behind them.

I'm working toward a January 1 alpha, and I'm testing whether the first visit makes sense. Can you tell what the site is for? Can you find something to explore? Does it feel usable on your phone?

I'd especially appreciate one thing that confused you and one thing you'd change. Please include your device and browser if something breaks.

This is an early build, and I'll be clear about which tools are ready and which are still being tested.

Before posting: founder approves the final copy, community, link and any images; verify that community's current self-promotion rules and obtain permission where required. No subreddit has been selected or contacted. Replace the tentative date language with verified launch status at posting time.

### Release-day shell

**Hold until the alpha is actually live and accepted.**

ANEVUM's alpha is live.

I'm opening the first version of a creative network for independent games, stories, worlds, and the people making them. This is the beginning. I want to build it around work people can actually explore and feedback that helps make the next version better.

[Insert only the capabilities verified in the final live release.]

Explore ANEVUM: https://anevum.com  
[Insert the founder-approved feedback link.]

No automated posting, spending, newsletter, invitation, moderation decision or public content update is authorized by this file.
