# ANEVUM V5 Stage 2 — public website reconstruction

Session: ANEVUM.WEB.BUILD.2026-10-10.001.FULL-SITE-RECONSTRUCTION  
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001  
Tracker: https://github.com/anevum/anevum-web/issues/265  
System release board: https://github.com/anevum/anevum-web/issues/259

## Release boundaries

This branch is **draft only** and stacked on F0 #258, which itself is stacked on Commons V5.1 #256. It does not grant a merge, production Cloudflare deployment, D1 migration, Stripe change, broker connection, Railway restoration or trading authority. No new social write endpoint or third-party profile exposure is introduced. The founder's protected RHEN Command stays separately gated.

## Public route inventory / disposition

| Route | Previous state | Stage 2 slice | Source/notes |
|---|---|---|---|
| / and /feed | V5 home / older feed page | V5 published first-party feed | src/commons/CommonsV5.tsx; real Field Notes only |
| /products | Legacy studio shell | V5 project directory | publicProducts registry; RHEN status explicitly V5 rebuild |
| /field-notes | Legacy public notes | V5 filtered source index | fieldNotes canonical published entries |
| /field-notes/:slug | Legacy note detail | V5 complete detail and methods | Dated historical caveat |
| /products/rhen | Legacy project page | V5 RHEN product overview | Owner/member separation; live suspended |
| /products/rhen/architecture | Legacy project architecture | V5 architectural boundaries | Consolidated Research/Replay/Forecast; IREN deferred |
| /products/rhen/releases | Legacy releases page | V5 historical version index | Old releases are archival not live |
| /products/rhen/releases/:slug | Legacy release detail | V5 historical release detail | Avoid publishing execution specifics as new facts |
| /about | Legacy founder page | V5 genuine founder profile | Existing public founder data |
| /sign-in | Working member auth, legacy look | Existing SignIn logic hosted by V5 shell | No change to Google auth callbacks or backend |
| /privacy and /terms | Existing legal copy, legacy look | Existing legal copy hosted by V5 shell | No silent legal-text rewrite |
| /communities | No route | Read-only topical navigation | No fake membership, posts or groups |
| /learn | No route | Research reading path | Real notes only; no course/paywall claims |
| /resume | Legacy résumé page | V5 résumé using original factual founder source | PDF generation and download unchanged |
| /products/rhen/evidence | Public evidence adapter | Deferred / existing guarded route | Must remain truthful SUSPENDED_FOR_REBUILD |
| /command | Member Command and owner-only operator affordance | Deferred / existing guarded route | Owner requires independent Access verification |
| /me, /me/settings, /me/rewards, /me/verify | Member state and account lifecycle | Deferred / existing guarded route | F0 two-member isolation must remain intact |
| /apps/rhen/* | Member private RHEN draft/workspace | Deferred / existing F0 route | Never render via public Commons components |
| /command/rhen/* and /api/command/* | Private owner terminal APIs | UNTOUCHED | Cloudflare Access and server gate |
| Remaining historical aliases | Compatibility routes | Preserve pending crawl and redirects | Check SEO and existing links before removal |

## GitHub, styles and resources — not safe to delete yet

- Archived pre-Vite site/ is documented as not production; verify there are no build/scripts/links references before moving or deleting.
- src/pages/* contains old public page versions and private member/RHEN pages; public routes have now gained a new implementation, but remove old components only after CI, imports, SEO and rollback review.
- src/styles/* includes overlapping generations for workshop, Command, IREN and market visualizations; maintain reachability map before any deletion.
- native/iren-ios and assets may be historical but must have owner retention decisions; do not conflate a deferred service with evidence that all source should be destroyed.
- GitHub Actions were recently consolidated to one guarded production deploy. Never remove guarded migration/rollback/security workflows merely because they look old.
- D1 schema, Better Auth account deletion/export, protected operator endpoints and external routes remain stable in this slice.

## Stage 2 remaining slices

1. Verify V5 UI across supported breakpoints, palettes, preferences and disabled-feature affordances. Fix any screenshot regression before review.
2. Rebuild independent authenticated Command/account pages in the V5 visual language without reusing owner authority. Maintain F0 contract and two-account adverse tests.
3. Assess #249/#251/#252 for reusable social backend and moderation; do not merge wholesale. Create actual posts, comments, saves, profiles and communities only with separate security and abuse controls.
4. RHEN evidence view and member terminal polish using real status and explicit stage gates. No live brokerage activation in this workstream.
5. Run reference/asset/static-import reachability, web analytics and redirect audit; retire proven-dead legacy assets/code via small reviewed PRs.
6. Review production D1 migration 0004 separately; record owner visual and final production approval in #259. No automatic deployment.

Acceptance is one coherent Commons public experience now, then an independently verified account experience, fully reviewed social functionality, safe cleanup, and rollbackable release. This stage is progress toward that definition—not a claim the full V5 product is complete.
