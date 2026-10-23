# Creator Studio V110 — Connected Agent Engineering Architecture
**Session:** `ANEVUM.WEB.DESIGN.2026-10-22.002.OPENAI-AGENT-CONNECTION`
**Status:** Proposed architecture, API contracts and test design. No migration or runtime implemented.
**Parent:** [PRD](./CONNECTED-AGENT-SYSTEM-V110.md) · [UX](./CONNECTED-AGENT-UX-V110.md) · Creator Studio Next #635.

## 1. Grounded architecture and boundaries

Existing ANEVUM source uses:
- Canonical **Better Auth member** identity and member-owned private Studio records in `creator-v1/canonical-auth/worker.mjs` / `studio.mjs`.
- Browser `studioList`/`studioGet`/`studioUpdate` private project APIs in `creator-v1/web/src/lib/canonical-studio.ts`.
- Existing gated `/studio/workbench` editor and `ANEVUM_BLOCKS_V1` declarative document format in `creator-v1/workbench-alpha/document.mjs` with revision-checked save, export, undo/redo and bounded first-slice content; pilot currently source-merged but protected by flags.
- Native playable ZIP/HTML uploader, isolated package runtime and separate reviewer approval. Playable output is **not** the editable source-tree API.
- Proposed V109 workspace shell with Explorer and tab navigation (draft PR #638). Files/folders are not yet established by that shell.

**Do not create a second project database, a second authorization service or agent-controlled publishing endpoint.** New agent records link to real canonical owner/project IDs; package builds remain distinct versions with existing moderation paths.

### Trust boundary diagram

```text
BROWSER, UNTRUSTED
   Creator Studio / file tabs / Agent Dock
   ├─ selects project IDs, file IDs, prompt and explicit approvals
   ├─ displays streaming text, cited selected file references, staged proposal
   └─ never receives provider API key, OAuth tokens or platform secrets
                 |
                 v
ANEVUM AUTHENTICATED WORKER — POLICY ENFORCEMENT
   Better Auth session + email verification + same-origin/CSRF + identity remount
   ├─ Agent Connection Service (eligible methods/approved OAuth)
   ├─ Agent Grant Service (member → project → file IDs → tool allowlist)
   ├─ Agent Run Coordinator (quota, idempotency, cancel, stream, audit)
   ├─ Read Tools (existing versioned Studio data, filtered/size-limited)
   ├─ Proposal Service (structural validation, diff, expected revision)
   └─ Apply Service (creator approval → revision-checked Studio writer)
           |                       |
           |                       +── Private Studio D1/R2 (existing resources)
           |                              and reviewed agent metadata tables
           v
OPENAI API / APPROVED ACCOUNT CONNECTION
   Responses API + bounded prompts + strict function schemas
   Model output: explanation, scoped read request, or proposed patch only
           |
           v
BACK THROUGH POLICY / VALIDATION / EXPLICIT CREATOR APPROVAL
   No arbitrary host shell, untrusted runtime or reviewer/publish authority
```

The diagram's "ANE VUM" label denotes ANEVUM's existing authenticated Worker trust boundary; it is not a proposed separate service.

## 2. Server route namespace (proposed, not registered)

Mount a separate, default-OFF member-scoped namespace under `/api/v1/member/studio/agents` inside the **existing canonical auth Worker routing**, not under public `/projects` and not inside the native uploaded package runtime.

| Method | Proposed path | Purpose | Preconditions |
|---|---|---|---|
| GET | `/status` | Honest server feature availability, permitted pilot mode and caps | Verified member |
| GET | `/connections` | Current eligible connections; no credentials returned | Verified member |
| POST | `/connections/pilot` | Bind authorized managed OpenAI pilot to verified member | Owner/invite grant, explicit consent, budget |
| POST | `/connections/openai/oauth/start` | Approved commercial OAuth transaction | Exact client registration and server flag |
| GET | `/connections/openai/oauth/callback` | One-time OIDC exchange and verified member linking | State, PKCE, nonce, session, exact redirect |
| DELETE | `/connections/:id` | Disconnect/revoke; cancel fresh runs | Credential binding owner |
| GET | `/projects/:projectId/profiles` | List role profiles in one owned project | Project read authorization |
| POST | `/projects/:projectId/profiles` | Create scoped agent role/instructions | Project edit authorization |
| POST | `/projects/:projectId/grants` | Set bounded file/run scopes | Project owner, file IDs server-verified |
| DELETE | `/projects/:projectId/grants/:id` | Revoke scopes | Project owner |
| POST | `/projects/:projectId/runs` | Create streaming task with fixed context receipt | Active connection, grant, quota, idempotency |
| GET | `/runs/:runId/events` | Authenticated per-run SSE, bounded replay | Owner and run-bound token/session |
| GET | `/runs/:runId` | Settled status/error/usage/proposal IDs | Owner |
| POST | `/runs/:runId/cancel` | Server-side stop/fail-closed | Owner; valid run state |
| GET | `/projects/:projectId/proposals/:id` | Read redacted staged diff + validation | Owner and project |
| POST | `/projects/:projectId/proposals/:id/apply` | Approve selected hunks and save exact revision | Human action, CSRF, revision, idempotency |
| POST | `/projects/:projectId/proposals/:id/reject` | Explicit rejection | Owner |
| GET | `/usage` | Period and per-connection limits and actual usage | Verified member |
| GET/DELETE | `/projects/:projectId/agent-history` | Read/export/delete eligible saved history | Owner; policy-specific retention |

These are **candidate contracts**, not promised public routes. Before implementation reconcile exact path regex and host routing with the current Worker and its tests. Never allow a GET callback to directly mutate project content; the OAuth callback changes only the connection association after verified browser consent.

### Response and error contract

Every private response: `Cache-Control: no-store`; no OAuth tokens, bearer credentials, raw prompt diagnostics or secrets in JSON/error bodies. Sensitive GETs reject guests and conflicting member/project identity. Distinguish:
- `401` member not authenticated/verified session missing.
- `403` authentic account but not in private grant/role.
- `404` nonexistent or inaccessible project/resource (avoid enumeration).
- `409` stale file/project revision or already-consumed proposal.
- `422` structurally unsafe/invalid diff, unsupported file type or oversized context.
- `429` per-member rate/cost/concurrency protection.
- `503` missing binding, disconnected model, eligible OAuth unavailable or upstream failure.
Return a stable public error code (e.g. `AGENT_REVISION_CONFLICT`) plus user-safe text; don't pass raw vendor responses to the browser.

### Conceptual run-create body

```json
{
  "profileId": "server-issued-profile-id",
  "connectionId": "server-issued-connection-id",
  "prompt": "Clarify the choices in the selected scene",
  "context": [
    {"fileId": "owned-scene-file-id", "expectedRevision": 12}
  ],
  "requestedCapability": "propose",
  "clientRequestId": "fresh-uuid"
}
```

*Ownership comes entirely from the cookie-authenticated server session.* The above IDs are looked up independently and cannot authorize a different owner or another project. Max file count/bytes/tokens set in server policy. Do not accept arbitrary `url`, `path`, `userId`, `role=admin` or `publish` fields.

### Streaming events (illustrative first-party SSE envelope)

```text
event: run.started
data: {"runId":"...","projectId":"...","state":"running"}

event: run.status
data: {"phase":"reading-approved-context"}

event: run.text_delta
data: {"text":"The current scene has two..."} 

event: run.proposal_ready
data: {"proposalId":"...","count":2,"baseRevision":12}

event: run.completed
data: {"status":"completed","usage":{"inputTokens":1234,"outputTokens":345}}
```

All event payloads server-sanitized and run-bound, with monotonic event IDs for permitted resumptions. SSE disconnect is not treated as task cancellation; explicit `/cancel` action must stop the server run. Never include token secrets or other member data. If hosting constraints preclude reliable SSE, first release may use bounded polling of authenticated run status rather than an unsafe fake stream.

## 3. Pilot runtime choice

**Default:** implement a small explicit OpenAI Responses API tool loop owned by the authenticated Cloudflare Worker/integrated service, not an open-ended general agent shell. This is sufficient for read-only narrative assistance and staged semantic diffs. Tool calling uses strictly validated JSON schemas; model-produced tool requests are treated as suggestions until an application-owned service approves and performs the read.

**Only first-party tools exposed to the model:**
1. `list_selected_files()` → already-authorized file IDs/names/versions only.
2. `read_selected_file(fileId,revision)` → exact grant-bound, secret-screened, size-limited snapshot.
3. `read_selected_diagnostics(diagnosticSetId)` → scoped, scrubbed pre-existing test/validation output.
4. `propose_changes(baseRevision,operations[])` → validates target IDs/operation types, persists **pending proposal** not a saved file.
5. Later `request_sandbox_preview()` → can create a **request** for explicit creator-triggered isolated preview; not actual arbitrary code execution.

All function schemas strict, `additionalProperties:false` and explicit required fields. No generalized `fetch_url`, `execute_shell`, `git_push`, `db_query`, `send_email`, `modify_permissions`, `charge` or `publish` tools. If a model attempts a forbidden tool name, fail closed and audit. A prompt is not a grant.

Use bounded individual model calls, bounded multi-tool loops (e.g., max 4 turns pilot), timeouts, concurrency caps and explicit budget reservation. If runtime durations are insufficient, store a resumable run and use an approved existing queue/DO design **only after** infrastructure review; no new paid infrastructure by assumption. The higher-level Agents SDK or managed Agents API can be evaluated when multiple agents/handoffs justify added complexity; avoid premature orchestration.

Official basis:
- https://developers.openai.com/api/docs/guides/function-calling
- https://developers.openai.com/api/docs/guides/streaming-responses
- https://developers.openai.com/api/docs/guides/agents/sdk
- https://developers.openai.com/api/docs/guides/agents

## 4. Data model, migrations and sensitive storage

These are **proposed tables**. Number the actual SQL migration only after inspecting latest merged staging/production schema, backups and restore rehearsal; do not assume `0014` is still unused.

### `studio_agent_connections`
- `id` opaque UUID; `member_id` canonical user ID; `provider` fixed `openai` for V110.
- `method` enum `managed_pilot` / `approved_oidc` / future `user_api_key`.
- `status` enum `pending` / `active` / `reconsent_required` / `revoked` / `error`.
- `external_issuer`, `external_client_id`, keyed/HMAC external subject for matching; minimized display name/email only if consented.
- `secret_ref` **server-only encrypted or secret-vault reference** for any actual credentials; never raw token value in D1.
- `granted_scopes` structured enum, `billing_mode`, `created_at`, `last_validated_at`, `revoked_at`, `revision`.
- Unique identity binding guards against cross-user connection replay.

### `studio_agent_profiles`
- `id`, `member_id`, canonical `project_id`, `connection_id`, `display_name`, `role`, `instructions` (size-limited, treated untrusted), `model_ref` (allowlisted), `created_at`, `updated_at`, `revision`, `archived_at`.

### `studio_agent_grants`
- `id`, `member_id`, `project_id`, `connection_id`, `profile_id`, `allowed_file_ids` (normalized join table preferred), `allowed_operations` (read/propose only until later), `granted_at`, `expires_at`, `revoked_at` and grant `revision`.
- No wildcard "all projects" scope in pilot. Recheck member, project, file and grant every tool call; do not rely solely on approval at task creation.

### `studio_agent_threads` and `studio_agent_runs`
- Threads: `id`, `member_id`, `project_id`, `profile_id`, creator-visible title, retention policy key, timestamps; stored content only under declared retention consent.
- Runs: `id`, `client_request_id`, `member_id`, `project_id`, `thread_id`, `connection_id`, `model_ref`, `scope_receipt_hash`, `status`, `error_code`, `reserved_budget`, `actual_usage`, `cancelled_at`, created/finished timestamps.
- Unique idempotency key per owner/project/action; a browser retry must not double charge or duplicate a saved diff.

### `studio_agent_proposals`
- `id`, `member_id`, `project_id`, `run_id`, `base_revision`, immutable `file_manifest`, `operations_hash`, `diff_blob_ref`, validation metadata, `state`, `created_at`, `expires_at`, `applied_revision`, `applied_by_member_id`.
- D1 row stores structured metadata only; larger validated diff/source snapshots can use private R2 with existing quotas and server-only object keys. A proposal is not an executable package or publication.
- Rejected/conflicted/expired proposals cannot later apply without a fresh user-requested regeneration against current source.

### `studio_agent_events` (append-only audit; bounded)
- `id`, `actor_member_id`, `project_id`, `connection_id`, `run_id`, `proposal_id`, `event`, `result`, `created_at` and safe diagnostic code.
- Audit uses minimal metadata, not default full prompts, full source text, provider keys or cookies. Make retention/export/delete rules explicit and conform to adopted privacy/legal policies.

### Storage and cryptography rules
- ANEVUM API secrets remain Cloudflare Worker/server secret bindings, not public Vite `VITE_` variables.
- If supporting user credentials or OAuth refresh tokens, use envelope encryption with authenticated AEAD, rotating versioned key encryption keys held outside D1 and strict access controls, or a reviewed managed vault. Avoid declaring that plain D1 encryption at rest alone makes tokens safe.
- Hash/external subject identifiers should use keyed HMAC for equality lookups where practical; do not use unsalted fast hashes for low-entropy personal identifiers. Minimize retained email/display name.
- Expiration/cleanup jobs must be idempotent; account closure and member export need a reviewed route for connections, grants, threads, proposals and usage data.
- Do not assign hardcoded universal retention durations until actual product policy, legal obligations, and OpenAI retention behavior are reconciled.

## 5. Connection states and approved OpenAI account linking

**Pilot, reachable without commercial OAuth:** `unavailable → managed_pilot_eligible → creator_consents → active`. The pilot connection is ANEVUM-owned service access, **not** a user ChatGPT account authorization. Users see the cost arrangement and limits.

**Future commercial website OAuth (ONLY after approval):**
1. ANEVUM member remains authenticated in existing canonical Better Auth session.
2. Server validates pilot eligibility/CSRF, starts separate OIDC transaction and binds one-time `state`, nonce, S256 verifier, expected issuer/client, exact callback URI, created time and initiating member/session fingerprint.
3. Redirect to official OpenAI authorization endpoint based on OIDC discovery with granted client registration. Prompt user to consent to identity. Do not use user's ChatGPT password in ANEVUM.
4. Callback validates and one-time consumes state, exchanges code server-side with PKCE, validates ID token signature/JWKS, `iss`, `aud`, `exp`, `nonce` and the initiating ANEVUM user binding.
5. Associate issuer/client/`sub` with **existing ANEVUM account as a connection**, not automatic replacement of ANEVUM's session. Require explicit confirmation before linking a different OpenAI identity.
6. Separately inspect *actually granted inference scopes*. Identity-only must not enable model runs. If the approved commercial integration does not include plan usage, use an explicitly agreed separate API billing method.
7. Disconnect clears local mapping/credentials and attempts provider revocation where supported. Active runs must fail closed. Reauthentication required on token expiry/revocation.

**Do not copy the open-source loopback dynamic-client `ext_agent_host_id` scheme into ANEVUM's remotely hosted commercial website.** That registration mode has distinct eligibility and callback requirements. Sources:
- https://developers.openai.com/siwc/website
- https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- https://developers.openai.com/siwc/token-sharing-open-source/errors-and-recovery

## 6. Permission decision for each action

```text
ALLOW_AGENT_READ(member,project,file,grant,connection,run)
= verified_current_member
  ∧ project.owner/member_permission(current_member)
  ∧ file.project_id == project.id
  ∧ explicit_grant.contains(file.id,"read")
  ∧ grant.not_expired_and_not_revoked
  ∧ connection.active_and_eligible
  ∧ server_feature_enabled
  ∧ current_run.not_cancelled
  ∧ budget_within_limit
  ∧ current_file_revision_matches_snapshot
```

The creator may have a collaborator edit role later; a permission-checked actor applies edits, not a self-appointed agent "role". **Grant revocation and member account switching** override any cached prompt/session permissions.

Application boundary: agent inference, tool read, diff staging, commit and publishing are **different operations**; ensure explicit server-approved transitions.

## 7. State machines, atomicity and idempotency

**Run:** `created → validating → budget_reserved → running → completed` or `failed/cancelled/timed_out`. All terminal states settle usage reservation once. Event subscriptions never resurrect a cancelled run. Retries with the same client idempotency key return the same run where valid, never start parallel billable duplicates.

**Proposal:** `pending_review → applied | rejected | conflicted | expired`. On apply:
1. Authenticate member and validate origin/CSRF, human action, server feature flag and proposal owner.
2. Verify proposal is still pending and created under non-revoked scope; compare source/project expected revision(s).
3. Validate selected operations for schema, paths, size, license constraints, forbidden content and arbitrary-code restrictions.
4. Apply selected changes using existing canonical Studio/Workbench revision-checked save semantics; new project revision remains private. Use a DB transaction or equivalent atomic condition update to prevent double-save/race.
5. Mark applied receipt and idempotency key only after persistence is confirmed; emit no "saved" on unknown network outcome without reconciliation.
6. If stale, return `409` with current revision and safe review actions, never overwrite silently.

For the first Workbench story editor, operations must use actual `ANEVUM_BLOCKS_V1` scene/block IDs and run through existing encode/decode/limit checks; the existing bounded description field cannot be used as an unbounded app source filesystem. For later W2/W3 source files, use stable file IDs, per-file ETags and a reviewable manifest.

## 8. Content, prompt, and tool security

Agent input is untrusted in both directions: project text can contain prompt-injection commands, and model output can invent tools, fabricate test results, or expose unsafe URLs. Never interpret those as permissions.

Security controls:
- Source text and diagnostics enter as quoted/sandboxed task data, separate from system policy; explicit context list and hard truncation. Detect and redact/block secrets before model transmission.
- Every model-requested tool is allowlisted by the server and independently checks server-bound member/project/file grants. Never accept arbitrary URL fetches or path traversal.
- Strict JSON-schema validation plus semantic operation validation; reject unrecognized tool name, operation type, file path, oversized content or forbidden code execution.
- Strong CSP, content-type validation and no executable DOM insertion from markdown/code. Untrusted app preview only on distinct isolated runtime origin (no authenticated cookies, strict sandbox, controlled postMessage), not ANEVUM's privileged application origin.
- Never expose credentials in SSE, console, headers, screenshots, prompt context, R2 export or error telemetry. Encrypt credentials separately and do not share with connected agents.
- Implement human approval for proposed source edits, and maintain independent reviewer control for all publication. A generated button text saying "Publish" does nothing unless existing publishing API approves from a real authorized reviewer.
- Respect privacy/age gating, moderation/copyright and existing project provenance/AI-use disclosure.
- Log only essential policy decisions and quantitative usage; configurable source retention with account export/deletion and provider policy notices.

References:
- https://developers.openai.com/api/docs/guides/safety-best-practices
- https://developers.openai.com/api/docs/guides/your-data
- https://developers.openai.com/api/docs/guides/conversation-state

## 9. Billing quota and provider stability

Pilot starts disabled without founder-approved spend. When authorized, use a capped OpenAI API project with a server-side spending guard **in addition to** whatever provider account budgets exist. Request admission checks and atomic reservations against both member and global limits. Retain actual returned token usage and the model/provider used; mark uncertain charges as pending reconciliation rather than free.

Rate limits per member, concurrent streams, tool invocations, file size, allowed model choices, input/output tokens and timeout. Automated retries should be bounded and must not duplicate charges or applied revisions. A 429/5xx provider error returns an honest recoverable status and preserves the draft. Do not silently switch from an eligible ChatGPT-plan connection to billable API mode.

Keep `store:false` for applicable API responses if using stateless continuation. This is not a promise of zero provider retention; inspect provider policy and endpoint-specific retention, especially if later enabling remote assistants, Code Interpreter, file search or background mode.

## 10. Proposed TypeScript boundaries

The implementation should keep the OpenAI adapter small and isolate project authorization before inference.

```ts
type AgentProvider = 'openai'; // only supported public provider in V110
type ConnectionMethod = 'managed_pilot' | 'approved_oidc'; // BYOK deferred
type AgentCapability = 'read_selected' | 'propose_changes';
type AgentRunState = 'created' | 'validating' | 'running' |
  'completed' | 'failed' | 'cancelled' | 'timed_out';

interface AuthorizedContext {
  memberId: string;   // resolved only from canonical server session
  projectId: string;  // server-verified owner/project relation
  fileSnapshots: Array<{fileId:string;revision:number;sanitizedText:string}>;
  allowedTools: AgentCapability[];
  connectionId: string;
  budgetReceiptId: string;
}
interface ProposedOperation {
  fileId: string;
  baseRevision: number;
  operationType: string; // server-supported enum per document family
  payload: unknown;      // validated by strict per-type schema
}
interface AgentProviderAdapter {
  provider: AgentProvider;
  getEligibleModels(connectionId: string): Promise<string[]>;
  streamProposal(context: AuthorizedContext, prompt: string, signal: AbortSignal):
    AsyncIterable<unknown>;
}
```

The type examples are contracts, not drop-in production code. A future second provider gets its own adapter behind the same trust boundaries. No need to build speculative adapters now.

## 11. Staging/production isolation and release strategy

- **Client** example: `VITE_CREATOR_AGENT_DOCK_V110=false` default. **Server**: `CANONICAL_CREATOR_AGENT_PILOT_ENABLED=false` default. The server gate is authoritative; a manually enabled client cannot open routes or infer permissions when disabled.
- Use separate staging credentials, quota budgets and D1/R2 resources from production. Never test billable calls on production data without explicit approval.
- Schema migration requires independent encrypted backup and actual restore rehearsal, then approval and rollback path; do not reuse the existing Workbench migration as a shortcut.
- Deploy only an inactive, feature-off candidate after exact-head tests. A separate guarded rollout requires explicit signed real-account QA. Never inherit acceptance from PR #638, which is only the workspace shell.
- External OpenAI commercial OAuth needs partner approval, registered per-environment callback and verified token flow; no staged redirect to unsupported authorize endpoint.
- Keep public Creator V1 discovery/review and January 1, 2027 launch priorities undisturbed.

## 12. Test matrix (minimum initial implementation)

| Class | Case | Required result |
|---|---|---|
| Feature gates | Client ON/server OFF | 404/disabled, no provider call |
| Member | Anonymous/expired/unverified | 401 and no private disclosure |
| Ownership | Member B requests A's file, run, proposal | 403/404, no identifying metadata |
| Role | Member can create agent, not upload/review without grant | No privilege escalation |
| Scope | Prompt names an ungranted file | Server denies read |
| Context | File revision changes mid-run | No stale unapproved write |
| OAuth | Forged/mismatched/replayed state, invalid `iss`/`aud`/`nonce` | Rejected; ANEVUM session unchanged |
| Billing | Limit exceeded, duplicate request, provider 429 | No unauthorized extra API call/charge |
| Secrets | File contains API key or prompt exfiltration request | Blocked/redacted and audit result |
| Tools | Model requests shell, network, publish or staff action | Denied, no side effect |
| Diff | Invalid block schema, unsupported file, oversized patch | 422, existing data intact |
| Apply | Two concurrent approvals or stale revision | One atomic apply or 409, no double-save |
| Cancellation | Stop during stream / revoke while running | Further tools/writes denied |
| Recovery | Provider error, SSE disconnect, account switch | No stale private content, honest state |
| UX | 320/390 iPhone, desktop, reduced motion, keyboard, focus | No overlap/clipping; accessible approvals |
| Release | Creator → moderation → guest play; no agent publish | Existing independent gates retained |
| Retention | Export/closure/disconnect/delete | Data policy honored, no orphan credentials |

**Success evidence** must include test source SHA, actual staging identity roles, real provider request IDs with secrets redacted, exact saving revision, usage ledger reconciliation, and real physical Safari evidence. Synthetic browser fixtures are useful but not proof of live account or API acceptance.

## 13. Questions reserved for mandatory external authorization

No additional product clarification is necessary to start non-billable UX scaffolding. These later steps genuinely require outside decisions/permissions:
- Founder authorizes an actual monthly OpenAI API spend and accepted payment method.
- OpenAI grants commercial website Sign in with ChatGPT client registration, if desired.
- Owner approves credential storage/security review, data retention/privacy disclosure and any use of customer material beyond the first constrained pilot.
- Owner explicitly approves production database migration, rollout, publication and other irreversible actions.

**Scope end:** This is a comprehensive implementation contract, not an executed migration, functioning OAuth integration, hosted agent, connected OpenAI model, or evidence of product acceptance.
