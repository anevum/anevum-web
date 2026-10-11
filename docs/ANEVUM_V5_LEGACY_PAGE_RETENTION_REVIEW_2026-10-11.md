# ANEVUM V5 — legacy page retention review

Session: ANEVUM.WEB.REVIEW.2026-10-11.001.LEGACY-PAGE-RETENTION
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Continuing: ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL
Master: WEB #259; website reconstruction: WEB #265
Source parent: draft WEB #291 at ce3e42cd31c19f595ee5f8dbe05f75cdf19d20bd
Main inspected: 56e2b5d7b783903aaa885543adb7b44bf6bca503

## Finding and implemented evidence

The parent import audit found 39 page modules: 12 in the draft runtime graph
and 27 outside it. Import reachability alone missed literal paths used by
release validation and source-reading tests. In this review, 10 of those 27
have literal file references; the remaining 17 require manual review.
These counts describe this checkout, not production usage or deletion approval.

scripts/audit-v5-legacy-page-retention.mjs now supplements the graph with
static string and expression-free template paths, concatenated literal paths,
and known path.join suffixes. It emits reference file, line and evidence kind;
never raw source text, environment values or credentials. Documentation and
configuration text mentions remain distinct from JavaScript path literals.
Display labels such as Research or System do not become source references.
The original graph additionally emits runtime/auxiliary import witnesses,
direct importers and outgoing dependencies for each page.

Seven existing page paths are read by scripts/validate-release-registry.mjs.
Six are outside the draft runtime graph: Home, Live, Performance, System,
Research and Theory. Existing crypto-retirement, legacy-RHEN, visual and SSE
source-reading tests impose additional retention dependencies. Removal before
replacing the relevant assertions would break required checks.

Run locally:

```sh
node scripts/audit-v5-source-reachability.mjs --json
node scripts/audit-v5-legacy-page-retention.mjs --json
node --test tests/v5-source-reachability.test.mjs tests/v5-legacy-page-retention.test.mjs
```

CI records both JSON reports in the anevum-v5-source-reachability artifact
for three days. Durable review findings live in this versioned document.

## Draft-excluded page inventory

This is a retention/review list. No row grants permission to delete.
The final column is a pinned main App import check, not a complete production
reachability audit. Production deployment ancestry remains a separate release check.

| Page | Review decision | Literal source references | Main at inspected SHA |
| --- | --- | --- | --- |
| About.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | No direct App import |
| Architecture.tsx | RETAIN_LITERAL_REFERENCE | tests/command-trading.test.mjs | Lazy import retained |
| Archive.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | No direct App import |
| CaseStudies.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | No direct App import |
| Feed.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | Lazy import retained |
| FieldNoteDetail.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | Lazy import retained |
| Founder.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | Lazy import retained |
| Home.tsx | RETAIN_LITERAL_REFERENCE | scripts/validate-release-registry.mjs | No direct App import |
| HomeCompany.tsx | RETAIN_LITERAL_REFERENCE | tests/command-trading.test.mjs | Lazy import retained |
| Lab.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | No direct App import |
| Live.tsx | RETAIN_LITERAL_REFERENCE | scripts/validate-release-registry.mjs, tests/command-trading.test.mjs, tests/legacy-rhen-retirement.test.mjs, tests/public-feed-sse.test.mjs, tests/visual-ops.test.mjs | Lazy import retained |
| NotFound.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | No direct App import |
| Notes.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | No direct App import |
| Performance.tsx | RETAIN_LITERAL_REFERENCE | scripts/validate-release-registry.mjs | No direct App import |
| ProductDetail.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | No direct App import |
| Products.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | Lazy import retained |
| Record.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | No direct App import |
| ReleaseDetail.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | Lazy import retained |
| Releases.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | Lazy import retained |
| Research.tsx | RETAIN_LITERAL_REFERENCE | scripts/validate-release-registry.mjs | No direct App import |
| ResearchHub.tsx | RETAIN_LITERAL_REFERENCE | tests/command-trading.test.mjs | Lazy import retained |
| Resume.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | Lazy import retained |
| RhenProduct.tsx | RETAIN_LITERAL_REFERENCE | tests/legacy-rhen-retirement.test.mjs | Lazy import retained |
| System.tsx | RETAIN_LITERAL_REFERENCE | scripts/validate-release-registry.mjs | No direct App import |
| Theory.tsx | RETAIN_LITERAL_REFERENCE | scripts/validate-release-registry.mjs | No direct App import |
| Wiki.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | No direct App import |
| Work.tsx | MANUAL_REVIEW_REQUIRED | No literal path found | No direct App import |

## Retention, replacement and rollback

Keep all 12 draft-runtime page modules, including legal/login components,
member accounts, RhenDraft, RhenApp, owner Command/RhenTerminal and staging/review
screens. Keep all legacy source in this draft as well. Main still has legacy
lazy imports that the unreleased V5 shell replaces; a draft graph is not evidence
that removing those sources is safe for main or rollback.

Before a deletion-specific change: map each candidate to a reviewed Commons
replacement or explicit archive decision; confirm its old address still redirects;
replace source-reading checks with meaningful tests of the replacement; review
computed paths, filesystem scans, static HTML/CSS, external backlinks and deployment
references. Preserve migrations, archival wiki/native source, historical release
records, public documents, OAuth and account exports. Do not remove dependencies
of retained pages solely because they are outside the draft runtime graph.

Restore source from the pinned parent commit or revert the future deletion commit.
The parent SHA is a Git source checkpoint, not a database/production backup.
Any eventual production rollback must use the separately reviewed release process.

## Verification and boundary

Parent #291 passed all exact-head ANEVUM Verify browser/build/privacy checks in
run 38132773824, release safety in 38132773815, and staging preflight in 38132773829.
The new tests prove file reads missed by imports are retained, transitive auxiliary
witnesses are recorded, UI labels and document mentions remain distinct, a restored
runtime import changes the decision, malformed parsing fails closed, output is
deterministic and the synthetic source tree is byte-identical after auditing.

This is source-only development. No page/asset deletion, merge, production or
reviewer staging repin, D1 migration, provider credential, Railway change,
Alpaca action or RHEN execution authorization is included. Exact-head CI for this
new draft must be recorded independently before further integration.
