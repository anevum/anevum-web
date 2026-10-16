# ANEVUM Series One V034 - Opt-in HD asset delivery

**Status: REVIEW CANDIDATE. No deployment or visual approval.** This PR is stacked on [V033 art bible #436](https://github.com/anevum/anevum-web/pull/436), which is stacked on [V031 progression #432](https://github.com/anevum/anevum-web/pull/432).

## Behavior

- The 60 canonical level names, unlimited level design, server-earned XP/award state and image accessibility remain unchanged.
- The React `LevelEmblem` can load an illustration using 128, 512 or 1254px transparent responsive WebP sources, selected by browser device pixel density.
- This is **disabled by default**. Setting `VITE_ANEVUM_ILLUSTRATED_LEVELS=true` is an intentional build-time review choice only, and requires approved, installed image assets; if an image fails to load, the existing canonical SVG fallback is displayed. The default website is unchanged.
- Award notification icons and member current-level panel load eagerly. The 60-card collection stays lazy. Existing beyond-Level-60 generic emblem is preserved.
- No binaries are committed to the public repository. Private recovered originals remain in the owner's Library and have **unverified rights/approval state**.

## Verified private archive (not checked into GitHub)

`/mnt/data/ANEVUM-Series-One-HD-Illustrated-Artwork.zip` in the owner's temporary review workspace: 60 recovered 1254-square RGBA originals and 180 128/512/1254px WebP derivatives. A local isolated-checkout test validated all 180 WebP files against the archive manifest SHA-256, decoded them at exact dimensions and confirmed RGBA transparency. This is not owner approval.

After documented art review and rights clearance, validate in a local checkout without writing:

```sh
python3 creator-v1/ops/install-series-one-illustrations-v034.py /path/to/ANEVUM-Series-One-HD-Illustrated-Artwork.zip
```

Install only after explicit visual and usage clearance:

```sh
python3 creator-v1/ops/install-series-one-illustrations-v034.py /path/to/ANEVUM-Series-One-HD-Illustrated-Artwork.zip --install-approved-art
```

This writes only the 180 local files into `creator-v1/web/public/assets/levels/illustrated/{128,512,1254}/level-NN.webp`. The build flag still remains **OFF**. An explicit separate review is required before turning the flag on in any deployable build.

## QA and approval gates

1. Source tests, CLI installer corruption checks, TypeScript and default Vite browser build pass on this draft.
2. With the flag unset, /levels, public profile, notifications and member dashboards retain SVG renderings and authoritative lock/unlock states.
3. If the flag is set without assets, responsive image failure switches to original SVG without introducing a broken UI surface.
4. After rights approval only: compare approved art on actual iPhone Safari at 16/24/32/48/96/128/256/512px across /levels, member dashboards, and achievement notifications; check transparent edges, loading, reduced motion and no horizontal overflow.
5. Production and staging stay unchanged until owner reviews the art, authorizes asset inclusion, and separately approves deployment.

**No migrations, no public signup flag changes, no XP or award changes, no custom domain changes.**