# Patch verification — 1.1.1

Session: CRISTYBREATHE.BUILD.2026-10-29.002

The suite now passes 7/7 scenarios, none skipped. The new SQL scenario uses 252
entries to verify that older drafts, reflections, priorities and collections are
found independently of the first loaded page; filtered counts and summary data
remain isolated by account. Browser coverage now also checks 220 paginated search
matches, older-entry discovery, input focus retention during searches, recent
items across view changes, and rapid theme/haptic/motion preference changes.

No schema migration or new service is required. iPhone landscape side insets are
included alongside the existing top/bottom safe areas. The sign-in browser is
still unauthenticated, so real-user production CRUD and physical iPhone
acceptance remain pending.

The previous release's verified backup restoration and authentication tests are
preserved below.

# Release verification — 1.1.0

Session: CRISTYBREATHE.BUILD.2026-10-29.002

## Passed

- Real RSA-signed fixture tokens; missing, malformed, tampered, expired,
  wrong-issuer, wrong-audience, future-not-before and unauthorized-user denial.
- SQL-backed create, refresh/new connection, edit, search, pin, draft, defer,
  conflict rejection and delete.
- Account separation for list, read, edit, delete, settings and export.
- Mutation Origin and custom-header protections, field validation, safe SQL
  parameter binding, literal search and idempotent creation/retry conflicts.
- JSON export and additive transactional restore with preserved contents,
  tags and timestamps. Invalid files cannot partially restore entries.
- Chromium end-to-end draft autosave, refresh recovery, editing, failed-save
  recovery, search, safe script-text rendering, defer/done, theme preference
  persistence, export download and UI-triggered restore.
- Text, muted text and primary-button contrast of at least 4.5:1 in all five
  themes, measured from the actual computed theme colors.
- Chromium layouts at 320, 390, 430, 768 and 1440 pixels, including editor
  bounds, without horizontal overflow. Captures visually inspected.
- Service worker cache inspection: only generic offline HTML and CSS.
- No unexpected browser console or page errors in the synthetic run. The
  intentionally injected 503 response is expected and recovery is tested.
- Actual Cloudflare D1 SQL backup and restoration in a disposable database.

The suite contains five API/security scenarios and one browser scenario with
the assertions above. The full run passed 6/6, with no skipped scenarios.

## Deployment verified through the Cloudflare management API

The existing Worker was updated in two increments. The final uploaded source
reports version 1.1.0 and includes the new design. Its D1 binding, original
authorized-account allowlist, issuer, audience and disabled preview URLs are
preserved. The production database remains empty after implementation tests.

## Pending acceptance

- Successful real-user sign-in: the browser sign-in attempt reached Access
  but the one-time code expired before authentication completed.
- Authenticated CRUD and reload on the actual production URL, including a new
  signed-in session and two real accounts.
- Actual iPhone Safari keyboard/safe-area behavior and installed home-screen
  launch. Chromium viewport tests do not prove native Safari or installation.
- Live authenticated browser console and server invocation checks.

These checks are not reported as completed. The release is deployed with an
acceptance hold, rather than declared fully verified.
