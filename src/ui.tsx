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
  if (href === "/lattice" || href.startsWith("/lattice/") || href === "/command" || href.startsWith("/command/") || href === "/rhenlink") {
    return host === ROOT_HOST ? href : `https://${ROOT_HOST}${href}`;
  }

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
  const isGate = ["skygate", "road"].includes(visualKey);
  const isConnection = visualKey === "connected";
  const isField = ["grainit", "iren", "event", "deep-three"].includes(visualKey);
  const warm = visualKey === "ovara" || visualKey === "event";

  const stars = Array.from({ length: 56 }, (_, index) => ({
    x: 22 + ((index * 173) % 1154),
    y: 18 + ((index * 97) % 470),
    r: index % 11 === 0 ? 1.8 : index % 4 === 0 ? 1.1 : .65,
    o: index % 5 === 0 ? .62 : .29,
  }));

  return (
    <svg className={`visual-art ${className}`} data-visual={visualKey} viewBox="0 0 1200 760" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <linearGradient id={`${id}-space`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#010407" /><stop offset=".46" stopColor="#07131a" /><stop offset="1" stopColor="#020609" /></linearGradient>
        <radialGradient id={`${id}-planet`} cx="31%" cy="23%" r="79%"><stop offset="0" stopColor="#e1ece9" /><stop offset=".12" stopColor="#9eb7bd" /><stop offset=".31" stopColor="#446c78" /><stop offset=".55" stopColor="#173442" /><stop offset=".77" stopColor="#08151c" /><stop offset="1" stopColor="#010305" /></radialGradient>
        <radialGradient id={`${id}-warm`} cx="31%" cy="22%" r="80%"><stop offset="0" stopColor="#f2dec0" /><stop offset=".18" stopColor="#b8986c" /><stop offset=".43" stopColor="#5b4735" /><stop offset=".72" stopColor="#1c1715" /><stop offset="1" stopColor="#020304" /></radialGradient>
        <radialGradient id={`${id}-moon`} cx="34%" cy="28%" r="76%"><stop offset="0" stopColor="#d5d7d3" /><stop offset=".34" stopColor="#777f80" /><stop offset=".72" stopColor="#232a2e" /><stop offset="1" stopColor="#050709" /></radialGradient>
        <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#fff6de" /><stop offset=".12" stopColor="#f3c98f" stopOpacity=".9" /><stop offset=".45" stopColor="#b57b45" stopOpacity=".22" /><stop offset="1" stopColor="#b57b45" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-terrain`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#17242b" /><stop offset=".42" stopColor="#0b1216" /><stop offset="1" stopColor="#020405" /></linearGradient>
        <linearGradient id={`${id}-water`} x1="0" x2="1"><stop offset="0" stopColor="#07131a" /><stop offset=".47" stopColor="#17313c" /><stop offset=".73" stopColor="#243d43" /><stop offset="1" stopColor="#0a151a" /></linearGradient>
        <linearGradient id={`${id}-link`} x1="0" x2="1"><stop offset="0" stopColor="#6fc0ff" stopOpacity="0" /><stop offset=".5" stopColor="#9bd4ff" stopOpacity=".76" /><stop offset="1" stopColor="#6fc0ff" stopOpacity="0" /></linearGradient>
        <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="14" /></filter>
        <filter id={`${id}-soft`}><feGaussianBlur stdDeviation="4" /></filter>
        <pattern id={`${id}-grain`} width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="3" cy="5" r=".7" fill="#fff" fillOpacity=".05" /><circle cx="20" cy="17" r=".5" fill="#fff" fillOpacity=".035" /></pattern>
      </defs>

      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      {stars.map((star, index) => <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#edf6f7" fillOpacity={star.o} />)}
      <rect width="1200" height="760" fill={`url(#${id}-grain)`} opacity=".8" />

      {isWorld ? <g>
        <circle cx="816" cy="328" r={visualKey === "ione" ? 218 : 315} fill={warm ? `url(#${id}-warm)` : `url(#${id}-planet)`} />
        <circle cx="816" cy="328" r={visualKey === "ione" ? 220 : 318} fill="none" stroke="#a6dbf2" strokeOpacity=".11" strokeWidth="8" />
        <path d="M574 243 C656 210 706 247 762 238 C829 227 867 179 945 200 C1001 216 1034 256 1070 279" fill="none" stroke="#f4f8f5" strokeOpacity=".14" strokeWidth="27" strokeLinecap="round" filter={`url(#${id}-soft)`} />
        <path d="M566 344 C644 307 700 335 760 358 C825 384 900 361 967 329 C1010 308 1042 319 1081 338" fill="none" stroke="#eff7f6" strokeOpacity=".12" strokeWidth="18" strokeLinecap="round" filter={`url(#${id}-soft)`} />
        <path d="M628 439 C698 406 766 421 827 447 C896 477 961 457 1034 414" fill="none" stroke="#c7e6ef" strokeOpacity=".09" strokeWidth="12" strokeLinecap="round" />
        <circle cx="1048" cy="130" r={visualKey === "ione" ? 24 : 46} fill={`url(#${id}-moon)`} />
      </g> : null}

      {isConnection ? <g>
        <circle cx="847" cy="310" r="228" fill={`url(#${id}-planet)`} opacity=".95" />
        <circle cx="1037" cy="185" r="48" fill={`url(#${id}-moon)`} />
        <g opacity=".6">
          <ellipse cx="778" cy="326" rx="342" ry="162" fill="none" stroke="#87bcd3" strokeOpacity=".15" transform="rotate(-12 778 326)" />
          <ellipse cx="778" cy="326" rx="420" ry="218" fill="none" stroke="#87bcd3" strokeOpacity=".09" transform="rotate(9 778 326)" />
          <circle cx="455" cy="389" r="17" fill="#aac4ce" /><circle cx="642" cy="165" r="10" fill="#e4c697" /><circle cx="1080" cy="421" r="13" fill="#aac4ce" />
          <path d="M455 389 C548 312 602 217 642 165 M642 165 C710 202 766 234 847 310 M847 310 C930 350 997 392 1080 421" fill="none" stroke="#78b9e5" strokeOpacity=".33" strokeWidth="2" />
        </g>
      </g> : null}

      {isGate ? <g opacity=".9">
        <circle cx="840" cy="322" r="249" fill="none" stroke="#60727a" strokeOpacity=".14" strokeWidth="72" />
        <circle cx="840" cy="322" r="249" fill="none" stroke="#9fc1cf" strokeOpacity=".22" strokeWidth="3" />
        <circle cx="840" cy="322" r="205" fill="#07131a" />
        <circle cx="840" cy="322" r="163" fill={`url(#${id}-planet)`} opacity=".72" />
        <path d="M588 322H1092" stroke={`url(#${id}-link)`} strokeWidth="2" opacity=".35" />
        <g fill="#b7c7cd" fillOpacity=".2">{Array.from({ length: 20 }).map((_, i) => { const a = (i / 20) * Math.PI * 2; return <rect key={i} x={836 + Math.cos(a) * 249} y={318 + Math.sin(a) * 249} width="8" height="8" rx="1" transform={`rotate(${i * 18} ${840 + Math.cos(a) * 249} ${322 + Math.sin(a) * 249})`} />; })}</g>
      </g> : null}

      {isCity ? <g>
        <circle cx="886" cy="210" r="170" fill={`url(#${id}-planet)`} opacity=".38" />
        <path d="M0 550 C180 482 321 526 455 487 C638 434 752 489 913 454 C1021 430 1103 395 1200 382 L1200 760 L0 760Z" fill={`url(#${id}-terrain)`} />
        <path d="M0 625 C192 588 302 615 447 590 C602 564 724 607 860 580 C1004 551 1081 527 1200 516 L1200 760 L0 760Z" fill="#030608" />
        <path d="M48 624 C210 584 337 626 481 587 C617 551 744 587 881 552 C989 525 1087 526 1190 494" fill="none" stroke="#7fbbe2" strokeOpacity=".18" strokeWidth="5" />
        <g fill="#111a1f" stroke="#75909b" strokeOpacity=".18">
          <path d="M276 594l16-118 24-18 18 136z" /><path d="M355 602l20-184 31-12 13 192z" /><path d="M452 586l18-92 34-28 21 115z" /><path d="M554 574l25-212 36-22 24 226z" /><path d="M672 572l17-146 34-24 26 166z" /><path d="M775 558l22-105 30-20 19 119z" />
        </g>
      </g> : null}

      {isField ? <g>
        <circle cx="810" cy="340" r="275" fill="#67b9eb" fillOpacity=".055" filter={`url(#${id}-glow)`} />
        {Array.from({ length: 14 }).map((_, i) => <path key={i} d={`M110 ${145 + i * 35} C350 ${62 + i * 26}, 648 ${274 + i * 12}, 1125 ${104 + i * 39}`} fill="none" stroke={i % 4 === 0 ? "#7bc8ff" : "#b8c8cf"} strokeOpacity={i % 4 === 0 ? .25 : .075} strokeWidth={i % 4 === 0 ? 2 : 1} />)}
        {visualKey === "event" ? <path d="M212 574 L385 448 L534 494 L681 275 L836 389 L1043 198" fill="none" stroke="#c6a46d" strokeOpacity=".5" strokeWidth="2" /> : null}
        {visualKey === "deep-three" ? <g><circle cx="834" cy="427" r="125" fill="none" stroke="#e9eeee" strokeOpacity=".12" /><circle cx="834" cy="427" r="72" fill="none" stroke="#76c1f5" strokeOpacity=".24" /></g> : null}
      </g> : null}

      {visualKey === "person" ? <g>
        <circle cx="812" cy="251" r="111" fill="#151d21" stroke="#80929a" strokeOpacity=".22" />
        <path d="M554 695 C573 504 664 414 812 414 C960 414 1048 504 1067 695Z" fill="#0c1215" stroke="#657982" strokeOpacity=".23" />
        <circle cx="812" cy="251" r="176" fill="none" stroke="#70bdf0" strokeOpacity=".075" />
      </g> : null}

      {!isCity ? <g>
        <path d="M0 603 C150 545 274 590 390 536 C497 486 609 526 718 506 C831 485 940 429 1044 452 C1101 465 1153 451 1200 428 L1200 760 L0 760Z" fill={`url(#${id}-terrain)`} />
        <path d="M0 655 C174 625 318 657 474 621 C626 586 734 620 884 587 C1016 558 1101 559 1200 534 L1200 760 L0 760Z" fill="#020405" />
        <path d="M0 614 C146 579 270 613 405 570 C543 526 663 552 798 537 C940 521 1059 467 1200 470" fill="none" stroke="#c2a875" strokeOpacity=".095" strokeWidth="2" />
        <ellipse cx="856" cy="612" rx="332" ry="44" fill={`url(#${id}-water)`} opacity=".38" />
        <circle cx="1090" cy="484" r="120" fill={`url(#${id}-sun)`} opacity=".5" />
      </g> : null}

      <rect x="25" y="25" width="1150" height="710" fill="none" stroke="#e7efef" strokeOpacity=".035" />
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
