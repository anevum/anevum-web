# ANEVUM Runtime Architecture

This document defines the current production architecture for the ANEVUM web runtime.

## Authority model

ANEVUM has one universe-record authority: the live ANEVUM Wiki in Notion.

- **Wiki = truth.** Universe records, lifecycle state, relationships, provenance and revision lineage originate in the live Transcosmic Canon Wiki.
- **Publishing Queue = release gate.** The Website Publishing Queue decides which Wiki material may be projected into the public product, when it may appear, its spoiler level and its render mode.
- **Public presentation gate = browser-safe prose.** A queued Wiki record is not serialized merely because it is releasable. `config/canon-projection-overrides.json` contains the explicitly approved public synopsis, publication-boundary copy, stable public ID, slug, visual key and released fact fields. This prevents private Wiki summaries or spoiler-bearing publication notes from leaking into the browser automatically.
- **Command = control.** `command.anevum.com` inspects and operates the runtime. It does not maintain a parallel lore database.
- **Lattice = spatial interpretation.** `lattice.anevum.com` renders a publication-safe relational view of Wiki-cleared records. It does not create or upgrade canon.
- **RHENLINK = identity.** RHENLINK provides persistent member identity, authentication, progression, saves and permissions.
- **Terminal = access layer.** The shared terminal/SystemShell routes among the current surfaces without creating another content model.
- **ANEVUM.com = public experience.** The root host remains the reader-facing story and launch experience.

## Canon lifecycle

The product contract can represent the complete lifecycle vocabulary used by the live Wiki:

1. `Source-Locked`
2. `Locked`
3. `Canonical`
4. `Working`
5. `Unresolved`
6. `Exploratory`
7. `Superseded`
8. `Archived`

The active Canon Encyclopedia currently uses the equivalent working set `Source-locked`, `Canonical`, `Working canon`, `Unresolved` and `Superseded`. The product normalizes those labels without changing their meaning.

Canon lifecycle and website release state are independent. A record does not become public merely because it is Canonical or Source-Locked. It must also pass the Website Publishing Queue and the browser-safe presentation gate. Current product truth excludes Working, Unresolved, Exploratory, Superseded and Archived material unless a future release policy explicitly defines a safe historical/control-plane representation.

## Public projection

Browser clients must not receive unrestricted Notion credentials or private Wiki rows. The public application therefore consumes a publication-safe serialized projection of the live Wiki.

`src/publicObjects.ts` is the generated public record set. `src/canonProjection.ts` is the generated lifecycle/relation projection consumed by Wiki, Lattice and Command. These are deployable products of the canonical system, not independent lore sources.

`scripts/sync-canon-projection.mjs` performs the synchronization. It uses Notion API version `2025-09-03` and reads two data sources:

- Canon Encyclopedia: `8486408d-b9d6-436f-9669-bb92a5a51e9b`
- Website Publishing Queue: `11bead82-0bfa-45cd-bccb-53b35dacdfdf`

A Wiki record is serialized only when all of the following are true:

- Publishing Queue `Public = true`
- Publishing Queue `Public Window = Now`
- Queue section is `Universe`, `Atlas` or `Archive`
- `Render Mode = Full | Curated | Teaser`
- `Spoiler Level = Safe | Light`
- the queue source URL resolves to a page inside the live Canon Encyclopedia
- source `Website Ready = true`
- source `Public Window = Now`
- source canon state normalizes to `Source-Locked`, `Locked` or `Canonical`
- an approved browser-safe presentation entry exists for the queue `Site Route`

If any otherwise releasable Wiki record fails one of those gates, the sync exits without replacing production. It never falls back to a private Wiki summary, old ZIP, Sites/V5 data or the moderated Supabase experiment.

## Automated synchronization

`.github/workflows/canon-projection-sync.yml` runs the projection sync hourly and can also be started manually. The workflow:

