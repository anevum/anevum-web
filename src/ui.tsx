import { useEffect, useId, useState, type ReactNode } from "react";
import { ArrowRight, CircleUserRound, Menu, Search, X } from "lucide-react";
import { PUBLIC_SYNC, publicObjects, type PublicObject, type VisualKey } from "./publicObjects";

export type LinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
  ariaLabel?: string;
};

const WIKI_HOST = "wiki.anevum.com";
const LATTICE_HOST = "lattice.anevum.com";
const COMMAND_HOST = "command.anevum.com";
const ROOT_HOST = "anevum.com";

function isProductionAnevumHost(hostname: string) {
  return hostname === ROOT_HOST || hostname.endsWith(".anevum.com");
}

export function resolveSystemHref(href: string) {
  if (typeof window === "undefined" || !href.startsWith("/") || href.startsWith("//")) return href;
  const host = window.location.hostname.toLowerCase();
  if (!isProductionAnevumHost(host)) return href;

  if (href === "/wiki" || href.startsWith("/wiki/")) {
    const relative = href === "/wiki" ? "/" : href.slice(5) || "/";
    return host === WIKI_HOST ? relative : `https://${WIKI_HOST}${relative}`;
  }
  if (href === "/lattice" || href.startsWith("/lattice/")) {
    const relative = href === "/lattice" ? "/" : href.slice(8) || "/";
    return host === LATTICE_HOST ? relative : `https://${LATTICE_HOST}${relative}`;
  }
  if (href === "/command" || href.startsWith("/command/")) {
    const relative = href === "/command" ? "/" : href.slice(8) || "/";
    return host === COMMAND_HOST ? relative : `https://${COMMAND_HOST}${relative}`;
  }
  if (href === "/rhenlink") return host === ROOT_HOST ? href : `https://${ROOT_HOST}/rhenlink`;

  if (href === "/" || href === "/stories" || href.startsWith("/stories/") || href === "/search" || href === "/transmissions" || href === "/store") {
    return host === ROOT_HOST ? href : `https://${ROOT_HOST}${href}`;
  }

  return href;
}

