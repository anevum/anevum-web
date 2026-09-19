-- REPLY release notification delivery and RHENLINK notice history.
-- Email delivery uses the Cloudflare Worker + Resend. These tables provide
-- durable campaign history, per-member in-app notices, and delivery telemetry.

create table if not exists public.release_notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  topic text not null default 'reply_release',
  subject text not null,
  title text not null,
  body text not null,
  action_label text,
  action_url text,
  status text not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  subscriber_count integer not null default 0 check (subscriber_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  provider text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.member_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.release_notification_campaigns(id) on delete set null,
  topic text not null default 'reply_release',
  title text not null,
  body text not null,
  action_label text,
  action_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.release_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.release_notification_campaigns(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'pending',
  provider text,
  provider_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (campaign_id, user_id)
);

create index if not exists member_notifications_user_created_idx
  on public.member_notifications (user_id, created_at desc);

create index if not exists release_notification_deliveries_campaign_idx
  on public.release_notification_deliveries (campaign_id, status);

create index if not exists release_notification_campaigns_created_idx
  on public.release_notification_campaigns (created_at desc);

alter table public.release_notification_campaigns enable row level security;
alter table public.member_notifications enable row level security;
alter table public.release_notification_deliveries enable row level security;

-- Worker-only tables. Browser clients use authenticated Worker endpoints and
-- never receive service-role credentials.
revoke all on public.release_notification_campaigns from anon, authenticated;
revoke all on public.member_notifications from anon, authenticated;
revoke all on public.release_notification_deliveries from anon, authenticated;

grant select, insert, update, delete on public.release_notification_campaigns to service_role;
grant select, insert, update, delete on public.member_notifications to service_role;
grant select, insert, update, delete on public.release_notification_deliveries to service_role;
