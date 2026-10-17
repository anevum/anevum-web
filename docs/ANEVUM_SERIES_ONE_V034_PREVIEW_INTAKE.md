# V034 — Series One approved concept artwork intake

Owner approved the 60 **128×128 WebP concept crops** made from the V033 atlas. They are not 60 individually illustrated high-definition canonical objects. The crop imagery may not match each canonical name. This is explicitly a provisional visual pass.

Archive: `ANEVUM-Series-One-V033-60-Concept-Crops.zip` (delivered in the ChatGPT conversation). To install from a checkout with Python and Pillow:

```bash
python creator-v1/tools/install-series-one-v033-crops.py /path/to/ANEVUM-Series-One-V033-60-Concept-Crops.zip --repository .
```

The installer verifies source atlas SHA-256, all sixty IDs, every file checksum and WebP dimensions. **Commit the resulting 61 files** in `creator-v1/web/public/assets/levels/series-one-v033/`. Do not commit the older V032 archive.

Once assets are committed and CI verifies the full set, set `VITE_SERIES_ONE_V033_PREVIEW=true` for the staging web build. Without the flag the current vector emblems remain. Individual image load failures fall back to SVG. Do not enable the flag before asset parity is proven.

The V034 cabinet is independently safe to merge with the flag off. Deployment is **a.anevum.com only** after the guarded Worker release checks; leave apex `anevum.com`, D1, signup restrictions and XP unchanged.
