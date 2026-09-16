# ANEVUM Runtime Architecture

This document defines the current production architecture for the ANEVUM web runtime.

## Authority model

ANEVUM has one universe-record authority: the live ANEVUM Wiki in Notion.

- **Wiki = truth.** Universe records, lifecycle state, relationships, provenance and revision lineage originate in the live Transcosmic Canon Wiki.
- **Publishing Queue = release gate.** The Website Publishing Queue decides which Wiki material may be projected into the public product, when it may appear, its spoiler level and its render mode.
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

Canon lifecycle and website release state are independent. A record does not become public merely because it is Canonical or Source-Locked. It must also pass the Website Publishing Queue. Current product truth excludes Working, Unresolved, Exploratory, Superseded and Archived material unless a future release policy explicitly defines a safe historical/control-plane representation.

## Public projection

Browser clients must not receive unrestricted Notion credentials or private Wiki rows. The public application therefore consumes a publication-safe serialized projection of the live Wiki.

`src/canonProjection.ts` records the current release projection metadata, lifecycle state and safe relation map. `src/publicObjects.ts` contains the released summaries, public notes and facts that were synchronized from the live Wiki and Website Publishing Queue. These files are a deployable projection of the canonical system, not an independent lore source.

At the 2026-09-16 synchronization point, the Website Publishing Queue exposed 22 records under the active public gate:

- `Public = true`
- `Public Window = Now`
- `Render Mode = Full | Curated | Teaser`
- `Spoiler Level = Safe | Light`

The projection must be refreshed from the live Wiki whenever the release gate changes. It must never be expanded by inference from private canon material.

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
2. Public Wiki records come only from the Website Publishing Queue-cleared projection of the live Canon Wiki.
3. Public Lattice nodes come only from those released Wiki records.
4. Public Lattice edges must be publication-safe relationships supported by released Wiki material; classified/spoiler relationships are not inferred from private canon.
5. Command distinguishes master canon lifecycle from website release state and from optional community moderation state.
6. Working, Unresolved, Exploratory, Superseded and Archived material is not silently promoted into current public truth.
7. If the canonical release projection cannot be resolved, product surfaces fail closed rather than falling back to obsolete Sites, ZIP exports or another lore store.
8. `publicObjects` and `canonProjection` are synchronized product projections. They are subordinate to the live Wiki and Publishing Queue and must be refreshed when those authorities change.
9. Community proposals, when enabled, may request changes but cannot canonize or publish records directly.

## Lattice policy

Lattice is intentionally a spatial interpretation, not a second encyclopedia. The current core map selects nine released records that form a coherent public-safe constellation while WIKI.ANEVUM exposes the full released set. Relation edges are restricted to relationships safe under the same publication boundary.

## Command policy

Command may show two different kinds of state and must keep them distinct:

- **Canon lifecycle:** status in the master Wiki.
- **Product release:** whether a record passed the Website Publishing Queue.
- **Community moderation:** optional proposal/review workflow, separate from both canon and release authority.

Failure of the community moderation backend must not make the canonical Wiki appear unavailable.

## Legacy boundary

Do not return production development to obsolete Sites/V5/old ZIP workflows. Those artifacts may be retained only as historical reference where needed; they are not active architecture or content authority.

The checked-in `supabase/migrations/20260915_public_moderated_wiki_v1.sql` belongs to the optional moderated community experiment. Do not apply it as a replacement canon database merely to satisfy Command, Wiki or Lattice.
