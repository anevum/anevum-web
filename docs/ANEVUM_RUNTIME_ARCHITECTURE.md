# ANEVUM Runtime Architecture

This document defines the current production architecture for the ANEVUM web runtime.

## Authority model

ANEVUM has one universe-record authority: the live ANEVUM Wiki.

- **Wiki = truth.** Universe records, lifecycle state, relationships, provenance and revision lineage originate in the live Wiki.
- **Command = control.** `command.anevum.com` inspects and operates the runtime. It does not maintain a parallel lore database.
- **Lattice = spatial interpretation.** `lattice.anevum.com` renders Wiki-authorized records and `wiki_links` as a navigable relation space. It does not create canon.
- **RHENLINK = identity.** RHENLINK provides persistent member identity, authentication, progression, saves and permissions.
- **Terminal = access layer.** The shared terminal/SystemShell routes among the current surfaces without creating another content model.
- **ANEVUM.com = public experience.** The root host remains the reader-facing story and launch experience.

## Canon lifecycle

Downstream surfaces preserve the lifecycle state returned by the live Wiki. The application recognizes the following states:

1. `Source-Locked`
2. `Locked`
3. `Canonical`
4. `Working`
5. `Superseded`

The current product adapter treats `Working` and `Superseded` records as unavailable to current public product truth. Lattice and public Wiki reads fail closed rather than substituting material from another source.

Older checked-in Wiki rows may expose only the original publication statuses (`draft`, `published`, `archived`). The compatibility adapter maps those conservatively while preferring explicit lifecycle fields whenever the live Wiki exposes them.

## Hosts

| Surface | Canonical host | Purpose |
| --- | --- | --- |
| Public ANEVUM / REPLY | `https://anevum.com/` | Public story and launch experience |
| RHENLINK | `https://anevum.com/rhenlink` | Persistent identity and progression |
| Wiki | `https://wiki.anevum.com/` | Canonical record authority |
| Lattice | `https://lattice.anevum.com/` | Wiki-backed relation navigation |
| Command | `https://command.anevum.com/` | Private operations/control surface |

Root aliases `/wiki`, `/lattice`, and `/command` may resolve the same React runtime for continuity, but canonical metadata points to the dedicated hosts.

## Authentication

RHENLINK sessions originate on `anevum.com`. `AuthBridge.tsx` provides the cross-subdomain session bridge for Wiki, Lattice and Command. Authorization decisions use protected Supabase `app_metadata`; user-editable profile metadata must not be used for administrative authorization.

## Data-flow rules

1. A universe object is not promoted into Command or Lattice as independent truth.
2. Lattice nodes come from product-visible Wiki pages.
3. Lattice edges come from `wiki_links`.
4. Command may inspect non-public lifecycle states when the authenticated operator has Wiki administrator access.
5. Working and Superseded material remains control-plane/history material, not current public truth.
6. If the Wiki backend cannot be resolved, product surfaces withhold universe claims instead of falling back to old snapshots.
7. `publicObjects`, legacy site exports and other historical snapshots are not substitutes for the live Wiki authority.

## Legacy boundary

Do not return production development to obsolete Sites/V5/old ZIP workflows. Those artifacts may be retained only as historical reference where needed; they are not active architecture or content authority.

## Current backend dependency

The repository contains the original moderated-Wiki Supabase migration under `supabase/migrations/20260915_public_moderated_wiki_v1.sql`. The current runtime also supports explicit Wiki lifecycle fields through `wikiClient.ts` when the live API exposes them.

Before changing the database schema, inspect the live Wiki schema and reconcile it with the lifecycle model above. Do not create a second Wiki schema merely to satisfy Command or Lattice.