1. resolves the live Notion Queue and Canon Encyclopedia;
2. refuses to publish blocked or unapproved records;
3. regenerates `src/publicObjects.ts` and `src/canonProjection.ts` only after the complete projection validates;
4. runs the normal production build;
5. commits the generated files to `main` only when the projection changed.

The workflow requires one repository secret named `NOTION_API_TOKEN`. The token belongs to a Notion integration that must have read access to the original Canon Encyclopedia and Website Publishing Queue data sources. The token must never be exposed through Vite variables, browser code, generated files or logs.

Normal application builds run `npm run canon:validate`, which validates the presentation gate and approved relation map without contacting Notion. `npm run canon:check` compares the checked-in projection with live Notion without writing; `npm run canon:sync` performs the guarded live update.

At the 2026-09-16 synchronization point, the Website Publishing Queue exposed 22 Wiki records under the active public gate.

## Hosts

| Surface | Canonical host | Purpose |
| --- | --- | --- |
| Public ANEVUM / REPLY | `https://anevum.com/` | Public story and launch experience |
| RHENLINK | `https://anevum.com/rhenlink` | Persistent identity and progression |
| Wiki | `https://wiki.anevum.com/` | Public release projection of canonical Wiki records |
| Lattice | `https://lattice.anevum.com/` | Wiki-backed relation navigation |
| Command | `https://command.anevum.com/` | Private operations/control surface |

Runtime normalization redirects legacy root aliases to their canonical surfaces. `/stories` resolves to the current REPLY book surface; `/wiki`, `/lattice` and `/command` resolve to their dedicated hosts.

## Authentication

RHENLINK sessions originate on `anevum.com`. `AuthBridge.tsx` provides the cross-subdomain session bridge for Wiki, Lattice and Command. Authorization decisions use protected Supabase `app_metadata`; user-editable profile metadata must not be used for administrative authorization.

Supabase remains appropriate for RHENLINK/session behavior and for an optional future moderated community-proposal layer. Supabase is not the ANEVUM canon database.

## Data-flow rules

1. A universe object is never promoted into Command, Lattice or another product surface as independent truth.
2. Public Wiki records come only from the Publishing Queue-cleared projection of the live Canon Wiki plus approved public presentation data.
3. Public Lattice nodes come only from those released Wiki records.
4. Public Lattice edges must be publication-safe relationships supported by released Wiki material; classified/spoiler relationships are not inferred from private canon.
5. Command distinguishes master canon lifecycle from website release state and from optional community moderation state.
6. Working, Unresolved, Exploratory, Superseded and Archived material is not silently promoted into current public truth.
7. If the canonical release projection cannot be resolved, the sync preserves the last validated production projection rather than replacing it with partial or inferred data.
8. `publicObjects` and `canonProjection` are generated product projections. They remain subordinate to the live Wiki, Publishing Queue and approved presentation gate.
9. Community proposals, when enabled, may request changes but cannot canonize or publish records directly.

## Lattice policy

Lattice is intentionally a spatial interpretation, not a second encyclopedia. The current core map selects nine released records that form a coherent public-safe constellation while WIKI.ANEVUM exposes the full released set. Relation edges are separately publication-approved and are filtered automatically against the current released record set.

## Command policy

Command keeps three different kinds of state distinct:

- **Canon lifecycle:** status in the master Wiki.
- **Product release:** whether a record passed the Website Publishing Queue and presentation gates.
- **Community moderation:** optional proposal/review workflow, separate from both canon and release authority.

Failure of the community moderation backend must not make the canonical Wiki appear unavailable.

## Legacy boundary

Do not return production development to obsolete Sites/V5/old ZIP workflows. Those artifacts may be retained only as historical reference where needed; they are not active architecture or content authority.

The checked-in `supabase/migrations/20260915_public_moderated_wiki_v1.sql` belongs to the optional moderated community experiment. Do not apply it as a replacement canon database merely to satisfy Command, Wiki or Lattice.
