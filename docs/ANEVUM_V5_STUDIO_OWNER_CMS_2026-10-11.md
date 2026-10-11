# ANEVUM V5 Studio — independent owner and administrator operations

Session: ANEVUM.WEB.BUILD.2026-10-11.012.STUDIO-OWNER-CMS
Parent: draft PR #311 source head 6ffca736c5ec1525087048bd6fd8ce854b4c00b9.
V5 release board: https://github.com/anevum/anevum-web/issues/259
2027 launch board: https://github.com/anevum/anevum-web/issues/308

## Identity and policy

- `anevum.studio@gmail.com` is the primary organization owner.
- `devon@anevum.com` is a separate intended administrator login **only after independent identity-provider authentication**. Mail forwarding does not create a Google account. Do not insert a synthetic Better Auth user.
- Both accounts must sign in to create real verified member identities. Studio then authorizes with a matching Better Auth user ID, verified email, independently verified Cloudflare Access assertion, and server-only exact-ID binding. Staff may bookmark `/sign-in?next=studio`; the fixed local return path grants no privileges and unauthorized members remain denied.
- `ANEVUM_STUDIO_OWNER_MEMBER_ID` and optional `ANEVUM_STUDIO_ADMIN_MEMBER_ID` must be set privately in Cloudflare. The staff endpoints also require the **separate** `ANEVUM_STUDIO_ACCESS_AUD` audience and `ANEVUM_STUDIO_ACCESS_EMAILS` allowlist, not RHEN Command Access. Neither grant may be based only on a displayed email or client-provided ID.
- Staff authorization is separate from RHEN owner trading authorization; Studio does not enable orders, funding, broker credentials, internal automation or strategy promotion.

## Implemented source contracts

- Authenticated `/studio` administration inside the shared V5 Commons layout.
- Draft creation and editing, explicit publishing, unpublishing and archiving; server revision compare-and-swap and durable audit events for successful changes.
- POST, UPDATE and AHA first-party publication kinds. Body text is displayed without raw HTML execution.
- Read-only `/updates` and `/updates/:slug` public pages display only PUBLISHED entries from the server.
- Protected GET `/api/member/studio/status`, GET/POST `/api/member/studio/entries`, PATCH entry, POST publish/unpublish/archive. Every write is server-authenticated and same-origin, pinned to the current session.
- Moderation remains a separately gated Commons pilot. Once `ANEVUM_STUDIO_ENABLED` is turned on, moderator authority also requires the pinned Studio staff identity; RHEN owner terminal permissions are not inherited.
- `migrations-studio/0008_studio_editorial.sql` is a **source proposal only**, independent of Commons social 0006/0007. Keep proper migration ledger review and rollback proof before any application.
- Current public publication metadata for individual dynamic updates remains conservatively noindex until verified dynamic metadata is approved. The `/updates` index route has public metadata.
- Sidebar Studio link appears only after a server-verified staff response.

## Configuration / release gates — not performed

1. Authorize application of reviewed D1 studio schema after a production backup and recovery check. Reconcile the current applied migrations first.
2. Verify owner Google sign-in on the target environment and obtain the exact server-observed member ID without sharing session cookies or exports.
3. Configure a real independent identity provider account for `devon@anevum.com` if secondary admin access is needed; otherwise keep this role dormant.
4. Configure a dedicated Cloudflare Access application for staff endpoints `/api/member/studio/*` and the separately gated Commons moderation endpoints. Configure `ANEVUM_STUDIO_ACCESS_AUD` and `ANEVUM_STUDIO_ACCESS_EMAILS` independently of the RHEN owner Access app; do not add administrative accounts to `COMMAND_ACCESS_EMAILS`. Require valid independently signed Access assertions.
5. Set `ANEVUM_STUDIO_OWNER_MEMBER_ID`, optional `ANEVUM_STUDIO_ADMIN_MEMBER_ID`, and `ANEVUM_STUDIO_ENABLED=true` as independently reviewed private production bindings. No role is granted by merely changing an email.
6. Enable `ANEVUM_STUDIO_PUBLISH_ENABLED=true` only with explicit owner approval of live public publication.
7. Run real multi-account acceptance: owner/admin/member access and revocation, wrong-session switch, CSRF, draft privacy, publish/unpublish/archival, stale revision, audit, mobile layout, failure handling and schema restore.
8. Review existing V5 release safety gates, CI and deployment rollback before merge, migration or activation.

State: SOURCE-ONLY DRAFT / UNMERGED / UNDEPLOYED. No secrets, real user creation, schema application, brokerage changes or public posting.
