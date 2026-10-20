# V095: native Creator Studio consolidation

Session: ANEVUM.OPS.UPDATE.2026-10-20.001.RELEASE-CONSOLIDATION

Repository: anevum/anevum-web

Parent release: merged PR #564, e1c945ec7af96abaea15c2d05a30ad46eb622919

Workstream: build/v095-native-creator-integration-20261020-001

## Locked direction

Staging is a deployment of the canonical application, not an independently styled product. Native builds, project records, playtesting, and package review use the existing React Shell, canonical account, navigation, Continuance styling, IREN and member identity. No second header, account system, player theme, staff authority, or creator database is introduced.

This work integrates the existing V003 browser-package service. It does not implement a full game engine, native executables, arbitrary Python/Node servers, AI-agent connections, metered model calls, or the future Creator Workbench.

## Delivered source surfaces

- `/studio`: retained canonical private project records, with native Studio navigation when explicitly enabled.
- `/studio/packages`: real owned playable builds, search, temporary/saved state, storage usage, exact-release save/submit/discard and immutable revision entry.
- `/studio/packages/new` and `/studio/packages/:projectId`: ZIP/HTML and optional PNG upload, explicit per-version rights, confirmed replacement, preserved form values on errors, private playtesting after upload, no automatic retry.
- `/projects/package/:projectId`: native public or private project player inside the canonical Shell. Only the executable frame uses the existing isolated runtime origin; no same-origin permission, server credentials or account access is granted to creator code. Expired private frames are removed.
- `/studio/packages/review`: server-authorized package review, exact archive hash/release identification, independent approval or reasoned change request, suspension/restoration. Existing non-playable record review remains intact.
- Discover and member-wall package cards link to the native player when enabled; builds compiled for `/creator/` retain that base path rather than escaping it.

The native API is an additive, default-OFF presentation adapter over the same canonical session, existing project tables, rights receipts, file inventory, preview capabilities, reviewer allowlist, quotas, storage, and cleanup. Existing mutation endpoints enforce the selected release ID when supplied by the new UI. No schema migration is required by this presentation integration.

## Correct route ownership

The externally routed namespace is **`/upload/v3`**. Its existing bridge maps `/upload/v3/review` to the controller's internal `/staff/packages` route, and `/upload/v3/api/v1/packages/*` to internal `/api/v1/packages/*`.

The previously suggested bare `/staff/packages` is not the public namespace. Adding new top-level Cloudflare routes is not needed for this integration and would violate the existing pinned route inventory. Do not retry the earlier blocked route mutation. No Cloudflare routing or Access policy change is made by this source update.

When native presentation is accepted, the bridge optionally redirects only its HTML screens to the matching React routes. APIs retain their current prefix, authentication, same-origin POST protection and service binding. Old published project IDs and URLs keep resolving; the V004 isolated service remains separate. Turning native presentation OFF retains the original V003 interface as rollback.

## Catch-up ledger

| Workstream | Current disposition |
| --- | --- |
| V091/V094 consolidation, IREN guidance, member/player presence, emblems and aura pages | Preserve the merged #564 application and tests. No parallel reimplementation. The whole-site candidate was not promoted by that merge. |
| V003 ZIP/HTML validation, optional artwork, rights receipts and revisions | Existing implementation retained; native screens now call the same service. |
| Upload resource protection | The V004-derived quotas, reservations, temporary retention and bounded cleanup are already consolidated in V003. Preserve its existing dedicated D1/R2 identities and limits. |
| Independent package moderation | Existing authority and self-review denial retained. Native decisions additionally identify the exact release being reviewed; stale decisions fail rather than approving another revision. |
| Member-wall and Discover integration | Existing verified gallery/proof contract retained; native player destinations are presentation changes only. No fabricated usage, ratings or identity mapping. |
| Staff transport/Observatory/profile access work, including historical #549/#551/#552 | Preserve the reviewed source snapshots and currently pinned staff deployment procedure. Do not blindly merge old main-based branches into the release. |
| #562 / #569 isolated compatibility work | Keep separate. #569's additional import analysis and compatibility design is not silently claimed as implemented in V003. Its parent staging service is not the canonical uploader. |
| #555 scene editor and #570 AI creator workbench | Retained design/future work. No agents, providers, model charges, editable engine or sandboxed build infrastructure is activated here. |
| Retired XP test button | Remains retired; do not revive an older XP-change PR. |
| Sites Workshop and business-site previews | Separate workstream; not part of this public Creator Studio consolidation. |
| Payment-provider and billing changes | Not part of this update. No provider, bank, charge, consent or financial configuration changes. |

A historical open PR is not proof of missing current functionality. Compare its actual changes and ancestry before closing or merging it. This ledger reconciles the active update scope; it is not a claim that every historical repository issue or deferred product idea is complete.

## Activation and rollback

All native activation is explicit and default-OFF:

1. Build the canonical frontend with `VITE_NATIVE_CREATOR_STUDIO_V095=true` and the existing accepted gallery flag. Staging uses these same components and assets, with only environment and approved feature settings different.
2. Upload and pin a **new immutable application candidate**. The old V091 candidate cannot represent this changed JavaScript, CSS or CSP. Keep the old version and its rollback settings until the replacement is accepted.
3. Deploy the reviewed V003 adapter/decision changes with its existing bindings; set `PACKAGE_NATIVE_STUDIO_ENABLED=true` only on the matching controller, namespace bridge and trusted HTML/CSP worker after the compiled candidate is available. Preserve the exact allowed runtime host and all existing routes.
4. Test real founder/reviewer/other-member sessions and public visibility on that exact candidate. Keep user-reported physical-device results distinct from synthetic Chromium fixtures. Never manufacture moderation receipts or substitute a role label for authenticated acceptance.
5. Record repository-linked acceptance, use the guarded production workflow, verify assets/configuration/routes and the complete live journey. Only then retire the duplicate presentation from ordinary navigation.

Until this is done, the release record stays fail-closed. Merged source is not a production deployment. The old source pin and exact five metadata exclusions must be updated to the reviewed new source without widening the exclusions. The existing candidate promotion/rollback guard remains intact and the release record explicitly marks the new native candidate as unaccepted.

Rollback changes presentation flags and the accepted application deployment, not project ownership, reviewed version pointers, accounts, earned recognition, or stored creator files. Do not delete a published project to undo a UI rollout.

## Evidence

`v095-native-creator-qa.yml` checks the existing and native backend/client contracts, default-OFF and explicitly enabled compiled React, shared Shell and style tokens, 320/390/768/1440 layouts, upload-error recovery, saved drafts, independent decisions, stale-release refusal, separate-member/guest isolation, Discover/member-wall links, private-token expiry, and expand/exit behavior. Screenshots and test traces identify their exact source and are synthetic only.

The existing full Creator V1, auth, staff, aura, gallery, package, source-scope, and browser regressions are still required before merging. No passing result is asserted by this document before those workflows actually finish.
