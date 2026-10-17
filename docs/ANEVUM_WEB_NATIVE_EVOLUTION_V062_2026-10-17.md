# ANEVUM V062 — Native Evolution Miniatures
Session: `ANEVUM.WEB.BUILD.2026-10-17.011.NATIVE-MINIATURE-GLASS-AURA`
Date: October 17, 2026

## Production release

- Canonical host: https://anevum.com
- Active Worker: `anevum-apex-prelaunch-gateway`
- V062 deployed Worker version: `fda6e24a-73ab-4331-ac0e-32f7dba6b237`, 100% traffic
- Previous known-good Worker version: `0b8838ab-d7d4-44e5-8c50-362913a4bab7` (V061)
- Production source app commit: `615fca21eb57c37550b82775a9702723bca66925`
- Live browser QA source: `ee27a4ce42af1d13798cc292ca1eb16f45984641` (adds QA files only; no deployed app behavior change)
- QA run: https://github.com/anevum/anevum-web/actions/runs/39061570165 (success)
- Native candidate build run: https://github.com/anevum/anevum-web/actions/runs/39061207232 (app and native GPU QA passed; final candidate-upload shell reported failure on a jq precedence error despite successful non-deploying asset/version upload)

## User-facing behavior

V062 upgrades the same shared `LevelEmblem` component already used by member post/reply cards, wall author bylines, directory, member pages, level cabinet, and achievement-style notifications. The old CSS-only floating image is no longer the primary presentation.

- Native V059 specimen geometry is lazily decoded from the per-level gzip JSON scene and rendered with the original GLSL deformation modes and 26 material definitions, GGX-style direct lighting, texture-map lighting and emissive surfaces.
- A new small-format bloom post-pass composites live color, glow, a seeded moving dust field and each specimen's colored aura. Transparent alpha allows these objects to visually float beside the member portrait without a surrounding box.
- One shared WebGL canvas composites up to three visible native specimens on mobile, five on desktop. Scene data is cached with capped GPU resources. Unseen specimens display their transparent 128px / 256px high-resolution still image.
- `prefers-reduced-motion` freezes native motion while retaining the detailed frame; bandwidth-saving connections and mobile devices run reduced animation FPS.
- A graphics failure, unsupported browser, or lost GPU context retains the readable poster fallback. No WebGL renderer is created for each post.
- Level calculations, earned XP and awards, identity privacy and signed-in member permissions were not changed in this release.

## Security

V062's upload was performed with `wrangler versions upload` and did not change live traffic. The pre-existing public route remained on V061 while its bindings were checked.

Prior to promotion, Cloudflare independently confirmed both old and new candidate had **23 identical bindings**, including the four opaque `secret_text` bindings and both unchanged D1 databases, the expected public signup flags, the same Worker executable ETag and both canonical apex and retired staging routes. The V062 candidate was promoted by an explicit Workers Versions deployment operation with a recorded V061 rollback version.

No secret values were read, regenerated, logged, or exposed. No database migration or XP mutation was executed.

**Deployment safety rule:** Do not use `wrangler deploy --keep-vars` against this script-API-managed Worker: it previously removed four secret bindings. Subsequent releases must upload a non-deployed version, independently compare all 23 bindings against a known-good live version (or inherit secrets explicitly by API), then promote through the Cloudflare Worker Deployments API. Abort on provider route, secret, data-binding, code or source drift.

The original version-upload workflow has now been replaced by a read-only production smoke workflow to prevent stale or unintended re-upload.

## Evidence

Native GPU browser QA used a local test page with two independently animated 3D scenes: Vacuum Whisper and ANEVUM. It confirmed one WebGL context, native mesh movement between screenshots and identical frames after enabling reduced motion, with no exceptions. See https://github.com/anevum/anevum-web/actions/runs/39061207232 (all tests except shell's final jq check passed).

**Public production Chrome QA** at https://github.com/anevum/anevum-web/actions/runs/39061570165 is successful. It independently verified the actual community post's level 2 live GPU host on desktop 1440px and mobile 390px; one visible WebGL canvas, `data-live=true`, successful image, runtime manifest, albedo, height map, compressed native scene requests (HTTP 200), no JavaScript exceptions, no mobile horizontal overflow, and recognition of reduced-motion settings.

Member authentication public capability endpoint continued to report registration open with email login enabled.

### Follow-up

The automated browser is Chromium with software graphics, not physical iPhone Safari. Test V062 on physical iOS/iPadOS Safari for frame stability, OLED alpha quality, GPU context recovery, thermal behavior during a 20+ card scroll, and visually inspect screenshots. Any failure should keep the poster fallback and must not compromise sign-in, member XP or forum moderation.
