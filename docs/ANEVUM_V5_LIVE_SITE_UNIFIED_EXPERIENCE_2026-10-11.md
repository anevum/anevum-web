# ANEVUM V5 — Develop on anevum.com, not a parallel design lab

Session: ANEVUM.WEB.BUILD.2026-10-11.011.LIVE-SITE-UNIFIED-NAVIGATION
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Parent source: WEB #310 at 3acd0c34ee302e9f706851337560fc92508422a4
Target: https://anevum.com on the existing anevum-web-nextgen Worker.

## Product decision

The real ANEVUM website becomes the canonical place for V5 interface,
design, navigation, content, and phased member development. No additional
temporary database, Worker, volume, or duplicate site is introduced.

The existing CommonsV5 surface now carries public, private member, and
private member verification pages, rather than retaining an unrelated light
legacy layout for the verification page.

A typed single-source navigation registry defines public sections and
authenticated workspace destinations. Desktop header, sidebar, and five
mobile destinations share the same active route classifier. Session-dependent
links go to Google sign-in when logged out, not an unauthorized workspace.

The new default Forest palette has muted forest green, restrained teal,
legible text/controls, and responsive cards. Existing user-selectable
palettes remain available. Styling stays inside the current Commons
Shadow DOM, with no global CSS mutation to private operator terminals.
Mobile drawer state closes when navigation changes.

The homepage offers a real four-route discovery journey through Projects,
Field Notes, Learning and Member Access. The right-rail visualization counts
published Field Notes by type from the actual first-party registry. These
are publication counts, not synthetic engagement or broker statistics.
The former fake post composer now links to truthful member-access content.

## Observed real production constraints, October 11, 2026

Production uses Worker anevum-web-nextgen and D1 anevum-members, UUID
7f0d4c0c-2e85-4900-8504-1347954e1df1. The live database currently
has core Better Auth and member tables, plus member_rhen_drafts, but NOT
member_rhen_workspaces. Foreign key check returned no violations.

Production Cloudflare has encrypted Better Auth and Google credentials.
RHEN_OWNER_MEMBER_ID was absent from the named production Worker secrets.
This is a blocker for full V5 owner/operator release according to the
existing deploy-production.yml prerequisites. Never infer the owner from
database row order or use the beta member's identifier.

Production currently disables Command live stream and the RHEN draft
feature. Workspaces are not production-approved; no trading or account
migration is authorized by this source-only UI patch. The production
D1, secrets and Cloudflare Access policy remain untouched.

## Release path

1. Verify the exact merged candidate with member isolation, safety,
   typechecking, generated build, mobile/desktop visual QA and URL contract
   checks, plus an explicit rollback/data-recovery readiness proof.
2. Use an owner-reviewed, exact-SHA manual production release of the
   EXISTING anevum-web-nextgen Worker. No direct uncontrolled overwrite.
   Keep owner/operator and live broker gates closed unless separately
   verified and authorized.
3. Develop full member/RHEN capabilities on the SAME production database,
   using controlled migrations and explicit activation after real two-user
   persistence, account exports/deletion and cross-user denial tests.
   Free public research requires no Alpaca Connect permission.
4. Invite outside users only after account safety and policy gates.
   Social posting, payouts, brokerage, financial rewards, and live
   execution still require their own separate approvals.
5. Retire duplicate preview resources only after confirming member data,
   retention, provider-review obligations and rollback. Existing beta
   member data cannot simply be deleted as a cleanup shortcut.

## Concrete acceptance

- Every public and member page has consistent navigation and accessible
  route highlighting, including 390px mobile and desktop layouts.
- Appearance switching remains optional, persisted, and keyboard-usable.
- Read-only publication visualization matches the real Field Notes data.
- No faux buttons suggest capabilities that have not launched.
- Member Command, account verification and personal RHEN share the design.
- Logged-out traffic cannot access private member or operator data.
- No new temporary volume, Worker or database created by this patch.

This branch remains DRAFT/UNMERGED, with no production deployment or
database mutation. Changes to anevum.com require release gates above.
