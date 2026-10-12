# Creator publishing: first vertical slice

Session: ANEVUM.WEB.BUILD.2026-10-11.001.CREATOR-PUBLISHING
Owner authorization: implement the external-hosted creator platform now, October 11, 2026.
Base: main 5c53fa530a495f022094fe3cc4903b43a8fc138c.
Program: WEB #259; service adoption #285; January 1, 2027 launch #308.
Preserve the concurrent distinctive-interface design PR #322. This is not a platform restart.

## Implemented source

- /discover: searchable, category-filtered catalog with bounded pagination and truthful empty/unavailable states.
- /projects/:id: reviewed project detail, external app/source links, opt-in sandbox preview, and browser-dependent Home Screen guidance.
- /publish: authenticated creator desk, public GitHub metadata import, private create/edit/delete drafts, rights-confirmed submission and withdrawal.
- /library: account-private saved projects, idempotent save/remove, hidden withdrawn listings.
- /studio/catalog: independent existing Studio Access JWT and exact Better Auth member binding, review notes, approve/reject/withdraw.
- Four additive D1 tables isolated in migrations-catalog; no migration is automatically applied by this branch.
- 25 listings per account, 200 saved projects, 20 mutations per minute per member, bounded request bodies and 100 retained events per project.
- Optimistic revisions and atomic mutation/audit batches; editing published content withdraws it until reviewed again.
- Catalog-specific export and FK-cascading deletion; private payloads contain viewerMemberId, public payloads omit owner IDs and emails.
- All 30 dedicated backend/dispatch tests passed locally using Node 22 and in-memory SQLite, with synthetic accounts. These do not constitute live D1, real OAuth, browser, or production acceptance.

## Cost and trust boundary

ANEVUM stores catalog metadata and member saves, not application code, binaries or deployments. The only outbound server fetch is bounded public metadata from api.github.com. No token, app URL fetch, package install, code execution, reverse proxy, background agent, paid hosting service, new Worker, new D1, Railway volume, or broker authority is introduced.

GitHub metadata import does NOT verify repository ownership. The UI labels repository links as unverified. Dedicated GitHub App installation/ownership checks, release webhooks and GitHub login are separate follow-on integration work. Creator hosting remains their responsibility.

External preview is click-to-load, no-referrer, sandbox=allow-scripts only. No allow-same-origin, forms, popups, downloads or top navigation. Some apps will not work in this restrictive preview; always offer external open. No claim that an iframe sandbox certifies software safety. No automatically generated app subdomain or native package; DNS redirects and app installation packaging remain follow-on work.

Technical references consulted: MDN iframe sandbox documentation; GitHub REST/GitHub App permission documentation. External hosts can block embedding; do not defeat those headers.

## Integration

creator-worker.mjs is middleware in the existing anevum-web-nextgen build; it delegates every non-catalog route to the unchanged worker.mjs. It reuses the existing member origin/session/CSRF logic and calls the original Studio status route to verify reviewer authority. CreatorApp adds explicit catalog UI paths and delegates everything else to existing App. Catalog styles live within the existing Commons ShadowRoot. RHEN, member login, old publications, private operator boundaries, and all trading-off settings remain unchanged.

Both ANEVUM_CATALOG_ENABLED and ANEVUM_CATALOG_PUBLISH_ENABLED remain false. Public pages remain noindex until production route-specific SEO and listing publication acceptance. The current homepage is not replaced; integrate the approved design work rather than bypass it.

## Required release evidence, not another blanket permission request

1. Exact-head full repository CI, build and regression checks; catalog mobile/desktop and keyboard browser QA including ShadowRoot layout and empty/error states.
2. Same existing member database: encrypted backup, verified archived recovery, additive migration rehearsal against the actual production schema, then apply only the reviewed catalog SQL. Never apply all pending social/billing migrations as a shortcut.
3. Real first and second-member testing: drafts, stale-tab denial, export, deletion, saved-project isolation; actual Studio allow/deny tests and real D1 batch/audit behavior.
4. Before accepting third-party submissions/publication: update privacy/export integration, retention/dispute/report handling and approve publishing rules. Existing general account export must incorporate the new catalog records before broad rollout; the dedicated catalog export is already implemented here.
5. Controlled existing production release with rollback recorded. Enable private catalog testing first, then public approval separately after submission/review acceptance. No fake seed creators or metrics.

## Follow-on order

Repository ownership proof and GitHub account connection; production-safe publication/report controls; new discovery homepage coordinated with #322; creator profiles/collections; ANEVUM Library install guidance; reviewed redirect subdomains. Payments, native storefront distribution, unrestricted hosting, broker connections and Discord migration are not activated by this source slice.
