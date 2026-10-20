# ANEVUM / V076 — Evolution of Everything original model restoration

**Session:** `ANEVUM.WEB.PATCH.2026-10-18.001.EVOLUTION-MEDIA-RESTORE`  
**Date:** 2026-10-18  
**Production:** https://anevum.com  
**Release source:** `fix/evolution-of-everything-media-v076`  
**GitHub release verification:** [Production workflow 39151943865](https://github.com/anevum/anevum-web/actions/runs/39151943865), **success**  
**Canary verification:** [Workflow 39151660606](https://github.com/anevum/anevum-web/actions/runs/39151660606), **success**  
**Production Worker:** `anevum-apex-prelaunch-gateway`, version `83e456d5-0cb7-4e54-bb11-ba6a261040a4` deployed at 100%  
**Previous rollback version:** `f8c895cf-10d1-4357-b9ec-ea67eb351dec`  
**Cloudflare deployment:** `3e350189-a9a5-4578-bd44-f3d982a19d3b`

## Failure and correction

V075's owner-earned inventory worked, but media requests for opted-in Level 4 `Symmetry Field` returned HTTP 503 for all seven media variants. This made the client silently substitute an unrelated `OrbitalMark` for the approved original Evolution specimen.

The V076 Worker now fetches the **unchanged V059** models, textures and optical exports from its private Cloudflare ASSETS binding using `env.ASSETS.fetch(new URL(path, 'https://assets.local'))` after server-authorized D1-level checks. Transport errors are distinguished by HTTP 502. In React's `LevelEmblem`, level icons of 68px and above use the original 256px WebP first; smaller author-card icons use the original transparent 128px PNG. If all original sizes fail, the UI shows an explicit "ARTWORK UNAVAILABLE" state instead of introducing new art.

No level name, shape, threshold, animation material, shader or original 3D model was redesigned or replaced. This restores the existing **Evolution of Everything** collection rather than a generic alternative.

## Confirmed production gates

- All 30 original artifacts were rebuilt, including their 152 V059/V060 asset files.
- Canary returned HTTP 200 and correct MIME for opted-in Level 4: compact PNG, 256px preview, 1024px poster, compressed native scene.gz, runtime JSON, height PNG and albedo WebP.
- Unreached public Level 1 and direct public `/evolution/*` model routes returned HTTP 404 in canary.
- Production V076 release workflow verified actual PNG (128x128), WebP preview (256x256), WebP poster (1024x1024) and gzip scene (level 4 with native mesh parts), retained email auth methods and private owner protection, confirmed release frontend bytes, and preserved required D1/ASSETS/Better Auth/Resend bindings.
- Independent Cloudflare read shows the corrected version serving 100% of production traffic. All three relevant apex and asset routes are still assigned to the same gateway.
- Independent public live fetch confirms current opted-in `@devon` inventory remains Level 4 `Symmetry Field`, runtime responds with the unchanged V059 material shader definition, `/levels` remains an earned-only page, and `/evolution/` remains HTTP 404.
- Native Chrome browser test from [run 39152522677](https://github.com/anevum/anevum-web/actions/runs/39152522677) logged **PASS** for both desktop 1440px and mobile 390px. The earned profile icon decoded at naturalWidth 256, the Level 4 inspector opened, and a WebGL 1.0 rendering context initialized at canvas 790px desktop and 397px mobile with controls active and no poster fallback. That *run* exited nonzero only because ephemeral Chrome profile cleanup raised ENOTEMPTY after both successful render assertions; the QA cleanup was corrected and a new independent browser run was started. See latest run for the canonical QA result.

## Boundaries preserved

The public gallery is **not** restored. A member sees only their previously earned level history; outsiders may inspect only their current, explicitly public earned level and selected honors. The read-only canary workers.dev route was disabled after the production cutover (the canary Worker remains as a non-public rollback/debugging artifact). Authentication approvals, user/account data, public signup, existing recognition grants, XP thresholds, and XP history were not changed by V076.

**Outstanding:** Real iPhone Safari interaction remains a separate device-level acceptance check even after Chrome desktop and mobile emulation. The older badge code/catalogue may still reveal unreached insignia metadata to someone inspecting client JavaScript bundles. The production XP test flag remains enabled, so earning integrity merits a separate follow-up. Keep these concerns independent from the completed original-model media fix.
