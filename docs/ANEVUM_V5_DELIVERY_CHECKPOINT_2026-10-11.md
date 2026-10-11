# ANEVUM V5 delivery checkpoint — October 11

## Latest release-track continuation — member beta and owner paper observation

Session sequence: ANEVUM.WEB.BUILD.2026-10-11.005.MEMBER-BETA-ONBOARDING →
ANEVUM.WEB.BUILD.2026-10-11.006.PUBLIC-BETA-ENTRANCE →
ANEVUM.WEB.BUILD.2026-10-11.007.OWNER-PERSONAL-PAPER-OBSERVER.
This section supersedes the older PR #297 next-job checkpoint below without
rewriting prior implementation/evidence records.

| Candidate | Source completion and boundary | Verified rollout state |
| --- | --- | --- |
| WEB #298 | Private authenticated /me/beta, identity-checked account/workspace/draft/Commons-read probes, signup availability retry and privacy-safe member onboarding. | All 3 exact-head CI workflows passed at 13468ce8a98e0e36049ca786ecd262484f4e788f. Draft, unmerged, not deployed. |
| WEB #299 | Public /beta visitor entrance, server-availability-based signup CTA, canonical Worker/SPA metadata, navigation and responsive checks; no invented social activity. | All 3 exact-head CI workflows passed at 8dce184b8ad392b0a3789bb68c1f4c224e58cc41. Draft, unmerged, not deployed. |
| WEB #300 | Founder personal PAPER account read-only observation, dual Access/Better Auth owner binding, staging-only/explicitly-OFF flags and backend secret custody, masked private status. Personal member and ANEVUM company finances separated; customer broker OAuth remains independent. | Source in review; evaluate CI against its latest exact head. No secrets provisioned, no real Alpaca request, no deployment or activation. |

Read-only Cloudflare state check October 11: base production membership D1
migrations 0001/0002 and configured Google/Better Auth bindings; isolated
staging member database 0001–0005. Social 0006/0007 remain unapplied. No
database modifications performed. Connection status must be confirmed via
real OAuth and member acceptance, not table existence or synthetic fixtures.
The new owner-member dual-bound production route also requires privately
verified RHEN_OWNER_MEMBER_ID provisioning before production release; this
must never be inferred from user counts, email or database row ordering.

**Minimum member beta release acceptance, independent of Alpaca Connect:**
- Exact consolidated source SHA, CI/browser/accessibility/SEO/privacy checks
  and rollback plan; preserve public historical pages and migrations.
- Real first-time and repeat Google signup; two ordinary member sessions,
  profile changes, save/follow state, export/sign-out and cross-member denial.
- Privately confirm founder/member binding and restricted operator denial
  before V5 cutover; owner terminal must not downgrade to Access-only.
- Cloudflare recovery proof for any database schema change, especially
  separate 0006/0007 moderated UGC deployment; never treat offline
  SQLite rehearsals as actual D1 restoration.
- Actual policy/privacy/moderator permission and appeals/retention approval
  before social writes; broker OAuth provider clearance is a separate gate.
- Explicit owner approval before production merge, deployment, migrations,
  secret writes, changing reviewer staging, or any broker execution.

**Developer PAPER observation is NOT an Alpaca Connect substitute.**
It remains off by default and cannot provide customer broker onboarding.
Company-owned trading, founder personal member testing, and customer-managed
brokerage each require isolated identity, records and authorization boundaries.


Session: ANEVUM.WEB.BUILD.2026-10-11.004.DISCUSSION-LIFECYCLE
Canonical program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Master release authority: WEB #259; full-site reconstruction: WEB #265
Current base: passing draft WEB #296 at 1ee89a5ccd193bde1bef763f055a61fbb223fae8
This checkpoint distinguishes implemented source from deployed/accepted capability.

## Progress carried forward

| Area | Concrete source/evidence checkpoint | Remaining release work |
| --- | --- | --- |
| Public Commons | Full-site shell/routes, real Field Notes, public Help/source links, canonical historical release detail and PDFs; #294 green | Final candidate public/legal/navigation/visual acceptance; approved rollout and rollback |
| Member Command and RHEN | Private workspace/draft contracts, account-keyed pages, owner-isolated legacy terminal; #295 settings lifecycle green | Real latest-candidate owner and second-member acceptance; private owner-binding provisioning |
| Staff review | Dual Access/Better Auth checks, durable report audit, exact scoped acknowledgements and pending-request account isolation; #296 green | Staff permission/revocation provisioning, rules/appeals/retention/privacy and real staff acceptance |
| Discussion lifecycle | This job adds stable feed/reply cursors, full bounded browsing, author-only reply removal, verified mutations and account isolation | Exact-head browser CI, then separately authorized pilot migrations/activation and real participant acceptance |
| Repository retirement | 39 page modules classified, 12 runtime / 27 retention review, zero old literal-reference blockers; source retained | Replacement/rollback and owner retention review before any deletion |
| Recovery and deployment | One guarded production deploy path; preview ledger 0001–0005 and encrypted backup/isolated SQLite recovery previously verified | Actual Cloudflare D1 restoration proof; separately approved production migration/cutover |
| Adopted services | Source-only GitHub/infrastructure observations and public source links carried in the stack; adoption tracked in #285 | Real least-privileged observations and owner/member denial acceptance where credentials/config are required |
| Alpaca reviewer | Existing isolated PAPER reviewer staging remains pinned; provider incident #282/ticket 371128 unresolved at this checkpoint | Provider activation/PAPER demonstration confirmation, genuine connection/revocation and review recording/DDQ |
| RHEN successor | Separate draft #488/#490 offline PAPER Research/Replay foundations passed | Complete authentic market-source custody, independent archived restore, 5/15/60m outcomes, reconciliation and prospective-session proof |

## Next coherent jobs

1. Consolidate final-candidate route/feature acceptance and performance/accessibility
   evidence. Reconcile the main-vs-candidate rollback map and remaining legacy
   replacement parity before presenting a release candidate for owner review.
2. Prepare the actual Cloudflare D1 restore acceptance path against an isolated
   disposable recovery target with exact backup/source binding, least-privileged
   credentials, comparison checks and explicit cleanup/approval boundaries. Do not
   count local SQLite recovery as this proof or touch the active member database.
3. Complete staff/pilot acceptance prerequisites and owner-authorized member/owner
   session acceptance against the chosen candidate. Provisioning/deployment is a
   distinct approval step after the concrete candidate and checks are reviewable.
4. Advance RHEN authentic source/replay work and Alpaca review when their separate
   provider/credential/owner gates permit it; do not substitute mock evidence.

Production V5, a public UGC launch, member trading, runtime execution and provider
approval are not complete. Future services and the separately locked bot-builder
product idea do not expand this release's scope. Keep RHEN as one application;
IREN remains deferred, and Vercel/Supabase stay retired.
