# ANEVUM / Evolution of Everything / V059

Session: `ANEVUM.WEB.BUILD.2026-10-17.008.EVOLUTION-HYPERRES-ARTWORK`

Thirty independently reconstructed animated 3D specimens, across the six existing chapters. This is an unreleased artwork review candidate. Public deployment is not authorized by this package.

Open `ANEVUM-V059-INTERACTIVE.html` in a modern browser. The full source distribution includes this standalone offline review, 2048px transparent PNG masters, WebP derivatives, separate 32/64/128/256px compact PNGs, editable glTF 2.0 scenes with binary meshes, custom scene JSON, source GLSL, editable SVG field layers, texture sources, actual motion previews and verification results.

## Rebuild

Requires Python 3.12+, NumPy, SciPy, Pillow, system EGL/OpenGL (Mesa works) and FFmpeg for motion previews. The web app itself has no external library, service or network dependency.

```sh
python src/textures.py
python src/export_native.py
python src/render.py
python src/build.py
python src/motion.py
python src/previews.py
python src/validate.py
```

The development branch retains the native procedural artwork, material shaders, source albedo, canonical registries, manifest and browser-acceptance harness. Generated geometry and render exports are reproducible, and the complete deliverable archive retains the full generated assets. The original image-generation PNG is preserved in the archive; the applied native albedo is the quality-95 JPEG committed with the source.

## Editing

`src/geometry.py` is the authoritative native source, with one explicit composition per level, named editable parts, material definitions and compact variants. Import `artwork/native/level-NN.gltf` into a glTF-capable 3D editor to edit individual meshes, UVs, materials and portable 24-second animation curves. Keep the adjacent `.bin` and `../textures` directory together.

`src/material.vert` and `src/material.frag` preserve the complete phenomenon-specific real-time behavior. The glTF node loops preserve a portable subset of motion; custom vertex deformation and traveling emission are shader-native. SVG field layers contain actual editable paths; no raster image is embedded in an SVG.

## Boundaries and limitations

30 permanent levels, six chapters, and `XP(L) = 75 × (L−1)²`; level 30 remains 63,075 XP. No account balance, achievement, XP grant, migration or website change occurs.

The renderer uses real 3D geometry, GGX direct lighting, procedural material variation and sampled textures. It is an authored real-time interpretation. It does not implement path-traced light transport, true volumetric gas simulation, fluid simulation or physical glass refraction. The 4096px procedural texture sources are native 4K maps; the generated obsidian source is 1254px, and is not represented as native 4K imagery.

The standalone file prioritizes offline review and embeds the entire collection. Production integration should request the selected scene and responsive poster individually. Only one WebGL specimen runs at a time; gallery and profile icons use static derivatives. Reduced motion freezes the timeline, and graphics failure selects the static fallback.

Artistic approval, native iPhone Safari, real device GPU performance and screen-reader acceptance remain distinct from automated checks. See the completed handoff and test reports for the actual results. Nothing in this branch is merged or deployed.
