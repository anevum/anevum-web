import { useMemo, useState } from "react";
import type { CommandSnapshot, LiveTradingFeed } from "../lib/data";
import type { IrenSnapshot } from "../lib/runtime-topology";
import { ageText, displayState, stateTone, type SystemName } from "../lib/system-display";
import { buildCommandEvents, TERMINAL_SYSTEMS } from "../lib/command-events";
import { significantRuntimeHistory } from "../lib/reconciliation-visibility";
import SystemIcon from "./company/SystemIcon";
import UiIcon from "./UiIcon";

type Filter = "ALL" | SystemName;

export default function CommandRawLog({
  snapshot,
  feed,
  tradingSnapshot,
  now
}: {
  snapshot: IrenSnapshot | null;
  feed?: LiveTradingFeed | null;
  tradingSnapshot?: CommandSnapshot | null;
  now: number;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const events = useMemo(() => {
    const base = buildCommandEvents(snapshot, feed);
    const rows = [...base];
    const append = (
      source: string,
      history: Record<string, unknown>[] | undefined,
      prefix: string
    ) => {
      for (const [index, event] of (prefix === "equity" ? significantRuntimeHistory(history || []) : (history || [])).entries()) {
        rows.push({
          id: prefix + "-" + String(event.at || index) + "-" + index,
          at: typeof event.at === "string" ? event.at : null,
          system: "RHEN" as const,
          source,
          state: typeof event.action === "string" ? event.action : typeof event.kind === "string" ? event.kind : "EVENT",
          title: [
            typeof event.symbol === "string" ? event.symbol : "",
            typeof event.action === "string" ? event.action.toUpperCase() : typeof event.kind === "string" ? event.kind.replaceAll("_", " ").toUpperCase() : "EVENT"
          ].filter(Boolean).join(" · "),
          detail: typeof event.reason === "string"
            ? event.reason
            : typeof event.message === "string"
              ? event.message
              : null
        });
      }
    };
    append("EQUITY RUNTIME", tradingSnapshot?.history, "equity");
    append("CRYPTO LIVE", tradingSnapshot?.crypto_live?.history, "crypto-live");
    append("CRYPTO PAPER", tradingSnapshot?.crypto_paper?.history, "crypto-paper");
    return rows.sort((a, b) => (Date.parse(b.at || "") || 0) - (Date.parse(a.at || "") || 0));
  }, [snapshot, feed, tradingSnapshot]);
  const visible = filter === "ALL" ? events : events.filter(row => row.system === filter);

  return (
    <aside className={"command-raw-log" + (open ? " is-open" : "")} aria-label="Raw system event log">
      <button type="button" className="command-raw-log-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <span><i className={events.length ? "is-live" : ""} /> RAW LOG</span>
        <strong>{events.length} events</strong>
        <b><UiIcon name="logs" /></b>
      </button>
      {open && (
        <div className="command-raw-log-drawer">
          <header>
            <div><span>CANONICAL EVENT STREAM</span><strong>Runtime, work, research, control, telemetry</strong></div>
            <nav>
              {(["ALL", ...TERMINAL_SYSTEMS] as Filter[]).map(item => (
                <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>
              ))}
            </nav>
          </header>
          <div className="command-raw-log-head"><span>TIME</span><span>SYSTEM</span><span>SOURCE</span><span>EVENT</span></div>
          <ol>
            {visible.length ? visible.slice(0, 120).map(row => (
              <li key={row.id} className={"tone-" + stateTone(row.state)}>
                <time>{row.at ? new Date(row.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}</time>
                <span><SystemIcon system={row.system} size="xs" /><b>{row.system}</b></span>
                <small>{row.source}</small>
                <div><strong>{row.title}</strong>{row.detail && <p>{row.detail}</p>}<em>{displayState(row.state)} · {ageText(row.at, now)}</em></div>
              </li>
            )) : <li className="command-empty">No canonical events for this filter.</li>}
          </ol>
        </div>
      )}
    </aside>
  );
}
