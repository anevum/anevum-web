# ANEVUM Private Lab V001.1 — Actual-build acceptance handoff

**Session:** `ANEVUM.WEB.UPDATE.2026-10-22.001.LAB-PREVIEW-REAL-BUILD-HANDOFF`  
**Date:** October 22, 2026  
**Repo:** `anevum/anevum-web`, existing private Lab preview PR #540.

## Change

The existing `/previews/` owner-only simulator stays a **synthetic design-workspace sandbox**. This update adds one distinct visible handoff for testing the **actual integrated ANEVUM application** through the existing, already reviewed Cloudflare Access acceptance entry:

`https://anevum.com/__enter/v095-v096`

This is only a link, not a route added to the preview Worker and not a login bypass. The entry itself verifies an allowed tester identity and a short-lived review window, and can be unavailable if the window has expired. The preview UI explicitly says this. No cookie, test token, member data, secrets or approval is injected.

The preview Worker remains `/previews/*` only and has no D1, live account operations, XP, moderation or publishing API. Existing five simulation scenes, CSP, noindex, fail-closed hostname checks and no-write assurances are unchanged.

The manifest now distinguishes the external link from this Worker using `realBuildHandoff`, with `requiresLogin`, `requiresActiveWindow`, `availability=TIME_LIMITED_NOT_ASSERTED` and `builtInThisWorker=false`. The source and health version move to V001.1 for truthful identification.

## Safety and acceptance

- Existing Access policy for `lab.anevum.com` is the enforced owner boundary.
- The separate `anevum.com` protected entry has its own signed Access and review expiry; this update cannot start, extend or bypass a session.
- Source CI and responsive Chromium acceptance must pass on the exact head; iPhone Safari and authorized tester login remain owner-review gates.
- Live deployed preview Worker `anevum-lab-previews-v001` must stay on V001 until a separately checked V001.1 version is uploaded inactive, signed in, and explicitly promoted under a guarded release.
- No changes to the public apex, Lab main Worker, IREN staff services, actual member records or ANEVUM Sites.

This is a continuation of the existing preview console, not a second staging website.
