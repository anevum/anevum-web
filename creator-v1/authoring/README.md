# ANEVUM Creator V1 launch overhaul — 2026-10-11

Session: `ANEVUM.ANEVUM.PLAN.2026-10-11.001.NEW-YEAR-LAUNCH-OVERHAUL`

This package implements and tests the first authenticated **owner-only** project authoring flow for isolated staging. It is not public signup and not a fully launched marketplace. All actual projects and votes must remain real, not design fixtures.

`authoring/worker.mjs` is an Access-protected Cloudflare Worker for `studio.next.anevum.com`.

`migrations/0002_staff_authoring.sql` is applied only to the new isolated staging D1.

`tests/authoring.test.mjs` uses an ephemeral SQLite database and locally signed RSA/JWT fixtures to verify the draft/edit/submit/publish/archive workflow, signature and claim rejection, origin/CSRF restrictions and public catalogue filtering.

`docs/LAUNCH-2027-OPERATING-PLAN.md` contains launch milestones and feature acceptance gates.

`docs/INTEGRATION-READINESS.md` distinguishes connectors, production integrations, and dependencies.

Required Worker bindings: `COMMUNITY_DB` (D1), `STUDIO_ACCESS_ISSUER`, `STUDIO_ACCESS_AUDIENCE`, `STUDIO_ALLOWED_EMAILS` (plain text, no shared V5 session secrets). No outgoing email or arbitrary code execution in this Worker.

Deployment: first create Access application for full studio hostname, verify owner allowlist, upload Worker and bind only staging D1, attach `studio.next.anevum.com`, verify anonymous Access challenge, then test allowed owner session. Never bind to production community D1 before reviewed promotion.