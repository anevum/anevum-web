# ANEVUM V5 discussion lifecycle

Session: ANEVUM.WEB.BUILD.2026-10-11.004.DISCUSSION-LIFECYCLE
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Continuing: ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL
Master: WEB #259; website reconstruction: WEB #265
Source parent: draft WEB #296 at 1ee89a5ccd193bde1bef763f055a61fbb223fae8

## Delivered source behavior

The pilot no longer stops at the first 30 discussions or 50 replies. Posts page
newest-to-oldest and replies oldest-to-newest using strict created_at/UUID keyset
boundaries. The server reads one lookahead row to distinguish an exact full page
from more data, returns a scoped cursor only when needed, and rejects duplicate,
unbounded, malformed, mixed-kind, mixed-topic and mixed-parent cursor requests.
Deleting an anchor does not break the next page; insertions above a post cursor
are intentionally retrieved on a fresh latest-feed reload. This is live browsing,
not an immutable historical snapshot or a guarantee against concurrent moderation.

The client checks a private versioned response envelope, exact authenticated
viewer, bounded fields, ownership shape, ordering, duplicate IDs, topic/parent
scope, cap, hasMore and exact terminal cursor before displaying a page. Extra
identity fields are discarded. Backend session authorization remains the
permission boundary; cursors select a browsing position and never an identity.

Older discussion and further reply controls support retry without silently
replacing the existing page. Browser state stays bounded to 300 records per
window. A continuation control then replaces the window with the next older
post/newer reply page while preserving the cursor; it does not truncate access
to all further pages. Refresh starts from the latest feed or first replies page.

A member may remove their own reply through the parent-scoped DELETE endpoint.
The server checks author ownership in the conditional update, overwrites the
body with the removal notice, marks REMOVED, and rejects foreign ownership,
wrong-parent IDs, repeated removal, unexpected method/query/body. This is soft
removal, not deletion of the audit/export record. The existing account export
includes that member's removed contribution; account deletion still cascades.
Neither a post owner nor a moderator capability grants this author-only action.
Post and reply removal both require user confirmation in the interface.

Create post/reply, report and removal acknowledgements must match the viewer and
expected target/content. Success is followed by verified server reload where
appropriate. A failed or uncertain mutation blocks further writes until explicit
latest-feed reload and is never automatically resubmitted. Feedback sits above
the composer so it remains discoverable on long feeds. Rate limits remain 3
posts and 12 replies per rolling 24 hours; removed rows still count toward them.

Account and topic changes discard the entire relevant tree and abort pending
reads/writes. Late completions cannot alter the next member's ownership controls,
composer, reply state or messages. A synchronous request lock prevents duplicate
in-flight form actions. Anonymous/unverified/unavailable users cannot read or write.

## Schema and cost boundary

Frozen migrations 0001–0006 retain their exact bytes. New proposed social-only
0007_commons_paging_indexes.sql (Git blob
39fd9de119f6f48e1841aa96958d09c40188d8bc) adds global published-post and stable
reply-order indexes without table or data changes. Real-schema query-plan tests
verify indexed ordering without a temporary sort. The offline rehearsal pins
0007, checks its catalog and preserves synthetic member data through it.
No default F0, reviewer or production workflow applies either social migration.
0006 and 0007 remain unapplied; actual D1 restore, reviewed backup/rollback and
explicit pilot migration authorization remain independent requirements.

## Validation

Local: TypeScript, production build, 90 Foundation tests, 83 existing member tests,
and offline pinned migration-chain rehearsal. Ten new tests include actual
SQLite execution of the frozen schema and index proposal, 70-post/120-reply
traversal, equal-second ties, concurrent insertion/deletion, exact full pages,
wrong-parent/cross-owner denial, text scrubbing/export, account cascade and quota
preservation. Contract tests reject crossed identities, malformed ownership,
wrong acknowledgements, wrong cursors and duplicate/unordered pages.

CI: 25 synthetic browser scenarios and 30 mandatory captures. The complete
create/read/reply/report/remove lifecycle runs at 320/390/768/1024/1440 with real
form edits, visible keyboard focus, cancellation of removals and exact request
fields. Other cases cover signed-out/disabled/off/denied states, malformed and
crossed feeds/cursors/replies, 31-post/51-reply pagination and topic change,
failed page retry, overlapping page rejection, wrong write/report/removal
acknowledgements, lost write response with authoritative reload, quota denial,
revocation and three account switches during delayed feed/reply/write responses.
Fixture network responses deliberately ignore cancellation for late-response
acceptance; every synthetic member request is intercepted. Browser fixtures and
local SQLite tests do not establish actual Cloudflare D1 or real staff acceptance.
Exact-head CI links and inspected artifact references belong in the draft PR.

## Remaining completion work

This completes the bounded browsing and author-removal source gap for the
invite-only discussion pilot. It is not the full community/product launch.
Staff/private invitation permissions, appeals/rules/retention/privacy review,
real two-member/staff adversarial acceptance and a separately authorized pilot
migration/activation remain outstanding. Profiles/consent, notification
preferences and broader community/reward capabilities require their separately
reviewed contracts rather than invented activity or permissions.

No merge, production/staging deployment, social activation, actual D1 restore,
Alpaca reviewer repin, broker operation or RHEN runtime launch is performed.
