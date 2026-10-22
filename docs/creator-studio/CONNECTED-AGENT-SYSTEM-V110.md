# ANEVUM Creator Studio — Connected Agent System V110
## Product requirements, scope, policy and delivery contract

**Session:** `ANEVUM.WEB.DESIGN.2026-10-22.002.OPENAI-AGENT-CONNECTION`
**Design state:** Full proposed specification, not yet an implemented or authorized production feature.
**Owner direction (locked):** Creator Studio will support connecting an AI agent. Initial supported AI provider is **OpenAI only**; other providers are later expansion.
**Related:** Creator Studio Next #635; V109 multi-tab workspace draft PR #638; Creator V1 #325; doctrine #344; January 1, 2027 release board #308.
**Companion design:** [User experience](./CONNECTED-AGENT-UX-V110.md) and [engineering architecture](./CONNECTED-AGENT-ENGINEERING-V110.md).

### Executive decision

Design one ANEVUM-owned agent collaboration layer inside the **existing** verified member Studio. Do not make a second studio, user account, rights system, code-hosting system, or release/moderation process. An agent is not an administrator. It can read intentionally disclosed project context, explain problems, and offer changes; the creator approves application to an editable draft. It must not directly publish, alter another member's work, change roles, access secrets, spend above approved limits, or run arbitrary code on ANEVUM's authenticated origin.

Build in this order: **workspace → real folders/files + revisions → read-only agent assistance → staged code/scene proposals → explicit apply → isolated preview.** Existing Workbench text scenes provide the first practical agent-editable vertical slice after pilot feature/DB approval. This is not a substitute for finishing the Creator V1 release.

## 1. Three separate identity layers

1. **ANEVUM member session** (existing canonical Better Auth, email verified) binds server-side to all project ownership and permissions. The member is always the authority for project editing. Staff reviewer rights remain independently managed.
2. **OpenAI connection** represents an eligible, authorized way to ask OpenAI models to help. This is neither a second ANEVUM sign-in nor proof the user's personal ChatGPT conversations/custom GPTs/Codex agents can be imported.
3. **Studio agent profile** is a project-scoped ANEVUM object specifying role, tone/instructions, model selection, permitted files and allowed *proposals*. Several profiles may exist for one project; the initial pilot runs one active profile at a time.

IREN remains ANEVUM's native guide, navigation and status voice. The connected OpenAI agent performs scoped creative/development assistance. IREN may summon the agent dock and explain what it can do, but cannot silently grant it access or approve its work.

## 2. Official OpenAI integration feasibility (verified October 22, 2026)

- **OpenAI's website Sign in with ChatGPT** uses OIDC OAuth 2.0 authorization code + PKCE. Commercial hosted website participation remains a **limited partner trial**, requiring an approved client registration. A future ANEVUM website connection must use the approved issuer, registered redirect URIs, state/nonce/PKCE and back-end ID-token verification. It must not use a fabricated OpenAI login dialog or seek a user's ChatGPT password.
- **ChatGPT-plan-powered inference** is a separate, optional permission/capability; it is not implied by the identity token. The open-source/local-host flow is not a free substitute for an unapproved commercial ANEVUM website. Do not advertise ChatGPT subscriptions as including Studio API usage unless ANEVUM is explicitly eligible and required scopes are granted.
- **Initial technically feasible pilot:** existing ANEVUM service credential held server-side in an ANEVUM-controlled OpenAI API project, founder-approved usage budget, closed pilot. This is **"OpenAI powered"**, not "Signed in with ChatGPT." Billing for ordinary API requests is separate.
- **Potential later billing mode:** eligible user-provided API key/organization connection, protected with encrypted credentials and disconnection. This adds security/support responsibilities and is not necessary for the first pilot. Never put an API key in a front-end environment variable, source file, screenshot or browser preference storage.
- As of the verified docs, OpenAI models can drive a scoped server tool loop through the **Responses API**, with structured function tools and streaming. Avoid claiming access to private ChatGPT history, memory, personal custom GPT definitions, or pre-existing agent sessions merely because OpenAI authentication succeeds.

Official sources:
- https://developers.openai.com/siwc/website
- https://developers.openai.com/siwc/quickstart
- https://developers.openai.com/siwc/token-sharing-open-source
- https://developers.openai.com/api/docs/guides/function-calling
- https://developers.openai.com/api/docs/guides/streaming-responses
- https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform

## 3. Product experience and naming

**Navigation:** Studio → left rail **Agents** or command palette "Open Agent Dock"; project Explorer and tabs stay visible. **Connected Agent** is a side dock on desktop and a full-height safe-area-aware panel on phone. An agent is an optional working companion; the rest of Studio works without AI.

