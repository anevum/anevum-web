# ANEVUM WEB / V075 earned rewards — production release

**Session:** `ANEVUM.WEB.RELEASE.2026-10-18.001.EARNED-REWARD-VAULT`  
**Date:** 2026-10-18  
**Release source commit:** `4fa0597afc16ff2a70cf57de89fc56eba3fea19c`  
**Public origin:** https://anevum.com  
**Cloudflare Worker:** `anevum-apex-prelaunch-gateway`  
**Active Worker version:** `f8c895cf-10d1-4357-b9ec-ea67eb351dec`  
**Deployment ID:** `5d52759a-d668-4db4-a5a7-dfbfab0eed15`  
**Rollback Worker version:** `2d967044-e3ac-4d8d-97bd-99625afe0b6d`  
**Original code review:** https://github.com/anevum/anevum-web/pull/515

## Actual released behavior

- Public 30-specimen gallery and unearned badge/medal pages replaced by private, earned-only /levels and /recognition views.
- Logged-in owners can inspect accumulated earned Evolution levels. Public member profiles permit inspection of only the member's current, opted-in, verified Evolution specimen and the member's published recognitions.
- Full native V059 meshes, all 30 original render exports and the complete shader runtime are retained in static storage. Interactive full-model inspection runs on demand, within a modal; the glitchy inline moving miniatures remain retired.
- Earned media and inventory requests are authorized by the canonical member service. Direct /evolution/* and /assets/levels/* requests are denied before serving models or spoilers.
- Existing protected-mailbox OTP approval was preserved from the V069 live patch. No member D1 migrations, XP grants, payment operations, or account data changes.
- Apex routes `anevum.com/*`, `anevum.com/assets/index-*`, and `anevum.com/evolution/vectors/*` now all resolve to the canonical apex Worker. Staff routes were left alone.

## Release verification

Build job #39148270066 completed full optical/native regeneration (152 assets), TypeScript compile, frontend build, model-preservation and reward authorization tests, and guarded release checks. Its final deployment step failed because its GitHub token was not authorized to update two Cloudflare routes (403). The automated rollback restored the previous Worker.

A separate Cloudflare account-authorized cutover deployed the **same prebuilt Worker version**, then changed those two routes through successful Cloudflare API calls, with a checked rollback version. The post-cutover Cloudflare inventory confirms the active version and route ownership.

Independent hosted read-only verification confirmed:
- `/levels` and `/recognition` render the earned-only guest experiences.
- `/evolution/`, `/evolution/assets/level-01-compact-128.png`, `/evolution/vectors/level-01.svg`, and `/assets/levels/series-one-v033/level-30.webp` return HTTP 404.
- Anonymous `/api/v1/member/rewards/inventory`, `/api/v1/member/rewards/levels/1/icon`, and `/api/v1/member/progression` return HTTP 401.
- `/api/v1/member/auth-methods` advertises email sign-in available.
- `/api/v1/member/health` reports ready and `/join` renders.
- The released `/assets/index-D1ldqGVz.js` is reachable on the apex route.
- The canonical public recognition-availability endpoint is still working.

## Remaining limitations / tracked follow-up

- Source-level secrecy for all future *badge SVG definitions and names* is not yet achieved; client art definitions still exist in source/bundles even though the user-facing catalog was removed. Do not describe badge source secrecy as complete.
- Existing production test-button XP remains enabled for legacy progression. This means XP is server-recorded but not all XP necessarily reflects ordinary contributions. A separate migration from staging XP to legitimate XP should be planned before making achievement scarcity claims.
- Hosted anonymous and automated regression tests passed; an authenticated real-device, iPhone Safari full-WebGL model viewer test remains necessary. Do not claim that a full interactive model was validated in a signed-in production browser.
- The original PR #515 remains a **draft source review** because its base branch is another unmerged design branch. Live deployment happened by a pinned release branch and Cloudflare Worker version, not by merging PR #515 to main.

No production changes are authorized by this documentation commit.
