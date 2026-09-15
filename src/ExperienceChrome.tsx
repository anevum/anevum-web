import { BookOpenText, CircleUserRound, Home, Orbit, PanelsTopLeft } from "lucide-react";
import { Link } from "./ui";

const routeNames: Record<string, string> = {
  "/": "FRONT DOOR",
  "/stories": "STORIES",
  "/stories/reply": "REPLY",
  "/wiki": "WIKI",
  "/lattice": "LATTICE",
  "/rhenlink": "RHENLINK",
  "/search": "SEARCH",
  "/transmissions": "TRANSMISSIONS",
  "/store": "STORE",
};

function routeName(pathname: string) {
  if (routeNames[pathname]) return routeNames[pathname];
  if (pathname.startsWith("/wiki/")) return "WIKI / RECORD";
  if (pathname.startsWith("/stories/")) return "STORIES";
  return "PUBLIC SURFACE";
}

export function InterfaceStrip({ pathname }: { pathname: string }) {
  return (
    <div className="interface-strip" aria-hidden="true">
      <span><i />ANEVUM / TRANSCOSMIC</span>
      <strong>{routeName(pathname)}</strong>
      <span>PUBLIC RELEASE STATE</span>
    </div>
  );
}

const portalEntries = [
  { index: "01", label: "BEGIN", title: "REPLY", note: "Start with the story", href: "/stories/reply" },
  { index: "02", label: "KNOWLEDGE", title: "WIKI", note: "Read the released record", href: "/wiki" },
  { index: "03", label: "PLACE", title: "LATTICE", note: "Move through the universe", href: "/lattice" },
] as const;

export function HomePortalRail() {
  return (
    <nav className="home-portal-rail" aria-label="Primary ANEVUM entry points">
      <div className="portal-rail-head"><span>ENTER ANEVUM</span><small>CHOOSE A SURFACE</small></div>
      {portalEntries.map((entry) => (
        <Link key={entry.href} href={entry.href} className="home-portal-link">
          <span className="portal-index">{entry.index}</span>
          <span className="portal-copy"><small>{entry.label}</small><strong>{entry.title}</strong><em>{entry.note}</em></span>
          <span className="portal-arrow">↗</span>
        </Link>
      ))}
    </nav>
  );
}

const mobileEntries = [
  { href: "/", label: "HOME", icon: Home, primary: false },
  { href: "/stories", label: "STORIES", icon: PanelsTopLeft, primary: false },
  { href: "/wiki", label: "WIKI", icon: BookOpenText, primary: false },
  { href: "/lattice", label: "LATTICE", icon: Orbit, primary: true },
  { href: "/rhenlink", label: "RHENLINK", icon: CircleUserRound, primary: false },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileDock({ pathname }: { pathname: string }) {
  return (
    <nav className="mobile-dock" aria-label="ANEVUM quick navigation">
      {mobileEntries.map((entry) => {
        const Icon = entry.icon;
        const active = isActive(pathname, entry.href);
        return (
          <Link key={entry.href} href={entry.href} className={`${active ? "active" : ""} ${entry.primary ? "primary" : ""}`}>
            <Icon size={18} strokeWidth={1.55} />
            <span>{entry.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
