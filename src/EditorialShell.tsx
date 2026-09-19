import { useEffect, useState, type ReactNode } from "react";
import { CircleUserRound, Menu, Search, X } from "lucide-react";
import { Link, Mark } from "./ui";
import type { SystemSurface } from "./SystemShell";

type PublicSurface = Exclude<SystemSurface, "command">;

const primary = [
  ["HOME", "/"],
  ["STORIES", "/stories"],
  ["EXPLORE", "/explore"],
  ["ARCHIVE", "/archive"],
  ["TRANSMISSIONS", "/transmissions"],
  ["STORE", "/store"],
] as const;

const surfaceCopy: Record<PublicSurface, { label: string; subtitle: string; nav: readonly (readonly [string, string])[] }> = {
  anevum: {
    label: "ANEVUM",
    subtitle: "A UNIVERSE IN STORY.",
    nav: [["PUBLIC WIKI", "/wiki"], ["LATTICE", "/lattice"], ["SEARCH", "/search"]],
  },
  stories: {
    label: "ANEVUM / STORIES",
    subtitle: "STORIES CREATE WORLDS. PEOPLE BRING THEM TO LIFE.",
    nav: [["ALL STORIES", "/stories"], ["REPLY", "/stories/reply"], ["UNIVERSE", "/lattice"]],
  },
  wiki: {
    label: "WIKI.ANEVUM",
    subtitle: "THE PUBLIC RECORD",
    nav: [["BROWSE", "/wiki"], ["CONTRIBUTE", "/wiki/new"], ["SAVED", "/wiki/saved"]],
  },
  lattice: {
    label: "LATTICE.ANEVUM",
    subtitle: "THE UNIVERSE AS A PLACE",
    nav: [["EXPLORE", "/lattice"], ["WIKI", "/wiki"], ["RHENLINK", "/rhenlink"]],
  },
  rhenlink: {
    label: "RHENLINK",
    subtitle: "YOUR PERSISTENT IDENTITY",
    nav: [["PROFILE", "/rhenlink"], ["LATTICE", "/lattice"], ["WIKI", "/wiki"]],
  },
};

function routeActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/wiki") return pathname === "/wiki" || pathname.startsWith("/wiki/") || (window.location.hostname === "wiki.anevum.com" && pathname !== "/rhenlink");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EditorialShell({ surface, pathname, children }: { surface: PublicSurface; pathname: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const meta = surfaceCopy[surface];

  useEffect(() => setOpen(false), [pathname, surface]);

  return (
    <div className={`editorial-shell editorial-surface-${surface}`}>
      <header className="editorial-header">
        <div className="editorial-masthead">
          <Link href="/" className="editorial-brand" ariaLabel="ANEVUM home">
            <Mark />
            <span className="editorial-wordmark"><strong>ANEVUM</strong><small>A UNIVERSE IN STORY.</small></span>
          </Link>
          <div className="editorial-manifesto"><span>STORY → DISCOVERY → DEPTH → RELATIONSHIP</span><small>INDEPENDENT PUBLISHER · STORY UNIVERSE</small></div>
          <nav className="editorial-primary-nav" aria-label="Primary navigation">
            {primary.map(([label, href]) => <Link key={href} href={href} className={routeActive(pathname, href) ? "active" : ""}>{label}</Link>)}
          </nav>
          <div className="editorial-tools">
            <Link href="/search" className="editorial-icon-link" ariaLabel="Search ANEVUM"><Search size={17} strokeWidth={1.45} /></Link>
            <Link href="/rhenlink" className="editorial-rhenlink"><CircleUserRound size={18} strokeWidth={1.35} /><span>RHENLINK</span></Link>
            <button className="editorial-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Open navigation">
              {open ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        <div className="editorial-surfacebar">
          <div className="editorial-surface-title"><strong>{meta.label}</strong><span>{meta.subtitle}</span></div>
          <nav className="editorial-surface-nav" aria-label={`${meta.label} navigation`}>
            {meta.nav.map(([label, href]) => <Link key={`${surface}-${href}-${label}`} href={href} className={routeActive(pathname, href) ? "active" : ""}>{label}</Link>)}
          </nav>
        </div>

        {open ? (
          <nav className="editorial-mobile-nav" aria-label="Mobile navigation">
            {primary.map(([label, href]) => <Link key={`mobile-${href}`} href={href}><span>{label}</span><i>↗</i></Link>)}
            <Link href="/search"><span>SEARCH</span><i>↗</i></Link>
            <Link href="/rhenlink"><span>RHENLINK</span><i>↗</i></Link>
          </nav>
        ) : null}
      </header>

      <div className="editorial-page">{children}</div>

      <footer className="editorial-footer">
        <span>KNOWLEDGE CONNECTS US.</span>
        <div><strong>ANEVUM</strong><small>THE UNIVERSE REMEMBERS.</small></div>
        <span>PEOPLE BRING WORLDS TO LIFE.</span>
      </footer>
    </div>
  );
}
