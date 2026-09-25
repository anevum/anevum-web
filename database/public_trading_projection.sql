-- ANEVUM public trading experiment projection
-- Source tables remain private. These tables contain only sanitized public records.
-- Applied to Supabase project mfntzxheldzdvlokyntk on 2026-09-24.

create table public.trading_public_equity (
  snapshot_id bigint primary key,
  observed_at timestamptz not null,
  equity numeric(14,4) not null,
  realized_pnl numeric(14,4),
  unrealized_pnl numeric(14,4),
  drawdown_pct numeric(10,6),
  open_positions integer not null default 0
);

create index trading_public_equity_observed_idx
  on public.trading_public_equity(observed_at desc);

create table public.trading_public_strategies (
  version_id text primary key,
  strategy_name text not null,
  status text not null,
  environment text not null,
  hypothesis text,
  activated_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null
);

create table public.trading_public_runs (
  public_id text primary key,
  strategy_version_id text not null,
  environment text not null,
  status text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  starting_equity numeric(14,4),
  ending_equity numeric(14,4),
  deposits numeric(14,4) not null default 0,
  withdrawals numeric(14,4) not null default 0
);

create index trading_public_runs_started_idx
  on public.trading_public_runs(started_at desc);

create table public.trading_public_trades (
  public_id text primary key,
  strategy_version_id text not null,
  symbol text not null,
  side text not null,
  opened_at timestamptz not null,
  closed_at timestamptz not null,
  qty numeric(20,8),
  avg_entry_price numeric(20,8),
  avg_exit_price numeric(20,8),
  realized_pnl numeric(14,4),
  net_pnl numeric(14,4),
  exit_reason text
);

create index trading_public_trades_closed_idx
  on public.trading_public_trades(closed_at desc);

alter table public.trading_public_equity enable row level security;
alter table public.trading_public_strategies enable row level security;
alter table public.trading_public_runs enable row level security;
alter table public.trading_public_trades enable row level security;

revoke all on public.trading_public_equity,
  public.trading_public_strategies,
  public.trading_public_runs,
  public.trading_public_trades
from public, anon, authenticated;

grant select on public.trading_public_equity,
  public.trading_public_strategies,
  public.trading_public_runs,
  public.trading_public_trades
to anon, authenticated;

create policy trading_public_equity_read
  on public.trading_public_equity for select to anon, authenticated using (true);
create policy trading_public_strategies_read
  on public.trading_public_strategies for select to anon, authenticated using (true);
create policy trading_public_runs_read
  on public.trading_public_runs for select to anon, authenticated using (true);
create policy trading_public_trades_read
  on public.trading_public_trades for select to anon, authenticated using (true);

create or replace function private.publish_trading_equity()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.trading_public_equity(
    snapshot_id,observed_at,equity,realized_pnl,unrealized_pnl,drawdown_pct,open_positions
  ) values(
    new.snapshot_id,new.observed_at,new.equity,new.realized_pnl,new.unrealized_pnl,
    new.drawdown_pct,coalesce(new.open_positions,0)
  )
  on conflict(snapshot_id) do update set
    observed_at=excluded.observed_at,
    equity=excluded.equity,
    realized_pnl=excluded.realized_pnl,
    unrealized_pnl=excluded.unrealized_pnl,
    drawdown_pct=excluded.drawdown_pct,
    open_positions=excluded.open_positions;
  return new;
end
$$;

create or replace function private.publish_trading_strategy()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.trading_public_strategies(
    version_id,strategy_name,status,environment,hypothesis,activated_at,retired_at,created_at
  ) values(
    new.version_id,new.strategy_name,new.status,new.environment,new.hypothesis,
    new.activated_at,new.retired_at,new.created_at
  )
  on conflict(version_id) do update set
    strategy_name=excluded.strategy_name,
    status=excluded.status,
    environment=excluded.environment,
    hypothesis=excluded.hypothesis,
    activated_at=excluded.activated_at,
    retired_at=excluded.retired_at;
  return new;
end
$$;