**Initial product labels:**
- No eligible connection: **"OpenAI agent — not connected"**, CTA **"Set up OpenAI"**.
- Managed API pilot: **"OpenAI-powered agent / ANEVUM pilot"**, with honest usage funding; never call it "Continue with ChatGPT".
- Approved account authorization: **"Continue with ChatGPT"** using OpenAI-approved branding, only after commercial client approval. Follow with **"Connected OpenAI account"** and specifically show whether model-usage permission was separately granted.
- Inactive/no access: **"Agent unavailable in this environment"** rather than a dead button or fake connected indicator.
- Agent result: **"Proposed changes"** until the creator has approved and the server confirms actual save. No UI may claim that a draft was saved, a build tested, or an app published merely because the model said it happened.

The visible provider selector lists **only OpenAI**. The backend may have a small internal adapter interface but must not expose unsupported providers.

## 4. Primary user journeys

**A. First connection:** Verified creator opens Agents → reviews explanation of project-only access, data sent to OpenAI, usage/billing, and non-autonomous editing → selects a real, available connection method → grants access to one project and selected file IDs → picks a starter agent profile → sends a first task. All state must be actually confirmed by the back end; denied consent preserves the project unchanged.

**B. Read-only assistance:** Creator opens a scene/file and asks "Explain this logic" or "Find why this interaction fails." The model receives only the chosen file snapshot, selected diagnostics and creator's prompt. It answers with references to actual files/versions and honest uncertainty. Other projects, unpublished releases, messages and secrets are not automatically attached.

**C. Propose and apply:** Creator says "Make the dialogue choices clearer" or "Fix this button." Model returns a structured staged proposal/diff against the *exact selected revision*. UI shows changed files, before/after, validation results and potential risks. Creator chooses all/some/none; server rechecks owner permissions, file grants, current revisions, content safety and idempotency; approved changes become a new reversible Studio revision. Agent is not allowed a direct unrestricted write tool.

**D. Preview and test:** Creator deliberately opens the existing private player or a future isolated preview runtime for the edited revision. An AI can suggest tests or generate test descriptions. Passing test output requires a real test runner/fixture; never invent success. The known iPhone "Expand Player" issue #631 still needs normal repair.

**E. Switch files/projects/accounts:** Changing active project requires a new disclosure/grant. Returning to tabs restores the member-scoped layout only. Switching ANEVUM accounts immediately unmounts agent threads, invalidates grants and aborts local streams; no stale member/project text is displayed.

**F. Disconnect/revoke:** User can stop a run, revoke project/file grants, disconnect the OpenAI connection, delete retained agent conversations, and export their work. Revocation blocks fresh requests and proposed writes; backend must also terminate/deny subsequent tool calls in still-running tasks.

**G. Recover:** No connection, unapproved OAuth client, exhausted cost cap, account expired, API 401/403/429, model timeout, file deleted, revision conflict, prompt injection or stale run has a distinct non-destructive state and actionable retry or safe reset.

## 5. Agent roles and capability ceilings

Initial *role presets* (all use OpenAI; role is not another provider):
- **Builder** — drafts UI components, game rules, screens or basic interactions.
- **Designer** — examines responsive layouts, accessibility, composition and interaction hierarchy.
- **Debugger** — reads selected code/diagnostics, proposes minimal fixes and tests.
- **Story Architect** — creates branching scenes and content flows using the canonical Workbench document schema.
- **QA Observer** — drafts checks, identifies regressions and reports evidence; does not certify checks it did not run.

**Pilot default:** one active agent/profile per project, explicit file context; tools limited to `list_selected_files`, `read_selected_file`, `read_selected_diagnostics`, and `propose_changes`. For the first demonstrable slice, support a single narrative Workbench document plus read-only diagnostics. No file writes, shell, GitHub push, internet fetch, package install, model-driven URL requests, email, purchases, production deploy or publication tools.

**After proven acceptance:** optional sandbox test trigger and reviewed write apply. Later UI/2D game files follow the real W2/W3 file storage contracts; no false "make any app" claim before a supported runtime exists.

## 6. File/context disclosure

- The default attached context is **only the current selected document** when the creator explicitly checks "Include current file". Explorer offers multi-select "Attach to agent"; previews show each selected file name, approximate size and whether it will be transmitted to OpenAI.
- Server resolves all IDs to canonical owner/project using session; no user-supplied arbitrary URLs or paths are accepted as file access grants. Names/IDs in a prompt never authorize access.
- Secret scanner redacts or blocks detected credential-like content; private staff materials and other ANEVUM member work are never eligible tools. Unsupported binary assets need separately accepted transforms.
- Each run stores a disclosure receipt: authorized member ID, project ID, file IDs, exact revisions, requested tool scopes, model connection and usage policy snapshot. Do not record secrets in receipts.
- The model's instructions and project files are untrusted inputs. Agent profile instructions cannot override policy, file scopes or required approvals.

## 7. Usage, billing and sustainable operation

