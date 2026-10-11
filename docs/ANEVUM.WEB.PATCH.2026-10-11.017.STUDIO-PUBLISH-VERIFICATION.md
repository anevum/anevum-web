# ANEVUM.WEB.PATCH.2026-10-11.017.STUDIO-PUBLISH-VERIFICATION

## Checkpoint and scope

Continue V5 from main `5c53fa530a495f022094fe3cc4903b43a8fc138c` (merged #317), not the retired pre-cutover draft train. The existing website is deployed from `05a0052b52bc655f45a00fd8c54aec4e872d5dac`. Parent coordination remains #259; January 1, 2027 launch remains #308. Multi-method signup #318 is independent and is not merged or modified here.

This patch changes application source and tests only. No production deployment, D1 migration, new resources, credentials, staff identities, public publication, broker authorization or trading change. Studio publishing remains disabled in the existing production configuration. User's report that the site checks out is not substituted for independently recorded two-identity authenticated acceptance.

## Implemented

- Staff-authorized single-entry GET through the existing exact member binding plus dedicated verified Studio Access boundary. Reject a stale expected-member header before returning the record; keep actor IDs private.
- Before publish confirmation, reload and compare every saved entry field. The eventual mutation still enforces the expected revision in SQL, closing the race after this read. A mismatch requires reconciliation, never a blind retry.
- Server acknowledgements require the exact resulting revision, state, actor, timestamps, and submitted content for create/edit. Client acknowledgements additionally verify immutable identity and unchanged content for state transitions. Interleaved reads fail closed instead of declaring a later revision the result of this request.
- After publish/unpublish, read the public detail endpoint with credentials omitted, redirects disabled and no reusable browser cache. Publish requires the exact article; unpublish requires the specific publication-not-found 404. Denials, outages, generic 404s and malformed responses are not success. Saved-but-unconfirmed results disable further mutations until reconciliation.
- Studio public and private responses use no-store directives for the browser, generic CDN and Cloudflare CDN. This prevents newly delivered API responses from requesting reusable caching; it cannot retract copies already downloaded or override an independently configured force-cache rule. Check actual production headers and edge behavior before publication activation.
- Stream JSON within an 80,000-byte cap before parsing, regardless of a missing or dishonest Content-Length. Strict UTF-8 decoding handles split multibyte sequences and rejects invalid wire encoding. Existing 12,000-character body validation remains. The wire cap accommodates the supported fields including worst-case JSON escaping.
- Guard archive and reconciliation against silently discarding unsaved text; add browser unload warnings while a draft is dirty. These warnings are not a general router navigation blocker and browser behavior can vary. Existing draft-switch confirmation remains.
- Refresh the actual Studio operations counts after an acknowledged write.

## Validation and release

Thirteen new pure integrity tests passed locally against modules whose Git blob hashes exactly match the proposed source. Expanded the existing Foundation Studio editor test entrypoint with these cases plus authenticated endpoint denial, malformed persistence, raced CREATE receipts, no-write oversized input, cache headers and UI wiring. Updated the operations test for the post-write refresh. Full repository CI must be checked against the exact candidate head before merge; local checks do not establish production readiness.

Do not enable publication until the real owner (`anevum.studio@gmail.com`) can create/save/reopen a private draft and see matching history/operations, and an independent ordinary member is denied Studio/private content with a clean account switch. Do not use public test content to satisfy this gate. Secondary admin `devon@anevum.com` remains independently gated. A production rollout must use the existing manual, pinned-source release process and appropriate approval; no repeated migration or recovery cutover is required by this source-only patch.

## Follow-on order

1. Exact-head CI, review and source integration of this patch.
2. Recorded real owner/ordinary-member acceptance and approved source deployment.
3. Separately authorized Studio publication activation with reviewed content, public read verification and an unpublish check.
4. Continue Commons and private RHEN member work under #259/#308 without making free participation dependent on Alpaca Connect approval.

Provider references checked October 11, 2026: Cloudflare Cache origin cache control and CDN cache-control documentation (`https://developers.cloudflare.com/cache/concepts/cache-control/`, `https://developers.cloudflare.com/cache/concepts/cdn-cache-control/`).
