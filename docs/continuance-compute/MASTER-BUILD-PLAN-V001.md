# ANEVUM Continuance Compute — implementation master plan

Session: `ANEVUM.OPS.PLAN.2026-10-24.001.CONTINUANCE-COMPUTE-BUILD`  
Updated: 2026-10-24  
Status: **source-only research design; no production release, customer activation, model fees or hardware procurement**.

## End state

Build an owner-controlled hybrid compute platform with an always-available cloud control plane and optional private local compute. IREN presents tasks and results; **GRAEN Core is the proposed job admission/scheduling owner, not yet a running compute coordinator**; Continuance Compute owns local model/tool execution; Continuance Lab owns reproducible experimental comparison; Creator Studio and VELUM own their product workflows; Continuance House provides a separately secured home-facing client.

The system should eventually help the founder (1) inspect code and draft patches with independent tests, (2) explain structured Creator Studio findings, (3) research/write/edit books, (4) generate or optimize approved WebGL/3D assets, (5) run measured engineering experiments, and (6) read privately authorized business/home status. **Production publishing, account changes, payments, brokerage actions, door locks and other material side effects require separate trusted control paths and explicit authorization.**

Do not build a general-purpose autonomous agent or new model training stack as a prerequisite. No bio-compute dependency.

## Verified predecessor projects

- **Compute V001:** draft PR #734, `research/continuance-hybrid-compute-v001-20261024`; loopback-only Node 22 Ollama adapter, source-only tests, no real local model yet.
- **Continuance Lab:** draft PR #664; deterministic Project Doctor with 14 findings/guides, synthetic fixtures, internal Railway diagnostics service in staging (reported sleeping). No live model or customer access.
- **Continuance House:** draft PR #724; standalone read-only owner command/family UI prototype, not publicly or privately deployed to an operational device.
- **PARITY V136:** separate visual and Creator Studio release stack. Do not merge compute implementation into public release without integration review.
- **RHEN/GRAEN:** market/broker execution is a distinct risk-controlled domain. Any compute policy must expressly deny its trading actions and tokens.

## Runtime architecture

```
Owner (private IREN / ANEVUM Command / Continuance House client)
    |
    v
Existing authenticated ANEVUM owner/member identity + scoped consent
    |
    v
Proposed GRAEN Compute Job Broker (admission, quotas, leases, audit)
    |                              |
    | deterministic cloud jobs     | outbound-only home worker bridge (future)
    v                              v
Continuance Lab / existing CI       Continuance Compute (loopback Ollama)
Project Doctor / verified APIs       approved local tools / optional GPU
    |                              |
    +--- evidence, test results, metering, audit ---> owner review/approval
```

**Public website uptime is independent of the home workstation.** The website's WebGL scenes render client-side; a home GPU may accelerate authoring and offline asset generation but does not replace a visitor's GPU. No web browsers, creator clients or public APIs can address local Ollama directly. A future worker uses outbound authenticated, encrypted, short-lived claims only after reviewed identity and transport controls exist.

### Ownership contracts

| System | Owns | Does not own |
|---|---|---|
| IREN | Intent interpretation, truthful reporting, owner UX | Arbitrary code execution, automatic approvals |
| GRAEN Core (proposed) | Signed jobs, admission, budgets, device leases, policy | Model weights, source file authority |
| Continuance Compute | Bounded inference/tool workers on owner hardware | Member identity, payments, GitHub write authority |
| Continuance Lab | Reproducible tests, safety baselines, measured comparisons | Production publishing or financial actions |
| Creator Studio | Authorized project snapshots, revisions, publishing controls | Hidden model-side writes or source leakage |
| VELUM | Artistic assets, render/LOD pipelines, visual approval | Public routing, user authentication |
| Continuance House | Privately authorized home interface | Business owner admin by inheritance; family-to-customer data access |

## Real task contracts

Current V001 allowlisted task identifiers must remain stable: `code-review`, `studio-explain`, `math-explain`, `research-summary`, `writing-assist`. Current inputs are only synthetic or operator-asserted owner-private nonsecret text, max 8 KiB prompt and 768 output tokens. That data-class field **is not an authorization control**. No private member files, family/child data, financial data, credentials, secrets, arbitrary URLs, shell commands or tool calls.

### Founder code review

Select limited text or a diff; run baseline parser/linter/tests independently; send selected, nonsecret scope for optional local suggestion; show references and tests separately; require human inspection before any patch. Initial acceptance: evidence of correctly identified seeded defects, measured false positives and explicitly stated unverified suggestions.

### Creator Studio Project Doctor

Use deterministic diagnostic `code`, node identity and saved revision as authority; source-free diagnostic summary may be explained offline; creator must explicitly approve any future file-scoped AI request. Do not send entire projects or turn warning disappearance into claims of accessible/functional games. No project mutation without revision-matched, human-approved apply.

### Book writing / research

Offer selected-draft editorial feedback, coherent chapter notes, math or programming help and research summaries. Avoid indiscriminate indexing of family or client content. Prefer helping finish manuscripts over proliferating ideas. Any citations must be grounded in actual attached source material, not invented.

