# WIKI.ANEVUM — Moderated Public Wiki

WIKI.ANEVUM is a public collaborative encyclopedia, not a direct mirror of ANEVUM's private canon workspace.

## Authority

The private Transcosmic Canon Wiki remains the authoritative internal canon source:
https://app.notion.com/p/3ae88cc2ef14818e8f0dd5b8399fb017?v=3b788cc2ef1480c2b0c3000c26172161&source=copy_link

Public wiki publication is a separate editorial act. Nothing from private canon becomes public automatically.

## Publication workflow

1. Anyone can read published pages.
2. A signed-in RHENLINK member can propose a new page or an edit.
3. The proposal enters `wiki_submissions` with `pending` status.
4. Only an authenticated user with protected Supabase `app_metadata.wiki_admin = true` (or admin/wiki_admin role) can review it.
5. Approval calls `review_wiki_submission`, which creates a permanent revision and promotes it to the public page atomically.
6. Rejection or requested changes never alter the current public revision.
7. Every approved revision remains in history.

## Database migration

Apply:

`supabase/migrations/20260915_public_moderated_wiki_v1.sql`

The migration creates:

- `wiki_categories`
- `wiki_pages`
- `wiki_revisions`
- `wiki_submissions`
- `wiki_links`
- `wiki_saves`
- `wiki_admin_actions`
- RLS policies for public readers, RHENLINK contributors, save ownership and administrators
- `review_wiki_submission(...)` for transactional moderation

The migration intentionally creates **zero published pages**. WIKI.ANEVUM begins blank.

## Administrator bootstrap

Administrator authority must never be stored in user-editable `user_metadata`.

After the migration is applied, grant the intended RHENLINK account protected app metadata using a privileged server-side/Admin/SQL path, for example:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"wiki_admin": true}'::jsonb
where email = 'YOUR_ADMIN_EMAIL';
```

Do not expose a service-role or `sb_secret_...` key to the browser.

After changing app metadata, sign out/in or refresh the RHENLINK session so the current user payload reflects the new claim.

## Routes

Primary app:

- `/wiki` — public main page
- `/wiki/new` — propose a page
- `/wiki/:slug` — approved article
- `/wiki/:slug/edit` — propose an edit
- `/wiki/saved` — member saves
- `/wiki/admin` — moderation queue

Wiki subdomain:

- `/` — public main page
- `/:slug` — approved article

Write/admin actions intentionally route through `anevum.com` when cross-subdomain RHENLINK session state is unavailable. Identity display may be shared across ANEVUM subdomains, but authentication tokens are not stored in a cross-subdomain client cookie.

## Security model

- Public roles can only select published pages and approved revisions.
- Contributors can only insert pending submissions attributed to their own `auth.uid()`.
- Contributors cannot publish pages or mutate revisions.
- Saves are owner-scoped by `auth.uid()`.
- Admin checks resolve from protected JWT `app_metadata`.
- The moderation function is `SECURITY INVOKER`; RLS remains active during publication.
- No service-role or secret API credential belongs in client code.
