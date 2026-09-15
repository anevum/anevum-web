# ANEVUM Interface V2

Established 2026-09-15 after the public presentation reset.

## Authority

Implementation authority remains:

1. Devon Akins's newest explicit instruction.
2. Current actual `main` implementation.
3. Current live ANEVUM Canon Wiki for universe/canon and visual locks.
4. Current approved interface reference boards.
5. Older website plans and legacy styles only as historical reference.

The live Canon Wiki is the authority for fictional facts and canonical visual locks. A generated website mockup is never canon authority.

## Architecture

The permanent engineering foundation remains one React/Vite repository deployed through GitHub -> Cloudflare.

- `anevum.com` — public root, Stories, Store, Transmissions, Search, RHENLINK, and current stable LATTICE route.
- `wiki.anevum.com` — moderated public Wiki.
- `/command` — private operational surface until the command subdomain is deliberately restored.
- RHENLINK — persistent member identity layer.

The public experience and COMMAND are different layout systems sharing the same React runtime. They must not share viewport/chrome behavior.

## Public presentation rule

Public ANEVUM uses the V2 editorial system:

- `baseV2.css` — minimal reset only.
- `publicV2.css` — authoritative public design system.
- `brandArt.css` — neutral atmospheric brand-art placement.
- component-specific V2 CSS only when a surface requires it.
- `publicIsolation.css` — prevents COMMAND fixed-viewport globals from leaking into public pages.

Historical presentation styles remain in Git for reference/rollback but are not production imports. Do not re-add `frontdoor.css`, `production.css`, `experience.css`, `referenceConvergence.css`, `surfaceConvergence.css`, or the legacy global `styles.css` without an explicit architectural decision.

## Visual rule

Canonical visual binaries are used only when the current visual register identifies them as approved/locked and the actual binary is available.

If a locked binary is missing:

- do not regenerate a replacement and silently treat it as the same asset;
- do not invent geography, architecture, character appearance, Skygate geometry, institutional marks, or other canon facts to fill space;
- use `BrandArt` neutral atmospheric visuals or an intentional missing-visual state;
- replace the neutral treatment with the recovered locked master when the binary becomes available.

`BrandArt` is deliberately non-canonical. It may use planetary limbs, atmosphere, abstract terrain silhouettes, signal fields, relation maps, and identity motifs. It must not be labeled as a named canonical location or structure.

## Surface contracts

### ANEVUM / Stories

Editorial and cinematic. Story-first. REPLY is the primary current story doorway. Avoid dashboard/terminal language on public story surfaces.

### WIKI

A moderated public encyclopedia. It starts from the actual public database state. Contributor proposals never directly overwrite live pages. Private Notion canon is not mirrored automatically.

### LATTICE

A relational view of *published public material only*. LATTICE must consume administrator-approved public Wiki pages, never the old hard-coded `publicObjects` dataset. If the public Wiki is empty or not initialized, LATTICE shows an honest empty relational state.

### RHENLINK

Persistent member identity. Auth/session logic is separate from canon/publication authority. Member progress never grants publication or admin rights.

### COMMAND

Private operational application. COMMAND may use the fixed terminal/application viewport. Its CSS and behavior must not leak into public surfaces. Authorization relies on protected claims, not user-editable metadata.

## Responsive rule

Mobile is a first-class composition, not desktop compressed into a narrow viewport.

- public masthead target: ~50 px;
- surface bar target: ~36 px;
- no fixed terminal console on public mobile;
- compact type hierarchy and padding;
- collapse multi-column content intentionally;
- avoid forced 650–800 px mobile sections unless content genuinely requires them.

## Change discipline

Before any future visual change:

1. inspect current `main`;
2. determine which surface owns the change;
3. check the live Canon Wiki if fictional content or imagery is involved;
4. edit the owning V2 component/design file instead of adding a broad override stylesheet;
5. verify the exact final commit through the Cloudflare build check;
6. preserve a recovery branch before destructive presentation-layer resets.

The goal is not screenshot mimicry. The goal is a coherent ANEVUM product that inherits the visual language of the approved references while remaining truthful to current data, publication state, and canon.
