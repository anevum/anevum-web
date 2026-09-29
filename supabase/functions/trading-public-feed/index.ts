import postgres from "npm:postgres@3.4.5";

const connectionString = Deno.env.get("SUPABASE_DB_URL");
if (!connectionString) throw new Error("SUPABASE_DB_URL is not configured");

const sql = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 1,
  connect_timeout: 10,
});

const corsHeaders = {
  "access-control-allow-origin": "https://anevum.com",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=4, s-maxage=4, stale-while-revalidate=8",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}

function numberOrZero(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item !== null && item !== undefined)
    .map((item) => {
      if (item instanceof Date) return item.toISOString().slice(0, 10);
      const raw = String(item);
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
        return parsed.toISOString().slice(0, 10);
      }
      return raw;
    });
}

function publicResearchEvent(row: Record<string, unknown>) {
  const payload = objectValue(row.payload);
  const classification = objectValue(payload.classification);
  const type = String(row.event_type || "research_checkpoint");
  const session = optionalString(payload.session);
  const weekStart = optionalString(payload.week_start);
  const weekEnd = optionalString(payload.week_end);
  const classificationName =
    optionalString(classification.classification) ||
    optionalString(payload.status) ||
    optionalString(payload.classification);
  const reason =
    optionalString(classification.reason) ||
    optionalString(payload.summary) ||
    optionalString(payload.conclusion);
  const nextAction =
    optionalString(payload.next_offline_research_action) ||
    optionalString(payload.next_action) ||
    optionalString(payload.focus);

  const fallbackTitle =
    type === "research_daily_report" ? `Daily review · ${session || "latest session"}` :
    type === "research_weekly_report" ? `Weekly review · ${weekEnd || "latest week"}` :
    "Research checkpoint";

  const warnings = Array.isArray(payload.data_quality_warnings)
    ? payload.data_quality_warnings
        .filter((item) => typeof item === "string")
        .filter((item) =>
          /candidate horizons are incomplete|unreconstructable|missing canonical daily reports|historical candidate/i.test(String(item))
        )
        .slice(0, 4)
    : [];

  const ads002 = objectValue(payload.ads002);
  const adsReadiness = objectValue(ads002.readiness);
  const adsConfidence = objectValue(ads002.confidence);
  const adsAttribution = objectValue(ads002.attribution);
  const publicAds002 = Object.keys(ads002).length
    ? {
        methodology_version: optionalString(ads002.methodology_version),
        readiness_state: optionalString(adsReadiness.state),
        data_valid: adsReadiness.data_valid === true,
        stable: adsReadiness.stable === true,
        confidence_score: Number.isFinite(Number(adsConfidence.score))
          ? Number(adsConfidence.score)
          : null,
        executable_signals: Number.isFinite(Number(adsAttribution.executable_signals))
          ? Number(adsAttribution.executable_signals)
          : null,
        direct_signals: Number.isFinite(Number(adsAttribution.direct_signals))
          ? Number(adsAttribution.direct_signals)
          : null,
        unlinked_signals: Number.isFinite(Number(adsAttribution.unlinked_signals))
          ? Number(adsAttribution.unlinked_signals)
          : null,
        direct_coverage: Number.isFinite(Number(adsAttribution.direct_coverage))
          ? Number(adsAttribution.direct_coverage)
          : null,
        reason_codes: safeStringArray(adsReadiness.reason_codes),
        promotion_authorized: ads002.promotion_authorized === true,
        live_configuration_changed: ads002.live_configuration_changed === true,
      }
    : null;

  return {
    at: row.occurred_at ? String(row.occurred_at) : null,
    type,
    title: optionalString(payload.title) || fallbackTitle,
    summary: reason,
    classification: classificationName,
    focus: optionalString(payload.focus) || nextAction,
    next_action: nextAction,
    session,
    week_start: weekStart,
    week_end: weekEnd,
    warnings,
    ads002: publicAds002,
  };
}

function publicDecision(row: Record<string, unknown>) {
  const evidence = objectValue(row.evidence);
  return {
    at: row.decided_at ? String(row.decided_at) : null,
    decision_key: optionalString(row.decision_key),
    status: optionalString(row.status),
    decision_type: optionalString(row.decision_type),
    subject: optionalString(row.subject),
    conclusion: optionalString(row.conclusion),
    methodology_version: optionalString(row.methodology_version),
    families: safeStringArray(evidence.families),
    observation_interval: optionalString(evidence.observation_interval),
    primary_forward_horizon_minutes:
      Number.isFinite(Number(evidence.primary_forward_horizon_minutes))
        ? Number(evidence.primary_forward_horizon_minutes)
        : null,
    implemented: evidence.implemented === true,
    executed: evidence.executed === true,
  };
}

