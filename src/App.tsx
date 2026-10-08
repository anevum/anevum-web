import { lazy, Suspense, useEffect, useLayoutEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { OverflowPan } from "./components/OverflowPan";
import { PublicShell } from "./components/Shell";
import { fieldNotes } from "./data/fieldNotes";
import { currentRhenRelease, rhenReleaseBySlug } from "./data/releases";

const Command = lazy(() => import("./pages/Command"));
const HomeCompany = lazy(() => import("./pages/HomeCompany"));
const Products = lazy(() => import("./pages/Products"));
const RhenProduct = lazy(() => import("./pages/RhenProduct"));
const Feed = lazy(() => import("./pages/Feed"));
const Live = lazy(() => import("./pages/Live"));
const ResearchHub = lazy(() => import("./pages/ResearchHub"));
const FieldNoteDetail = lazy(() => import("./pages/FieldNoteDetail"));
const Architecture = lazy(() => import("./pages/Architecture"));
const Founder = lazy(() => import("./pages/Founder"));
const Resume = lazy(() => import("./pages/Resume"));
const Releases = lazy(() => import("./pages/Releases"));
const ReleaseDetail = lazy(() => import("./pages/ReleaseDetail"));

const titles: Record<string, string> = {
  "/": "ANEVUM — Independent Software",
  "/products": "Products — ANEVUM",
  "/feed": "Feed — ANEVUM",
  "/field-notes": "Field Notes — ANEVUM",
  "/products/rhen": "RHEN — ANEVUM",
  "/products/rhen/evidence": "RHEN Public Evidence — ANEVUM",
  "/products/rhen/architecture": "RHEN Architecture — ANEVUM",
  "/products/rhen/releases": "RHEN Releases — ANEVUM",
  "/about": "About — ANEVUM",
  "/resume": "Résumé — ANEVUM"
};

const descriptions: Record<string, string> = {
  "/": "Independent software built against real problems, with real data, public evidence, and versioned work.",
  "/products": "The canonical registry of public ANEVUM products. Products appear when they actually exist.",
  "/feed": "A chronological ANEVUM record assembled from real releases, Field Notes, public-safe runtime observations, and research decisions.",
  "/field-notes": "ANEVUM Field Notes document research decisions, failures, engineering changes, releases, and measured evidence.",
  "/products/rhen": "RHEN is ANEVUM's live trading and research system operating on real market data with public evidence and narrow live authority.",
  "/products/rhen/evidence": "Inspect sanitized RHEN runtime and performance evidence without exposing protected broker, position, order, or strategy details.",
  "/products/rhen/architecture": "Inspect RHEN execution, research, replay, forecasting, control, storage, and evidence boundaries.",
  "/products/rhen/releases": "RHEN release records document production changes, verification, limitations, and public system history.",
  "/about": "About ANEVUM, the independently built and operated software studio.",
  "/resume": "Professional résumé and background for the person responsible for ANEVUM."
};

function ensureMeta(selector: string, create: () => HTMLElement, content: string) {
  let node = document.head.querySelector(selector) as HTMLElement | null;
  if (!node) {
    node = create();
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function setRouteMeta(pathname: string, title: string, description: string, protectedRoute: boolean) {
  const canonicalUrl = "https://anevum.com" + (pathname === "/" ? "/" : pathname);
  document.title = title;
  document.documentElement.dataset.route = pathname.replace(/^\//, "") || "home";

  ensureMeta('meta[name="description"]', () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    return meta;
  }, description);

  ensureMeta('meta[name="robots"]', () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    return meta;
  }, protectedRoute ? "noindex,nofollow" : "index,follow,max-image-preview:large");

  for (const [property, value] of [
    ["og:title", title],
    ["og:description", description],
    ["og:url", canonicalUrl],
    ["twitter:title", title],
    ["twitter:description", description]
  ]) {
    const isTwitter = property.startsWith("twitter:");
    const attr = isTwitter ? "name" : "property";
    let node = document.head.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attr, property);
      document.head.appendChild(node);
    }
    node.content = value;
  }

  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;
}

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const protectedRoute = path.startsWith("/command");
    let title = titles[path] || "ANEVUM — Independent Software";
    let description = descriptions[path] || descriptions["/"];

    if (path.startsWith("/command")) {
      title = "Command — ANEVUM";
      description = "Protected ANEVUM operating surface.";
    } else if (path.startsWith("/products/rhen/releases/")) {
      const slug = path.slice("/products/rhen/releases/".length);
      const release = rhenReleaseBySlug(slug);
      title = release ? "RHEN " + release.version + " — " + release.codename + " — ANEVUM" : "RHEN Releases — ANEVUM";
      description = release ? "Public release record for RHEN " + release.version + " " + release.codename + ", including production changes, verification, and limits." : descriptions["/products/rhen/releases"];
    } else if (path.startsWith("/field-notes/")) {
      const slug = path.slice("/field-notes/".length);
      const note = fieldNotes.find((item) => item.slug === slug);
      title = note ? note.title + " — ANEVUM Field Notes" : "Field Note — ANEVUM";
      description = note?.summary || descriptions["/field-notes"];
    } else if (path === "/products/rhen/releases") {
      const current = currentRhenRelease();
      title = "RHEN Releases — " + current.version + " " + current.codename + " — ANEVUM";
    }

    setRouteMeta(path, title, description, protectedRoute);
  }, [location.pathname]);

  return null;
}

