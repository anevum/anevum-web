# ANEVUM Continuance Lab V001

Isolated CPU-only diagnostic API for ANEVUM's Creator Studio pilot. This is an internal experiment and **not** a new public ANEVUM feature, self-learning AI model, or OpenAI service.

## Deployment and isolation

- GitHub source: this research branch, tracking draft PR #664.
- Railway project: ANEVUM Continuance Lab, environment staging, service continuance-diagnostics-api.
- Container image builds using services/continuance-lab/Dockerfile and its service-local Dockerfile.dockerignore allowlist; only canonical codecs, Project Doctor and HTTP server are copied. No root Dockerfile or Railway config alters other ANEVUM builds.
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


## Source-only V001.2: saved/draft issue comparison

The feature-off Studio panel can compare the currently edited draft with the last server-confirmed saved source. It uses the same canonical inspectors **locally in the browser** and identifies diagnostics by the stable block/page/component UUID plus the finding code (not mutable list indexes). It reports:

- Newly reported: a finding present in the draft but absent from the saved revision.
- No longer reported: a finding absent in the draft; this may reflect deletion or changed connections rather than a verified repair.
- Still reported: a finding attached to the same canonical node that persists despite reordering, insertions or other edits.

The comparator fails closed for unsupported, malformed, incompatible or truncated documents. It does not persist the comparison, send the source to Railway, update revisions or confer approval to publish.

The research test suite covers reordered blocks/components, newly introduced defects, invalid sources, truncation and a synthetic sensitive string not being echoed. Exact-head GitHub CI is required before declaring it verified.

## Synthetic benchmark limitations

The lab's 60-case benchmark is constructed from 50 intentionally seeded issues and 10 clean canonical documents. It is a baseline unit/fixture benchmark, not a randomized audit of actual members, real-world accessibility certification or evidence of online learning. Do not claim general performance based on this constrained fixture set.


## Source-only V001.3: authenticated synthetic smoke benchmark

An authenticated internal-only GET /v1/benchmark runs the fixed 60-case synthetic diagnostic benchmark at request time. It returns the number of clean/defective cases, exact-match count, false-positive and false-negative counts, precision/recall, duration, and a list of fixture IDs with mismatches. The response declares source=synthetic-fixtures-only, memberData=false, and modelEvaluated=false.

This is a repeatable software baseline, **not** evidence of generalization, actual member-project accuracy, model training, reasoning ability or a self-improving AI. The endpoint accepts no user-supplied fixtures or query parameters, uses the existing bearer authorization and instance-local request quota, and is only accessible on Railway's private service interface. Do not publish it as an open URL.

Capabilities now include lab.synthetic-benchmark.run, which is a developer test capability rather than an end-user or IREN tool. All API calls are strictly read-only and return no secrets or source text. If the synthetic benchmark finds mismatches, it responds with HTTP 503 instead of claiming full readiness.
