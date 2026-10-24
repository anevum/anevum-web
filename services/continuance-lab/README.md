# ANEVUM Continuance Lab V001

Isolated CPU-only diagnostic API for ANEVUM's Creator Studio pilot. This is an internal experiment and **not** a new public ANEVUM feature, self-learning AI model, or OpenAI service.

## Deployment and isolation

- GitHub source: this research branch, tracking draft PR #664.
- Railway project: ANEVUM Continuance Lab, environment staging, service continuance-diagnostics-api.
- Container image builds from the repository-root Dockerfile using an allowlisted .dockerignore; only canonical codecs, the Project Doctor and HTTP server are copied.
- Node 22 as a non-root user, listens on PORT (Railway assigns it), no external packages.
- Public domain: **none**. The health check is intentionally unprivileged but useful only inside the isolated deployment. Do not attach a public domain or expose model input to browsers until identity, origin and usage controls are reviewed.
- Health path: GET /healthz. Version and mode only; no user data.
- Auth: LAB_API_TOKEN must be a strong 32-512-character server-only secret configured in Railway. Never put it in source, static front-end builds, URL parameters, issues, logs or screenshots.
- Model/API spend: none; service can sleep when idle. Workspace provider charges may still apply for deployed resources.

## Internal API

All responses are JSON with Cache-Control: private, no-store. No request source is echoed or persisted.

- GET /healthz: public-safe service readiness, version and flags.
- GET /v1/capabilities: requires Authorization: Bearer (server-held-token); describes diagnostic formats and abilities.
- POST /v1/diagnose: requires the same bearer token and Content-Type: application/json; body has exactly one key, source, containing canonical ANEVUM_BLOCKS_V1 or ANEVUM_UI_V1 text (not an executable file).

Example for a trusted internal server only, with a placeholder source:

    curl -sS -H "Authorization: Bearer $LAB_API_TOKEN" \
      -H 'Content-Type: application/json' \
      -d '{"source":"<canonical-encoded-document>"}' \
      http://continuance-diagnostics-api.railway.internal:<service-port>/v1/diagnose

Response includes normalized format, validity, path-specific findings, read-only mode, source byte count, and a SHA-256 source fingerprint. Source text is not returned. Invalid documents receive HTTP 422 with an explanation rather than being repaired or saved.

Other protections: 36 KiB HTTP body limit, 32 KiB canonical input limit, 32 max findings, fixed response formats, no CORS opt-in, no arbitrary URL loads, in-memory 60-request/minute quota per instance. This quota is **not** a distributed per-identity limit and does not replace owner authentication or per-member usage policy.

## Creator Studio source UI

The existing private V111 file editor includes a source-only, feature-off local inspection panel under VITE_STUDIO_PROJECT_DOCTOR_V001=true on this branch. It uses the canonical codecs in the browser, only after the creator presses Inspect draft. Results update as the local draft changes. No model or Railway request is made and no project is modified.

Do not activate this flag before the parent Creator Studio V109-V113 integration and its required canonical D1 backup/restore rehearsal, member authorization, migration review and mobile acceptance. This panel is independent of the Railway API; initial local inspection requires no transmission of member source text.

## IREN and AI roadmap - not active

Later stages can present verified findings to IREN and use an approved, consented AI model to explain them and draft reversible changes. Read access must use canonical member/project/file authorization and explicit selected-file grants. The Railway token is never a client-side credential or substitute for ANEVUM authentication. An untrusted model must not edit/publish, access other projects or create hidden costs. Future evaluation must compare accepted patches with held-out tests and measure false positives, repair acceptance, latency and genuine cost.

## Verification

    node --test creator-v1/agent-quality-lab/project-doctor-v001.test.mjs \
      services/continuance-lab/server.test.mjs \
      creator-v1/test/studio-project-doctor-ui-v001.test.mjs

GitHub Actions also builds the Docker container from its restricted build context. Railway deployment health and runtime logs must be inspected separately; only terminal SUCCESS is a deployed service. GitHub CI is not evidence of mobile browser acceptance or customer-facing readiness.

## Safety invariants

- No live ANEVUM/RHEN deployments, databases, member data, financial execution, payments, IREN privileges or moderation workflows are modified by this work.
- No self-learning model, API provider connection, trainable weights or GPU is included in V001.
- The cloud API is independently usable for synthetic fixtures and internal research; it must not receive private member source until authenticated and consented server-to-server transport is reviewed.
