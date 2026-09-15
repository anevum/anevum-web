import { useEffect, useMemo, useState } from "react";
import { Footer, Header } from "./ui";
import { FrontDoor, NotFound, Reply, SearchPage, Store, Stories, Transmissions } from "./PublicPages";
import { Lattice, Rhenlink } from "./MemberPages";
import { InterfaceStrip, MobileDock } from "./ExperienceChrome";
import { AchievementLayer, RhenlinkIdentityCard } from "./MemberChrome";
import { trackMemberRoute } from "./memberState";
import {
  CommunityWikiHeader,
  ModeratedWikiArticle,
  ModeratedWikiHome,
  WikiAdminPage,
  WikiContributionPage,
  WikiMissing,
  WikiSavedPage,
} from "./ModeratedWiki";

const WIKI_HOST = "wiki.anevum.com";

function useLocationState() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const hostname = window.location.hostname.toLowerCase();

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return { pathname, hostname };
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

function isWikiSurface(pathname: string, hostname: string) {
  return hostname === WIKI_HOST || pathname === "/wiki" || pathname.startsWith("/wiki/");
}

function Route({ pathname, hostname }: { pathname: string; hostname: string }) {
  const wikiHost = hostname === WIKI_HOST;

  if (wikiHost) {
    if (pathname === "/" || pathname === "/wiki" || pathname === "/search") return <ModeratedWikiHome />;
    if (pathname === "/new") return <WikiContributionPage />;
    if (pathname === "/admin") return <WikiAdminPage />;
    if (pathname === "/saved") return <WikiSavedPage />;
    if (pathname === "/rhenlink") return <Rhenlink />;
    const editSlug = wikiEditSlug(pathname, true);
    if (editSlug) return <WikiContributionPage editSlug={editSlug} />;
    const slug = wikiSlug(pathname, true);
    return slug ? <ModeratedWikiArticle slug={slug} /> : <WikiMissing />;
  }

  if (pathname === "/") return <FrontDoor />;
  if (pathname === "/stories") return <Stories />;
  if (pathname === "/stories/reply") return <Reply />;
  if (pathname === "/wiki") return <ModeratedWikiHome />;
  if (pathname === "/wiki/new") return <WikiContributionPage />;
  if (pathname === "/wiki/admin") return <WikiAdminPage />;
  if (pathname === "/wiki/saved") return <WikiSavedPage />;
  const editSlug = wikiEditSlug(pathname, false);
  if (editSlug) return <WikiContributionPage editSlug={editSlug} />;
  const slug = pathname.startsWith("/wiki/") ? wikiSlug(pathname, false) : "";
  if (slug) return <ModeratedWikiArticle slug={slug} />;
  if (pathname === "/lattice") return <Lattice />;
  if (pathname === "/rhenlink") return <Rhenlink />;
  if (pathname === "/search") return <SearchPage />;
  if (pathname === "/transmissions") return <Transmissions />;
  if (pathname === "/store") return <Store />;
  return <NotFound />;
}

function titleFor(pathname: string, hostname: string) {
  const wikiHost = hostname === WIKI_HOST;
  if (isWikiSurface(pathname, hostname)) {
    if ((wikiHost && (pathname === "/" || pathname === "/wiki" || pathname === "/search")) || (!wikiHost && pathname === "/wiki")) return "WIKI.ANEVUM — Public Collaborative Encyclopedia";
    if (pathname.endsWith("/new")) return "Propose a Page — WIKI.ANEVUM";
    if (pathname.endsWith("/admin")) return "Wiki Administration — ANEVUM";
    if (pathname.endsWith("/saved")) return "Saved Pages — WIKI.ANEVUM";
    const slug = wikiEditSlug(pathname, wikiHost) || wikiSlug(pathname, wikiHost);
    return slug ? `${slug.replace(/-/g, " ")} — WIKI.ANEVUM` : "WIKI.ANEVUM";
  }
  if (pathname === "/") return "ANEVUM";
  if (pathname === "/stories/reply") return "REPLY — ANEVUM";
  if (pathname === "/lattice") return "LATTICE.ANEVUM — The Universe as a Place";
  if (pathname === "/rhenlink") return "RHENLINK — ANEVUM";
  if (pathname === "/search") return "Search — ANEVUM";
  if (pathname === "/transmissions") return "Transmissions — ANEVUM";
  if (pathname === "/store") return "Store — ANEVUM";
  return "ANEVUM";
}

function canonicalFor(pathname: string, hostname: string) {
  const wikiHost = hostname === WIKI_HOST;
  if (isWikiSurface(pathname, hostname)) {
    if ((wikiHost && (pathname === "/" || pathname === "/wiki" || pathname === "/search")) || (!wikiHost && pathname === "/wiki")) return "https://wiki.anevum.com/";
    if (pathname.endsWith("/new") || pathname.endsWith("/admin") || pathname.endsWith("/saved") || pathname.endsWith("/edit")) return `https://anevum.com${wikiHost ? `/wiki${pathname}` : pathname}`;
    const slug = wikiSlug(pathname, wikiHost);
    if (slug) return `https://wiki.anevum.com/${encodeURIComponent(slug)}`;
  }
  return `https://anevum.com${pathname}`;
}

function memberRouteFor(pathname: string, hostname: string) {
  const wikiHost = hostname === WIKI_HOST;
  if (!isWikiSurface(pathname, hostname)) return pathname;
  if ((wikiHost && pathname === "/") || (!wikiHost && pathname === "/wiki")) return "/wiki";
  const editSlug = wikiEditSlug(pathname, wikiHost);
  if (editSlug) return `/wiki/${editSlug}/edit`;
  const slug = wikiSlug(pathname, wikiHost);
  return slug ? `/wiki/${slug}` : wikiHost ? `/wiki${pathname}` : pathname;
}

export default function App() {
  const { pathname, hostname } = useLocationState();
  const wikiSurface = isWikiSurface(pathname, hostname);
  const canonical = useMemo(() => canonicalFor(pathname, hostname), [pathname, hostname]);
  const memberRoute = useMemo(() => memberRouteFor(pathname, hostname), [pathname, hostname]);

  useEffect(() => {
    document.title = titleFor(pathname, hostname);
    document.documentElement.dataset.surface = wikiSurface ? "wiki" : "anevum";

    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = canonical;
  }, [pathname, hostname, canonical, wikiSurface]);

  useEffect(() => {
    const recordRoute = () => trackMemberRoute(memberRoute);
    recordRoute();
    window.addEventListener("anevum-member-session", recordRoute);
    return () => window.removeEventListener("anevum-member-session", recordRoute);
  }, [memberRoute]);

  return (
    <div className={`app-shell production-shell ${wikiSurface ? "wiki-surface-shell" : "anevum-surface-shell"}`}>
      {wikiSurface ? <CommunityWikiHeader /> : <Header pathname={pathname} />}
      {!wikiSurface ? <InterfaceStrip pathname={pathname} /> : null}
      <Route pathname={pathname} hostname={hostname} />
      {!wikiSurface ? <Footer /> : null}
      {!wikiSurface ? <MobileDock pathname={pathname} /> : null}
      <RhenlinkIdentityCard />
      <AchievementLayer />
    </div>
  );
}
