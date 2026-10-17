# ANEVUM Native Pack V001 — portable creative files and local players

Session: ANEVUM.WEB.BUILD.2026-10-17.001.NATIVE-CREATION-FORMATS

Status: SOURCE ONLY / REVIEW / NOT MERGED OR DEPLOYED. Based on canvas-first Creator Studio V054.2 draft, preserving canonical private-draft and staff-review boundaries. Tracked under #329, #325, and functional gates #480. Does not change locked product doctrine #344.

## Intent

Creators compose in ANEVUM, download a portable native project file, reopen it locally, and experience it in ANEVUM's purpose-built browser player. The files are inspectable in regular ZIP tools. This format is a versioned creative container, not a new audio/video codec, executable runtime, copyright claim, or upload authorization.

## V001 file family

| Extension | Kind | Payload entry | Local experience |
|---|---|---|---|
| .anvg | game | content/game.json | Declarative scene decisions and optional still-image backgrounds |
| .anva | album | content/album.json | Audio track list (MP3/WAV/OGG) and optional cover |
| .anvs | series | content/series.json | Ordered video episodes (MP4/WebM) and optional poster |
| .anvw | visual | content/visual.json | Ordered image galleries with captions |
| .anvp | project | content/project.json | Strict ANEVUM_BLOCKS_V1 private Workbench document |

All extensions share the anevum.pack.v1 archive contract.

## Archive contract

The file is a ZIP archive with store-only entries (method 0). No ZIP64, compression, encryption, symlinks, data descriptors, extras, multipart volumes, archive comments or directory records are accepted. Contains exactly one root anevum.json, one appropriate content/*.json entry, and optional media assets beneath assets/. No HTML, executable JS, CSS, SVG or arbitrary code.

Example layout:

    the-first-signal.anvg
      anevum.json
      content/game.json

Manifest example (size and hash shown as placeholders, not valid metadata):

    {
      "schema": "anevum.pack.v1",
      "kind": "game",
      "title": "The First Signal",
      "creator": "ANEVUM",
      "version": "0.1.0",
      "entry": "content/game.json",
      "files": [{
        "path": "content/game.json",
        "mime": "application/json",
        "size": 290,
        "sha256": "(must contain 64 lowercase hex SHA-256 characters)"
      }]
    }

Every file is checked for byte length, CRC-32 and SHA-256 before preview. Unknown schema, invalid extension, duplicate or unsafe paths, unexpected files, unsupported documents or dangling scene choices fail closed.

Local prototype bounds: 20 MiB archive, up to 32 content/asset entries, 128 KiB content document, 64 KiB manifest; 64 game scenes and 8 choices per scene. Albums/series/galleries allow up to 32 items, subject to the same archive-entry budget. These are not public storage quotas.

## Creator Studio experience

The private Studio Workbench receives an optional collapsed NATIVE PACK LAB:

- Game: compose scene titles, prose and branching choices; playtest and export .anvg.
- Album, series and gallery: choose original local media, assemble a portable file, preview in browser-native audio, video, and image renderers.
- Project: export current Workbench blocks as .anvp.
- Open recognized ANEVUM files locally in their appropriate data-only players.
- Importing .anvp into the current unsaved Workbench requires a deliberate confirmation. Saving the real project revision remains a separate user action.

Local game and media build state is not persisted in D1; exporting the file is how a creator retains a copy. This preview never executes creator HTML, JavaScript, SVG, iframes, WASM or arbitrary executables. No external resource is fetched.

## Non-goals and release gates

This branch does not add any public upload endpoint, R2 binding, D1 migration, new member permission, automatic approval, signed release, billing, XP award, executable HTML5 game hosting, or production deployment.

Before public storage or publication:
1. Verify real ownership, license/rights, third-party credits, age policy, moderation, reports, takedowns, appeals and release revocation.
2. Require owner-bound upload authorization, real file signature and malware/media scanning, isolated R2 and quota/cost controls. Current browser-side extension and checksum checks are NOT a security scan.
3. Introduce reviewed immutable release manifests with independent publisher/reviewer authorization, revocation and safe CDN media access. Hashes provide byte integrity, not publisher trust.
4. Run any future executable HTML5 games and apps on a separately registrable sandboxed origin, with restrictive CSP, scoped messaging, no main-site session access and no direct XP minting.
5. Validate two real members, guest, separately authenticated staff, iPhone Safari, accessibility/reduced motion, rollback and costs.
6. Retain honest external-demo project pages while native publication is gated.

## Paths and verification

Source:
- creator-v1/web/src/lib/anevum-native-pack.ts
- creator-v1/web/src/pages/NativePackLab.tsx
- creator-v1/web/src/pages/native-pack-lab.css
- creator-v1/web/src/pages/StudioWorkbench.tsx
- creator-v1/test/native-pack-v001.test.mjs

Run npm --prefix creator-v1 run test:native-packs for format regression, npm --prefix creator-v1 run test:studio for Studio regression, and Creator V1 typechecks/Vite builds before any staged release. Real mobile/cross-account testing remains mandatory.

This V001 review branch does NOT imply that creator uploads, hosted native games, public albums or public series are live.
