# ANEVUM / Continuance Institute — Private Preview Console
Session: ANEVUM.WEB.BUILD.2026-10-19.001.PRIVATE-LAB-PREVIEW-CONSOLE

## Target
Existing owner-only Cloudflare Access hostname: https://lab.anevum.com/
New isolated route: https://lab.anevum.com/previews/

The current private Lab custom-domain Worker `anevum-private-lab` remains untouched. Independent preview Worker `anevum-lab-previews-v001` handles `lab.anevum.com/previews*` through an exact, path-specific Cloudflare Workers Route. Per Cloudflare routing documentation, Routes take precedence over Workers Custom Domains on the same hostname.

## Auth and data
Cloudflare Access app id 63f63f79-3591-46ef-83c9-20d018743e6c already protects lab.anevum.com and has one owner email allowlist policy. Do not change Access, add users, expose a workers.dev hostname, enable preview URLs, or move this Worker to anevum.com. Its host/protocol validation is defense in depth, not authentication. No D1, KV, R2, sessions, staff grants, payments, private member data or backend API calls. Browser interactions run on in-memory synthetic specimens and reset on refresh.

Five interactive scenes: V079 four-door Wayfinder, simulated founder/moderator/member identity & sample XP, IREN spotlight guide, fictional staff review queue, V082 email verification sequence (nonfunctional simulation). All explicitly labeled as simulations with source and test evidence links. This does not replace the source or real working release.

## Deployment procedure
1. Verify Access owner policy, unchanged production Lab domain, exact script version and existing routes before any mutations.
2. Run source test and headless mobile/desktop screenshot review.
3. Upload single-module `lab/previews/worker.mjs` as a **new** Worker. Confirm no bindings.
4. Disable both workers.dev and Worker preview URLs; verify disabled.
5. Create `lab.anevum.com/previews*` route only. Do not add or change wildcard `lab.anevum.com/*` routes.
6. Verify 100% deployment, route, and Access remains owner-only. Recheck current Lab version is unchanged.
7. Owner logs in with Cloudflare Access at https://lab.anevum.com/previews/ and checks mobile interaction; zero member database dependence.

Rollback: remove only the new `lab.anevum.com/previews*` route. Never remove the existing Lab custom domain or Access app.

## Open items
A real interactive build-mirroring engine (previewing compiled Creator V1 versions with sandbox APIs) is future work. Static scenes here are intentionally not portrayed as live ANEVUM accounts or authenticated Staff. A Staff-to-Lab launcher should be integrated after the member D1 login/role service recovers and the Staff UI is separately reviewed.