function RouteScrollReset() {
  const location = useLocation();
  useLayoutEffect(() => {
    // This must run above lazy route Suspense: when embedded in a lazy page,
    // the scroll-reset effect can be deferred until after the route resolves.
    const root = document.documentElement;
    const scroller = document.scrollingElement || root;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    scroller.scrollTop = 0;
    // Repeat on the next frame, before restoring smooth scrolling. This also
    // avoids browser scroll anchoring retaining the old document position.
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      scroller.scrollTop = 0;
      root.style.scrollBehavior = previousScrollBehavior;
    });
    return () => {
      window.cancelAnimationFrame(frame);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [location.pathname, location.key]);
  return null;
}

function Loader() {
  return <div className="route-loader"><span>ANEVUM</span><i /></div>;
}

function PublicExperience({ children }: { children: ReactNode }) {
  return <PublicShell><Suspense fallback={<Loader />}>{children}</Suspense></PublicShell>;
}

export default function App() {
  return (
    <>
      <RouteEffects />
      <RouteScrollReset />
      <OverflowPan />
      <Routes>
        <Route path="/" element={<PublicExperience><HomeCompany /></PublicExperience>} />
        <Route path="/products" element={<PublicExperience><Products /></PublicExperience>} />
        <Route path="/feed" element={<PublicExperience><Feed /></PublicExperience>} />
        <Route path="/field-notes" element={<PublicExperience><ResearchHub /></PublicExperience>} />
        <Route path="/field-notes/:slug" element={<PublicExperience><FieldNoteDetail /></PublicExperience>} />
        <Route path="/about" element={<PublicExperience><Founder /></PublicExperience>} />
        <Route path="/resume" element={<PublicExperience><Resume /></PublicExperience>} />

        <Route path="/products/rhen" element={<PublicExperience><RhenProduct /></PublicExperience>} />
        <Route path="/products/rhen/evidence" element={<PublicExperience><Live /></PublicExperience>} />
        <Route path="/products/rhen/architecture" element={<PublicExperience><Architecture /></PublicExperience>} />
        <Route path="/products/rhen/releases" element={<PublicExperience><Releases /></PublicExperience>} />
        <Route path="/products/rhen/releases/:slug" element={<PublicExperience><ReleaseDetail /></PublicExperience>} />

        <Route path="/live" element={<Navigate to="/products/rhen/evidence" replace />} />
        <Route path="/performance" element={<Navigate to="/products/rhen/evidence" replace />} />
        <Route path="/architecture" element={<Navigate to="/products/rhen/architecture" replace />} />
        <Route path="/releases" element={<Navigate to="/products/rhen/releases" replace />} />
        <Route path="/releases/:slug" element={<LegacyReleaseRedirect />} />
        <Route path="/research" element={<Navigate to="/field-notes" replace />} />
        <Route path="/research/:slug" element={<LegacyNoteRedirect />} />
        <Route path="/field-notes-old" element={<Navigate to="/field-notes" replace />} />
        <Route path="/founder" element={<Navigate to="/about" replace />} />
        <Route path="/case-studies" element={<Navigate to="/products" replace />} />
        <Route path="/theory" element={<Navigate to="/field-notes" replace />} />

        <Route path="/iren" element={<Navigate to="/command" replace />} />
        <Route path="/private" element={<Navigate to="/command" replace />} />
        <Route path="/command/*" element={<Suspense fallback={<Loader />}><Command /></Suspense>} />
        <Route path="/rhenlink" element={<Navigate to="/command" replace />} />

        <Route path="/system" element={<Navigate to="/products/rhen" replace />} />
        <Route path="/record" element={<Navigate to="/products/rhen/releases" replace />} />
        <Route path="/work" element={<Navigate to="/field-notes" replace />} />
        <Route path="/lab" element={<Navigate to="/products" replace />} />
        <Route path="/notes" element={<Navigate to="/field-notes" replace />} />
        <Route path="/wiki" element={<Navigate to="/products/rhen" replace />} />
        <Route path="/wiki/archive/transcosmic" element={<Navigate to="/products/rhen/releases" replace />} />
        <Route path="/proof" element={<Navigate to="/products/rhen/evidence" replace />} />
        <Route path="/method" element={<Navigate to="/field-notes" replace />} />
        <Route path="/the-book" element={<Navigate to="/field-notes" replace />} />
        <Route path="/reply" element={<Navigate to="/field-notes" replace />} />
        <Route path="/stories/reply" element={<Navigate to="/field-notes" replace />} />
        <Route path="/universe" element={<Navigate to="/products" replace />} />
        <Route path="/lattice" element={<Navigate to="/products" replace />} />
        <Route path="/store" element={<Navigate to="/products" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function LegacyReleaseRedirect() {
  const location = useLocation();
  const slug = location.pathname.slice("/releases/".length);
  return <Navigate to={"/products/rhen/releases/" + slug} replace />;
}

function LegacyNoteRedirect() {
  const location = useLocation();
  const slug = location.pathname.slice("/research/".length);
  return <Navigate to={"/field-notes/" + slug} replace />;
}
