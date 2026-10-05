import { useMemo, useState } from "react";
import type { LiveTradingFeed } from "../lib/data";
import type { IrenSnapshot } from "../lib/runtime-topology";
import { ageText, displayState, stateTone, type SystemName } from "../lib/system-display";
import { buildCommandEvents, TERMINAL_SYSTEMS } from "../lib/command-events";
import SystemIcon from "./company/SystemIcon";

type Filter = "ALL" | SystemName;

export default function CommandRawLog({
  snapshot,
  feed,
  now
}: {
  snapshot: IrenSnapshot | null;
  feed?: LiveTradingFeed | null;
  now: number;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const events = useMemo(() => buildCommandEvents(snapshot, feed), [snapshot, feed]);
  const visible = filter === "ALL" ? events : events.filter(row => row.system === filter);

  return (
    <aside className={"command-raw-log" + (open ? " is-open" : "")} aria-label="Raw system event log">
      <button type="button" className="command-raw-log-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <span><i className={events.length ? "is-live" : ""} /> RAW LOG</span>
        <strong>{events.length} events</strong>
        <b>{open ? "×" : "⌁"}</b>
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
