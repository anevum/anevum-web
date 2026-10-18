# ANEVUM — Native Creator Experience Unification

Date: 2026-10-18
Session: `ANEVUM.WEB.UPDATE.2026-10-18.003.NATIVE-CREATION-EXPERIENCE`
Status: **Deployed. Public discovery and published player routes verified; authenticated uploader modal requires owner acceptance.**

## Product principle

An uploaded creation is an ANEVUM project, not an external site. The public experience belongs inside the canonical project page and navigation. Uploaded content is a separate execution/security boundary only, embedded within the native ANEVUM page. The original author’s content should dominate, not synthetic category artwork.

## Routes

- `/discover`: native approved public catalogue. Now includes a direct **UPLOAD A CREATION** CTA leading to `/upload`.
- `/projects/alpha_<id>`: canonical published creation page with ANEVUM header, actual inline sandboxed content, project title/description, Restart / Expand / Share controls, and More in Category. No artificial cosmic hero for alpha projects.
- `/play/<uuid>`, published: HTTP 302 to `/projects/alpha_<uuid stripped of dashes>`. This eliminates the disconnected duplicate public page. The raw game iframe still loads `/api/v1/alpha/projects/<uuid>/file` without same-origin sandbox permission.
- `/play/<uuid>`, nonpublished: the original owner/staff-gated response retains its authentication checks and receives the matching brand/navigation/styles. It is not indexed publicly.
- `/upload`: alpha upload workflow stays operational but gets a unified design, clear Upload → Preview → Review → Publish progression, preserved saved drafts, and a private preview modal for project links. Successful uploads return to the uploader with the newly created draft highlighted, rather than abruptly navigating to a standalone player.
- `/alpha`: redirects to `/discover` for a single public catalogue.
- `/alpha/review`: existing redirect to `/staff/projects` preserved.
- `/staff/projects`: existing Cloudflare Access + canonical ANEVUM owner/reviewer permission checks unchanged.

## Live worker ownership, October 18, 2026

- `anevum.com/assets/index-*` → `anevum-native-project-player-v005` (upstream `anevum-apex-prelaunch-gateway`).
- `anevum.com/play/*`, `anevum.com/upload*`, `anevum.com/alpha*` → `anevum-unified-creation-routes-v002` (upstream `anevum-alpha-submission-tracker-v005` and canonical member D1).
- `anevum.com/api/v1/projects*`, `anevum.com/api/v1/categories`, `anevum.com/api/v1/status`, `anevum.com/api/v1/boards` → `anevum-alpha-discovery-adapter-v002` (upstream apex and canonical member D1).
- `anevum.com/api/v1/alpha/*` continues to use `anevum-alpha-uploader-player-v004-staff` with auth, R2 and D1 bindings.
- Staff routes and native frontend root remain owned by their established Workers. No account database, publishing rows, approval records or level/reward systems were migrated or overwritten.

Source copies on branch `alpha/player-uploader-20261018`:
- `site/alpha/anevum-native-project-player-v005.mjs`
- `site/alpha/anevum-unified-creation-routes-v002.mjs`
- `site/alpha/anevum-alpha-main-discovery-v002.mjs`

Earlier versions remain available as isolated Cloudflare Worker rollback targets.

## Correct representation of creator identity

Single Drift’s owner currently has a creator profile with **private** visibility. The public project now says **ANEVUM MEMBER / CREATOR PROFILE NOT LINKED**, rather than inventing a visible public profile URL, display name, level icon or award. The native discovery card similarly uses neutral creator credit. Do not automatically change member profile visibility. Once a creator explicitly publishes their profile, integrate their actual player card through the canonical verified public identity API.

## Verified

- `/discover` renders Single Drift and a working Upload CTA.
- `/projects/alpha_5764a892052647b6953b4cf6a9053c0f` renders Single Drift, embedded raw HTML sandbox, Restart / Expand / Share, true author summary in About, and a neutral unlinked creator indicator.
- Unfinished participation and discussion panels are removed from the alpha project page; no broken `/creators/null` links remain.
- `/play/5764a892-0526-47b6-953b-4cf6a9053c0f` resolves to the native project page.
- `/alpha` resolves to `/discover`.
- Guest `/upload` renders the new brand header, progress stages, and sign-in gate.
- Public discover and project pages were checked after each deploy. The v003 frontend regression (duplicate JS declaration) was detected, rolled back, corrected and verified before newer deployments.
- Source-injected JS modules were syntax checked before latest deployment.
- The existing alpha raw HTML sandbox remains `sandbox="allow-scripts"` plus restrictive response CSP, without `allow-same-origin`.
- Staff review remains Cloudflare Access protected.

## Unverified / next acceptance checks

1. With `devon@anevum.com` signed in, open `/upload` and click a saved project's preview. Confirm that the private dialog opens inside the uploader, runs the HTML game, can restart, and closes properly on iPhone.
2. Upload a second small, self-contained HTML test file. Confirm upload completes, browser stays on `/upload?created=<id>#my-projects`, and highlights the saved draft.
3. Submit and then approve the new project in `/staff/projects`. Confirm new public Discover card and viewership from an anonymous browser.
4. Exercise in-page Expand and Restart and the iOS Share sheet using real touch interactions. Visual presence is verified; those interactions are not yet acceptance tested in the live browser.
5. Migrate presentation to the canonical creator-v1 source components; existing route Workers are an interim compatibility layer and not the desired long-term architecture.
6. Add ZIP/multi-file upload, preview screenshot/thumbnail extraction, project versioning, author-provided artwork, reliable activity/ratings/discussions, and optional published creator/player cards. These are **not** completed by this release.

## Rollback

Before making any change, inspect current Cloudflare zone Worker routes and refuse to overwrite a changed owner.

- To return to prior public page overlay, route `anevum.com/assets/index-*` to `anevum-native-project-player-v002` (stable pre-unification player).
- To return to the prior alpha route behavior, route only `anevum.com/play/*`, `anevum.com/upload*`, `anevum.com/alpha*` to `anevum-alpha-submission-tracker-v005`.
- Public API adapter can return to `anevum-alpha-discovery-adapter-v001` on its same routes if necessary; do not disable the public catalogue.
- Never reset/delete member D1, R2 objects, published project status, or staff grants during a UI rollback.
