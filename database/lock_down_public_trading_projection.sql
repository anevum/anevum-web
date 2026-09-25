-- ANEVUM public data boundary hardening
-- Applied to Supabase project mfntzxheldzdvlokyntk on 2026-09-25.
--
-- Public visitors now receive only the intentionally sanitized
-- trading-public-feed Edge Function payload. The older public
-- projection tables remain as historical/internal data stores but
-- are not directly readable by anon or authenticated browser roles.

revoke all on table
  public.trading_public_equity,
  public.trading_public_strategies,
  public.trading_public_runs,
  public.trading_public_trades
from anon, authenticated;

drop policy if exists trading_public_equity_read on public.trading_public_equity;
drop policy if exists trading_public_strategies_read on public.trading_public_strategies;
drop policy if exists trading_public_runs_read on public.trading_public_runs;
drop policy if exists trading_public_trades_read on public.trading_public_trades;

-- Verification examples:
-- select has_table_privilege('anon','public.trading_public_equity','select');
-- select has_table_privilege('authenticated','public.trading_public_trades','select');
-- Both should be false.
