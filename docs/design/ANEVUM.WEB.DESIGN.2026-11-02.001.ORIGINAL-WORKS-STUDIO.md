# Anevum — Original Works Studio Preview

Session: `ANEVUM.WEB.DESIGN.2026-11-02.001.ORIGINAL-WORKS-WEBSITE`  
Status: **Source implementation for design review; not accepted or deployed**  
Owner: Devon Akins  
Owning repository: `anevum/anevum-web`  
Owning Notion Website Bible: https://app.notion.com/p/3f988cc2ef148110a50cce6a347ceed2

## Approved direction versus proposed presentation

**LOCKED 2026-11-02:** Anevum (public title case) is an original-works venture. REPLY is the first flagship novel, and The Transcosmic is its initial original story universe. An author revision and reader-safe wiki revival are active priorities.

**PROPOSED:** "The Quiet Monument" studio presentation: mineral-night surfaces, restrained reciprocal signal geometry, warm ivory typography, copper, steel, and sapphire details, editorial rather than social-app hierarchy.

**NOT AUTHORIZED:** public site replacement, deployment, redirect migration, publisher or retailer mutation, author publication, private wiki projection, production content changes, or final logo/cover substitution.

## Existing system and dependency boundaries

- Current live route `/` remains `CommonsV5`, with all preexisting products, feed, accounts, moderation, studio and RHEN routes retained.
- Private `/command/*` and `/apps/rhen/*` retain existing routing and authorization policies. No Cloudflare Access, D1, Worker API, secrets or provider changes.
- This source adds only the review-only React route prefix `/design/original-works/*`.
- The preview route is **not** added to the published-path register or sitemap and is marked noindex by the client route metadata. The Worker already adds `X-Robots-Tag: noindex, nofollow, noarchive` for paths with no published route metadata.
- The UI uses no Notion API calls or public raw canon exports. Curated introductory content is hand-authored from the previously approved opening-state canon.
- No artificial users, reviews, commerce availability, cover imagery, preorder status, book release date, or telemetry are fabricated.

## Review route map

| Route | Purpose |
| --- | --- |
| `/design/original-works` | Studio homepage: creative identity, REPLY, Transcosmic |
| `/design/original-works/works` | Original works overview, one actual flagship |
| `/design/original-works/reply` | REPLY editorial page, truthful revision status |
| `/design/original-works/transcosmic` | The universe's opening situation |
| `/design/original-works/atlas` | Three source-approved, spoiler-safe introductory entries |
| `/design/original-works/journal` | Honest, held-only journal teaser |
| `/design/original-works/about` | Original-works studio identity |

Unknown review routes show an explicit not-found state.

## Current asset and canon limitations

The hero's orbital mechanics and book typography are clearly labeled design studies—not a literal Skygate, REPLY cover, approved final brand master, or manuscript illustration. The existing Orbital Underground SVG mark is reused as a compatibility asset, but **Anevum** is rendered as title-case text. The production pass must verify and reuse the previously approved REPLY cover source and other existing visual masters rather than regenerating or fabricating replacements.

The active internal canon is https://app.notion.com/p/3ae88cc2ef14818e8f0dd5b8399fb017. The spoiler/disclosure authority is https://app.notion.com/p/3db88cc2ef1481ed99fcedeb8153f26b. The private reader gateway and teaser draft is https://app.notion.com/p/40c88cc2ef1481b78869e0ae4d9b1fd3.

This preview does **not** promote wiki entries into the public website. A subsequent publishing integration needs explicit review of current source, `Website Ready`, `Public Window`, `REPLY Gate`, and an approved public publishing queue row. Never infer authorization from elapsed time.

The previous November 17, 2026 IngramSpark on-sale target conflicts with a later author release deferral and lingering retailer listings. No purchase or preorder CTA is permitted until that mismatch is resolved.

## Acceptance criteria

1. Existing root, member, RHEN, beta, field-notes, help, privacy, Command, and studio routes remain exactly routed as before.
2. Every preview path navigates with real React Router `Link` elements, accessible headings, skip link, current-page labels, correct focus states and truthful unknown-state behavior.
3. Responsive layout at **320, 390, 768, 1024, 1440 px**; no text cropped or horizontal overflow; verify on a real phone or automated browser.
4. `prefers-reduced-motion` and forced-colors honor user/device settings; static artwork fallback remains readable without animation.
5. No private wiki, unpublished manuscripts, RHEN owner data, member data or finance details in the preview bundle.
6. No search indexing and no public release/status claims. Browser and HTTP tests should validate `X-Robots-Tag`, per-route metadata and public-facing behavior in the preview.
7. Source-contract tests, full repository CI, TypeScript, build, Cloudflare preview, mobile screenshots and role-based existing-route regression tests pass at the exact PR head before considering promotion.
8. Owner reviews real 1440 px and 390 px screenshots; final design signoff and release authorization are independent gates.

## Required next production iteration

After preview validation, reconcile approved original art masters and book metadata, create the actual public `/stories/reply` and `/transcosmic/atlas` route contracts (preserving legacy routes and search indexing), and implement server-approved public canon projections with fail-closed publication rules. Do not merge the preview into production as a substitute for the public migration.

## Retained context

