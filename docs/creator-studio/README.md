# ANEVUM Creator Studio — Connected Agent V110

**Session:** `ANEVUM.WEB.DESIGN.2026-10-22.002.OPENAI-AGENT-CONNECTION`  
**Status:** Comprehensive design, not an active OpenAI integration.  
**Parent workstream:** [Creator Studio Next #635](https://github.com/anevum/anevum-web/issues/635)  
**First workspace shell:** [V109 draft #638](https://github.com/anevum/anevum-web/pull/638)  
**Public Creator V1 obligations:** [#325](https://github.com/anevum/anevum-web/issues/325), [#344](https://github.com/anevum/anevum-web/issues/344), [#308](https://github.com/anevum/anevum-web/issues/308)

## Read in this order

1. [Product requirements: OpenAI-first connected agents](./CONNECTED-AGENT-SYSTEM-V110.md). What to build, identity separation, connection feasibility, permission ceilings, roles, cost and phased delivery.
2. [UX design: desktop/mobile workspace and connection flow](./CONNECTED-AGENT-UX-V110.md). Agent dock, consent wizard, project context, streaming conversation, change review and responsive accessibility.
3. [Engineering design: backend/auth/tooling/data/security](./CONNECTED-AGENT-ENGINEERING-V110.md). Candidate endpoints, schema, trust boundaries, connection state machines, OpenAI Responses tool calling, proposal application and test matrix.

## Locked product intent

- A Creator Studio user will eventually connect **their AI agent**.
- **OpenAI is the sole initially supported provider.** No others are presented as available.
- Keep the creator's **ANEVUM identity**, the **OpenAI funding/login connection**, and the **project-scoped agent profile** separate.
- A verified member explicitly chooses which project files the agent sees.
- Agents can explain and propose source or scene changes; creator approval is required for a versioned private save.
- No model tool may publish work, change staff roles, bypass moderation or deploy arbitrary code on the authenticated ANEVUM origin.
- IREN remains the native Continuance Institute guide; a connected OpenAI agent is a separate assistant.

## Feasibility boundary

ANEVUM's immediately feasible pilot path is a **separately approved, capped OpenAI API connection held by ANEVUM**, scoped to invited members. This is **not** ChatGPT account sign-in, not imported ChatGPT history or existing personal custom agents, and not free inference under a ChatGPT subscription.

Official **Sign in with ChatGPT** website OAuth is a limited commercial partner trial as of October 22, 2026. Only enable its button once ANEVUM has registered/approved credentials and required permissions. The open-source client flow does not substitute for a commercial website authorization.

## Implementation dependency order

`V109 workspace shell` → `W2 server-owned project files and revisions` → `agent dock + permission UX` → `server feature gate/limited OpenAI API pilot` → `explicit context/agent run` → `reviewable proposal` → `user-confirmed revision save` → `isolated preview` → `optional approved ChatGPT OAuth`.

No rush to make agent assistance a prerequisite for the January 1, 2027 creator-discovery launch. In particular, do not interrupt creator onboarding, independent publishing review, mobile player repairs, release readiness or retained Workbench privacy gates to pursue provider integration.

## Current state and handoff

This repository folder contains design materials only. It does not contain an active agent service, an OAuth client, provider secrets, production migrations or a deployment. A standalone, no-network interactive concept prototype accompanies the design in the conversation deliverable; it is intentionally not installed as a live Studio route.

The next legitimate implementation PR after current workspace acceptance should be a **default-OFF, non-billable Agent Dock with real membership gating and disconnected/eligible UX**. It must not expose fictitious availability or invoke OpenAI until separately authorized.
