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


## Source-only V001.4: finding navigation, filtering and explicit IREN handoff

The feature-off Studio-local panel provides severity filters (all/warnings/informational) and a conditional "Open in visual editor" button for each finding with a valid, canonical location. The location resolver only accepts bounded, validated structural paths; it maps path indexes to stable scene/page/component IDs. It rejects malformed or out-of-range paths, and the visual editors independently confirm the selected node exists before choosing the corresponding compose/design mode. The editor focuses the selected, semantic tree button for keyboard users. Navigation never changes source content, saves a revision, publishes or calls the cloud API.

The panel also offers "Copy source-free diagnostic brief". This action is user-initiated and requires browser clipboard permission; it copies only the diagnostic summary, severity counts, structural paths and up to four curated suggestions. The raw project text, canonical UUIDs, secrets, member identifiers and complete source are omitted. Clipboard refusal results in a visible error without fallback transmission. **This is not a direct IREN integration**: the creator may independently choose whether and where to paste the short summary.

The research test suite verifies stable ID resolution under reordering, malicious-looking text as inert data, invalid/stale location refusal, explicit human action for clipboard writes and keyboard focus. These source-only UI controls remain gated by VITE_STUDIO_PROJECT_DOCTOR_V001 (default OFF) and still require parent PR #658's authorization, migration, backup and release gates before any account-facing rollout.


## V001.7: offline guided repair help (source-only)

Project Doctor now includes a deliberately **non-LLM** assistance layer in creator-v1/agent-quality-lab/project-doctor-guidance-v001.mjs. Every existing supported diagnostic code has a curated, immutable entry describing:

- Why the structural warning or informational notice matters.
- Two short manual correction steps to consider in the existing visual editor.
- What to inspect or test afterward.
- Why clearing a structural warning does **not** certify that an application works, is accessible, or is secure.

The existing NEXT-styled finding card shows a native collapsed details/summary disclosure, "Understand and verify". It expands locally when a creator requests help; no call to a model or external service, user-code execution, automatic source patch, saved revision write, telemetry collection, new database, or new credential is necessary. The panel labels this path "LOCAL RULES / NO AI REQUESTS / NO AUTO-EDITS", and the header states "0 MODEL CALLS".

This module only matches known diagnostic codes. It never interpolates project content, user prompts, UUIDs, secrets or file paths into instructions. Unknown codes return null instead of requesting a hosted model. The guide data and step arrays are frozen. Canonical scene and interface documents still use the existing local read-only diagnostic engine, with existing source bounds and human navigation.

**Cost boundary:** This guidance has zero LLM inference cost and no self-hosted weights or GPU. This does **not** mean ANEVUM incurs zero browser/network infrastructure or Railway hosting charges. The existing Railway staging API remains separately hosted but is not needed for these instructions. Advanced coding models, cloud inference, and continual learning remain unimplemented and must not be activated automatically.

**Future model admission gate (not implemented):** Any later hosted model path must be explicitly requested and consented to by the authenticated creator, with owner/project/source permission checks, global and per-account quotas, a genuine provider billing hard-stop, secret storage only on the trusted server, minimal selected-file context, and an approved exact-model evaluation. Avoid fallbacks that silently transform local guidance into billable provider calls.

CI includes project-doctor-guidance-v001.test.mjs validating complete code coverage, immutable data, unknown/untrusted code rejection, no source reflection, no model/provider requests and preserved source. The synthetic Creator Studio Chromium fixture opens guide disclosures, checks offline labels and absence of unexpected writes, and captures full and mobile detail screenshots. These are synthetic CI evidence, not real-member acceptance or public release authorization.

Keep VITE_STUDIO_PROJECT_DOCTOR_V001 default OFF until protected Creator Studio PR #658's member-auth, version-bound edits, D1 backup/restore, native-device testing, and owner review gates are satisfied.