function publicEvent(eventType: string | null, occurredAt: string | null) {
  const type = String(eventType || "system");
  const map: Record<string, { kind: string; label: string }> = {
    scan: { kind: "observe", label: "Scanner cycle evaluated the market universe." },
    allocation: { kind: "decide", label: "Allocation engine evaluated available capacity." },
    signal: { kind: "decide", label: "Decision engine evaluated a qualified setup." },
    order_intent: { kind: "risk", label: "Risk gate evaluated an execution intent." },
    execution: { kind: "execute", label: "Execution subsystem recorded market activity." },
    broker_order: { kind: "execute", label: "Broker interface recorded an order lifecycle event." },
    broker_fill: { kind: "execute", label: "Broker interface recorded a completed fill event." },
    exit: { kind: "execute", label: "Position lifecycle recorded an exit event." },
    reconciliation: { kind: "learn", label: "Broker state and internal ledger were reconciled." },
    runtime_start: { kind: "system", label: "Runtime started." },
    runtime_stop: { kind: "system", label: "Runtime stopped." },
    runtime_error: { kind: "warning", label: "Runtime reported an operational exception." },
  };
  const safe = map[type] || { kind: "system", label: "System telemetry event recorded." };
  return { at: occurredAt, type, kind: safe.kind, label: safe.label };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json(405, { ok: false, error: "method_not_allowed" });

  try {
    const [
      strategyRows,
      strategyHistoryRows,
      summaryRows,
      recentRows,
      bucketRows,
      dailyRows,
      weeklyEventRows,
      decisionRows,
      weeklyRows,
      questionRows,
      outcomeRows,
      comparisonRows,
      scanRows,
    ] = await Promise.all([
      sql.unsafe("select version_id, strategy_name, environment, status, activated_at from private.trading_strategy_versions where environment = 'live' and status = 'active' order by activated_at desc limit 1"),
      sql.unsafe("select version_id, strategy_name, environment, status, activated_at, retired_at from private.trading_strategy_versions where environment = 'live' order by coalesce(activated_at,created_at) desc limit 12"),
      sql.unsafe("select max(occurred_at) as latest_event_at, count(*) filter (where occurred_at >= now() - interval '60 minutes') as events_60m, count(*) filter (where event_type = 'scan' and occurred_at >= now() - interval '10 minutes') as scan_events_10m, count(distinct symbol) filter (where event_type = 'scan' and occurred_at >= now() - interval '10 minutes') as symbols_10m, count(*) filter (where event_type in ('execution','broker_order','broker_fill') and occurred_at >= now() - interval '2 hours') as execution_events_2h, count(*) filter (where event_type = 'reconciliation' and occurred_at >= now() - interval '2 hours') as reconciliations_2h, count(*) filter (where event_type = 'runtime_error' and occurred_at >= now() - interval '2 hours') as errors_2h from private.trading_events where occurred_at >= now() - interval '2 hours'"),
      sql.unsafe("select event_type, occurred_at from private.trading_events where occurred_at >= now() - interval '2 hours' and event_type in ('scan','allocation','signal','order_intent','execution','broker_order','broker_fill','exit','reconciliation','runtime_error','runtime_start','runtime_stop') order by occurred_at desc limit 18"),
      sql.unsafe("select date_bin(interval '10 minutes', occurred_at, timestamptz '2001-01-01') as bucket, count(*) as event_count from private.trading_events where occurred_at >= now() - interval '60 minutes' group by 1 order by 1 asc"),
      sql.unsafe("select event_type, occurred_at, payload from private.trading_events where event_type='research_daily_report' order by coalesce(nullif(payload->>'generated_at','')::timestamptz,occurred_at) desc,received_at desc limit 1"),
      sql.unsafe("select event_type, occurred_at, payload from private.trading_events where event_type='research_weekly_report' order by coalesce(nullif(payload->>'generated_at','')::timestamptz,occurred_at) desc,received_at desc limit 1"),
      sql.unsafe("select decision_key,status,decision_type,subject,conclusion,methodology_version,evidence,decided_at from private.trading_research_decisions order by decided_at desc limit 12"),
      sql.unsafe("select report_version,period_start,period_end,completeness_state,expected_sessions,included_sessions,missing_sessions,generated_at from private.trading_weekly_reports order by period_end desc,generated_at desc,created_at desc limit 1"),
      sql.unsafe("select * from (select distinct on (research_question_id) research_question_id,status,question,why_it_matters,sample_size,created_on,created_at from private.trading_research_questions order by research_question_id,created_at desc) q where status in ('OPEN','MONITOR','ACTIVE') order by created_at desc limit 8"),
      sql.unsafe("select horizon_minutes,status,count(*)::int as count from private.trading_candidate_forward_outcomes group by horizon_minutes,status order by horizon_minutes,status"),
      sql.unsafe("select coalesce(nullif(payload->>'match_state',''),'UNKNOWN') as match_state,count(*)::int as count from private.trading_events where event_type='live_offline_comparison' group by 1 order by 1"),
      sql.unsafe("select observed_at,market_session,cycle_outcome,data_status,degraded from private.trading_scan_cycles order by observed_at desc limit 1"),
    ]);


    const [performanceRows, performanceCurveRows] = await Promise.all([
      sql.unsafe(`with baseline as (
          select
            observed_at as tracking_started_at,
            equity::numeric as first_equity
          from public.trading_public_equity
          order by observed_at asc
          limit 1
        ),
        latest_equity as (
          select observed_at as last_observed_at, equity::numeric as latest_equity
          from public.trading_public_equity
          order by observed_at desc
          limit 1
        ),
        cash_flow_candidates as (
          select
            nullif(payload->'cash_flow_accounting'->>'session_date','')::date as session_date,
            nullif(payload->'cash_flow_accounting'->>'net_external_cash_flow','')::numeric as net_external_cash_flow,
            coalesce(payload->'cash_flow_accounting'->>'source','') as source,
            observed_at,
            row_number() over (
              partition by nullif(payload->'cash_flow_accounting'->>'session_date','')::date
              order by
                case when payload->'cash_flow_accounting'->>'source' = 'alpaca_account_activities' then 0 else 1 end,
                observed_at desc
            ) as rn
          from private.trading_account_snapshots
          where payload->'cash_flow_accounting'->>'session_date' is not null
            and payload->'cash_flow_accounting'->>'net_external_cash_flow' is not null
        ),
        cash_flows as (
          select
            coalesce(sum(net_external_cash_flow) filter (where rn=1),0)::numeric as net_external_cash_flow,
            count(*) filter (where rn=1 and net_external_cash_flow <> 0)::int as cash_flow_sessions
          from cash_flow_candidates
        ),
        live_trades as (
          select
            t.opened_at,
            t.closed_at,
            coalesce(t.net_pnl,t.realized_pnl,0)::numeric as pnl
          from public.trading_public_trades t
          join public.trading_public_strategies s
            on s.version_id=t.strategy_version_id
          where s.environment='live'
            and t.closed_at is not null
        ),
        realized_curve as (
          select
            closed_at,
            sum(pnl) over (
              order by closed_at
              rows between unbounded preceding and current row
            ) as cumulative_pnl
          from live_trades
        ),
        realized_drawdown as (
          select
            closed_at,
            cumulative_pnl,
            max(cumulative_pnl) over (
              order by closed_at
              rows between unbounded preceding and current row
            ) as peak_pnl
          from realized_curve
        ),
        trade_summary as (
          select
            count(*)::int as closed_trades,
            count(*) filter (where pnl > 0)::int as wins,
            count(*) filter (where pnl < 0)::int as losses,
            count(distinct (closed_at at time zone 'America/New_York')::date)::int as trading_sessions,
            min(opened_at) as first_trade_at,
            max(closed_at) as last_trade_at,
            coalesce(sum(pnl),0)::numeric as net_realized_pnl
          from live_trades
        ),
        equity_count as (
          select count(*)::int as snapshot_count
          from public.trading_public_equity
        )
        select
          b.tracking_started_at,
          le.last_observed_at,
          b.first_equity,
          le.latest_equity,
          ec.snapshot_count,
          'cash_flow_neutral_adjustment'::text as baseline_reason,
          (cf.cash_flow_sessions > 0) as external_cash_flows_present,
          ts.closed_trades,
          ts.wins,
          ts.losses,
          ts.trading_sessions,
          ts.first_trade_at,
          ts.last_trade_at,
          case
            when b.first_equity > 0
              then ((le.latest_equity - cf.net_external_cash_flow) / b.first_equity - 1) * 100
            else null
          end as account_return_pct,
          case
            when b.first_equity > 0
              then (ts.net_realized_pnl / b.first_equity) * 100
            else null
          end as realized_return_pct,
          case
            when b.first_equity > 0
              then coalesce((
                select max(greatest(peak_pnl - cumulative_pnl,0))
                from realized_drawdown
              ),0) / b.first_equity
            else null
          end as max_drawdown_fraction
        from baseline b
        cross join latest_equity le
        cross join cash_flows cf
        cross join trade_summary ts
        cross join equity_count ec`),
      sql.unsafe(`with baseline as (
          select observed_at as tracking_started_at, equity::numeric as first_equity
          from public.trading_public_equity
          order by observed_at asc
          limit 1
        ),
        live_trades as (
          select
            t.closed_at,
            coalesce(t.net_pnl,t.realized_pnl,0)::numeric as pnl
          from public.trading_public_trades t
          join public.trading_public_strategies s
            on s.version_id=t.strategy_version_id
          where s.environment='live'
            and t.closed_at is not null
        ),
        curve as (
          select
            closed_at,
            sum(pnl) over (
              order by closed_at
              rows between unbounded preceding and current row
            ) as cumulative_pnl
          from live_trades
        )
        select at, return_pct
        from (
          select b.tracking_started_at as at, 0::numeric as return_pct
          from baseline b
          union all
          select
            c.closed_at as at,
            case when b.first_equity > 0
              then (c.cumulative_pnl / b.first_equity) * 100
              else null
            end as return_pct
          from curve c
          cross join baseline b
        ) q
        order by at asc`),
    ]);

    const strategy = strategyRows[0] ?? null;
    const summary = summaryRows[0] ?? {};
    const latestEventAt = summary.latest_event_at ? String(summary.latest_event_at) : null;
    const freshnessSeconds = latestEventAt
      ? Math.max(0, (Date.now() - Date.parse(latestEventAt)) / 1000)
      : null;
    const live = freshnessSeconds != null && freshnessSeconds < 120;

    const latestDaily = dailyRows[0] ? publicResearchEvent(dailyRows[0]) : null;
    const latestWeekly = weeklyEventRows[0] ? publicResearchEvent(weeklyEventRows[0]) : null;
    const decisions = decisionRows.map((row) => publicDecision(row));
    const nextDirection =
      decisions.find((row) => row.decision_type === "next_research_direction") || null;
    const completedDecisions =
      decisions.filter((row) => row.decision_type !== "next_research_direction");
    const weekly = weeklyRows[0] ?? null;
    const missingSessions = weekly ? safeStringArray(weekly.missing_sessions) : [];
    const includedSessions = weekly ? safeStringArray(weekly.included_sessions) : [];


    const performance = performanceRows[0] ?? {};
    const closedTrades = numberOrZero(performance.closed_trades);
    const wins = numberOrZero(performance.wins);
    const losses = numberOrZero(performance.losses);
    const tradingSessions = numberOrZero(performance.trading_sessions);
    const externalCashFlowsPresent = performance.external_cash_flows_present === true || String(performance.external_cash_flows_present || "") === "true";
    const baselineReset = false;
    const sampleState =
      closedTrades >= 100 && tradingSessions >= 20
        ? "LONGER_HISTORY"
        : closedTrades >= 50 && tradingSessions >= 10
          ? "BUILDING_HISTORY"
          : "EARLY_SAMPLE";
    const accountReturnPct =
      performance.account_return_pct == null ? null : Number(performance.account_return_pct);
    const realizedReturnPct =
      performance.realized_return_pct == null ? null : Number(performance.realized_return_pct);
    const maxDrawdownPct =
      performance.max_drawdown_fraction == null
        ? null
        : Number(performance.max_drawdown_fraction) * 100;
    const winRatePct = closedTrades > 0 ? (wins / closedTrades) * 100 : null;
    const publicCurve = performanceCurveRows
      .filter((row) => row.return_pct != null)
      .map((row) => ({ at: row.at, return_pct: Number(row.return_pct) }));

    const limitations = [
      ...(missingSessions.length
        ? [`Canonical weekly reporting is ${String(weekly?.completeness_state || "PARTIAL")}; ${missingSessions.length} expected session(s) are missing a canonical daily report.`]
        : []),
      "Historical candidate telemetry is partially backfilled, so some rejected opportunities cannot be reconstructed.",
      "Some historical live-vs-offline decisions are unreconstructable where exact decision-time inputs were not retained.",
    ];

    const journal = [
      ...decisions.slice(0, 6).map((row) => ({
        at: row.at,
        type: row.decision_type,
        title: row.subject || "Research decision",
        summary: row.conclusion,
        classification: row.status,
        focus: row.subject,
        next_action: null,
        session: null,
        week_start: null,
        week_end: null,
        warnings: [],
      })),
      ...(latestWeekly ? [latestWeekly] : []),
      ...(latestDaily ? [latestDaily] : []),
    ].sort((a, b) => Date.parse(String(b.at || "")) - Date.parse(String(a.at || "")));

    return json(200, {
      ok: true,
      generated_at: new Date().toISOString(),
      source: "anevum_public_telemetry",
      live,
      freshness_seconds: freshnessSeconds,
      state: live ? "RUNNING" : latestEventAt ? "STALE" : "OFFLINE",
      active_strategy: strategy
        ? {
            version_id: strategy.version_id,
            strategy_name: strategy.strategy_name,
            environment: strategy.environment,
            status: strategy.status,
            activated_at: strategy.activated_at,
          }
        : null,
      strategy_history: strategyHistoryRows,
      telemetry: {
        events_60m: numberOrZero(summary.events_60m),
        scan_events_10m: numberOrZero(summary.scan_events_10m),
        symbols_10m: numberOrZero(summary.symbols_10m),
        execution_events_2h: numberOrZero(summary.execution_events_2h),
        reconciliations_2h: numberOrZero(summary.reconciliations_2h),
        errors_2h: numberOrZero(summary.errors_2h),
      },
      activity: bucketRows.map((row) => ({
        at: row.bucket,
        count: numberOrZero(row.event_count),
      })),
      events: recentRows.map((row) => publicEvent(row.event_type ?? null, row.occurred_at ?? null)),
      operational: {
        latest_scan: scanRows[0] ?? null,
      },
      research: {
        current_focus: nextDirection?.subject || null,
        current_status: nextDirection?.status || null,
        last_updated_at: decisions[0]?.at || latestWeekly?.at || latestDaily?.at || null,
        next_direction: nextDirection,
        completed_decisions: completedDecisions,
        active_questions: questionRows,
        latest_daily: latestDaily,
        latest_weekly: latestWeekly,
        latest_weekly_summary: weekly
          ? {
              report_version: weekly.report_version,
              period_start: weekly.period_start,
              period_end: weekly.period_end,
              completeness_state: weekly.completeness_state,
              expected_session_count: safeStringArray(weekly.expected_sessions).length,
              included_session_count: includedSessions.length,
              missing_session_count: missingSessions.length,
              included_sessions: includedSessions,
              missing_sessions: missingSessions,
              generated_at: weekly.generated_at,
            }
          : null,
        evidence: {
          candidate_forward_outcomes: outcomeRows,
          live_offline_comparison: comparisonRows,
          analytics_only: true,
        },
        limitations,
        journal,
      },

      performance: {
        methodology_version: "PUBLIC-PERFORMANCE-v3",
        basis: "cash_flow_neutral_account_plus_realized_live_trade_ledger",
        status: "TRACKING",
        sample_state: sampleState,
        tracking_started_at: performance.tracking_started_at || null,
        last_observed_at: performance.last_observed_at || null,
        first_trade_at: performance.first_trade_at || null,
        last_trade_at: performance.last_trade_at || null,
        snapshot_count: numberOrZero(performance.snapshot_count),
        trading_sessions: tradingSessions,
        closed_trades: closedTrades,
        wins,
        losses,
        win_rate_pct: winRatePct,
        account_return_pct: accountReturnPct,
        realized_return_pct: realizedReturnPct,
        max_drawdown_pct: maxDrawdownPct,
        external_cash_flows_present: externalCashFlowsPresent,
        baseline_reason: performance.baseline_reason || null,
        baseline_reset: baselineReset,
        curve: publicCurve,
        limitations: [
          "This is a short live sample and is not evidence of future performance.",
          "Dollar account values, symbols, prices, quantities, orders, fills, and individual trade records are excluded from the public feed.",
          "Tracked-account return removes external cash flows before normalization; deposits and withdrawals do not count as trading performance.",
          "The plotted curve and drawdown are derived from cumulative realized live-trade P&L, so owner cash movements cannot create artificial spikes.",
        ],
      },
      disclosure: {
        level: "sanitized",
        public_fields: [
          "runtime state",
          "active strategy identity",
          "telemetry freshness",
          "aggregate activity",
          "anonymized event classes",
          "sanitized research decisions",
          "sanitized evidence availability",
          "sanitized strategy history",
          "normalized live performance percentages",
          "normalized public performance curve",
        ],
        excluded_fields: [
          "account value",
          "cash",
          "buying power",
          "deposits and withdrawals",
          "symbols",
          "prices",
          "quantities",
          "orders and fills",
          "individual trade records",
          "strategy thresholds and risk parameters",
        ]
      }
    });
  } catch (error) {
    console.error("public_feed_failed", error);
    return json(500, { ok: false, error: "public_feed_failed" });
  }
});
