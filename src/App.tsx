import { useEffect, useState } from "react";
import { getPublicObjectBySlug } from "./publicObjects";
import { Footer, Header } from "./ui";
import { FrontDoor, NotFound, Reply, SearchPage, Store, Stories, Transmissions } from "./PublicPages";
import { WikiHome, WikiRecord } from "./WikiPages";
import { Lattice, Rhenlink } from "./MemberPages";

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  return pathname;
}

function Route({ pathname }: { pathname: string }) {
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

function titleFor(pathname: string) {
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

export default function App() {
  const pathname = usePathname();
  useEffect(() => { document.title = titleFor(pathname); }, [pathname]);
  return (
    <div className="app-shell production-shell">
      <Header pathname={pathname} />
      <Route pathname={pathname} />
      <Footer />
    </div>
  );
}