export function navigate(href: string) {
  const resolved = resolveSystemHref(href);
  const target = new URL(resolved, window.location.href);
  if (target.origin !== window.location.origin) {
    window.location.assign(target.toString());
    return;
  }
  const next = `${target.pathname}${target.search}${target.hash}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) window.history.pushState({}, "", next);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function Link({ href, className, children, onNavigate, ariaLabel }: LinkProps) {
  const resolvedHref = typeof window === "undefined" ? href : resolveSystemHref(href);
  return (
    <a
      href={resolvedHref}
      className={className}
      aria-label={ariaLabel}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(href);
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}

export function Mark() {
  return (
    <svg className="anevum-mark" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M49 12C47 35 41 56 25 81M51 12C53 35 59 56 75 81" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
      <path d="M50 28C45 49 40 63 33 73M50 28C55 49 60 63 67 73" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".46" />
      <circle cx="50" cy="80" r="4.8" fill="currentColor" />
    </svg>
  );
}

const nav = [
  ["STORIES", "/stories"],
  ["WIKI", "/wiki"],
  ["LATTICE", "/lattice"],
  ["TRANSMISSIONS", "/transmissions"],
  ["STORE", "/store"],
] as const;

export function Header({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="site-header production-header">
      <div className="header-row">
        <Link href="/" className="brand" onNavigate={() => setOpen(false)}>
          <Mark />
          <span className="brand-copy"><strong>ANEVUM</strong><small>STORIES · WORLDS · CONNECTIONS</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""}>{label}</Link>
          ))}
        </nav>
        <div className="header-tools">
          <Link href="/search" className="header-icon" ariaLabel="Search ANEVUM"><Search size={16} /></Link>
          <Link href="/rhenlink" className="rhenlink-pill"><CircleUserRound size={17} /><span>RHENLINK</span></Link>
          <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Menu">
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {[...nav, ["SEARCH", "/search"] as const, ["RHENLINK", "/rhenlink"] as const].map(([label, href]) => (
            <Link key={href} href={href} onNavigate={() => setOpen(false)}><span>{label}</span><ArrowRight size={15} /></Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export function Button({ href, children, quiet = false }: { href: string; children: ReactNode; quiet?: boolean }) {
  return <Link href={href} className={`button ${quiet ? "quiet" : ""}`}><span>{children}</span><ArrowRight size={14} /></Link>;
}

export function SyncStamp() {
  return (
    <div className="sync-stamp">
      <span>PUBLIC CANON</span>
      <strong>{publicObjects.length} RELEASED RECORDS</strong>
      <small>RECONCILED {PUBLIC_SYNC.syncedAt}</small>
    </div>
  );
}

export function VisualArt({ visualKey, className = "", label }: { visualKey: VisualKey; className?: string; label?: string }) {
  const id = useId().replace(/:/g, "");
  const isWorld = ["veyra", "ovara", "neral", "ione"].includes(visualKey);
  const isCity = ["merva", "serein", "cape", "continuance"].includes(visualKey);
  const isGate = ["skygate", "road", "connected"].includes(visualKey);
  const isField = ["grainit", "iren", "event", "deep-three"].includes(visualKey);

  return (
    <svg className={`visual-art ${className}`} data-visual={visualKey} viewBox="0 0 1200 760" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <linearGradient id={`${id}-space`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#020405" /><stop offset=".48" stopColor="#0c1317" /><stop offset="1" stopColor="#030506" /></linearGradient>
        <radialGradient id={`${id}-planet`} cx="33%" cy="25%" r="78%"><stop offset="0" stopColor="#d6ddd9" /><stop offset=".16" stopColor="#76909a" /><stop offset=".42" stopColor="#24414b" /><stop offset=".72" stopColor="#0b1a20" /><stop offset="1" stopColor="#020405" /></radialGradient>
        <radialGradient id={`${id}-warm`} cx="38%" cy="26%" r="80%"><stop offset="0" stopColor="#d9cfb2" /><stop offset=".22" stopColor="#846f50" /><stop offset=".54" stopColor="#352d25" /><stop offset="1" stopColor="#050505" /></radialGradient>
        <linearGradient id={`${id}-link`} x1="0" x2="1"><stop offset="0" stopColor="#4da8ff" stopOpacity="0" /><stop offset=".5" stopColor="#4da8ff" stopOpacity=".9" /><stop offset="1" stopColor="#4da8ff" stopOpacity="0" /></linearGradient>
        <pattern id={`${id}-grain`} width="37" height="37" patternUnits="userSpaceOnUse"><circle cx="3" cy="5" r=".9" fill="#f2efe8" fillOpacity=".16" /><circle cx="28" cy="22" r=".65" fill="#f2efe8" fillOpacity=".1" /></pattern>
        <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="22" /></filter>
      </defs>
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <rect width="1200" height="760" fill={`url(#${id}-grain)`} opacity=".72" />
      <path d="M0 620 C235 545 405 575 620 535 C835 495 1018 430 1200 465 L1200 760 L0 760Z" fill="#05090b" />
      <path d="M0 633 C260 590 438 616 650 588 C868 558 1010 518 1200 528" fill="none" stroke="#b79a5d" strokeOpacity=".12" />

      {isWorld ? <g>
        <circle cx="800" cy="340" r={visualKey === "ione" ? 214 : 304} fill={visualKey === "ovara" ? `url(#${id}-warm)` : `url(#${id}-planet)`} />
        <path d="M566 300 C650 245 732 250 800 290 C870 331 918 319 1004 270" fill="none" stroke="#e8eeec" strokeOpacity=".11" strokeWidth="22" strokeLinecap="round" />
        <path d="M575 400 C680 365 770 430 858 392 C922 364 970 374 1015 398" fill="none" stroke="#4da8ff" strokeOpacity=".1" strokeWidth="10" strokeLinecap="round" />
        <circle cx="1030" cy="118" r={visualKey === "ione" ? 18 : 34} fill="#c1c4c1" fillOpacity=".58" />
        <ellipse cx="800" cy="340" rx="330" ry="112" fill="none" stroke="#f2efe8" strokeOpacity=".08" strokeWidth="2" transform="rotate(-13 800 340)" />
      </g> : null}

      {isCity ? <g>
        <path d="M95 636 H1120" stroke="#617078" strokeOpacity=".18" />
        <path d="M124 630V495H208V630M225 630V392H304V630M326 630V470H410V630M430 630V320H518V630M538 630V438H614V630M636 630V245H724V630M744 630V356H830V630M850 630V430H932V630M954 630V285H1034V630M1056 630V482H1120" fill="none" stroke="#7e8f97" strokeOpacity=".42" strokeWidth="2" />
        <path d="M60 664 C260 590 460 680 653 617 C820 563 1012 593 1200 520" fill="none" stroke="#4da8ff" strokeOpacity=".23" strokeWidth="12" />
        <path d="M60 680 C320 650 505 720 710 667 C904 618 1030 646 1200 612" fill="none" stroke="#b79a5d" strokeOpacity=".09" strokeWidth="3" />
        {visualKey === "continuance" ? <g><rect x="710" y="120" width="138" height="510" fill="#0f171a" stroke="#718189" strokeOpacity=".5" /><rect x="737" y="74" width="82" height="556" fill="#151f23" /><line x1="778" y1="74" x2="778" y2="18" stroke="#b79a5d" strokeOpacity=".38" /></g> : null}
      </g> : null}

      {isGate ? <g>
        <circle cx="790" cy="360" r="255" fill="none" stroke="#9facb2" strokeOpacity=".18" strokeWidth="66" />
        <circle cx="790" cy="360" r="255" fill="none" stroke="#4da8ff" strokeOpacity=".5" strokeWidth="2" strokeDasharray="8 15" />
        <circle cx="790" cy="360" r="176" fill="#061017" stroke="#d6e0e4" strokeOpacity=".17" />
        <ellipse cx="790" cy="360" rx="105" ry="176" fill="none" stroke="#4da8ff" strokeOpacity=".35" />
        <path d="M520 360 H1060" stroke={`url(#${id}-link)`} strokeWidth="3" />
        {Array.from({ length: 18 }).map((_, i) => { const a = (i / 18) * Math.PI * 2; return <circle key={i} cx={790 + Math.cos(a) * 255} cy={360 + Math.sin(a) * 255} r="5" fill="#d4dde0" fillOpacity=".42" />; })}
      </g> : null}

      {isField ? <g>
        <circle cx="785" cy="365" r="280" fill="#4da8ff" fillOpacity=".04" filter={`url(#${id}-blur)`} />
        {Array.from({ length: 15 }).map((_, i) => <path key={i} d={`M160 ${150 + i * 32} C390 ${56 + i * 25}, 650 ${290 + i * 11}, 1080 ${105 + i * 37}`} fill="none" stroke={i % 4 === 0 ? "#4da8ff" : "#c6cdd0"} strokeOpacity={i % 4 === 0 ? .3 : .1} strokeWidth={i % 4 === 0 ? 2 : 1} />)}
        {visualKey === "event" ? <path d="M265 560 L430 420 L565 482 L690 250 L834 370 L1010 180" fill="none" stroke="#b79a5d" strokeOpacity=".56" strokeWidth="2" /> : null}
        {visualKey === "deep-three" ? <g><circle cx="835" cy="430" r="122" fill="none" stroke="#f2efe8" strokeOpacity=".13" /><circle cx="835" cy="430" r="70" fill="none" stroke="#4da8ff" strokeOpacity=".25" /></g> : null}
      </g> : null}

      {visualKey === "person" ? <g><circle cx="795" cy="245" r="116" fill="#1a2226" stroke="#7d9099" strokeOpacity=".28" /><path d="M540 690 C555 500 642 414 795 414 C945 414 1030 500 1048 690Z" fill="#10171a" stroke="#5e727b" strokeOpacity=".28" /><circle cx="795" cy="245" r="182" fill="none" stroke="#4da8ff" strokeOpacity=".08" /></g> : null}
      <rect x="38" y="38" width="1124" height="684" fill="none" stroke="#f2efe8" strokeOpacity=".04" />
    </svg>
  );
}

export function RecordCard({ record, compact = false }: { record: PublicObject; compact?: boolean }) {
  return (
    <Link href={record.route} className={`record-card ${compact ? "compact" : ""}`}>
      {!compact ? <VisualArt visualKey={record.visualKey} className="record-card-art" /> : null}
      <div className="record-card-copy">
        <span className="meta">{record.section} / {record.type}</span>
        <h3>{record.title}</h3>
        {!compact ? <p>{record.summary}</p> : null}
        <span className="record-state">{record.renderMode} · {record.spoilerLevel}</span>
      </div>
      <ArrowRight size={16} className="record-arrow" />
    </Link>
  );
}

export function Footer() {
  return <footer className="site-footer"><span>ANEVUM</span><span>STORIES CREATE WORLDS. PEOPLE BRING THEM TO LIFE.</span><span>DEVON AKINS</span></footer>;
}