- One founder/invited-member pilot, behind separate client **and** server flags, without exposing token spend to every user.
- Before a billable run, display whether usage is provided by ANEVUM's capped pilot budget, a separate user API account (only if supported), or a legitimately authorized ChatGPT plan (only if approved).
- Require globally enforced owner budget, per-member daily cap, per-run token/time/tool limits, concurrent-run cap, and automatic fail-closed denial on unavailable usage data. Example *planning target*, not enabled production policy: one simultaneous run per member; ten runs/day; a small monthly founder-controlled aggregate USD budget; no paid tools. Values require owner approval and live pricing review.
- Show used/remaining allowance, model, estimate versus **actual recorded usage**, and an explicit **Stop** action. Do not claim the preview is free or the ChatGPT subscription covers it unless true for that connection.
- No general-audience paywall, marketplace, cash rewards, usage promises or paid ranking tie-in. AI-assisted work remains optional, and creator-controlled publishing rights/provenance disclosure remain required.

## 8. Privacy and rights

Creators own their work under the existing platform terms; opening an AI dock grants no OpenAI or ANEVUM new publication rights. Before sending source/assets, obtain real consent disclosing provider, purpose, data categories, available retention and billing. For API requests use `store:false` where compatible, recognize that provider-side abuse/retention policies may still apply, and make no unconditional zero-retention claim.

Threads, proposals, provider connection records and audit trails must have separate documented retention/export/delete rules before activation; auto-expiration, explicit deletion and owner account closure must be tested. Keep per-project histories private. Public project passports must preserve accurate AI-use disclosure, human contribution, third-party credits and licenses. Refuse accidental access to private family content, unrelated member projects or arbitrary external services.

## 9. Permissions and publishing boundary

| Operation | Agent may request | Creator approval | Authority |
|---|---|---|---|
| Read explicitly selected file | Yes, with scope | Prior project/file consent | Canonical member/project check |
| Summarize, explain, suggest | Yes | Request itself | Server tool allowlist |
| Draft new file or edit | **Proposal only** | Required before save | Revision-checked project service |
| Run private sandbox preview | Later | Explicit user action | Isolated runtime only |
| Submit for independent review | No agent tool | Existing creator flow | Current publishing service |
| Approve/publish/suspend releases | Never | Staff action under existing roles | Independent reviewer service |
| Modify identity, Access, XP, billing, staff, RHEN | Never | Not offered | Existing systems unchanged |

## 10. Visual art direction

Make it feel like a **Continuance Institute technical instrument**, not a generic chatbot. Reuse ANEVUM's dark orbital environment, violet/cyan highlights, high-contrast panels, precise typographic scales and subtle motion. IREN is a separate in-world guide identity; a connected agent should appear as a restrained "signal" tile, not a competing mascot. Use gentle orbital activity only when a real run is active; every animation has a reduced-motion fallback.

Accessibility is functional: role-labelled tabs, large enough touch targets, robust focus/keyboard operations, screen-reader announcements for task completion and approval, visible connection and spending state, 320px and 390px tests, safe-area mobile panels and no hover-only actions.

## 11. Versioned phases and hard gates

| Phase | Deliverable | Gate |
|---|---|---|
| **V110-DESIGN** | This PRD, UI system, API/data/security proposal | Source documentation only |
| **A0** | Real workspace and file/revision API foundations (V109/W2–W3) | Existing Auth/release gates; backups and restore |
| **A1** | Flagged Agent Dock with clearly **disconnected/mock** states | No external call, no fake authorization |
| **A2** | Owner-only server connection, read-only agent using OpenAI API | Explicit spend approval, secrets, telemetry, protected acceptance |
| **A3** | Staged diff/proposal storage + human-approved revision save | Cross-account conflict/safety tests and restore |
| **A4** | Isolated preview/test integration, file-level multi-tab awareness | Real browser/device sandbox QA |
| **A5** | Invite-only pilot, usage controls, support and revocation | Authentic member journeys, documented retention |
| **A6** | Commercial Sign in with ChatGPT **only if approved** | Valid client, scopes, OAuth and cost model |
| **Future** | Other providers/multi-agent orchestration, collaborative teams | Separate demand, trust and cost case |

Protect the January 1, 2027 public ANEVUM creator-discovery and moderation launch. Connected agents are not a P0 launch condition unless the existing launch board is explicitly changed.

## 12. Definition of done (feature, not this design document)

A verified invited creator can connect a genuine authorized OpenAI funding/identity method, select an actual private editable project/file, receive an accurately grounded streamed explanation, request a structured diff, inspect and accept a subset, save an actual new revision without losing unrelated data, preview it in a verified isolated environment, undo/revert, and disconnect. A second member cannot list, stream, modify or infer that project's data. A model cannot independently publish, change permissions or exceed enforced usage caps. All failure paths are non-destructive and audited. All tests run against the exact accepted source, and a human has checked desktop and physical iPhone Safari.

**Not implemented by this document:** OAuth client registration, a real OpenAI agent runtime, paid API calls, actual D1 migrations, account key storage, production flags, rollout, data access grants, code execution, or publication.
