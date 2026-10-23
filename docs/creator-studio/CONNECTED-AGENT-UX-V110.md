# Creator Studio V110 — Connected Agent UX and Interaction Design
**Design session:** `ANEVUM.WEB.DESIGN.2026-10-22.002.OPENAI-AGENT-CONNECTION`
**Status:** Proposed handoff / design-only. The screens below are specifications, not active production functionality.
**Parent:** [Connected Agent System PRD](./CONNECTED-AGENT-SYSTEM-V110.md).

## 1. Navigation and information architecture

The **existing Studio** stays the parent application. Agent assistance is part of the project, not a separate web destination or chatbot product.

```text
ANEVUM / CREATOR STUDIO
├── Project switcher
├── Explorer
│   ├── Project files + nested folders (after W2)
│   ├── Scenes / UI / assets / scripts (after W3)
│   ├── Versions / private builds / review
│   └── Agents                         [NEW]
├── Document tabs                      [V109 evolving]
├── Main editor / canvas / playtest
├── Inspector
├── Agent Dock                         [NEW: right dock / phone sheet]
│   ├── Conversation
│   ├── Context attachments
│   ├── Proposed changes
│   ├── Activity / usage
│   └── Connection + permissions
├── Bottom diagnostics / test output
└── IREN (native guide, visually and operationally separate)
```

**Do not turn project folders into agents.** Files/folders are project content; agent profiles are tools working on that content, with their own permission scopes. The Explorer initially shows only actual existing project inventories, as in V109, until file-tree storage is implemented.

## 2. Desktop application layout

Breakpoint target: 1440×900 desktop, then 1024, 768, 390 and 320 px. Content fills available safe viewport, using existing site header rules; if Studio later receives a dedicated immersive mode, it must hide/restore site chrome explicitly and keep browser back/focus reliable.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◌ ANEVUM / CREATOR STUDIO   ⌄ The First Signal   ◇ All changes saved   [Preview] [Review status] │
├─────────┬───────────────────────────┬────────────────────────────────┬─────────────────────────────┤
│ Activity│ EXPLORER                  │ Intro.scene  main.ts  UI ◇     │ AGENT DOCK                  │
│  Files  │ ▾ Scenes                  ├────────────────────────────────┤ OpenAI • ANEVUM pilot       │
│  Search │   ▸ Chapter 1             │                                │ Agent: Builder       ⌄     │
│  Agents │   • Intro.scene           │       VISUAL EDITOR            ├─────────────────────────────┤
│ Versions│ ▾ Scripts                 │                                │ Selected context            │
│  Assets │   • main.ts               │       Scene / UI / Graph        │ ☑ Intro.scene    r12       │
│         │ ▾ Assets                  │                                │ + Attach file               │
│         │                           │                                ├─────────────────────────────┤
│         │                           │                                │ Creator: Fix the choices.   │
│         │                           │                                │ Agent: Found two issues.    │
│         │                           │                                │ [Review 2 suggested edits]  │
│         │                           │                                │                             │
│         │                           │                                │ [ Ask Builder…            ] │
│         │                           │                                │ [ Send ]        [Stop]      │
├─────────┴───────────────────────────┴────────────────────────────────┴─────────────────────────────┤
│ DIAGNOSTICS  ▸  Preview · Validation · Build output · Version history                               │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PRIVATE DRAFT · REVISION 12                   AGENT HAS READ: 1 FILE                USAGE: 3/10 RUNS │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Dimensions and adaptive layout

- Activity rail: 52–60px desktop with textual tooltips and accessible labels; not a hover-only navigation path.
- Explorer: user-resizable target 240–320px; preserve min editor width rather than overflowing.
- Agent dock: 360–460px default, resizable 320–560px where space permits. Pin/collapse/hide controls; content can expand to focused review mode.
- Editor: flexible remaining area, never below 320px when dock is shown. If area is too narrow, dock overlays only through a deliberate opening action and traps/restores focus.
- Diagnostics: collapsible 170–270px, off by default when vertical space is limited.
- A private **Run activity** indicator lives in the dock; it never replaces the global publishing status.

### Three working modes

1. **Focus / Edit:** editor central, compact Agent dock, Inspector collapsible.
2. **Review Changes:** diff pane central, Agent dock narrows, Explorer visible; creator can select hunks and approve.
3. **Playtest:** isolated preview central, Agent dock available for diagnostic interpretation but can never directly manipulate protected host privileges.

The same file tab remains active across these modes. Split editor panes come after W1 once mobile and focus behavior are proven.

## 3. Mobile layout

