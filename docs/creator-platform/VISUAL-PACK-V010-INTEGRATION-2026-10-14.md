# ANEVUM V010 — verified visual-kit adaptation (draft)

Session: `ANEVUM.WEB.BUILD.2026-10-14.002.VISUAL-PACK-INTEGRATION`
Parent: V009 source review PR #404 (`18eb1752d80aa53a41f8ba3d9f579a8722487056`).
Visual source: owner Library `ANEVUM-Dashboard-V004-Verified-Individual-Files.zip` (12,371,143 bytes).
SHA-256: `8d49b528c9b69242ea38aed759bcd15c6a15c7a1ddb6a731042715dff014103b`
Source V003/V004 pull requests: #385 and #387. Visual-dossier branch #397 remains separate.
Status: **owner review required**. No merge, staging change, member signup, D1 migration, or production launch.

## What the source actually is

The V004 handoff contains 204 files: 10 independent sitewide source/test files,
173 optional individual artwork/component files, and review evidence. Its 173-file
library includes 6 procedural atmospheric backgrounds, 8 optional category covers,
textures, ornaments, SVG/action icons, raster icon fallbacks, effects and editable
UI studies. All are separated from approved final imagery.

The V004 package README explicitly says **do not replace** the 10 integrated
cinematic WebPs or existing orbital mark by default. Its procedural art is useful
as background decoration but is not the high-fidelity matte painting,
2.5D foreground, or finished Series One badge artwork demanded by the locked
cosmic/fantasy concept references. The package does not itself complete AAA
design-fidelity acceptance. Original references contain fictional social counts
and project cards; none may become public records.

## V010 integration

- Preserve the V009 navigation, React routes, guards, real API, and existing
  `CosmicArtwork` imagery.
- Add one optional, typed `VisualKitAtmosphere` component in the existing
  homepage and public route shell, never private/broker/Atlas routes.
- Mount a **curated 28-file selection** of backgrounds, textures, ornaments,
  effects and secondary category covers only after SHA verification with the
  provided Python installer. Extra images and duplicated 96px PNG icons stay
  unmounted to protect bundle budgets and preserve existing source priority.
- The installer generates a `manifest.json` only after the source ZIP and each
  selected file pass SHA-256 checks. Browser loads the original 2560×1440
  backdrop before opt-in layers appear. Without a mounted pack, the exact V009
  experience remains functional—no broken images, no invented assets.
- Apply institutional Roman/technical-register typography based on the
  `ANEVUM.WEB.DESIGN.2026-10-14.002.INSTITUTIONAL-TYPOGRAPHY` handoff,
  scoped to the V009 shell with system fallbacks. No new private fonts or
  third-party font requests are required.
- Introduce restrained secondary haze, star texture and orbital engravings;
  accessibility honors reduced motion and forced colors.

## Installer / source of truth

```
python creator-v1/tools/import_visual_kit_v010.py /path/to/ANEVUM-Dashboard-V004-Verified-Individual-Files.zip
npm run check:creator-v1-web
npm run build:creator-v1-web
npm run build:creator-v1-web:staging
node --test creator-v1/test/visual-kit-v010.test.mjs
```

The source-only PR does **not** contain or silently publish the Library ZIP's
binary media. For an asset-complete review, use the locally assembled
candidate with the installer; it must be delivered and tested independently
before any hosted preview claims the optional media is mounted. The isolated
V009 preview continues to show V009 media until this gate is satisfied.

## Not yet delivered by V010

- High-detail, clean 3840×1600/1440×2560 environment matte masters and
  separate near/mid/far/foreground, emissive and depth-mask production passes.
- Approved, consistent raster designs for the first 60 level artifacts
  (four concept emblems and a 60-item source manifest are not 60 final art files).
- Real member-driven creator covers, verified profile badges, working game
  media/player experiences, editable upload artwork, or published activity.
- Final webfont self-hosting, no-FOUT/LCP/CLS validation and owner signoff.

## Guardrails / order

1. Review layered V010 candidate at 1440, 1024, 390 and 320 pixels, under
   genuine empty/loading/error public catalogue states.
2. Confirm images are decorative, do not displace labels/buttons, no horizontal
   overflow, readable type, 44px touch targets, keyboard focus and reduced motion.
3. Produce/approve missing high-resolution scene masters separately;
   avoid upscaling composites or converting whole screenshots into UI.
4. Reconcile existing unmerged profile and identity proposals deliberately.
5. Only after owner visual acceptance and required QA, authorize an isolated
   binary-backed hosted preview. Staging and production are separate decisions.

`anevum.com` remains the January 1, 2027 public launch terminal.
`a.anevum.com` remains canonical design staging and is unchanged by this branch.
