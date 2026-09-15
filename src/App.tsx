import { useEffect, useMemo, useState } from "react";
import { FrontDoor, NotFound, Reply, SearchPage, Store, Stories, Transmissions } from "./PublicPages";
import { Lattice, Rhenlink } from "./MemberPages";
import { AchievementLayer } from "./MemberChrome";
import { trackMemberRoute } from "./memberState";
import { CommandHome } from "./CommandPage";
import { UnifiedSystemShell, type SystemSurface } from "./SystemShell";
import { AuthBridgePage, SystemSessionBridge } from "./AuthBridge";
import {
  ModeratedWikiArticle,
  ModeratedWikiHome,
  WikiAdminPage,
  WikiContributionPage,
  WikiMissing,
  WikiSavedPage,
} from "./ModeratedWiki";

const ROOT_HOST = "anevum.com";
const WIKI_HOST = "wiki.anevum.com";
const LATTICE_HOST = "lattice.anevum.com";
const COMMAND_HOST = "command.anevum.com";

function useLocationState() {
  const [location, setLocation] = useState(() => ({ pathname: window.location.pathname, hostname: window.location.hostname.toLowerCase() }));

  useEffect(() => {
    const sync = () => setLocation({ pathname: window.location.pathname, hostname: window.location.hostname.toLowerCase() });
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return location;
}

function wikiSlug(pathname: string, wikiHost: boolean) {
  const prefix = wikiHost ? "" : "/wiki";
  const relative = prefix ? pathname.slice(prefix.length) : pathname;
  const match = relative.match(/^\/([^/]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

function wikiEditSlug(pathname: string, wikiHost: boolean) {
  const prefix = wikiHost ? "" : "/wiki";
  const relative = prefix ? pathname.slice(prefix.length) : pathname;
  const match = relative.match(/^\/([^/]+)\/edit\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

function isWikiPath(pathname: string) {
  return pathname === "/wiki" || pathname.startsWith("/wiki/");
}

function surfaceFor(pathname: string, hostname: string): SystemSurface {
  if (pathname === "/rhenlink") return "rhenlink";
  if (pathname === "/stories" || pathname.startsWith("/stories/")) return "stories";
  if (isWikiPath(pathname)) return "wiki";
  if (pathname === "/lattice") return "lattice";
  if (pathname === "/command") return "command";
  if (hostname === COMMAND_HOST) return "command";
  if (hostname === WIKI_HOST) return "wiki";
  if (hostname === LATTICE_HOST) return "lattice";
  return "anevum";
}

function WikiRoute({ pathname, wikiHost }: { pathname: string; wikiHost: boolean }) {
  const root = wikiHost ? pathname === "/" || pathname === "/wiki" || pathname === "/search" : pathname === "/wiki";
  if (root) return <ModeratedWikiHome />;
  if (pathname === (wikiHost ? "/new" : "/wiki/new")) return <WikiContributionPage />;
  if (pathname === (wikiHost ? "/admin" : "/wiki/admin")) return <WikiAdminPage />;
  if (pathname === (wikiHost ? "/saved" : "/wiki/saved")) return <WikiSavedPage />;
  const editSlug = wikiEditSlug(pathname, wikiHost);
  if (editSlug) return <WikiContributionPage editSlug={editSlug} />;
  const slug = wikiHost ? wikiSlug(pathname, true) : pathname.startsWith("/wiki/") ? wikiSlug(pathname, false) : "";
  return slug ? <ModeratedWikiArticle slug={slug} /> : <WikiMissing />;
}

function Route({ pathname, hostname }: { pathname: string; hostname: string }) {
  const wikiHost = hostname === WIKI_HOST;
  const latticeHost = hostname === LATTICE_HOST;
  const commandHost = hostname === COMMAND_HOST;

  if (commandHost) {
    if (pathname === "/" || pathname === "/command") return <CommandHome />;
    if (pathname === "/wiki" || pathname === "/wiki/admin") return <WikiAdminPage />;
    if (pathname === "/rhenlink") return <Rhenlink />;
    if (pathname === "/lattice") return <Lattice />;
    if (pathname === "/stories" || pathname === "/stories/reply") return pathname === "/stories" ? <Stories /> : <Reply />;
    return <CommandHome />;
  }

  if (wikiHost) {
    if (pathname === "/rhenlink") return <Rhenlink />;
    return <WikiRoute pathname={pathname} wikiHost />;
  }

  if (latticeHost) {
    if (pathname === "/" || pathname === "/lattice") return <Lattice />;
    if (pathname === "/rhenlink") return <Rhenlink />;
    if (isWikiPath(pathname)) return <WikiRoute pathname={pathname} wikiHost={false} />;
    if (pathname === "/stories") return <Stories />;
    if (pathname === "/stories/reply") return <Reply />;
    if (pathname === "/search") return <SearchPage />;
    return <Lattice />;
  }

  if (pathname === "/") return <FrontDoor />;
  if (pathname === "/stories") return <Stories />;
  if (pathname === "/stories/reply") return <Reply />;
  if (isWikiPath(pathname)) return <WikiRoute pathname={pathname} wikiHost={false} />;
  if (pathname === "/lattice") return <Lattice />;
  if (pathname === "/rhenlink") return <Rhenlink />;
  if (pathname === "/command") return <CommandHome />;
  if (pathname === "/search") return <SearchPage />;
  if (pathname === "/transmissions") return <Transmissions />;
  if (pathname === "/store") return <Store />;
  return <NotFound />;
}

function titleFor(pathname: string, hostname: string, surface: SystemSurface) {
  if (surface === "command") return pathname === "/wiki" || pathname === "/wiki/admin" ? "Wiki Moderation — ANEVUM COMMAND" : "ANEVUM COMMAND — Control Plane";
  if (surface === "lattice") return "LATTICE.ANEVUM — Relational Universe";
  if (surface === "rhenlink") return "RHENLINK — ANEVUM Identity";
  if (surface === "wiki") {
    const wikiHost = hostname === WIKI_HOST;
    const root = wikiHost ? pathname === "/" || pathname === "/wiki" || pathname === "/search" : pathname === "/wiki";
    if (root) return "WIKI.ANEVUM — Public Collaborative Encyclopedia";
    if (pathname.endsWith("/new")) return "Propose a Page — WIKI.ANEVUM";
    if (pathname.endsWith("/admin")) return "Wiki Administration — ANEVUM";
    if (pathname.endsWith("/saved")) return "Saved Pages — WIKI.ANEVUM";
    const slug = wikiEditSlug(pathname, wikiHost) || wikiSlug(pathname, wikiHost);
    return slug ? `${slug.replace(/-/g, " ")} — WIKI.ANEVUM` : "WIKI.ANEVUM";
  }
  if (pathname === "/stories/reply") return "REPLY — ANEVUM";
  if (surface === "stories") return "Stories — ANEVUM";
  if (pathname === "/search") return "Search — ANEVUM";
  if (pathname === "/transmissions") return "Transmissions — ANEVUM";
  if (pathname === "/store") return "Store — ANEVUM";
  return "ANEVUM — Unified Interface";
}

function canonicalFor(pathname: string, hostname: string, surface: SystemSurface) {
  if (surface === "command") return `https://command.anevum.com${pathname === "/command" ? "/" : pathname}`;
  if (surface === "lattice" && (hostname === LATTICE_HOST || pathname === "/lattice")) return "https://lattice.anevum.com/";
  if (surface === "rhenlink") return "https://anevum.com/rhenlink";
  if (surface === "wiki") {
    const wikiHost = hostname === WIKI_HOST;
    const root = wikiHost ? pathname === "/" || pathname === "/wiki" || pathname === "/search" : pathname === "/wiki";
    if (root) return "https://wiki.anevum.com/";
    if (pathname.endsWith("/new") || pathname.endsWith("/admin") || pathname.endsWith("/saved") || pathname.endsWith("/edit")) {
      const normalized = wikiHost ? pathname : pathname.slice(5) || "/";
      return `https://wiki.anevum.com${normalized}`;
    }
    const slug = wikiSlug(pathname, wikiHost);
    if (slug) return `https://wiki.anevum.com/${encodeURIComponent(slug)}`;
  }
  return `https://anevum.com${pathname}`;
}

function memberRouteFor(pathname: string, hostname: string, surface: SystemSurface) {
  if (surface === "lattice" && hostname === LATTICE_HOST && pathname === "/") return "/lattice";
  if (surface === "command" && hostname === COMMAND_HOST && pathname === "/") return "/command";
  if (surface !== "wiki") return pathname;
  const wikiHost = hostname === WIKI_HOST;
  if (wikiHost && pathname === "/") return "/wiki";
  const editSlug = wikiEditSlug(pathname, wikiHost);
  if (editSlug) return `/wiki/${editSlug}/edit`;
  const slug = wikiSlug(pathname, wikiHost);
  return slug ? `/wiki/${slug}` : wikiHost ? `/wiki${pathname}` : pathname;
}

export default function App() {
  const { pathname, hostname } = useLocationState();
  const bridgeRoute = hostname === ROOT_HOST && pathname === "/auth-bridge";
  const surface = useMemo(() => surfaceFor(pathname, hostname), [pathname, hostname]);
  const canonical = useMemo(() => canonicalFor(pathname, hostname, surface), [pathname, hostname, surface]);
  const memberRoute = useMemo(() => memberRouteFor(pathname, hostname, surface), [pathname, hostname, surface]);

  useEffect(() => {
    document.title = bridgeRoute ? "ANEVUM Identity Bridge" : titleFor(pathname, hostname, surface);
    document.documentElement.dataset.surface = bridgeRoute ? "bridge" : surface;
    document.documentElement.dataset.host = hostname;

    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = bridgeRoute ? "https://anevum.com/auth-bridge" : canonical;

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = bridgeRoute || surface === "command" ? "noindex,nofollow,noarchive" : "index,follow";

    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = bridgeRoute ? "https://anevum.com/auth-bridge" : canonical;
  }, [pathname, hostname, canonical, surface, bridgeRoute]);

  useEffect(() => {
    if (bridgeRoute) return;
    const recordRoute = () => trackMemberRoute(memberRoute);
    recordRoute();
    window.addEventListener("anevum-member-session", recordRoute);
    return () => window.removeEventListener("anevum-member-session", recordRoute);
  }, [memberRoute, bridgeRoute]);

  if (bridgeRoute) return <AuthBridgePage />;

  return (
    <div className="app-shell production-shell unified-runtime-shell">
      <SystemSessionBridge hostname={hostname} />
      <UnifiedSystemShell surface={surface} pathname={pathname} hostname={hostname}>
        <Route pathname={pathname} hostname={hostname} />
      </UnifiedSystemShell>
      <AchievementLayer />
    </div>
  );
}
