import { Link } from "react-router-dom";
import SystemIcon from "./company/SystemIcon";
import type { LiveTradingFeed, PublicSystemState } from "../lib/data";
import "../styles/public-system-status.css";

const SYSTEMS = ["IREN", "RHEN", "GRAEN", "NOSTRA", "VELUM"] as const;
type SystemName = typeof SYSTEMS[number];

function tone(row?: PublicSystemState) {
  const state = String(row?.health_state || row?.runtime_state || "UNKNOWN").toUpperCase();
  if (["HEALTHY", "RUNNING", "READY", "COMPLETE", "IDLE"].includes(state)) return "good";
  if (["FAILED", "OFFLINE", "CRITICAL", "STALE", "ATTENTION_REQUIRED"].includes(state)) return "bad";
  return "warn";
}

function age(value?: string | null) {
  if (!value) return "NO TIMESTAMP";
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return "INVALID TIME";
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return seconds + "S AGO";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "M AGO";
  return Math.floor(minutes / 60) + "H AGO";
}

export default function PublicSystemStatus({ data }: { data?: LiveTradingFeed | null }) {
  return (
    <section className="public-system-status" aria-label="ANEVUM system status">
      <header>
        <div><span>LIVE SYSTEM MAP</span><strong>One machine. Five independently observed systems.</strong></div>
        <small>{data?.generated_at ? "FEED " + age(data.generated_at) : "CONNECTING"}</small>
      </header>
      <div className="public-system-status-grid">
        {SYSTEMS.map((name: SystemName) => {
          const row = data?.systems?.[name];
          const state = String(row?.health_state || row?.runtime_state || "UNKNOWN").toUpperCase();
          return (
            <Link className={"public-system-status-card " + tone(row)} to={"/products/" + name.toLowerCase()} key={name}>
              <div className="public-system-status-card-head">
                <SystemIcon system={name} size="sm" />
                <span><i />{state}</span>
              </div>
              <strong>{name}</strong>
              <p>{row?.activity || "Awaiting canonical subsystem activity."}</p>
              <small>{age(row?.observed_at)}</small>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
