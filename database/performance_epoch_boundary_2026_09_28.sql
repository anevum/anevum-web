-- RHEN public-performance cash-flow boundary
-- Applied to Supabase project mfntzxheldzdvlokyntk on 2026-09-28.
-- Purpose: preserve prior performance history while preventing an owner withdrawal
-- from appearing as RHEN trading loss or drawdown.

begin;

create table if not exists private.trading_performance_epochs (
  epoch_id bigint generated always as identity primary key,
  baseline_snapshot_id bigint not null
    references private.trading_account_snapshots(snapshot_id) on delete restrict,
  started_at timestamptz not null,
  ended_at timestamptz,
  reason text not null
    check (reason in ('initial_tracking','external_cash_flow','manual_reset')),
  note text,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

alter table private.trading_performance_epochs enable row level security;

revoke all on private.trading_performance_epochs
from public, anon, authenticated;

create index if not exists trading_performance_epochs_started_idx
  on private.trading_performance_epochs(started_at desc);

create unique index if not exists trading_performance_epochs_one_active_idx
  on private.trading_performance_epochs ((1))
  where ended_at is null;

insert into private.trading_performance_epochs(
  baseline_snapshot_id, started_at, ended_at, reason, note
)
select
  2,
  timestamptz '2026-09-25 01:07:23.268+00',
  timestamptz '2026-09-28 14:14:40.459+00',
  'initial_tracking',
  'Original public performance tracking epoch preserved for history.'
where not exists (
  select 1
  from private.trading_performance_epochs
  where baseline_snapshot_id = 2
);

insert into private.trading_performance_epochs(
  baseline_snapshot_id, started_at, ended_at, reason, note
)
select
  5704,
  timestamptz '2026-09-28 14:14:40.459+00',
  null,
  'external_cash_flow',
  'Owner-confirmed external withdrawal. Current post-withdrawal equity is the new website performance baseline.'
where not exists (
  select 1
  from private.trading_performance_epochs
  where baseline_snapshot_id = 5704
);

update private.trading_runs
set withdrawals = 8.00,
    notes = case
      when notes is null or notes = ''
        then 'External owner withdrawal of $8.00 recorded 2026-09-28; performance baseline reset at first post-withdrawal snapshot.'
      when notes not like '%External owner withdrawal of $8.00 recorded 2026-09-28%'
        then notes || ' External owner withdrawal of $8.00 recorded 2026-09-28; performance baseline reset at first post-withdrawal snapshot.'
      else notes
    end
where run_id = '49b3534b-1d19-4224-886a-95d48ab6b44c'
  and withdrawals = 0;

commit;
