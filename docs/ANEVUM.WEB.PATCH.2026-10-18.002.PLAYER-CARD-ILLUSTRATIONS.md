# ANEVUM — Earned player-card art, V077

Session: `ANEVUM.WEB.PATCH.2026-10-18.002.PLAYER-CARD-ILLUSTRATIONS`  
Date: 2026-10-18  
Repository: `anevum/anevum-web`  
Source branch: `patch/evolution-player-card-illustrations-v077-20261018`  
Base: `fix/evolution-of-everything-media-v076`

## Intent

The existing player-card Level 4 "Symmetry Field" mini screenshot reads poorly at 30–60 pixels because the oblique 3D plane silhouette loses its identity. More generally, small player cards cannot reliably reuse perspective screenshots of complex 3D specimens. Keep the complete original V059/V076 high-resolution 3D collectibles, materials, lighting, motion, and earned inspector unchanged.

## Implementation

- `creator-v1/canonical-auth/evolution-card-plates.json`: thirty separately composed front-facing 256-unit vector illustrations using each level's canonical V059 accent and unique subject silhouette. Level 4 is a bilaterally balanced ivory / slate / coral directional specimen, not a side view.
- `creator-v1/canonical-auth/evolution-card-art.mjs`: private server-only renderer outputs scalable SVG with lit ceramic, metal, stone and optical effects. No React import and no static publication of the registry.
- `creator-v1/canonical-auth/reward-media.mjs`: new `card` kind via existing owner and opted-in current public member reward media routes. Exact V075 D1 XP, current earned level, privacy and consent checks run BEFORE a single plate is selected. Requests for unearned media remain 404.
- `creator-v1/web/src/components/LevelEmblem.tsx`: explicit `artwork="card"` prop; original-mode behavior remains default for earned vault and other historical contexts. No 3D canvas on small cards and no fallback to angle-distorted model renders.
- `creator-v1/web/src/components/CompactMemberIdentity.tsx`: all universal player-card sizes request `artwork="card"`; avatars and their badges, ribbons, medals and identity state stay unchanged.
- `creator-v1/web/src/components/player-card-v065.css`: compact fixed framing, pixel-safe composition, reduced-motion and hover contrast.

## Protection and scope

The interactive `RewardInspector` pop-up and `RewardModelRenderer` remain the primary collectible inspection feature, including drag rotation, zoom, reset and pause/play. Original `scene`, `runtime`, `poster`, `preview` and `icon` routes remain unchanged and strictly earned. Unreached specimen identities and images remain inaccessible.

The V077 SVGs are deliberate frontal graphic illustrations, not new volumetric mesh assets or camera snapshots. Style variants can later be refined without changing progression, 3D geometry or collectible rights. Artwork should undergo visual sign-off at 30px, 38px, 44px, 60px and 128px; specifically review Level 4 with Brandi before live cutover.

## Verification and release

- `creator-v1/test/evolution-card-illustrations-v077.test.mjs`: one-to-one canonical art registry, unique illustrations, Level 4 frontal symmetry, no scripts, private client boundary, 3D viewer untouched.
- Extended `creator-v1/test/earned-reward-media-v075.test.mjs`: earned and opted-in card reads, 404 for future levels, response MIME, CSP and HEAD semantics.
- `.github/workflows/evolution-card-v077-qa.yml`: branch-local source, TS typecheck, Vite build, reward privacy and recognition tests. No deployment performed.
- Rollout should use existing guarded V076 workflow semantics: build frontend and Worker together, verify D1/ASSETS/Better Auth/Resend bindings independently, confirm XP/privacy policy, test real Level 4 public avatar and private collector, test desktop/mobile, retain prior Worker rollback. No direct `wrangler deploy --keep-vars` that might drop secrets.

Status: feature branch implementation and CI testing; **not promoted to anevum.com**.
