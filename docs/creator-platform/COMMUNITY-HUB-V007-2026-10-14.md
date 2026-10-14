# ANEVUM Community V007 — cinematic Commons hub

Session: ANEVUM.WEB.BUILD.2026-10-14.003.COMMUNITY-HUB-V007
Source: build/creator-v1-community-hub-v007-20261014
Base: web/cinematic-world-v005-20261014 (cosmic/tactile V005/V006 draft)
Authority: #325 engineering, #331 community, #328 identity, #329 publishing, #332 security, #335 creative acceptance, #333 release.
Status: SOURCE IMPLEMENTED. CI, visual review, authenticated staging acceptance, and public release are separate.

## Implementation

The previous /community roadmap is replaced with a real-data community hub. It has four local tabs: Latest (date-ordered approved projects and conversations), Projects (approved published work with server-filtered categories), Discussions (approved moderated excerpts, exact published-project context, eligible counts, public new/hot ordering), and People (approved creator-channel directory and server-side search).

A cinematic hero, actual publication/creator counts, compact quick paths, accessible toolbar and full-width content records lead to a sidebar showing category discovery, verified public makers, free participation and community norms.

Public ANEVUM navigation no longer promotes the founder portfolio or private Lab. Nothing was deleted and private guards remain unchanged.

## Data and privilege boundaries

- Public sources: readStatus, readProjects, readCreators and readCommunityPosts, using existing no-cookie/no-store public API.
- Conversations load only when the status endpoint reports features.communityPosts === true. 404/disabled is a truthful closed state, not an invented conversation.
- Counts and authors come from the server. No synthetic accounts, fake posts, false creator totals, generated ranks or invented XP.
- Project, creator, discussion and board links retain the existing real public route and canonical project details.
- Private discussion writes, MemberGate, staff approval, reactions, creator Studio, XP and upload permissions were not altered.
- Latest is a bounded excerpt, not a site-wide cursor-complete chronological index. Hot follows the current API's ordering, not a personalized ranking.
- Loading, error, closed and zero-record states are explicit; API unavailability never falls back to fake activity.

## Visual system

Use the owner's October 14 cosmic website reference and V005/V006 cinematic layers: raster original scene assets, archival editorial serif, readable sans, monospaced metadata, tactile rounded controls, restrained cyan/violet and dark translucent depth. Interactive elements remain HTML/React.

At desktop widths the introduction and verified signal form one cinematic panel, then wide stream plus field/people sidebar. On phones the global header stays compact, activity cards become full-width, quick paths remain two-up, and the sidebar follows the main reading column. CSS includes 1200, 900, 640 and 359px breakpoints, focus-visible, reduced motion, forced colors, and reduced transparency.

## Verification and acceptance

New test community-hub-v007.test.mjs covers syntax, route boundaries, API reads, capability gates, real counts, anti-fake state, accessible filters and responsive CSS. Existing community source-contract tests were updated to match V007 instead of expecting the obsolete planned-room page. The new test is wired into Creator V1 npm test.

Required before acceptance: exact-head TypeScript and Vite builds, CI test suite, compiled Chromium captures at 1440/1024/390/320, actual owner visual inspection, and a genuine staging creator -> separately authenticated staff -> public guest -> independent member journey. Confirm security/privacy/export/deletion/abuse controls and real V1 D1 restore/rollback.

Open signup draft #390 is separate. Reconcile shared Shell changes deliberately on an integration branch; never silently replace identity or apply mismatched 0007/0008/0013 migrations. Account registration and public write access remain closed.

Do not merge, deploy, move Cloudflare routes, apply D1 migrations, enable public signup, enroll users, or mutate broker/private Lab services based on this source-only patch.
