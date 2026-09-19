# REPLY release notifications

REPLY release updates are a separate, explicit RHENLINK opt-in. Creating a RHENLINK does not subscribe a member.

## Delivery flow

1. A signed-in member chooses **Add Release Updates** in RHENLINK.
2. The preference is written to Supabase Auth user metadata as `reply_release_updates=true`.
3. COMMAND reads only opted-in RHENLINK users through the server-side Supabase Admin API.
4. An administrator composes a release notice in COMMAND and must confirm before sending.
5. The Cloudflare Worker sends email through Resend in batches of at most 100 recipients and creates RHENLINK in-app notices when the notification migration is present.
6. Every email contains an ANEVUM unsubscribe URL and a List-Unsubscribe header. Unsubscribing clears the RHENLINK release preference.

## Required production secrets

Set these as Cloudflare Worker secrets/variables; never expose them through Vite variables.

- `SUPABASE_SERVICE_ROLE_KEY` — server-only key used to enumerate opted-in Auth users and write notification telemetry.
- `RESEND_API_KEY` — Resend server API key.
- `RESEND_FROM` — verified sender, for example `ANEVUM <updates@anevum.com>`.
- `NOTIFICATION_UNSUBSCRIBE_SECRET` — long random value used to sign one-click unsubscribe links.\n- `NOTIFICATION_MAILING_ADDRESS` — valid public postal address included in commercial release email footers.

Optional:

- `SUPABASE_URL` — defaults to the current ANEVUM member project.
- `SUPABASE_PUBLISHABLE_KEY` — defaults to the browser-safe ANEVUM publishable key.

## Database migration

Apply `supabase/migrations/20260918_reply_release_notifications_v1.sql` to the existing ANEVUM member Supabase project.

Email delivery can still use the Auth preference if the telemetry tables are temporarily unavailable, but RHENLINK in-app notice history and COMMAND campaign history require the migration.

## Scope

The permission is intentionally narrow: REPLY publication/release events, availability, editions/formats, material delays or changes, and ownership-claim instructions. General ANEVUM marketing requires a separate preference.
