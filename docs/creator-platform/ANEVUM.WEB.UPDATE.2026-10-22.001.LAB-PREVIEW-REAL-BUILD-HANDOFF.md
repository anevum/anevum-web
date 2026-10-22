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

## Verified V001.1 Cloudflare receipt — October 22

- Previous live V001 version `3df5d0aa-ba92-45e7-8ed4-68372fc4dc1a` at **100%**, deployment `371e4d50-d381-4264-a19e-4f20b06049d1`.
- Compared Cloudflare's deployed Worker source **byte-for-byte** to the repository's original V001 commit `8eb11a735a14d4cb6018f7b287445a7475daa3e0`; exact equality confirmed before uploading.
- Uploaded V001.1 **version-only candidate** `8a7ac69d-bee9-40c7-823a-74b8ac450bec` (V2) from reviewed source `8b154d3f5b05af76d254289396423432a7588cb4`, using unchanged compatibility date `2026-10-19` and zero bindings.
- Confirmed the active deployment ID and previous live V001 version remained **unchanged at 100%**; V001.1 serves **zero public/private traffic** until deliberately deployed.
- Exact final-head Github Action workflow runs [39837637816](https://github.com/anevum/anevum-web/actions/runs/39837637816) and [39837629568](https://github.com/anevum/anevum-web/actions/runs/39837629568) both concluded **success** for source and real-Chromium preview simulation checks.
- Candidate acceptance gate remains signed-in founder visual review and active time-limited real-build entry; no Access changes or public rollout authorized.

## Safety and acceptance

- Existing Access policy for `lab.anevum.com` is the enforced owner boundary.
- The separate `anevum.com` protected entry has its own signed Access and review expiry; this update cannot start, extend or bypass a session.
- Source CI and responsive Chromium acceptance must pass on the exact head; iPhone Safari and authorized tester login remain owner-review gates.
- Live deployed preview Worker `anevum-lab-previews-v001` must stay on V001 until a separately checked V001.1 version is uploaded inactive, signed in, and explicitly promoted under a guarded release.
- No changes to the public apex, Lab main Worker, IREN staff services, actual member records or ANEVUM Sites.

This is a continuation of the existing preview console, not a second staging website.