### Art / WebGL pipeline (after inference proof)

Deterministic VELUM-approved commands for Blender renders, model compression, texture optimization and asset validation; capture source digests, triangle/size budgets, render times and visual review. Don't put untrusted uploaded creator code into a privileged renderer process; sandbox jobs, control resource consumption and inspect outputs before promotion.

### Home command center (after owner auth)

Initially read-only signals in private Continuance House, then a separately isolated family vault and parent-approved device list. No public, creator or ordinary model output should be allowed to actuate devices. Security-sensitive physical actions always require separate explicit confirmation and hardware-side fallback.

## Build stages and exit gates

| Stage | Deliverable | Objective exit condition |
|---|---|---|
| P0 INVENTORY | Preserve #664, #724, #734; inspect live infra and contracts | Truthful integration map and separate draft branches |
| P1 BENCHMARK | 25 synthetic, fixed lexical probes (15 development/10 reserved), existing 4 smokes, offline contract tests | Deterministic CI passes, no external model calls and no private data; no model-quality claim |
| P2 LOCAL PROOF | Owner runs one real, license-reviewed Ollama model on existing capable hardware | Measured cold/warm latency, memory footprint, local quality, uptime and safety; no paid fallback |
| P3 JOB ADMISSION | Offline finite-state synthetic job contract then authenticated server broker | Invalid transitions/replay/expiry/duplicate claims denied; independent auth review |
| P4 HOME BRIDGE | Outbound-only private worker, short leases, encryption, cancellation and expiry | Offline, token theft, replay and restart tests pass; no exposed local inference port |
| P5 OWNER COMMAND | IREN/Command real job status, artifact diff, budgets, approvals | Owner identity enforced; genuine data shown; approval bound to exact revision |
| P6 STUDIO PILOT | First owner synthetic/source-free findings, later opt-in creator beta | Canonical per-project authorization, revision rollback, tenant isolation, Safari acceptance |
| P7 VELUM | Restricted rendering and model preparation | Render advantage documented, hashes verified, PARITY visual gates retained |
| P8 HOUSE | Secure read-only dashboard, later vetted local device adapters | Separate household auth and policy, explicit physical-device confirmation |
| P9 HARDWARE SCALE | Measured resource saturation and price/benefit review | Owner-authorized purchase only when tasks justify budget |

The phases are **gated**, not promises of launch dates. Advancing phases must not block current website improvements, Creator Studio usability, book completion or revenue-generating ANEVUM Sites work.

## P1.1 code deliverable (current research increment)

- `GET /healthz` remains unprivileged and reports **configuration only**.
- New authenticated read-only `GET /v1/model-status` asks local Ollama `/api/tags` whether the configured model is installed; status = `not_configured`, `unreachable`, `model_missing` or `installed`. This **does not verify inference capability or model loading**.
- New 25-case entirely synthetic lexical suite; run development and reserved partitions separately (15/10) to stay inside local rate ceilings. Reserved cases are publicly readable, not secret holdouts. Scores show exact lexical coverage only, not intelligence.
- New offline `job-contract.mjs` ensures monotonic state changes and bounded leases on fake, digest-only synthetic jobs. The module **does not authorize a real principal** and never sends network requests. Nothing calls it from the production website or cloud.
- Node safety suite, source-only CI, no model download, no new provider billing or hosting.

## Hardware posture

Do not buy a dedicated GPU yet. First benchmark with an already owned capable PC (even CPU-only) using a small licensed local model. Later choose GPU based on actual VRAM peaks and workload split: interactive coding, image/asset generation and Blender rendering have different optimal specifications. Include whole-system electricity, heat, noise, networking, backup and maintenance costs. Keep cloud independent and local processing optional.

## Failure and promotion rules

- Backend unavailable -> a truthful `503` for generation or `unreachable` for authenticated inspection, **never a cloud model fallback**.
- No creator/member private source before explicit selected-file consent and owner/project authorization; `owner-private` caller assertions do not enforce server ACLs.
- No model may claim it ran code, browser tests or applied an edit unless a trusted independent tool records it.
- No model-driven direct GitHub merge, Cloudflare deploy, financial transaction, public publish, home lock, or family/child account change.
- All progress requires exact commit + workflow evidence, staging rollback, artifact provenance, creator/owner approval when relevant.

## Next engineering tasks (ordered)

1. Confirm P1.1 exact-head CI; update all fixtures/docs when code changes.
2. Add a compact offline held-out quality rubric with clearly separated human acceptance scores, independent of lexical match.
3. Record actual Ollama model evidence locally on an owner workstation before claiming speed/quality/VRAM characteristics.
4. Design audited GRAEN broker authorization/lease interfaces on synthetic data, not live network protocols or privileged tokens.
5. Prototype private owner Compute instrument panel in the existing Command design after PARITY V136 integration decisions.
6. Gate Studio and House rollout against their existing parent PRs rather than bypassing them.
