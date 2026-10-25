# ANEVUM Continuance Compute V001.1 — owner-local inference contract

Session: `ANEVUM.OPS.BUILD.2026-10-24.001.HYBRID-COMPUTE-FOUNDATION`

Status: source-only research pilot. **Not deployed, not connected to live IREN/Creator Studio, not offered to members, and not a GPU purchase approval.** This is the local inference sidecar for the existing Continuance Lab research (draft PR #664), not a replacement for its deterministic Project Doctor.

## Purpose

Use one optional local model to experiment with ANEVUM's actual owner tasks: code explanations, math, writing, synthetic Studio diagnostic explanations and research-note summaries. Measure usefulness before buying hardware. Existing deterministic Project Doctor remains primary for structural correctness. A model's explanation is only a suggestion; it never applies code, saves member projects, publishes, places orders, manages home devices or claims to have run tests.

## Configuration (future workstation or existing capable PC)

Requirements: Node.js 22+, a separately installed local Ollama server and a model that fits available CPU/GPU RAM. No paid API key is required. This pilot only accepts Ollama at loopback; remote URLs and model provider fallbacks are forbidden. No specific model is assumed or downloaded by this repository.

1. Set `CONTINUANCE_COMPUTE_TOKEN` to a unique random value of at least 32 characters in the host's private environment. Never commit or expose it to browsers.
2. Set `CONTINUANCE_OLLAMA_URL=http://127.0.0.1:11434` and `CONTINUANCE_LOCAL_MODEL` to an already installed Ollama model ID.
3. Run `node services/continuance-compute/server.mjs`. It binds **only to 127.0.0.1:3217** by default; `PORT` can change the loopback port.
4. For owner-only testing, send `POST http://127.0.0.1:3217/v1/infer` with bearer authorization and JSON, for example `{"task":"math-explain","dataClass":"synthetic","prompt":"What is 17*19?"}`.
5. Use `node services/continuance-compute/benchmark.mjs --list` to inspect the four legacy smoke IDs. Use `node services/continuance-compute/benchmark.mjs --list --suite=extended` and `--partition=reserved` to list the 15 development and 10 reserved lexical probes. Run each group explicitly when a real model is available; these are only synthetic lexical checks.

`GET /healthz` indicates configuration, **not model availability**. Authenticated `GET /v1/model-status` checks the local Ollama model list and reports `installed`, `model_missing`, `unreachable`, or `not_configured`; `installed` is not proof of loaded weights or successful inference. A failed or absent model produces 503; it never sends prompts to a third party. The benchmark tests trivial synthetic cases and is not evidence of intelligence, genuine reliability, or production fitness.

## Offline job-state prototype

`job-contract.mjs` models a finite-state progression for **synthetic records containing only task IDs and digests**: `awaiting_approval -> queued -> leased -> running -> succeeded|failed`, with cancellation and expiration. Leases are bounded to 30 seconds, job lifetimes to ten minutes, and stale/replayed/invalid transitions are refused. There is no actual queue, authorization service, signed cryptographic lease, remote connection, owner approval check, workflow executor or deployment. The mock `approve` event is a state transition, not evidence of a human decision. GRAEN's future job broker must add those independent security controls before integration.

The implementation plan and threat model live in `docs/continuance-compute/`. The research work remains stacked on draft PR #664 and separate from Continuance House (#724).

## Security and limits

- Loopback listener only; no LAN/public binding, Cloudflare tunnel, exposed Railway domain, CORS, WebSocket, credential proxy, plugins or website integration.
- Server-side bearer token (32–512 chars); no source text or prompts in logs. No persistence, training, fine-tuning or telemetry upload.
- Allowlisted tasks and explicit `synthetic` or `owner-private` declaration. The declaration is an **operator assertion**, not a data-loss-prevention scanner. Do not provide member data, unpublished customer work, RHEN brokerage/financial secrets, family records or unconsented source.
- 8 KiB prompt, 12 KiB body, 768 output-token ceiling; 20 requests/minute per process and one concurrent inference. Actual model memory and compute usage are not capped by this alone.
- Fixed loopback-only provider URL; no HTTP URLs from requests, external API calls, code execution, arbitrary tools, filesystem access, home commands, or silent hosted-model fallback.
- The local model is untrusted output: treat it as suggestions, not a security, math or correctness authority. Do not give the model secrets or use its output as commands.

## How this becomes hybrid later

Keep the website, identity, account rights, payment systems and production IREN tools in their existing cloud runtime. The Continuance Lab can continue to evaluate synthetic Studio artifacts without GPU. An eventual **outbound-only**, short-lived authenticated agent could allow the home workstation to accept explicitly approved *owner* jobs, but that remote protocol is **not implemented here**. Before designing it, require encryption in transit, origin and job authorization, queue expiration, replay prevention, cancellation, rate/cost ceilings, transparent data classification, home-network isolation and human approval for side effects.

Do not make public ANEVUM traffic depend on whether the home machine is turned on. Keep home/family devices separately authorized from customer/business systems. Never silently forward private inputs to paid cloud APIs if the local model is down.

## Verification

`node --test services/continuance-compute/server.test.mjs services/continuance-compute/development.test.mjs`

The test suite uses synthetic mock responses (19 tests in the current P1.1 implementation). It verifies denial of remote hosts, invalid/untrusted task types, member data classification, bad tokens, provider outages, parallel requests, no hidden cloud fallback and expected synthetic evaluation reporting. No tests download models or use accounts, GPU compute, member files, databases, or external providers.
