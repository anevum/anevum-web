# CristyBreathe

A private personal workspace for notes, ideas, reflections, reminders and a
gentler evening review. This app is independent of every other application in
this repository: it has its own Worker, database, authentication configuration,
build and tests. It does not send content to other workspaces or AI services.

The reusable software is licensed under the repository's Apache License 2.0.
There are no paid software dependencies or proprietary application services.
Cloudflare hosts the private deployment; others can fork and self-host the code.
Names and marks remain subject to the repository's trademark notice.

## Local development and tests

Use Node 22.13 or later (Node 24 recommended).

```sh
npm run build
npm run test:unit
npm install
npx playwright install chromium
npm run test:browser
npm run dev:test
```

`dev:test` starts a **local synthetic-account harness**, on loopback port 8787.
It supplies a locally generated RSA-signed test JWT and uses a local SQLite file.
It cannot authenticate against production. It must never be deployed as a server.
The production bundle includes only `src/` and `public/`; it does not include
the harness, fixtures, generated signing keys, test records or private config.

`CRISTYBREATHE_TEST_CHROMIUM` may select an existing Chromium executable for
automated browser tests. Test captures and local SQL files live under ignored
`.private/`. No screenshots or test database contents belong in Git.

## Private deployment

Copy `wrangler.example.jsonc` to ignored `wrangler.private.jsonc`, then set the
Worker name, D1 database ID, exact Access issuer and audience, and authorized
email allowlist. Never commit the populated file. Retain the existing Access
application if upgrading an existing deployment.

1. Keep the entire hostname protected by Cloudflare Access. Restrict the
   policy to the intended people. Leave preview URLs disabled.
2. Export the current database and record a Time Travel bookmark.
3. Inspect `sqlite_master` and `PRAGMA table_info(entries)` first. Apply
   `0001_foundation.sql`, then apply the additive `0002_personal_workspace.sql`
   **once**. Do not rerun its `ALTER TABLE` statements on an upgraded database.
4. Run `npm run build` and the tests. Upload `dist/worker.mjs`, preserving
   the private D1 binding and all authentication variables.
5. Verify Access redirects while signed out. Sign in and verify `/healthz`,
   then create, refresh, edit, search, export and delete a synthetic entry.
6. Verify a second authorized account cannot retrieve that entry. Complete
   actual iPhone Safari and Add to Home Screen acceptance checks.

The app fails closed when its issuer, audience, allowed emails or signed JWT
is absent. Do not create an authentication bypass for testing. See
[SECURITY.md](SECURITY.md) and [BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md).

## What is included

- Five semantic themes, responsive navigation, motion preferences and
  optional browser-supported vibration.
- Quick capture, D1 autosaved drafts, notes and private reflections.
- Collections, tags, pins, archive, reminders and priorities.
- Search across titles, content, collections and tags; recently opened items
  for the current visit. Filters and counts query the full account. Lists page in groups of 100; Load more opens more search matches or entries.
- Review, defer to tomorrow, mark done and reopen. Journal entries are
  excluded from review and focus.
- Account preferences, data export and additive transactional restore.
- Original ribbon icon, editable SVG/CSS hero artwork, PNG home-screen icons,
  manifest, metadata and a non-sensitive offline fallback.

The evening nudge is shown while the app is open. Background push and voice
transcription are not enabled. Private entries are never cached offline.
Unsaved text is retained in the open editor after failed saves, with retry,
copy and deliberate close-without-saving controls. Leaving the page before
the server acknowledges a save triggers the browser's unsaved-change warning.
There is no local-storage substitute for secure persistence.

This is a personal workspace, not an electronic health record.
