# CONTINUANCE CADETS — ANEVUM private family-game prototype

Session: `ANEVUM.ANEVUM.BUILD.2026-10-16.001.CONTINUANCE-CADETS-FAMILY-GAME`

This package is an interactive browser game designed for the **existing owner-only ANEVUM Lab**. It contains no backend, public accounts, cookies, analytics, ads, payments or runtime third-party imports. Generic placeholder character names are intentional; a parent can enter family names privately on the device after setting a passcode.

## Implemented in V0.1

- Two independently customizable, animated explorer characters: six suit colors, three helmets, three companions and earnable animated Aurora fields.
- Daily missions and weekly objectives covering school effort, helpfulness, morning and evening routines, homework, reading and home responsibilities.
- Children request completion; a parent unlocks the local adult screen and approves or declines. No automatic deductions, penalties, sibling leaderboards or punitive streaks.
- Persistent on-device XP and redeemable Stardust. XP is lifelong and never spent; Stardust is spent on explicit approvals.
- Parent-approved weekend tablet passes, Fun Friday, and a virtual cosmetic unlock; prices and tablet limits are adjustable.
- Parent mission editor, export/import backup, local data reset with confirmation, simple PBKDF2-derived local parent passcode.
- Monday-Sunday weekly cycles and local-time day boundaries; no remote school behavior monitoring.
- Responsive browser UI, reduced-motion support, keyboard-friendly controls, SVG character art and no external assets.

## Security, privacy, and deployment

The existing Cloudflare Access protection at `lab.anevum.com` **must remain intact**. The optional PIN is a **secondary local convenience gate only**, not robust identity security: someone with device/developer-tool access can edit local storage. Do not expose private child data, credentials, family notes, or exports through public files, logs or CI fixtures. Source includes placeholder explorer labels only. Data is saved to `localStorage`, not synchronized between devices; browser clear/private browsing can delete it, so export backups.

This package is **source and locally tested prototype**, not a claim of hosted deployment or real Safari acceptance. Do not overwrite an existing Cloudflare Worker with an outdated Lab bundle. The live private Lab may include additional deployed modules not present on the older source branch. Deploy only after a narrow module/route overlay onto the currently active Worker, provider checks, authorization gates, and a real mobile device acceptance pass.

## Local development

Run `node lab/build-cadets-snapshot.mjs` to compile the four editable files in `lab/cadets/` to `lab/cadets-snapshot.mjs`. Run `node --test lab/test-cadets.mjs` to verify deterministic reward rules, accounting, weekly boundaries, backup consistency and source parity. Serve `lab/cadets/` as the `/projects/cadets/` directory under any simple HTTP dev server. Do not load `index.html` via `file://` since it imports ES modules.

## Lab integration

1. Import `{CADETS_FILES}` from `./cadets-snapshot.mjs` in `lab/worker.mjs`.
2. Route `/projects/cadets` to a 308 redirect toward `/projects/cadets/`.
3. Serve `/projects/cadets/` and `/projects/cadets/index.html` using `CADETS_FILES['/projects/cadets/index.html']`; serve the remaining four mapped static paths with correct Content-Type. Preserve existing host checks, GET/HEAD behavior, CSP, Access and anti-indexing headers.
4. Add a fifth `CONTINUANCE CADETS` entry to the Lab launcher, adjust fixed four-entry keyboard hints and CSS row counts, and update existing Lab tests and browser smoke tests.
5. Include `lab/cadets-snapshot.mjs` as a named Worker module in the provider-reviewed deployment. Do not attach child-facing public login or production community accounts.

## Future child-device experience

The initial version is parent-device/supervised-only because `lab.anevum.com` is owner-only. A separate future family-specific child access and adult verification design would be necessary before independent child logins or cloud sync. No per-child Cloudflare Access grants have been requested or applied.