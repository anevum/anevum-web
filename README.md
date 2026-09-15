# ANEVUM Web

Permanent public ANEVUM web application.

Production source: this repository, branch `main`.
Hosting: Cloudflare Workers + static assets from `dist`.
Production domain: `https://anevum.com`.
Wiki surface: `https://wiki.anevum.com`.

## Build

```bash
npm run build
```

## Deploy

```bash
npx wrangler deploy
```

## Architecture

- `anevum.com` — ANEVUM front door
- `WIKI.ANEVUM` — moderated public collaborative encyclopedia
- `LATTICE` — relational/member universe layer
- `RHENLINK` — member identity and progress layer
- ANEVUM Command — private company/operations environment

The private Transcosmic Canon Wiki remains the authoritative internal canon source. Public wiki publication is a separate editorial act; private canon is never mirrored automatically.

Canonical source:
https://app.notion.com/p/3ae88cc2ef14818e8f0dd5b8399fb017?v=3b788cc2ef1480c2b0c3000c26172161&source=copy_link

## Moderated Wiki Generation 1

The former hard-coded public canon index is being replaced by a real moderated wiki.

The public wiki begins with zero published pages. Signed-in RHENLINK members can propose new pages and edits. Those proposals remain private to the submitter and administrators until an administrator approves them. Approval creates a permanent revision and promotes it to the public page.

Repository implementation:

- `src/ModeratedWiki.tsx` — public wiki, contribution flow, saves, history and admin moderation UI
- `src/wikiClient.ts` — Supabase Data API client for wiki operations
- `src/moderatedWiki.css` — wiki interaction/design system
- `supabase/migrations/20260915_public_moderated_wiki_v1.sql` — schema, RLS and moderation transaction
- `docs/WIKI_MODERATION.md` — workflow, security and administrator bootstrap

The migration must be applied to the existing ANEVUM member Supabase project before submissions, saves and moderation can persist. The frontend fails safely to an empty public wiki if the database objects are unavailable.

## Member backend

Existing ANEVUM member/Auth project:

`mfntzxheldzdvlokyntk`

The browser uses only the Supabase publishable key. Never expose `service_role` or `sb_secret_...` credentials in client code.

## Production principles

- Current actual implementation outranks historical plans.
- GitHub `main` is the website source of truth.
- Public canon is deliberately published, never inferred from private development data.
- Administrator authority is stored in protected Supabase `app_metadata`, never user-editable `user_metadata`.
- RLS remains enabled on exposed member/wiki tables.
