# Continuance NEXT: isolated React foundation and Action Lens

Session: `ANEVUM.WEB.BUILD.2026-10-23.002.CONTINUANCE-INTERFACE-OVERHAUL`.
Design predecessor: `ANEVUM.WEB.DESIGN.2026-10-23.001.CONTINUANCE-INTERFACE-OVERHAUL`.
Board: #325. Design review: #335. Current release: #655 / #674.

## Authority and sequencing

The owner authorized continued overhaul development while Cloudflare MCP is unavailable. The overhaul is a successor to V131, not a replacement for its pending publication. Source development and offline review may proceed. Production promotion, migrations, provider connections, payments, XP, arbitrary code hosting and publication remain separately gated.

Base: V131 `ad0d3aef473e12c124b003d2c3bb45b79bff520e`. Branch: `design/continuance-next-ov03-20261023-001`. A stacked draft is for reviewing only this delta: do not merge it into the frozen V131 publication branch. After V131 is published, reconcile/retarget onto the explicitly selected successor integration base and rerun exact-head verification. Keep #658 Studio and #667 public surfaces separate; no duplicate file-tree, catalogue, identity or IREN implementation.

## Implemented here

- Opt-in Continuance tokens, readable desktop/mobile composition, original OrbitalMark, CSS orbital atmosphere, manual motion pause, hidden-page pause, reduced-motion and forced-color handling.
- Independent React review with Arrival, Discover and Creator Studio views. The review includes no real account or catalogue data. Discover demonstrates explicit empty/loading/error states without invented projects.
- Mobile workspace pane switching, editable local title/description, safe text-only preview, retained edits across view changes, and clear unsaved/reload semantics.
- Reusable ActionLens presentation plus a pure immutable local model: exact target/revision/before-value checks, allowlisted bounded fields, independent receipt snapshots, blank human drafts, atomic multi-field changes and undo conflict protection.
- Separate Vite review entry and output. Normal App.tsx, main.tsx, package manifests/lockfile, deployment workflows, auth, player and database code are unchanged.

The local model is not a security boundary, durable revision service, idempotency store, real AI planner or permission grant. Production actions need server-derived identity/scope, validated revisions, operation IDs, authorization, authoritative receipts, unknown-outcome reconciliation and reviewed undo semantics. The new review mounts no IREN instance and sends no `anevum:iren-open` events. It does not replace approved character art.

## Run safely

From the existing repository with its existing frontend dependencies installed:

```sh
node --experimental-strip-types --test creator-v1/test/continuance-next-action-lens.test.mjs creator-v1/test/continuance-next-isolation.test.mjs
npm run check:creator-v1-web
npm run build:creator-v1-web
AVNEXT_CHECK_PRODUCTION=1 node --test creator-v1/test/continuance-next-isolation.test.mjs
npx --no-install vite build --config creator-v1/web/vite.continuance-next-review.config.ts
python creator-v1/test/capture-continuance-next.py
```

Browser capture needs Python Playwright 1.57.0 and Chromium. The new pull-request-only workflow installs those development tools, builds the isolated review, blocks external browser requests, checks 15 view/viewport combinations plus interactions, and retains screenshots/evidence as an artifact. It has read-only repository permissions, blank provider credentials and no deployment step. Its source-diff guard allows only new review files relative to the frozen V131 base. Any future broader integration requires a reviewed guard change, not bypassing a failed check.

Normal production output is `creator-v1/dist/web`; review output is `creator-v1/dist/continuance-next-review`. The production-bundle test scans compiled HTML/JS/CSS for review markers. `publicDir:false` prevents copying normal public assets into the review bundle. No secret-bearing service or database is bound to it. Never upload the review as the production website.

## Evidence distinctions

At local preparation: 15 action-model tests and 4 source-contract checks passed; the compiled-production isolation check was explicitly skipped because the full repository build was unavailable locally. The pure model passed strict TypeScript 5.8.3 no-emit checking; that compiler is not the repository-pinned 7.0.2. JSX/TypeScript syntax checks are distinct from full React typechecking.

The container could not reach GitHub/npm to install the pinned frontend toolchain. Therefore no local compiled-React screenshots or production-build acceptance are claimed. Record actual CI results and exact head on the draft PR; never substitute the earlier standalone HTML prototype's screenshots or its test counts for this React slice. Physical iPhone Safari, screen-reader review, real accounts/provider delivery, durable Studio storage, field performance and final owner visual acceptance remain open.

## Next implementation

Use CI-generated 1440px desktop captures first, then 390px and 320px phone views. Address concrete defects before adding more UI. Next reconcile the shared shell/overlay priorities and actual public catalogue adapters while retaining the current single IREN, auth/player contracts, query/cursor state and #667 ownership. Studio backend integration follows #658's independent migration/restore/authorization gates. No framework rewrite, new production package, database migration, feature activation or Cloudflare workaround is required for this source-only slice.
