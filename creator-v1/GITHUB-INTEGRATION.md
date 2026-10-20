# GitHub integration: first Creator V1 source increment

Session: ANEVUM.WEB.BUILD.2026-10-11.001.CREATOR-PUBLISHING
Active parent: build/anevum-v1-foundation-20261011 at b3562cf3f1e4ac8a81283db47e9386c4d61e7cfe.
Status: implemented and locally tested source; not deployed by this session.

## Current increment

GET or HEAD /api/v1/projects/:id/repository reads a published project's public GitHub repository metadata. The repository URL comes ONLY from the existing COMMUNITY_DB project row. The exact existing active-creator/published/not-future visibility predicate runs on every call, even a cache hit. Unknown, draft, hidden or withdrawn projects return 404 before a GitHub request. Query-supplied URLs are rejected.

Only HTTPS github.com/owner/repo source links are accepted. The outbound request has a constant api.github.com host, no visitor cookies/Authorization, no redirect following, a 4.5-second timeout and a 32-KiB streamed JSON limit. No repository files, README HTML, packages, git clone, app URLs or application compute are fetched/executed. Only bounded public fields are returned. Metadata explicitly says ownershipVerified=false. Public visibility is NOT permission to publish or proof of ownership.

Successful metadata is cached for five minutes with a 128-entry in-memory bound per Worker isolate; failures/repeated concurrent requests have a one-minute cooldown. This is a best-effort per-isolate limit, not a global traffic budget or distributed rate limiter. Public project visibility is never cached by this layer. API clients must display observedAt and must not turn a metadata lookup into a verified-author badge.

No schema change, migration, secret, new Worker, billing, file hosting, auth activation, preview-frame CSP change or visual redesign is part of this increment. The current build concatenator continues to support the API source. The existing frontend is unchanged; a future creator import/project detail UI should call this endpoint deliberately, not on every card render. Unavailable GitHub metadata must not make the project listing disappear.

## Verification

14 new tests passed on Node 22.16.0 with local in-memory SQLite and mocked GitHub responses. They cover visibility, active-creator checks, URL restrictions, credentials, metadata identity checks, malformed/oversized payloads, rate-limit failure, bounded cache/cooldown, HEAD, read-only mutation denial, unchanged catalogue counts and build-concatenator compatibility.

The tests do NOT establish a real GitHub request, full existing build/browser suite, live D1 behavior, live OAuth or production rollout. Run the complete Creator V1 suite and preview acceptance before a separately recorded release. Keep the current version declaration until the reviewed release assigns its version.

## Reconciliation with earlier work

The older PR #326 contains reusable publishing/draft/review/library components and 30 local backend/dispatch tests. Its V5 Worker wrapper, identity wiring, database migration and React UI are superseded as a deployment target. Do not merge that PR into production or restore the retired V5 workflow. The approved Creator V1 design, read-only API, separate COMMUNITY_DB and archive boundary remain authoritative.

The next functional dependency is real Creator V1 member registration, recovery and creator ownership, then draft submission/moderation and private libraries against the NEW community model. Reuse tested validation and lifecycle behavior; do not copy the old V5 database or assume its Google accounts belong to Creator V1. Full GitHub App consent and repository ownership proof come after that identity foundation. Subdomains, PWA packaging, marketplace payments and hosted app execution are not enabled.