Historical October 2026 V143 studio direction: https://github.com/anevum/anevum-web/pull/793. It remains an unmerged review branch with games/creator assumptions; do not cherry-pick it blindly or delete it.


## 2026-11-02 — Reader preview data-integrity gate (review only)

Anevum's eight introductory reader entries and explicit relationship edges now live in `src/data/transcosmic-reader-preview.json`, with the typed frontend adapter `src/data/transcosmic-reader-preview.ts`. `src/pages/AtlasExplorer.tsx` renders the vetted snapshot; it does not contact Notion or accept arbitrary wiki records. This is **not** a public publishing feed or an approved manuscript copy.

The independent test fixture `tests/fixtures/transcosmic-reader-preview-baseline.json` freezes the current reviewed UI copy and topology. The validator `scripts/verify-transcosmic-reader-preview.mjs` **fails closed** when any record, text, category, relationship, release flag, public queue flag, unexpected field or private-source transport marker departs from the review contract. Its assertions and adversarial tests are run in both the core verification and local visual QA before building the review client.

The browser-review harness additionally tests whether a normal production-default build actually contains any of the distinctive draft text in its generated HTML, JavaScript, CSS or source maps. It must not rely on the client-side `noindex` tag as access control. A reviewer build can be created only with an explicit compile-time flag `VITE_ORIGINAL_WORKS_PREVIEW=true`; the existing Cloudflare-hosted preview restriction and separate provider release gate are unchanged.

**Important limits:** These checks are structural and snapshot-based; they do not replace fresh editorial reading, legal rights verification, an actual secure review service, or publication approval. A new editor-approved wording change requires a human review of the source, deliberate baseline update, and normal CI revalidation. A public release requires a separately approved, spoiler-reviewed public projection and publishing-queue state. No date in a record can flip these flags automatically.


## 2026-11-02 — Owner-only hosted review preflight (proposed; not provisioned)

**Implemented:** `scripts/verify-original-works-hosted-access.mjs` and `tests/original-works-hosted-access.test.mjs` perform a **read-only, fail-closed** Cloudflare Access / Worker configuration preflight before the legacy `wrangler preview` step in ANEVUM Verify. Core CI and local browser QA test both allowed and unsafe configurations. This preflight never creates Access applications, edits remote Worker settings, enables preview URLs, grants identities, starts a deployment, or publishes a web page.

**Verified current blocker:** Remote `anevum-web-nextgen` reports `enabled=false` and `previews_enabled=false`; the current Cloudflare account has no observed Access application that explicitly protects this Worker's preview traffic. An existing `preview_worker` Access application protects another Anevum project and is **not** transferable evidence of website preview protection.

### Deliberate setup gate — requires separate approval

1. Approve the specific hosted review surface and permitted identity or identities. The current preflight is intentionally limited to one exact owner email; it rejects wildcard, domain-wide, bypass, other email and arbitrary service-token allow rules.
2. Create or identify a Cloudflare **self-hosted Access app** with exactly one `preview_worker` destination for the actual `anevum-web-nextgen` Worker tag (32 hexadecimal characters). Never select `worker` (which would change production authorization) or an application belonging to a different Worker. Configure a single owner-only `allow` rule; no public bypass.
3. Confirm preview URLs are explicitly allowed for that Worker in Cloudflare. This is an external configuration change and **must not be inferred from `wrangler.jsonc`**. Enabling the Worker subdomain/preview endpoint is an external-exposure operation; obtain approval first.
4. Configure GitHub Actions repository variables `ANEVUM_WEB_PREVIEW_ACCESS_APP_ID` and `ANEVUM_WEB_PREVIEW_WORKER_UUID` with the reviewed identifiers. Despite the historical variable name, the Worker value is the exact **32-character hex** `tag` returned by Cloudflare Workers and `preview_worker.worker_id`, **not** a hyphenated UUID. The Access application ID is a separate **hyphenated UUID**. The preflight compares these two different identifier types strictly and verifies that the pinned Worker tag matches both the live script and the destination of the owner-only Access app.
5. CI uses its existing Cloudflare read token and account ID to inspect the app/policy, actual Worker identity and remote preview enablement; missing variables, denied reads, incorrect worker, broad policies, and disabled previews stop **before** `wrangler preview` is called. No credentials are printed by the preflight.
6. **Additional work after preflight passes:** the legacy hosted HTTP/browser QA expects unauthenticated responses. Cloudflare Access will correctly block those. Do not disable Access to make those checks pass: use a separately authorized minimally privileged CI service identity and redesign the hosted smoke tests for authenticated checks, or retain human owner review and local automated evidence. The new `scripts/verify-original-works-protected-preview.mjs` runs an **anonymous-denial** check immediately after Preview creation on eight routes. It accepts only unauthenticated Access refusal/login redirects and rejects exposed content (200), missing routes (404), wrong hosts and unsafe redirects. This does **not** replace authenticated owner QA; the old positive hosted probes remain blocked until that separately approved capability exists.

**Release state:** Not LIVE. No production deploy, worker configuration, Access policy, service token, DNS, account permissions, or public wiki queue was changed during this implementation. The existing local browser screenshots remain the functional review evidence until an approved hosted endpoint and its authentication are verified.
