# ANEVUM V5 Studio production readiness

Session: ANEVUM.WEB.BUILD.2026-10-11.014.STUDIO-PRODUCTION-READINESS
Date: 2026-10-11 (America/New_York)
Release train: WEB master issue #259, January 1 2027 launch issue #308.
Source lineage: V5 sitewide #311 -> Studio CMS #312 -> Studio editor #314 -> Studio operations #315.

## Observed production baseline

Read-only inspection on October 11 established:
- Production web Worker: anevum-web-nextgen.
- Member production D1: anevum-members. Core member tables exist; studio_entries and studio_entry_events did not yet exist.
- Cloudflare Access has ANEVUM Command with destinations anevum.com/api/command* and anevum.com/command/rhen*. Do not broaden that application.
- The Studio pull request stack remains draft and unmerged, and the separate production Staff Access application has not been provisioned.
- Existing preview and beta member databases are sufficient for approved release testing. No new permanent databases or volumes should be created merely for Studio.

Recheck these facts on release day; they are evidence at a dated checkpoint, not permanent claims.

## Identity policy

The primary organization owner is anevum.studio@gmail.com, authenticated through an independent verified Google Better Auth member account. Pin its exact server-observed member ID privately in ANEVUM_STUDIO_OWNER_MEMBER_ID.

devon@anevum.com is a proposed separate staff administrator account only after genuine independent Google sign-in and separately pinned ANEVUM_STUDIO_ADMIN_MEMBER_ID. Email forwarding alone cannot sign in, and synthetic user records must not be inserted.

Studio identity requires the intersection of a verified Better Auth member session, a pinned account/member ID, exact allowlisted email and independently signed Cloudflare Access assertion. Studio access does not grant RHEN brokerage, orders, funding, strategy promotion or system deployment permissions.

## Ordered production release gates

1. Reconcile the entire unmerged V5 source train. Do not merge stacked Studio #315 to main as an isolated patch. All exact-head CI, cross-repo contracts, member signup, two-account isolation and responsive browser tests must be reviewed.
2. Verify a current, restorable encrypted production D1 backup and migration ledger. Use reviewed migrations-studio/0008_studio_editorial.sql only after that evidence is accepted. Preserve all existing member rows. No new permanent test resource.
3. Create one independent Cloudflare self-hosted Access application named ANEVUM Studio with TWO explicit public destinations: anevum.com/studio* and anevum.com/api/member/studio/*. Multi-destination applications are already proven by the existing Command app. Set the independent app AUD in ANEVUM_STUDIO_ACCESS_AUD and exact staff emails in ANEVUM_STUDIO_ACCESS_EMAILS. Never change CF_ACCESS_AUD, COMMAND_ACCESS_EMAILS or RHEN_OWNER_MEMBER_ID to permit Studio access.
4. Deploy only the reviewed, integrated source with ANEVUM_STUDIO_ENABLED=false and ANEVUM_STUDIO_PUBLISH_ENABLED=false. Verify D1 tables and indexes, session handling and rollback paths.
5. Have the real owner log in to the production Better Auth identity, independently pass dedicated Staff Access, then pin the verified member ID. Enable only ANEVUM_STUDIO_ENABLED and confirm private drafts and operations overview. Keep the admin role dormant until a separately verified login exists.
6. Test staff revocation, ordinary-member denial, stale session handling, owner/admin switching, draft privacy, edit/save/preview, D1 error feedback and audit receipts. Commons social pilot remains separately disabled.
7. Live public publishing requires explicit independent owner authorization. Only after review may ANEVUM_STUDIO_PUBLISH_ENABLED be set true, followed by a real POST/UPDATE/AHA publish, public /updates and Commons feed verification, and an unpublish recovery test.
8. Verify the existing private RHEN Command and member workspaces remain unchanged and unaffected by these Staff Access and editorial migrations.

## Acceptance matrix

| Check | Required result |
| --- | --- |
| Unauthenticated /studio request | Staff Access challenge |
| Ordinary member | No Studio role, no staff API data |
| Exact verified owner | Can save and edit private drafts |
| Unconfigured separate administrator | Denied |
| Member identity changed mid-write | Stale action blocked |
| Unsaved draft revision | Cannot publish an older saved revision |
| Operations overview | Real D1 counts for members, drafts, published, archived, audit |
| D1 invalid or unavailable | Explicit unavailable, not zero |
| Commons pilot disabled | PILOT_DISABLED and unknown pending count |
| Social storage missing | STORAGE_UNAVAILABLE and unknown pending count |
| Publish feature disabled | No public editorial write |
| Explicit authorized publish | Only PUBLISHED records publicly visible |
| Unpublish | Public entry no longer visible |
| Studio history | Bounded, private, member-verified audit |
| RHEN owner broker paths | Existing access and scope unchanged |

## Safe rollback

Disable ANEVUM_STUDIO_ENABLED and ANEVUM_STUDIO_PUBLISH_ENABLED. Revoke incorrect Staff Access grants/sessions and restore the previous verified Worker if necessary. Do not drop Studio editorial or audit tables to hide a failed release. Preserve records for recovery and reconcile public visibility before re-enabling.

## Honest scope

The Studio draft implements first-party posts, project updates, AHA notes, editor previews, publish/unpublish/archive actions, audit history and real operational aggregates. It does not yet implement a production-wide user-ban/appeals console, scheduled editorial calendar, media library, mass notifications, production deployment approval console or paid billing administration. The Commons social/moderation pilot is a separate release gate and remains disabled in production.

State at drafting: SOURCE ONLY, UNMERGED, UNDEPLOYED. No new Access app, production schema writes, live user creation, secrets, published messages or RHEN changes were made by this source increment.
