import type { SVGProps } from "react";

export type UiIconName =
  "overview" | "trading" | "research" | "system" | "account" | "market-session" |
  "scanner" | "orders" | "positions" | "performance" | "strategy" | "risk" |
  "broker" | "evidence" | "telemetry" | "freshness" | "incident" | "job" |
  "objective" | "schedule" | "logs" | "experiment" | "validation" | "promotion" |
  "blocked" | "prompt" | "copy" | "handoff" | "refresh" | "external" | "private";

type Props = SVGProps<SVGSVGElement> & { name: UiIconName; decorative?: boolean };

function Glyph({ name }: { name: UiIconName }) {
  switch (name) {
    case "overview": return <><rect x="4" y="4" width="6" height="6" rx="1.4"/><rect x="14" y="4" width="6" height="6" rx="1.4"/><rect x="4" y="14" width="6" height="6" rx="1.4"/><rect x="14" y="14" width="6" height="6" rx="1.4"/></>;
    case "trading": return <><path d="M4 17l4-5 4 3 7-9"/><path d="M15 6h4v4"/></>;
    case "research": return <><circle cx="9" cy="9" r="4"/><path d="M12 12l7 7M15 5h4M17 3v4"/></>;
    case "system": return <><rect x="4" y="5" width="16" height="4" rx="1.4"/><rect x="4" y="10" width="16" height="4" rx="1.4"/><rect x="4" y="15" width="16" height="4" rx="1.4"/><circle cx="7" cy="7" r=".8" fill="currentColor" stroke="none"/><circle cx="7" cy="12" r=".8" fill="currentColor" stroke="none"/><circle cx="7" cy="17" r=".8" fill="currentColor" stroke="none"/></>;
    case "account": return <><rect x="4" y="6" width="16" height="13" rx="2.5"/><path d="M4 10h16M8 15h4"/><circle cx="16.5" cy="14.5" r="1.3"/></>;
    case "market-session": return <><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3.5 2M4 12h2M18 12h2"/></>;
    case "scanner": return <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3M12 12l5-4"/></>;
    case "orders": return <><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h5M10 12h6M10 16h6"/></>;
    case "positions": return <><path d="M5 8l7-4 7 4-7 4z"/><path d="M5 12l7 4 7-4M5 16l7 4 7-4"/></>;
    case "performance": return <><path d="M4 19V5M4 19h16"/><path d="M7 15l4-4 3 2 5-6"/><circle cx="19" cy="7" r="1" fill="currentColor" stroke="none"/></>;
    case "strategy": return <><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 6h10M6.5 7.5l4.2 8M17.5 7.5l-4.2 8"/></>;
    case "risk": return <><path d="M12 3l7 3v5c0 4.5-2.7 7.7-7 10-4.3-2.3-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-5"/></>;
    case "broker": return <><path d="M8 8l-2-2a3 3 0 014-4l3 3M16 16l2 2a3 3 0 01-4 4l-3-3"/><path d="M9 15l6-6M7 17l10-10"/></>;
    case "evidence": return <><path d="M12 3l7 9-7 9-7-9z"/><path d="M8.5 12h7M10 9h4M10 15h4"/></>;
    case "telemetry": return <><path d="M3 13h3l2-5 4 10 3-7 2 2h4"/><path d="M4 5h16M4 21h16" opacity={0.45}/></>;
    case "freshness": return <><circle cx="12" cy="12" r="8"/><path d="M12 7v5l4 2"/><path d="M6 4l-2 2M18 4l2 2"/></>;
    case "incident": return <><path d="M12 3l9 17H3z"/><path d="M12 9v5M12 17h.01"/></>;
    case "job": return <><path d="M12 3l7 5v8l-7 5-7-5V8z"/><path d="M9 12h6M12 9v6"/></>;
    case "objective": return <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><path d="M17.5 6.5L21 3"/></>;
    case "schedule": return <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16M8 13h3M13 13h3M8 16h3"/></>;
    case "logs": return <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/></>;
    case "experiment": return <><path d="M9 3h6M10 3v6l-5 9a2 2 0 001.7 3h10.6a2 2 0 001.7-3l-5-9V3"/><path d="M8 15h8"/></>;
    case "validation": return <><path d="M12 3l7 3v5c0 4.5-2.7 7.7-7 10-4.3-2.3-7-5.5-7-10V6z"/><path d="M8.5 12l2.2 2.2 4.8-5"/></>;
    case "promotion": return <><path d="M5 19h14M7 19V8h10v11M9 8V5h6v3"/><path d="M12 15V5M9 8l3-3 3 3"/></>;
    case "blocked": return <><circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/></>;
    case "prompt": return <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/><path d="M17 7h.01"/></>;
    case "copy": return <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/></>;
    case "handoff": return <><path d="M4 7h11M12 4l3 3-3 3M20 17H9M12 14l-3 3 3 3"/></>;
    case "refresh": return <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.2 9A7 7 0 006.3 6.3L4 9M5.8 15A7 7 0 0017.7 17.7L20 15"/></>;
    case "external": return <><path d="M13 5h6v6M19 5l-8 8"/><path d="M10 7H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5"/></>;
    case "private": return <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/><circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none"/><path d="M12 16.2v2"/></>;
  }
}

export default function UiIcon({ name, decorative = true, className = "", ...props }: Props) {
  return <svg className={"ui-icon " + className} viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden={decorative || undefined} aria-label={decorative ? undefined : props["aria-label"] || name.replaceAll("-", " ")} {...props}><Glyph name={name} /></svg>;
}
