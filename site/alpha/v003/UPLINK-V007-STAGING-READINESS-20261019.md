# ANEVUM Package Uplink V007 — Staging Readiness and Route Safety

Session: ANEVUM.WEB.UPDATE.2026-10-19.003.STAGING-PUBLISHER-READINESS
Parent: ANEVUM Creator Uplink V006, draft PR #516
Status: development branch; stage D1 additive schema was updated separately and backed up; NO Worker deploy, NO production route changes, NO general public upload activation.

## Ground truth observed on October 19, 2026 (read-only unless explicitly marked)

- Existing Cloudflare package staging control: https://anevum-package-alpha-v003-control.devonakins.workers.dev
- Existing Cloudflare isolated runtime: https://anevum-package-alpha-v003-runtime.devonakins.workers.dev
- Both Workers show deployed older V003 script records and enabled workers.dev subdomains. Their source versions have NOT been updated to the V007 branch.
- The control's public health URL returned HTTP 200 and an older narrow body with db=true, storage=true, runnerConfigured=true; it lacked the V007 stage readiness fields. Public /help/packages and /upload/v3 displayed the older site presentation. Anonymous /packages was empty. These are verified READ-ONLY HTTP responses, not a passed member upload.
- The isolated runtime returned 404 for an intentionally nonexistent release and for its root path; 404 is the safe result but does NOT prove executable builds play.
- The isolated stage database named anevum-package-alpha-v003-staging contained 0 project, release, file, preview-token, and attempt rows. An initial sqlite_master inventory found the rights receipt table absent.
- Stage-only D1 backup was exported successfully, with a recovery bookmark obtained, before an additive CREATE TABLE IF NOT EXISTS rights-receipts migration was executed. The rights table was then verified to exist. No existing table, production member data or package rows were modified. Restoration itself has not been rehearsed.
- Cloudflare production route inventory currently contains 36 routes. /upload* and /play/* are routed to the existing unified creation Worker; /staff* and /staff/projects* also have existing established owners. a.anevum.com/* has its own Worker. Changing a route to point to the package uploader would cross an existing owner boundary and requires a reviewed canonical integration plan.

## Implemented on the V007 source branch

1. The controller refuses upload before reading/storing a ZIP when the six required isolated staging D1 tables, including release rights receipts, are absent. It also checks R2 get/head/put binding presence. No orphan upload data is written when readiness fails.
2. Public health describes db, storage, schemaReady, uploadReady, runnerConfigured, and publicPublishingEnabled separately. A configured runtime hostname is NOT labeled as a verified running game. The new stageContract is uplink-v007-readiness.
3. The owner upload page displays an accurate "New uploads are paused" state while stage prerequisites are not met, without displaying a nonfunctional upload form. Existing public releases and discovery remain accessible.
4. Revoked uploads with cleanup still pending count toward creator storage allowance, preventing quota bypass by repeatedly failing private R2 deletion.
5. Runtime CSP now permits the exact verified staging control Worker as a frame ancestor only when BOTH RUNTIME_HOST and STAGING_CONTROL_HOST match the fixed preauthorized staging hostnames. All other instances still allow https://anevum.com only; no arbitrary configurable framing domains.
6. Host-locked, cookieless runtime GET /__anevum_runtime_health_v1 returns minimal stageContract, schemaReady and storage information, 200 only if ready (503 otherwise), 404 for wrong host or disallowed method; no secrets/records.
7. tests/alpha-package-stage-readiness.mjs reads the actual deployed public staging health, guest uploader gate, runtime health and nonexistent-release access WITHOUT cookies, API tokens or writes. It emits artifacts/package-stage-readiness/stage-readiness.json. The separate advisory CI job is permitted to fail without falsely failing app code tests, because stage deployment is independently pending.
8. Browser CI gained a bounded one-retry fresh-profile recovery for transient headless Chrome DevTools startup failures. API and runtime source syntax checks now include the cover and V005 visual modules.
9. New unit tests verify missing schema/storage gates and stage-specific CSP/host-check behavior. No public executable release flag is enabled by this change.

## Remaining blockers — not simulated away

1. V007 source is NOT deployed to the old V003 staging Workers. Compare module SHA, confirm preserved Worker AUTH, D1/R2 and secret bindings before a stage-only rollout. Runtime needs its optional STAGING_CONTROL_HOST binding equal to the exact stage control Worker domain. Production Worker does not receive that additional ancestor.
2. Run read-only live stage probe after stage deploy and confirm stageContract, schemaReady, no unauthorized upload form for guests, known-missing-release 404. This is only structural readiness.
3. Authenticated acceptance requires a supported HTTPS app origin under anevum.com capable of sending canonical member session cookies to the existing AUTH service. workers.dev guest UI alone cannot prove creator login or post uploads. Do NOT move anevum.com/upload* or anevum.com/play/* to make test traffic succeed. Stage a deliberately isolated, approved narrow route or a compatible staging-session integration first.
4. Upload an actual rights-cleared ZIP with root index.html and relative JS/CSS/media, with optional genuine creator PNG. Real founder A should privately preview; independently authorized reviewer B approves; guest C plays. Verify no access to another creator's draft, public-v1 preservation while v2 is waiting, rejection, suspension/takedown, revision discard, and bounded R2 cleanup.
5. Real iPhone Safari and desktop QA must confirm touch/audio/autoplay, responsive viewport, restart/fullscreen, CSP, asset MIME, authenticated form errors and manual staff workflow. Synthetic Chromium does not replace this test.
6. Review content inspection, abuse reporting, emergency takedown, data retention, and legal permissions before broad public executable uploads.
7. Merge only after exact-head CI, stage deployment acceptance, V091 identity/route integration, security review and a gated rollout/rollback. The default-off PACKAGE_PUBLIC_PUBLISH_ENABLED guard is an absolute release condition, not a button to bypass.

## Verification

- 32 deterministic SQLite/mock-R2 integration tests (including rights, release moderation, privacy, cleanup, staging preflight and CSP) plus real synthetic Chromium UI tests on 320/390/1440 widths are required by PR CI.
- The advisory stage probe emits machine-readable evidence and is expected to report readOnlyStageReady=false while the old stage Workers still serve the older V003 code. Do not interpret a green unit test as a successful stage deploy.

This is a scoped, source-first continuation of PR #516, not an ANEVUM Creator Engine redesign or production publishing announcement.
