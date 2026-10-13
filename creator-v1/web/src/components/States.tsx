import { Link } from "react-router-dom";
import { OrbitalMark } from "./OrbitalMark";

export function LoadingState({ label = "Loading the network" }: { label?: string }) {
  return <div className="state-card" role="status"><OrbitalMark className="state-mark"/><strong>{label}</strong><span className="loading-line"/></div>;
}
export function ErrorState({ title = "The network is unavailable", detail = "ANEVUM could not load public catalogue data. This is not an empty-project result." }: { title?: string; detail?: string }) {
  return <div className="state-card state-error" role="alert"><span className="state-code">SIGNAL LOST</span><h2>{title}</h2><p>{detail}</p><Link to="/status" className="button secondary">BUILD STATUS</Link></div>;
}
export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="state-card"><span className="state-code">OPEN SPACE</span><h2>{title}</h2><p>{detail}</p></div>;
}
