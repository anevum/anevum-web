import { useEffect, useMemo, useState } from "react";
import { getPublicObjectBySlug, publicObjects } from "./publicObjects";
import { Footer, Header } from "./ui";
import { FrontDoor, NotFound, Reply, SearchPage, Store, Stories, Transmissions } from "./PublicPages";
import { WikiHome, WikiRecord } from "./WikiPages";
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
    if (pathname === "/" || pathname === "/wiki") return <WikiHome />;
    if (pathname === "/search") return <SearchPage />;
    const record = wikiRecordForPath(pathname);
    return record ? <WikiRecord slug={record.slug} /> : <NotFound />;
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
    if (pathname === "/" || pathname === "/wiki") return "WIKI.ANEVUM — The Known Record";
    const record = wikiRecordForPath(pathname);
    return record ? `${record.title} — WIKI.ANEVUM` : "WIKI.ANEVUM";
  }

  if (pathname === "/") return "ANEVUM";
  if (pathname === "/stories/reply") return "REPLY — ANEVUM";
  if (pathname === "/wiki") return "WIKI.ANEVUM — The Known Record";
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
    if (pathname === "/" || pathname === "/wiki") return "https://wiki.anevum.com/";
    const record = wikiRecordForPath(pathname);
    if (record) return `https://wiki.anevum.com${record.sourceRoute}`;
    if (pathname === "/search") return "https://wiki.anevum.com/search";
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
  const canonical = useMemo(() => canonicalFor(pathname, hostname), [pathname, hostname]);

  useEffect(() => {
    document.title = titleFor(pathname, hostname);
    document.documentElement.dataset.surface = hostname === WIKI_HOST ? "wiki" : "anevum";

    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = canonical;
  }, [pathname, hostname, canonical]);

  const headerPath = hostname === WIKI_HOST && pathname === "/" ? "/wiki" : pathname;

  return (
    <div className="app-shell production-shell">
      <Header pathname={headerPath} />
      <Route pathname={pathname} hostname={hostname} />
      <Footer />
    </div>
  );
}
