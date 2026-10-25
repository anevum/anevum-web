# Continuance Compute — security, operations and evidence

Status: source-only draft. No production authentication, protected cloud broker, or customer data path added.

## Trust zones

- **Untrusted input:** model prompts, proposed patches, downloaded reference material, user-provided code, future website or creator content.
- **Trusted ANEVUM business:** existing account/session/tenant authorization, revision control, Cloudflare/Railway service secrets, payments, publication and moderation.
- **Private owner workstation:** loopback model server, local owner tasks, no implicit exposure to LAN or internet.
- **Private household:** family accounts, devices, camera/sensor data, schedules. Never share identity credentials or databases with ANEVUM business.
- **Brokerage systems:** RHEN trading and account information. Out of scope for local inference and autonomous operations.

## Threats and mitigations

| Threat | Current defense | Additional controls required for future remote execution |
|---|---|---|
| Arbitrary network requests / SSRF | Strict loopback Ollama endpoint; fetch redirects rejected | Per-device network ACL, fixed endpoint routing, DNS/pinning review |
| Unauthorized inference | Long server-only bearer token; loopback binding | Owner session auth and least-privilege short-lived job grants |
| Hidden paid model calls | No cloud provider implemented; 503 on local failure | Explicit provider allowlist, pre-authorized budget and hard stop |
| Prompt exfiltration | No persistence/telemetry/logging; bounded body | Encryption in transit and at rest, audited retention/erasure, DLP review |
| Tenant/project crossover | Private member source prohibited | Verify member ownership + exact project/file/revision, separate per-job grants |
| Model instructs dangerous action | No model tools, no shell, no side-effect endpoints | Trusted tool adapter, allowlists, preview + human approval |
| Replay/expired task | Offline synthetic state machine denies invalid state/lease/expiration | Cryptographic device identity, signed nonces, single-use server leases and storage |
| Corrupt/malicious output | Bounded response, source-only benchmark | Sandboxed renderer/runner, independent parser/linter/security tests |
| Model status false-positive | Config check separated from Ollama tags installed check | Real end-to-end local inference probe + task benchmark/VRAM measurement |
| Stale approval | No remote approval mechanism exists | Signed exact-input digest, revision, destination, actor and timeout |
| Home-device safety | No home adapter exists | Independent Home Assistant entity allowlist, local safety interlock and confirmation |

## Evidence labels (required)

- `SOURCE_ONLY`: code in draft PR, CI not yet known or live.
- `SYNTHETIC_CI_PASS`: CI on exact commit using mocks or synthetic fixtures; no hardware claims.
- `LOCAL_REAL_MODEL_PASS`: actual licensed model with bounded real request, recorded host environment and model digest; still not product-grade.
- `ISOLATED_STAGING_PASS`: authorized, isolated live service or broker test with traffic and permissions recorded.
- `RELEASE_APPROVED`: separate owner release decision after protected member/production rollback gates.

Never turn one evidence label into another merely because a prior run succeeded. Do not call seeded fixture matching "accuracy," independent model intelligence, or real GPU validation.

## Current API contract

- `GET /healthz`: publicly safe *loopback-local* configuration indicator; does not ping Ollama.
- `GET /v1/model-status`: bearer-authenticated Ollama installation inspection. 200 describes state, even if offline; `inferenceTested:false` always. No model inventory disclosure, model downloads or provider substitution.
- `POST /v1/infer`: bearer-authenticated bounded local selected-task inference; 503 when unavailable; no other tools.
- `benchmark.mjs`: synthetic fixtures only, local loopback address and operator token required, no raw answers in report.
- `job-contract.mjs`: pure offline synthetic record transformation. An `approve` transition indicates an event selected by test code, **NOT evidence of a human authorization**. A real broker must separately verify identity and sign grants.

## Staging change policy

The following are **not** authorized by this source-only increment: publishing public web routes, installing a paid model provider, creating a new billable service/volume/bucket, changing Cloudflare Access, granting member file access, migrating D1, changing OAuth/IREN authority, altering RHEN controls, running home actuators, purchasing GPUs, or changing the PARITY V136 release stack.

Before any future deployment, document: verified configuration inventory, estimated cost, owner-approved domain/network topology, threat review, trace metadata retention, test backups, documented rollback, signed release head and post-release checks. User/private source must never appear in CI artifacts or the public repository.
