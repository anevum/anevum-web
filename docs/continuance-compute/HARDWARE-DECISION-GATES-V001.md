# Hardware decision gates — no immediate purchase

ANEVUM is solving founder development and creation tasks, not chasing speculative benchmark records. The V001 local inference code works with **a separately installed Ollama backend**; no model or GPU has been demonstrated in this increment.

## Order of operations

1. **Software first:** run the mocked contract suite and synthetic benchmark fixture listing; establish a non-LLM baseline using existing Project Doctor, linters and manual workflow.
2. **Use existing hardware:** choose a small, license-reviewed open-weight model that fits the memory of an available PC; test cold start, interactive latency, correctness, noise, energy and stability. CPU execution is acceptable for the first proof.
3. **Record real workloads:** founder code review, source-free Studio explanation, writing/research revisions and later a VELUM render. Collect human acceptance and independently run tests; include failures and false positives.
4. **Specify workbench only from measured need:** evaluate model residency, VRAM headroom, system RAM, CPU, storage, cooling and workstation acoustics. Prefer one reliable machine over a fragile multi-GPU system.
5. **Separate production from home:** business uptime and customer requests stay in the cloud. Home compute must be optional and pauseable without creating a website outage.
6. **Approve purchase explicitly:** compare ownership cost (parts, power, heat, backup, maintenance) with paid-cloud alternatives, then make a separate owner spending decision.

## Decision matrix

| Observation | Recommended response |
|---|---|
| Small model is adequate for code/Studio tasks | Keep low-cost local CPU/small GPU; avoid upgrade |
| Model answers are unreliable even with GPU | Fix problem design and evaluation; hardware is not the solution |
| Local models are useful, but memory limits prevent target tasks | Consider VRAM capacity with measured model quantization and context needs |
| Blender/texture generation dominates | Size rendering GPU separately from LLM requirements |
| Need high-availability public inference | Design controlled hosted capacity and budgets; do not serve customers from home |
| No meaningful cost/time savings | Do not purchase hardware; continue deterministic tools and existing providers |

## Measurement worksheet

For each actual run record: task ID, nonsecret dataset revision, model license/version/digest, inference runtime version, machine CPU/RAM/GPU and VRAM, cold/warm latency, tokens/sec where reported, peak observed memory, power if measured, whether an independent test passes, founder usefulness rating, and failure explanation. A missing measurement is `unknown`, never a fabricated benchmark.

Do not select specific GPU models or purchase budgets until a real workload and available spending limits are established. Hardware procurement is outside the scope of this PR.
