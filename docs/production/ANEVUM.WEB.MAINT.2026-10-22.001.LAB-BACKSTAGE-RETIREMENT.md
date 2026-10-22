# ANEVUM Lab — Backstage retirement and canonical IREN handoff

Session: `ANEVUM.WEB.MAINT.2026-10-22.001.LAB-BACKSTAGE-RETIREMENT`  
Date: October 22, 2026  
Scope: **source-only protected Lab maintenance**, not a production deployment.

## Purpose

The Lab is an owner-only project sandbox. The deployed Backstage case desk is a browser-local planning tool; its counts are not canonical moderation or member records. Live staff operations are through the independently authenticated `https://anevum.com/staff` IREN staff boundary.

## Current verified runtime baseline

- Cloudflare `anevum-private-lab` version `3e3b94de-3b7f-473b-9f59-18a27b3eff61` at 100% (October 16 deployment), owner-only `lab.anevum.com`.
- Separate `anevum-lab-previews-v001` version `3df5d0aa-ba92-45e7-8ed4-68372fc4dc1a` at 100% for `/previews*`, synthetic fixtures only.
- Lab runtime includes Fold, read-only RHEN, Transcosmic local writing, Continuance Cadets and browser-local Backstage. A local moderation demo also exists. These are independent of the public ANEVUM release.
- Deployed V7 Worker source is **newer** than the older `build/lab-project-workspaces-20261013-001` branch. Do not upload that old Worker source to Cloudflare; it would drop Cadets and the moderator archive.

## Implemented source work

`lab/operations/v002-archive-backstage.mjs` is a deterministic fail-closed transform for the exact-current Worker and terminal source pair. It:

1. Removes **Backstage only from the primary project directory**; preserves Fold, RHEN, Transcosmic and Cadets if present.
2. Adds clear links to **real IREN Staff**, the existing **Backstage local case export archive**, the synthetic Lab previews, and the local moderator archive if that route exists.
3. Leaves the existing `/projects/backstage/`, `/projects/backstage/workspace.js`, CSS and localStorage schema untouched. The archive remains usable to export and restore `backstage-local-v1` case JSON.
4. Labels archived cases as **not live moderation** and exposes the real staff route without sharing permissions or login state.
5. Updates the visible directory count, console help, responsive list rows and Worker `/health` project count.
6. Fails closed on missing route/host invariants, ambiguous anchors and repeated application. No database writes, staff mutations, policy changes or public release are included.

## Required next verification and promotion gates

- Verify transform output on the **exact current deployed Worker module pair**, not only an older Git branch.
- Run Node route tests and browser testing at 320/390/768/1440 width on the complete transformed bundle.
- Preserve all current Worker modules, origin restrictions, security headers, secrets/bindings (if any), owner-only Access policy, disabled direct previews and rollback ID.
- For actual browser-local cases, exporting from the original device and browser profile is the only reliable way to preserve those records. Browser-local data is not accessible through the Cloudflare API.
- Keep the owner-only Lab version at 100% until reviewed acceptance authorizes its replacement. Stage inactive if feasible.
- Never substitute the synthetic `/previews/` console for actual member staging or real creator lifecycle acceptance. Any next production-accurate preview must be read-only, pinned by immutable commit/version, clearly labeled and isolated from personal data.

## Other work in progress

- Public ANEVUM V104 / integrated platform candidate remains a **separate held release**.
- RHEN investment research, Fold content work, Transcosmic authoring and ANEVUM Sites remain separate workstreams; no runtime changes are implied.
