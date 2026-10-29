# Recovery checkpoint

Session: CRISTYBREATHE.BUILD.2026-10-29.002

Recovered October 29, 2026. The existing private Worker has a D1 binding and
an Access application restricted to two authorized accounts. Preview URLs are
disabled. The database contains an empty `entries` table with id, owner, kind,
title, body, status, created_at and updated_at. The Worker already verifies RS256
JWT signatures, issuer, audience, expiry and an authorized email allowlist.
Its CRUD SQL restricts updates and reads to the authenticated owner.

The original UI supports basic notes, journal entries, ideas, tasks and browser
theme selection. It lacks draft autosave, conflict detection, collections,
pinning, review/defer, persisted preferences, restore, and native PNG PWA icons.
The original brand preview is a broader demonstration with simulated meetings
and business operations; those functions must not become personal app features.

The source of truth for this independent app is `apps/cristybreathe` in this
repository. There is no runtime or data connection to the repository's other
applications. Deployment configuration is supplied privately. Original Worker
source was retained outside Git for rollback. Original active version:
`df34b120-4b24-453b-840f-c6704d837d0e`.

Changes are additive to the existing schema. Preserve the existing Access
application, database binding, authorized accounts and disabled preview URLs.
Keep the original approved ribbon icon and share artwork. Add a complete personal
workspace, five themes, server drafts, owner isolation tests, export/restore,
and a PWA that never caches private entries.

Human verification remains necessary for Cristy's real sign-in and an actual
iPhone home-screen launch. Automated emulation cannot establish either result.
