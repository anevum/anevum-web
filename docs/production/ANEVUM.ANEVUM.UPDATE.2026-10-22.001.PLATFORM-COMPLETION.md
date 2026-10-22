# ANEVUM platform completion and alpha release record

Session: `ANEVUM.ANEVUM.UPDATE.2026-10-22.001.PLATFORM-COMPLETION`  
Target: January 1, 2027 alpha. Current state: **release hold**, October 22, 2026.  
Operational record: [issue #622](https://github.com/anevum/anevum-web/issues/622).

## Verified checkpoint

Production apex remains `93cc7f07-cf39-457e-af69-c9f6f4c02d25` at 100%; protected V103 `7b9dbcdf-0fbd-4cbc-8e98-184724324553` remains at 0%. No deployment, route, Access, database, entitlement, purchase, recognition or publishing changes were made during this checkpoint.

The genuine founder browser loads the existing homepage, older Creator Studio and Observatory with owner clearance. Observatory has no test-XP counters or controls. Homepage still features Single Drift with the description “This is a test game.” This is an editorial blocker, not permission to silently publish replacement content.

D1 readback: six members; seven legitimate milestones (115 XP total); three active independent recognition grants; zero synthetic XP events; zero obsolete level notices; ten award notices. The 1,783-event recovery snapshot and the trigger preventing new test-button events remain intact. Issues #619/#620 are closed as obsolete; do not run #616 or activate the global reset.

## Integrated implementation

Continue [PR #612](https://github.com/anevum/anevum-web/pull/612), exact application source `7630a8b2fef77571862a51417499021d4c162bd2`.

This source combines current release code, V104 Studio navigation/IREN frame recovery, #621 calibration retirement, and public profile/mobile recovery. The retired XP API was additionally removed from the Worker allowlist so guests and all methods receive 404 before authentication or D1. Its inner handler also remains permanently disabled.

Local validation: TypeScript and feature-enabled root Vite build passed; 35 integrated recovery tests, 21 progression/auth tests, 134 creator lifecycle/permission tests under Node 22.23.4, and 27 asset/release guard tests passed. Some suites overlap; these counts must not be added into a claimed unique total. Node 24 produced an asynchronous synthetic multipart-stream error; the pinned Node 22 suite passed without altering upload behavior.

Existing inactive-upload tooling is reused on `ops/platform-candidate-20261022-001`, packaging `a7b9f144cc86665b4c4818a5b620f8b288b7733d`. [Candidate run](https://github.com/anevum/anevum-web/actions/runs/39795991977) pins the application bytes, tests root paths and Studio/IREN recovery, retains all 152 earned assets, requires exact-source CI and permits only an inactive upload. The candidate's obsolete XP flag becomes false; public traffic, current versions, all 40 routes, Access, D1 identities, secrets, upload permissions and public-production safeguards remain protected.

## Release-readiness checklist

A source test is not live acceptance. Every live result must record source, immutable version, account role, browser/device, time, evidence and outcome.

| Gate | Required evidence | Current state |
| --- | --- | --- |
| XP data | Rechecked milestone, recognition, recovery and synthetic-event counts | Verified |
| Observatory retirement | Genuine owner engagement/member views without test controls | Verified live |
| Retired public routes | Selected release: /thebutton reaches /levels; xp-test returns 404 for every method and session state | Source tested; live release pending |
| Exact build | Complete CI, root assets, private earned media, immutable candidate receipt | In progress |
| Studio consolidation | /studio is the single front door; records, builds, upload and review use the existing services | Integrated; live candidate pending |
| IREN | Visible animated frame, silent-GPU/context-loss fallback, motion preferences, usable controls | Automated tests configured; candidate/device review pending |
| Public profile | Wall outage/timeout/retry preserves public identity; private and missing profiles stay nonrevealing | Integrated; candidate verification pending |
| Responsive experience | 320/390/768/1440, keyboard, focus, readable type, touch targets, no overflow or dock obstruction | Hosted checks in progress; founder visual acceptance pending |
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
