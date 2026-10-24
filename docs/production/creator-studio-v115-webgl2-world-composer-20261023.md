# ANEVUM Creator Studio P1 — actual local WebGL2 World Composer

Session: `ANEVUM.WEB.BUILD.2026-10-23.001.WEBGL2-WORLD-COMPOSER`
Review lane: draft PR #692 stacked only on Studio visual P0 draft PR #687, itself stacked on Creator Studio #658. This is not a production change.

## Exact source components
- `creator-v1/world-composer/document.mjs` and `.d.mts`: versioned `ANEVUM_WORLD_V1` model, bounded 32,768-byte text serialization, max 64 nodes, source validation and typed deterministic commands. No code execution.
- `creator-v1/web/src/pages/world-webgl2-v115.ts`: actual browser-provided WebGL2 drawing of procedural meshes, depth test, lighting shader, environment grid, selection outline, and color-buffer GPU object picking. The renderer has no remote network, imported runtime shader, cloud GPU or new npm dependency.
- `creator-v1/web/src/pages/WorldCanvasV115.tsx`: lifecycle-aware GPU canvas, pointer drag orbit, wheel zoom, keyboard camera control, viewport-based pixel budget, redraw on invalidation, context-loss/restore and explicit 2D inspector/tree fallback.
- `creator-v1/web/src/pages/WorldComposerReviewV115.tsx`: real React editor with selected object hierarchy, typed position/rotation/scale/material commands, undo/redo, add primitives, environment lighting and read-only source export.
- `creator-v1/web/src/pages/world-composer-v115.css`: compact Instrument Glass integration, responsive app-like 1440/390/320 layout and accessible controls.
- `creator-v1/web/src/App.tsx`: independently lazy/default-OFF `VITE_CREATOR_WORLD_WEBGL2_V115` route at `/studio/world-review`. It does not activate V109, P0 V115, V111 or any publishing feature.

## Why direct WebGL2 in P1?
The browser-based GPU path was chosen as a dependency-free, source-reviewed demonstration of actual interactive 3D authoring and a testable fallback. It consumes the creator's existing graphics device, including integrated GPUs; no cloud GPU account, purchased hardware or inference endpoint. Shader and geometry implementation here are **deliberately bounded**. This is a working architecture/interaction spike, not a replacement for a modern maintained Three.js/React Three Fiber rendering and asset pipeline. A later independent engineering review may swap its renderer behind `WorldDocument` without changing persisted scene semantics.

### Explicit quality boundary
The original October 23 cosmic floating-city reference is a **high-fidelity art direction**. P0 is original 2D illustration for layout and screenshot quality. P1 is actual WebGL2 with procedural low-poly objects, physically interactive camera and scene edits, not the final production photorealistic city/waterfall renderer. Advanced terrain materials, physically based rendering, asset compression/LOD, large content streaming, animation, real multiplayer, AI scene generation, optimized texture atlases and postprocessing are future slices.

## Interaction contract
- **Drag**: orbit the active camera. **Wheel / plus-minus**: zoom with bounds. **Arrow keys**: rotate. **0**: reset camera. **Click a mesh**: GPU ID-buffer selects object; the object also remains selectable in the tree for keyboard/screen-reader users.
- **Explorer**: select, filter and add a sample primitive. **Inspector**: move/rotate/scale nodes, update a material and change sun intensity or sky preset. **Undo/redo**: restore prior canonical `ANEVUM_WORLD_V1` documents (bounded to 48 local snapshots).
- **Document**: code is not accepted or run; current scene can be inspected as read-only text. A displayed "Save revision" is disabled until actual V111 owner-authorized persistence is separately adopted.
- **Hardware failure**: WebGL2 denied/lost/unsupported disables the canvas, not the document or accessible tree/inspector. Release requires physical-device review; simulated Chromium GPU support alone is insufficient.
- **Performance**: local GPU; DPR <=2 desktop and <=1.5 mobile; resize redraw on demand, not an idle infinite animation loop. Clean up WebGL buffers/programs on unmount. No FPS or graphics capability is fabricated.

## Safety/release boundaries
1. Source-only draft #692. No authenticated user or project inventory is loaded. No database, R2, Worker, route on Cloudflare, payment, AI provider, XP or publish action.
2. #658 V111 migration 0014 and #682 migration 0015 remain unapplied. Source storage is not silently rewritten; only read-only scene text inside the review UI.
3. Inherited P0 #687 visual design remains review-only; accepted production V131 #655, NEXT Commons #679 and creator achievements #682 are untouched.
4. A future authorized persistence phase must use server-confirmed V111 project owner/revision gates and independent live-bound MEMBER_DB backup and isolated restore before schema activation.
5. No public 3D import from arbitrary GLB/URL until strict MIME/content/size, texture/triangle/VRAM, rights and cross-owner access controls exist.

## Acceptance criteria and measurements
- `node --test creator-v1/test/world-composer-v115.test.mjs`: codec roundtrip, security bounds/cycles, command immutability and route/source assertions.
- Real repository strict TypeScript build (React 19), default-OFF V115 GPU bundle exclusion and feature-ON build with no backend flags.
- Compiled local Chromium software WebGL2: canvas shader init, nonzero drawing buffer, geometry editing via hierarchy, camera via keyboard, proper typed source output, undo/redo, lighting, 1440/390/320 no horizontal overflow, mobile inspector/explorer and simulated/real context loss.
- CI source-head browser screenshot artifacts must be retained and inspected. Test fixture must not generate or grant a real account, XP, active project or published release.
- Physical Safari (real 390/320 device), accessibility/tree controls, long-running GPU context loss, high DPI/power consumption and owner visual review remain hard release gates.

**Completion must be tied to actual exact-head test evidence.** Do not mark as merged, deployed, or final-visual-quality merely because code exists.
