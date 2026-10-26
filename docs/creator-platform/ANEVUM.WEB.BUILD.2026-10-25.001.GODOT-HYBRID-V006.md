# ANEVUM Godot / Hybrid Runtime V006
Session: ANEVUM.WEB.BUILD.2026-10-25.001.GODOT-RUNTIME-INTEGRATION
Status: development-only stacked on Creator V005 (PR #569) and V004 (PR #562). Not deployed or approved.

## Product decision
One ANEVUM project identity supports multiple independently tested platform editions:
- Browser (HTML5 / WASM / WebGL 2; Godot 4 Compatibility renderer; GDScript first)
- Native downloadable builds for Windows, Linux, macOS (later Android)
- Optional ANEVUM desktop library/launcher only when multiple native titles justify its maintenance.

A PWA is only packaging for the browser edition and does not solve browser hardware or runtime restrictions. Cloud gaming is not a default.

## What V006 implements now
A non-authoritative Godot web-export checker recognizing a root index.html, .pck, .wasm and .js loader, source-only projects, missing web-export components, and the V004 ZIP/expanded/per-file ceilings. Existing upload validation, quotas, authentication, private preview, cleanup, review and publication gates are NOT relaxed. Diagnostic results never certify malware safety, compatibility or right to publish.

## Next implementation gates
1. Design and implement an independently isolated large-asset upload flow (signed multipart / direct-to-R2, resumable transfers, bounded extraction in separate compute, quotas, SHA-256 per asset, immutable release, scanning and rollback). Do not decode large Godot exports inside the 128 MiB Worker pilot.
2. Preserve the existing sandboxed cross-origin iframe with no member cookies, data or ambient permissions. Test WebAssembly streaming MIME, WebGL 2, compressed assets and browser performance; evaluate any Godot threaded export separately because COOP/COEP and worker policies need explicit redesign.
3. Maintain one project and platform-edition catalog with versioned release IDs, signed artifact manifests, platform/architecture, checksums, provenance, download size, and revocation state. Native artifacts are downloaded and executed by the OS; arbitrary untrusted executables must not be launched automatically from a website.
4. Add gamepad-connected UI for focus, rebindable controls, fullscreen, pause, keyboard fallback and touchscreen disclosure. Browser Gamepad API mappings require real Xbox Edge QA.
5. Private test Absence Protocol (or a small approved Godot export) end-to-end on desktop Chromium/Firefox, iOS Safari and Xbox Edge before announcing support.
6. After safe distribution and real users, evaluate a signed, auto-updating ANEVUM Player. Launcher identity and save synchronization must be permissioned and scoped to authenticated projects.

## Proposed creator manifest (NOT accepted by current V004 uploader)
```json
{
  "schemaVersion": "anevum.editions.v1",
  "projectSlug": "absence-protocol",
  "editions": [
    {"platform": "web", "engine": "godot-4", "entrypoint": "index.html", "renderer": "compatibility", "threads": false},
    {"platform": "windows-x64", "engine": "godot-4", "artifact": "absence-protocol-win-x64.zip", "sha256": "<verified-on-release>"}
  ]
}
```

Release manifests belong to the trusted publishing backend, not editable embedded game metadata. All paths and hashes are server-validated. Do not claim that a JSON file alone authorizes any game to access accounts, saves, payments or member APIs.

## Dependencies / ownership
V004 provides private upload and isolated runtime; V005 adds advisory classification, private viewport tests and release-hash staff attestation. V006 extends those diagnostics without creating a competing platform. Reconcile these stacked branches with the canonical ANEVUM website overhaul before any merge. Studio publishing remains separate from Creator until authorized canonical integration.

## Ship criteria
- V004/V005/V006 tests pass against the exact branch SHA.
- No existing production routes, DB schema, storage or authentication regressions.
- No release until device and security QA complete; no production D1 migrations without backup and restore test.
- Native binaries signed where supported and checksums publicly verifiable before download.
