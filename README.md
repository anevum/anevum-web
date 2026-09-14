# ANEVUM Web

Permanent public web application for ANEVUM.

## Production authority

This repository is the company-owned source of truth for the ANEVUM public web application.

- Production branch: `main`
- Active development branch at cutover: `nextgen`
- Preserved pre-cutover rollback branch: `legacy-main-2026-09-14`
- Hosting/deployment: Cloudflare Workers + static assets from `dist`
- Public production domain: `https://anevum.com`
- Build command: `npm run build`
- Production deployment command used by Cloudflare Builds: `npx wrangler deploy`
- Non-production branch upload: `npx wrangler versions upload`

Do not create a replacement repository or a second ANEVUM frontend without an explicit architectural decision.

## Canon and publication authority

The live ANEVUM Canon Wiki remains the authority for fictional truth:

https://app.notion.com/p/3ae88cc2ef14818e8f0dd5b8399fb017?v=3b788cc2ef1480c2b0c3000c26172161&source=copy_link

The public website is not a direct mirror of private Notion. Only publication-cleared records may be projected into the client. Unreleased material must not leak through routes, search, metadata, graph nodes, payloads, labels, errors, analytics, or imagery.

## Product architecture

- `anevum.com` — public story/company front door
- WIKI — released canonical record
- LATTICE — relational discovery/member application layer
- RHENLINK — persistent member identity beneath LATTICE
- Supabase project `mfntzxheldzdvlokyntk` — existing member/auth persistence target; do not replace without an explicit architectural reason
- ANEVUM Command remains private and is not a public route in this application

## Visual system

Current production direction uses the locked ANEVUM editorial/cinematic system:

- Deep Black `#050505`
- Carbon `#07090A`
- Graphite `#15191A`
- Mineral White `#F2EFE8`
- Mineral Bone `#E4E0D7`
- LATTICE Link Blue `#4DA8FF` — contextual only
- relational gold/copper — sparse contextual use

Avoid neon cyberpunk, fake terminals, generic HUDs, generic SaaS dashboard styling, and fabricated canon imagery.

## Development

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
```

Changes should normally be made in bounded components/content sources, verified in preview, then promoted to `main`. Git history is the rollback record; do not overwrite production without preserving a recoverable commit.

## Public content sync

`src/publicObjects.ts` currently contains the publication-safe projection reconciled against the live Website Publishing Queue. The next infrastructure step is to replace manual snapshot maintenance with a server/build-side Notion publication sync that still enforces the public gates and never exposes private workspace access to the browser.

## RHENLINK

The React signup/sign-in surface is wired to the existing member Supabase project through public client credentials only. Production must provide `VITE_SUPABASE_PUBLISHABLE_KEY` (or legacy `VITE_SUPABASE_ANON_KEY`) in the build environment before member registration is considered operational. Never place a service-role key in the frontend.