create or replace function private.publish_trading_run()
returns trigger language plpgsql security definer set search_path=''
as $$
declare pid text;
begin
  pid:=substr(encode(extensions.digest(new.run_id::text,'sha256'),'hex'),1,16);
  insert into public.trading_public_runs(
    public_id,strategy_version_id,environment,status,started_at,ended_at,
    starting_equity,ending_equity,deposits,withdrawals
  ) values(
    pid,new.strategy_version_id,new.environment,new.status,new.started_at,new.ended_at,
    new.starting_equity,new.ending_equity,coalesce(new.deposits,0),coalesce(new.withdrawals,0)
  )
  on conflict(public_id) do update set
    strategy_version_id=excluded.strategy_version_id,
    environment=excluded.environment,
    status=excluded.status,
    started_at=excluded.started_at,
    ended_at=excluded.ended_at,
    starting_equity=excluded.starting_equity,
    ending_equity=excluded.ending_equity,
    deposits=excluded.deposits,
    withdrawals=excluded.withdrawals;
  return new;
end
$$;

create or replace function private.publish_trading_position()
returns trigger language plpgsql security definer set search_path=''
as $$
declare pid text;
begin
  pid:=substr(encode(extensions.digest(new.position_id::text,'sha256'),'hex'),1,16);
  if new.status='closed' and new.closed_at is not null then
    insert into public.trading_public_trades(
      public_id,strategy_version_id,symbol,side,opened_at,closed_at,qty,
      avg_entry_price,avg_exit_price,realized_pnl,net_pnl,exit_reason
    ) values(
      pid,new.strategy_version_id,new.symbol,new.side,new.opened_at,new.closed_at,new.qty,
      new.avg_entry_price,new.avg_exit_price,new.realized_pnl,new.net_pnl,new.exit_reason
    )
    on conflict(public_id) do update set
      strategy_version_id=excluded.strategy_version_id,
      symbol=excluded.symbol,
      side=excluded.side,
      opened_at=excluded.opened_at,
      closed_at=excluded.closed_at,
      qty=excluded.qty,
      avg_entry_price=excluded.avg_entry_price,
      avg_exit_price=excluded.avg_exit_price,
      realized_pnl=excluded.realized_pnl,
      net_pnl=excluded.net_pnl,
      exit_reason=excluded.exit_reason;
  else
    delete from public.trading_public_trades where public_id=pid;
  end if;
  return new;
end
$$;

revoke all on function private.publish_trading_equity(),
  private.publish_trading_strategy(),
  private.publish_trading_run(),
  private.publish_trading_position()
from public, anon, authenticated;

create trigger publish_trading_equity_after_write
after insert or update on private.trading_account_snapshots
for each row execute function private.publish_trading_equity();

create trigger publish_trading_strategy_after_write
after insert or update on private.trading_strategy_versions
for each row execute function private.publish_trading_strategy();

create trigger publish_trading_run_after_write
after insert or update on private.trading_runs
for each row execute function private.publish_trading_run();

create trigger publish_trading_position_after_write
after insert or update on private.trading_positions
for each row execute function private.publish_trading_position();

-- One-time backfill after creating the projection.
insert into public.trading_public_equity(
  snapshot_id,observed_at,equity,realized_pnl,unrealized_pnl,drawdown_pct,open_positions
)
select snapshot_id,observed_at,equity,realized_pnl,unrealized_pnl,drawdown_pct,coalesce(open_positions,0)
from private.trading_account_snapshots
on conflict(snapshot_id) do nothing;

insert into public.trading_public_strategies(
  version_id,strategy_name,status,environment,hypothesis,activated_at,retired_at,created_at
)
select version_id,strategy_name,status,environment,hypothesis,activated_at,retired_at,created_at
from private.trading_strategy_versions
on conflict(version_id) do nothing;

insert into public.trading_public_runs(
  public_id,strategy_version_id,environment,status,started_at,ended_at,
  starting_equity,ending_equity,deposits,withdrawals
)
select substr(encode(extensions.digest(run_id::text,'sha256'),'hex'),1,16),
  strategy_version_id,environment,status,started_at,ended_at,
  starting_equity,ending_equity,coalesce(deposits,0),coalesce(withdrawals,0)
from private.trading_runs
on conflict(public_id) do nothing;

insert into public.trading_public_trades(
  public_id,strategy_version_id,symbol,side,opened_at,closed_at,qty,
  avg_entry_price,avg_exit_price,realized_pnl,net_pnl,exit_reason
)
select substr(encode(extensions.digest(position_id::text,'sha256'),'hex'),1,16),
  strategy_version_id,symbol,side,opened_at,closed_at,qty,
  avg_entry_price,avg_exit_price,realized_pnl,net_pnl,exit_reason
from private.trading_positions
where status='closed' and closed_at is not null
on conflict(public_id) do nothing;
