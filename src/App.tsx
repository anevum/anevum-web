import { useEffect, useMemo, useState } from "react";
import { getPublicObjectBySlug, publicObjects } from "./publicObjects";
import { Footer, Header } from "./ui";
import { FrontDoor, NotFound, Reply, SearchPage, Store, Stories, Transmissions } from "./PublicPages";
import { WikiHeader, WikiHome, WikiMissing, WikiRecord, WikiRhenlink, WikiSaved } from "./WikiPages";
import { Lattice, Rhenlink } from "./MemberPages";

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

function wikiRecordForPath(pathname: string) {
  if (pathname.startsWith("/wiki/")) {
    return getPublicObjectBySlug(decodeURIComponent(pathname.slice(6)));
  }

  const byPublishedRoute = publicObjects.find((record) => record.sourceRoute === pathname);
  if (byPublishedRoute) return byPublishedRoute;

  const singleSegment = pathname.match(/^\/([^/]+)\/?$/)?.[1];
  if (singleSegment) return getPublicObjectBySlug(decodeURIComponent(singleSegment));

  return undefined;
}

function Route({ pathname, hostname }: { pathname: string; hostname: string }) {
  const wikiHost = hostname === WIKI_HOST;

  if (wikiHost) {
    if (pathname === "/" || pathname === "/wiki" || pathname === "/search") return <WikiHome />;
    if (pathname === "/rhenlink") return <WikiRhenlink />;
    if (pathname === "/saved") return <WikiSaved />;
    const record = wikiRecordForPath(pathname);
    return record ? <WikiRecord slug={record.slug} /> : <WikiMissing />;
  }

  if (pathname === "/") return <FrontDoor />;
  if (pathname === "/stories") return <Stories />;
  if (pathname === "/stories/reply") return <Reply />;
  if (pathname === "/wiki") return <WikiHome />;
  if (pathname.startsWith("/wiki/")) return <WikiRecord slug={decodeURIComponent(pathname.slice(6))} />;
  if (pathname === "/lattice") return <Lattice />;
  if (pathname === "/rhenlink") return <Rhenlink />;
  if (pathname === "/search") return <SearchPage />;
  if (pathname === "/transmissions") return <Transmissions />;
  if (pathname === "/store") return <Store />;
  return <NotFound />;
}

function titleFor(pathname: string, hostname: string) {
  if (hostname === WIKI_HOST) {
    if (pathname === "/" || pathname === "/wiki" || pathname === "/search") return "WIKI.ANEVUM — Public Canon Encyclopedia";
    if (pathname === "/rhenlink") return "RHENLINK — WIKI.ANEVUM";
    if (pathname === "/saved") return "Saved Records — WIKI.ANEVUM";
    const record = wikiRecordForPath(pathname);
    return record ? `${record.title} — WIKI.ANEVUM` : "WIKI.ANEVUM";
  }

  if (pathname === "/") return "ANEVUM";
  if (pathname === "/stories/reply") return "REPLY — ANEVUM";
  if (pathname === "/wiki") return "WIKI.ANEVUM — Public Canon Encyclopedia";
  if (pathname.startsWith("/wiki/")) {
    const record = getPublicObjectBySlug(decodeURIComponent(pathname.slice(6)));
    return record ? `${record.title} — WIKI.ANEVUM` : "WIKI.ANEVUM";
  }
  if (pathname === "/lattice") return "LATTICE.ANEVUM — The Universe as a Place";
  if (pathname === "/rhenlink") return "RHENLINK — ANEVUM";
  if (pathname === "/search") return "Search — ANEVUM";
  if (pathname === "/transmissions") return "Transmissions — ANEVUM";
  if (pathname === "/store") return "Store — ANEVUM";
  return "ANEVUM";
}

function canonicalFor(pathname: string, hostname: string) {
  if (hostname === WIKI_HOST) {
    if (pathname === "/" || pathname === "/wiki" || pathname === "/search") return "https://wiki.anevum.com/";
    if (pathname === "/rhenlink") return "https://anevum.com/rhenlink";
    if (pathname === "/saved") return "https://wiki.anevum.com/saved";
    const record = wikiRecordForPath(pathname);
    if (record) return `https://wiki.anevum.com${record.sourceRoute}`;
    return `https://wiki.anevum.com${pathname}`;
  }

  if (pathname === "/wiki") return "https://wiki.anevum.com/";
  if (pathname.startsWith("/wiki/")) {
    const record = getPublicObjectBySlug(decodeURIComponent(pathname.slice(6)));
    if (record) return `https://wiki.anevum.com${record.sourceRoute}`;
  }
  return `https://anevum.com${pathname}`;
}

export default function App() {
  const { pathname, hostname } = useLocationState();
  const wikiHost = hostname === WIKI_HOST;
  const canonical = useMemo(() => canonicalFor(pathname, hostname), [pathname, hostname]);

  useEffect(() => {
    document.title = titleFor(pathname, hostname);
    document.documentElement.dataset.surface = wikiHost ? "wiki" : "anevum";

    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = canonical;
  }, [pathname, hostname, canonical, wikiHost]);

  const headerPath = wikiHost && pathname === "/" ? "/wiki" : pathname;

  return (
    <div className={`app-shell production-shell ${wikiHost ? "wiki-surface-shell" : ""}`}>
      {wikiHost ? <WikiHeader /> : <Header pathname={headerPath} />}
      <Route pathname={pathname} hostname={hostname} />
      {!wikiHost ? <Footer /> : null}
    </div>
  );
}