On a phone the Agent dock becomes a safe-area-constrained sheet or a full-width workspace panel with a persistent close/back control. Use real dynamic viewport units and safe-area insets; avoid the existing Expanded Player crop regression (#631). The editor does not remain squeezed behind the dock.

```text
┌───────────────────────────────┐
│ ← STUDIO  / THE FIRST SIGNAL  │
│ [Files] [Editor] [Agent] [Run]│
├───────────────────────────────┤
│ AGENT / OPENAI                │
│ Builder • Connected via API   │
│ Project: The First Signal     │
├───────────────────────────────┤
│ Context: Intro.scene r12      │
│ [Change selected files]       │
├───────────────────────────────┤
│ You: Fix choice navigation.   │
│ Agent: 2 edits proposed.      │
│ [Open change review]          │
├───────────────────────────────┤
│ [Type a task…             ]   │
│ [Send]              [Stop]    │
├───────────────────────────────┤
│ Private only  •  Run 3 of 10  │
└───────────────────────────────┘
```

Touch targets at least 44×44 CSS px. On narrow devices, review diffs are stacked **before/after** rather than two narrow side-by-side columns. All close/disconnect/cancel actions have clear labels and confirmation for irreversible steps.

## 4. Connection setup sheet (four steps)

**Step 1 — What it does.** Title: "Connect OpenAI to this workspace." Body: "Your agent can help read and improve the project files you choose. It cannot publish your project or access other work without permission." Secondary "Not now"; primary "Continue".

**Step 2 — Choose eligible connection.**
- **Initial approved ANEVUM pilot path:** "Use OpenAI through the ANEVUM pilot". Subtext: "Pilot usage is provided within a limited allowance. You are not signing in to a ChatGPT account." Button "Use pilot connection" only if backend grants it.
- **Later, conditional OpenAI commercial OAuth:** "Continue with ChatGPT", using officially approved branding, only if an actual registered client is configured, including valid callback and verified scopes. If identity is linked but inference not authorized, show "Account connected — AI usage not enabled" and explain alternatives. Never imply automatic transfer of chats, custom GPTs, ChatGPT memory or existing agents.
- **Future BYOK path:** "Use an OpenAI API key" only after secure credential handling and billing disclosures are approved. Never present a disabled fake password field as a real connection option.
- Other providers: **not shown**.

**Step 3 — Give access.** Display actual project name, checked file list with exact revisions and content types. Initially allow **read selected files only**, plus "Suggest edits for my review". Explain that **all** content shown in the context summary may be transmitted to OpenAI. Include "View exact files" control. Default project selection is one active verified project, not all projects. Creator can revoke later.

**Step 4 — Choose role.** Starter Agent cards: Builder, Designer, Debugger, Story Architect, QA Observer, each with a one-sentence description, scope ceiling and ability to edit its name/instructions. Default suggestion: Builder for generic app/game project; Story Architect when opening a real branching-story Workbench document. Confirm "Create project agent".

After completion display a real backend-confirmed connection status. A connection-sheet close should never erase existing projects, permissions or revisions.

## 5. Agent Dock structure

Dock header: provider and connection mode, active agent name/role, active project, the agent's current **read-only/proposal** permission level, menu (Manage connection, Switch agent profile, View usage, Disconnect). If the account is disconnected, expose only setup and non-functional demo explanation, not a message composer pretending to send.

Context strip: a disclosure chip for current file + revision (click opens scope picker), "Remove" and "Add files", total context size and indicator when file version changes. Switching project clears previously attached file content and requires renewed authorization.

Conversation: creator prompt, streaming response with file citations/grounded file names, concise structured task activity, actual tool execution outcomes, warning when a model is uncertain. File links navigate only to files the member is authorized to open. Outputs are marked as **suggested** until applied.

Composer: text input; optional actions "Explain selected", "Propose fix", "Suggest test", "Improve interface" that insert editable prompts. Send has explicit effect only with real active connection and quota. Enter submits unless composing with IME; Shift+Enter newline; keyboard focus restored after response.

Run controls: "Stop generation", reasoned error/retry, elapsed action status, context list. Cancel request tells server to cancel; button never merely hides an ongoing paid run.

## 6. Proposed changes review (highest-trust interface)

Never accept prose like "I updated your file" as proof. The server returns a verifiable proposal against named resource IDs and a known base revision. Review screen:

```text
CHANGE REVIEW / THE FIRST SIGNAL / REV 12
Agent: Builder                    Status: Awaiting your approval
Changed resources: Intro.scene (2 hunks), UI (1 suggestion)
[Select all] [Clear selection]

▾ Intro.scene — Revision 12
   - Old destination: "chapter_two"
   + New destination: "scene_chapter_two"
   Explanation: Resolve missing choice target.
   [✓ Include this edit]

   - Button text: "Click"
   + Button text: "Enter the Archive"
   Explanation: Give the action a clear, meaningful label.
   [✓ Include this edit]

Validation: Proposed data passes structural schema checks.
Runtime playtest: NOT RUN.

[Reject proposal] [Save selected as new draft revision]
```

Behaviors:
- Selected hunks default **unselected** for sensitive changes, or preselected only when the creator explicitly requested a low-risk type and acceptance shows no surprise. Pilot default: unselected.
- "Save selected" requires valid current member, project edit state, exact current revision, server verification and idempotent request ID.
- On conflict: disable save and explain "Project changed since agent read revision 12." Offer **Review against latest** or discard; never silently clobber live work.
- After success: "Saved revision 13", activity/audit receipt, "Undo/revert" from existing revision controls. New change remains **private draft**, not published.
- If generated file content is unsupported by current Workbench schema, mark "Unsupported proposal" with export or manual copy option; do not coerce valid original documents.
- An agent cannot click the approval button itself; only an authenticated creator action triggers the commit.

## 7. IREN integration and division of labor

IREN keeps its role as the ANEVUM living system guide and site companion. Its Studio intents may be:
- "Open the Agent dock."
- "Explain why a file cannot be edited."
- "Show how to attach context."
- "Review what Builder proposed."
- "Return to the private player."

These intents trigger **navigation and instruction only**. They do not send project data to OpenAI, authorize payment, apply patches or publish. Connected agents are not branded as IREN itself. This preserves a stable system identity as more model providers are contemplated years later.

## 8. Status/copy system

| UI state | Visible wording | Actual interaction |
|---|---|---|
| No connection | "OpenAI agent not connected." | Show setup only |
| No approved commercial login | "ChatGPT sign-in is not available for this Studio environment." | Explain that an API pilot may be available |
| Identity only | "OpenAI account connected. Model usage not authorized." | Restrict task send; offer valid next step |
| Pilot connected | "OpenAI-powered pilot active." | Show grant and allowance |
| Not enough scope | "Select a file and authorize access." | Scope selector |
| Read in progress | "Reading selected files…" | Cancel/inspect attached items |
| Model streaming | "Drafting a suggestion…" | Stream true model text; Stop |
| Proposal ready | "3 edits awaiting your review." | Open diff/review |
| Saved | "Saved to private draft revision 13." | Only after server success |
| Revision conflict | "File changed since this proposal was made." | Compare/rebase/discard |
| Rate limit | "Usage is temporarily limited. No changes were made." | Retry only when valid |
| Revoke | "Connection removed; agent runs stopped." | Only after confirmed server result |
| Provider outage | "OpenAI is unavailable. Your project is unchanged." | Retry, not sign-out |
| Unauthorized member | "You cannot access this project's agent work." | Do not reveal metadata |

No simulated "Analyzing", "Complete", "Success", "Used your ChatGPT plan" or "Tests passed" when the service did not confirm those actions. Avoid false activity/progress percentages.

## 9. Visual system

**Theme:** Orbital Underground / Continuance Institute. Dark graphite-navy surfaces with measured luminous cyan (active/selection), violet (agent identity), subdued pink (studio provenance), and high-contrast neutral states. Dense enough to feel like professional software, not so cramped that mobile navigation collides.

Suggested *local* tokens, subject to existing site theme reconciliation:
- `--agent-canvas: #08111F`
- `--agent-panel: #111D30`
- `--agent-elevated: #1A2940`
- `--agent-edge: #35526C`
- `--agent-ink: #F2F6FD`
- `--agent-muted: #B5C8D9`
- `--agent-cyan: #A5E5EE`
- `--agent-violet: #C6B3F0`
- `--agent-warning: #F4C48B`
- `--agent-danger: #F0A3B2`

Colors never convey status alone: icons + labels required. Use typography appropriate to dense editor tabs and file trees. Contrast ratios must be checked against actual components, not assumed from token names.

Motion: short 120–220ms dock/tab transitions, a subtle real-time activity orbit for active streaming, no full-screen perpetual mascot motion. Stop animations when complete; reduced-motion gets an instant state change. Avoid IREN floating over diff approval buttons or full-screen preview controls.

## 10. Accessibility, privacy and test choreography

- Every dialog has initial focus, visible close/back, Escape behavior that does not cancel paid work silently, and focus restoration. A close with pending draft proposal prompts whether to keep or discard.
- Keyboard: command palette can find "Agents", tab strip remains accessible; agent panel uses standard text editing, buttons, labelled role list and accessible diff selection.
- Screen readers receive bounded `aria-live` updates at major task states rather than every streamed token.
- A project switch revokes browser-visible context and aborts stale streams immediately; a server grant remains project-specific and is never carried to the new project.
- Permission sheet states file names and provider data disclosures before the run, with a persistent "View what was sent" history entry (metadata and opted-in content according to retention policy).
- Mobile QA includes 320/390 portrait, landscape, OS keyboard, dynamic browser chrome, screen reader, zoom, agent sheet open/closed, keyboard focus and private playtest return.
- Ordinary creators without upload grants must still see their authorized project records but never gain build or reviewer permissions from an agent connection.

## 11. Design acceptance storyboard

1. New verified creator arrives at existing Studio, opens the optional Agent dock, and sees **not connected**.
2. An invited pilot member chooses a valid API-backed connection and reviews the project/file scope; nonpilot sees a truthful gate.
3. Creator opens one saved narrative scene and asks for an explanation. Output references the actual scene and revision; no other project traffic is observed.
4. Creator requests revised choice labels and reads a diff. "Save" requires explicit approval.
5. Server commits an authenticated new draft revision. Other member, public guest and reviewer still receive only their existing scope.
6. Creator opens existing private preview, tests it on phone, and can revert. No publication occurs.
7. Disconnect/leave the project, sign out and switch member identities: all agent context is hidden and revoked according to policy.

**This document designs the experience. It does not authorize any live AI action or claim that any of the above screens already exist.**
