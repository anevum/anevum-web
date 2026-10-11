# V5 Studio operational editor review — October 11, 2026

Session: ANEVUM.WEB.PATCH.2026-10-11.013.STUDIO-EDITOR-REVIEW
Parent incremental source: ANEVUM WEB draft #312 at c08027c91f3628d13b3dfc4cc0ebb2810207dda6
Master release: WEB #259 · launch #308.

## Fixes

- Editorial form now detects unsaved changes and prevents publishing a stale saved revision.
- Leaving an unsaved draft through the editor's own record selector asks for explicit discard confirmation.
- Form length/control-character validation runs before writing, with actionable feedback for HTTP 400.
- HTTP 409 revision conflicts require a safe reconciliation reload; HTTP 401/403 clears local staff content.
- Private client-only preview uses escaped React text and preserves paragraphs. It never publishes, uploads, or renders arbitrary HTML.
- New Access+Better Auth+staff-bound GET /api/member/studio/entries/:id/history returns a bounded, revision-bound immutable audit projection, with no broker or private public leakage.
- The timeline validates exact current member ID, selected entry ID, current revision, response schema and event shape and aborts on account/item changes.

## Release gates

This remains source-only and stacked on unmerged V5 WEB #312. No Cloudflare D1 migration, Staff Access policy, member creation, production deploy, social activation, broker permissions, paid services or public publication was authorized. Run the updated full Foundation suite and confirm exact-head checks before advancing. Owner and secondary admin still require independently verified sign-in and exact member-ID binding, as recorded in the #312 runbook.


## Dedicated staff Access application

Studio requires its own Cloudflare Access JWT audience under `ANEVUM_STUDIO_ACCESS_AUD` and explicit `ANEVUM_STUDIO_ACCESS_EMAILS` allowlist. A missing dedicated audience or list is not allowed to fall back to RHEN Command's `CF_ACCESS_AUD` or `COMMAND_ACCESS_EMAILS`. Add the secondary administrator only to Studio Access, never to the RHEN owner Access app. Moderator endpoints use dedicated Studio Access while Studio is enabled; the old isolated pilot may use its earlier gate when Studio is disabled. All actual Cloudflare policy/configuration changes remain release-gated and unperformed.


## Staff sign-in return

The exact token `/sign-in?next=studio` returns an independently authenticated Google member to `/studio` after login. It is only a fixed navigation convenience; Studio authorization continues requiring the authenticated Better Auth member's exact pinned ID, verified email, independently validated dedicated Cloudflare staff Access identity, and server allowlist. Arbitrary callback URLs and `next=admin` remain rejected. `devon@anevum.com` still requires an actual separate Google account or an approved future identity provider; forwarding alone is not a login.
