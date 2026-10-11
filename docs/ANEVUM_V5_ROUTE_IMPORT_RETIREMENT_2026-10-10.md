# ANEVUM V5 — route/import retirement inventory

Session: ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL
Master queue: WEB #259; full-site reconstruction: #265
Source parent: WEB draft #289 at `2586976626aefc716fec988e1a8e89144f820af2`

## Evidence-based cleanup in this patch

The existing V5 `src/App.tsx` rendered no JSX instances for **14** stale lazy-import identifiers; each was a holdover from older public pages now served by the Commons V5 shell. The following unused App-level lazy imports are removed **without deleting any page file**:

`HomeCompany`, `Products`, `RhenProduct`, `Feed`, `ResearchHub`, `FieldNoteDetail`, `Architecture`, `Founder`, `Resume`, `Releases`, `ReleaseDetail`, `SignIn`, `Privacy`, `Terms`.

This is safe import-graph housekeeping, not proof that their source files are unused everywhere. In particular `Privacy`, `Terms`, and `SignIn` are still imported by `src/commons/CommonsPages.tsx`. No legacy page source, historical document, native IREN iOS prototype, archival wiki, migration, asset, Cloudflare Worker route or stylesheet is deleted in this change.

A Foundation test now fails if any new unmounted `React.lazy` import is added to App or if the protected V5 routes, Commons legal/login dependencies, SEO or legacy retirement boundary disappear.

## Route classification for next proof stage

| Group | Current path or component | Classification |
| --- | --- | --- |
| Public Commons | `/`, `/products`, `/feed`, `/field-notes`, `/about`, `/help`, `/learn`, `/communities`, `/privacy`, `/terms` | KEEP/REBUILD using V5 shell |
| Public RHEN records | `/products/rhen`, evidence, architecture, releases | KEEP, historical/disabled status is explicit |
| Member account | `/me`, `/me/settings`, `/me/rewards`, `/apps/rhen/*` | KEEP behind existing member controls |
| Owner terminal | `/command/rhen/*` | KEEP owner-only double identity gate, never substitute member role |
| Acceptance/reviewer | `/me/verify`, `/apps/rhen/connect` | KEEP staging/reviewer gates |
| Legacy public addresses | `/live`, `/performance`, `/architecture`, `/research/*`, `/founder` and other historical redirects | REDIRECT, preserve inbound links |
| Old page source | legacy `src/pages/*` and older CSS | AUDIT further before deleting any file |
| Historical artifacts | `site/wiki/archive/transcosmic/*`, `native/iren-ios/*`, migrations/evidence | RETAIN until separate owner-reviewed archival decision |
| Provider/deployment | GitHub Actions, Cloudflare, Railway, Alpaca, Stripe and Google | RETAIN trusted provider boundaries; no automatic provisioning |
| Vercel | No `vercel.json` or `.vercel/project.json` in inspected V5 source tree | No tracked deployment config to remove; external GitHub/Vercel app connections are a distinct audit |

## Required verification

- [ ] CI exact-head Foundation, build, release safety, staging preflight and browser route QA.
- [ ] Dependency graph and source reachability audit of remaining 39 `src/pages/*.tsx` modules, with owner review of retention/archive/deletion candidates.
- [ ] Verify no Vercel/obsolete deployment hooks in external GitHub integrations before claiming Vercel fully disconnected.
- [ ] Real two-member/owner browser acceptance, D1/reviewer release and separate production authorization.

This is an incremental DRAFT on the V5 development branch. It has no production, provider, OAuth, schema, billing or order-path effects.
