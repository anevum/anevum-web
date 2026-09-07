# ANEVUM Web

Official source repository for the ANEVUM public web experience and interactive universe platform.

## Current build

Build 0.1 establishes the public shell and homepage only:

- ANEVUM master public identity
- responsive navigation
- Stories / Explore / Archive / Transmissions / Store / LATTICE entry surfaces
- mobile-first responsive layout
- reduced-motion support
- release-gate language that keeps canon truth separate from public publication

No production canon records are hardcoded into this build. Public lore should be added only through the approved release workflow.

## Local development

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
```

## Cloudflare Pages

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

The repository is intended to deploy from GitHub to Cloudflare Pages.

## Core visual tokens

- Deep Black `#050505`
- Carbon `#07090A`
- Graphite `#15191A`
- Mineral White `#F2EFE8`
- Mineral Bone `#E4E0D7`
- LATTICE Link Blue `#4DA8FF` — contextual only
- Relational Gold `#D4AF37` — contextual and sparing

Continuance Copper is not an ANEVUM primary brand color and should only appear in appropriate fictional Continuance contexts.
