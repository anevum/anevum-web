# ANEVUM Continuance Adaptive Lab - project-facing pilot V001

Session: ANEVUM.ANEVUM.BUILD.2026-10-23.001.CONTINUANCE-PROJECT-DOCTOR

## Why this is the first task

The useful initial problem is not autonomous general intelligence or training a math chatbot. The platform already has a draft Creator Studio workspace, an offline OpenAI Agent Dock, IREN guidance, and canonical structured scene/UI formats. First establish a deterministic, testable layer that can identify actual problems in a creator's existing work, then measure whether an optional AI model can explain and propose repairs **better than that baseline**.

The experimental component belongs to ANEVUM's internal shared research program, while Creator Studio owns the eventual product workflow. This source-only pilot is intentionally placed on a research branch derived from existing Creator Studio V109-V113 integration candidate (draft PR #658). **It is not a second studio, a new AI provider connection, a new privileged IREN, or a new persistent database.**

## V001 delivered scope

* Pure diagnoseStudioSource(encodedText) function that uses the real canonical ANEVUM_BLOCKS_V1 and ANEVUM_UI_V1 decoders and schema validation.
* Read-only checks for unreachable story scenes, unlinked or unlabeled choices, unreachable/empty UI pages, buttons without actions or labels, and unlabeled inputs.
* Bounded text input, limited findings, stable machine-readable codes, and source-relative paths suitable for later human-reviewed suggestions.
* Baseline tests with the actual schema starters, deliberately broken synthetic documents, malformed/oversize source and inert malicious-looking literal text.
* No network access, model calls, training data collection, new dependency, paid service, execution sandbox, database migration, account grant, file mutation or production route.

**Finding != fix.** This code reports potential defects; it does not alter a project or claim to test an executable build. Some results (such as an intentionally unlinked choice) require a human decision.

## Product-facing follow-through (NOT implemented)

1. **Creator Studio:** After PR #658 and its separate backup, route, authorization, staging, real-member and iPhone acceptance gates, expose read-only inspection for a creator-selected, owned, versioned file. Preserve existing member identity and revision.
2. **IREN:** Present a structured summary of *verified* findings from the existing Studio API. IREN can guide a creator to the right file, but does not become a second inspector authority or gain hidden file access. IREN never silently initiates a billable request.
3. **Creator Agent Dock:** An optional approved OpenAI managed-API pilot may receive only the creator-consented file and the deterministic findings. The agent proposes an explanation and an explicit version-bound patch. It cannot apply, publish, manage roles, use a shell, or fetch arbitrary URLs.
4. **Website/onboarding:** Site guidance should initially use a verified route/feature registry and known help content, not live model improvisation. Reuse IREN's single guide, avoid a separate competing assistant.

## Research and evaluation plan

The diagnostic pilot is a deterministic **baseline**, not a self-learning model. It tests product usefulness and data contracts before investing in model tuning.

For an initial evaluation, generate 20+ synthetic scenes and UI fixtures with seeded defects and record:
* **Correctness:** defect detection recall, false-positive count, source revision and precise location attribution.
* **Safety:** rejection of unsupported/malformed/over-limit data, no code execution, no cross-project data disclosure, no write privileges.
* **Utility:** creator understanding of the explanation; whether suggested repairs pass canonical validation and existing project tests (separately measured).
* **Cost/latency:** milliseconds per deterministic inspection and, only if later authorized, actual model token charges.
* **Learning:** keep an offline, consented test set of accepted/rejected repairs and evaluate any future model against **held-out** problems. Never update a deployed model solely from unreviewed user feedback.

An adapted algorithm, reservoir model, small open-weight model or LLM can be compared later on actual task success. Mathematical and coding skill is useful insofar as it improves these outcomes; bigger weights or more raw data do not independently constitute progress.

## Release boundaries

* Existing Creator Studio V109-V113 is source-only and behind default-OFF flags. Its V111 D1 migration is not approved merely because CI passes.
* Do not deploy this research head to the public apex, merge it into the release, apply migrations, expose raw private source to external models, create API credentials, incur hosting charges or enable any new customer-facing AI claims without explicit review.
* Do not put private member projects, personal histories, production tokens or RHEN broker/trading evidence into this public repository or CI artifacts.
* A human creator must approve any future edits against the exact current revision; existing authentication and publishing/moderation paths remain authoritative.

Next release gate: run isolated CPU-only Node tests; inspect results; obtain a reviewed integration design for the private Studio UI rather than inserting a disabled or misleading feature into production.
