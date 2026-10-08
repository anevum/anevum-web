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
const Live = lazy(() => import("./pages/Live"));
const ResearchHub = lazy(() => import("./pages/ResearchHub"));
const FieldNoteDetail = lazy(() => import("./pages/FieldNoteDetail"));
const Architecture = lazy(() => import("./pages/Architecture"));
const Founder = lazy(() => import("./pages/Founder"));
const Resume = lazy(() => import("./pages/Resume"));
const Releases = lazy(() => import("./pages/Releases"));
const ReleaseDetail = lazy(() => import("./pages/ReleaseDetail"));

const titles: Record<string, string> = {
  "/": "ANEVUM — Independent Software Studio",
  "/products": "Products — ANEVUM",
  "/products/rhen": "RHEN — ANEVUM",
  "/live": "RHEN Public Evidence — ANEVUM",
  "/research": "Field Notes — ANEVUM",
  "/architecture": "RHEN Architecture — ANEVUM",
  "/about": "About — Devon Akins / ANEVUM",
  "/resume": "Devon Akins — Résumé",
  "/releases": "RHEN Releases — ANEVUM",
  "/private": "Private — ANEVUM",
  "/iren": "IREN Operations — ANEVUM"
};

const descriptions: Record<string, string> = {
  "/": "ANEVUM is an independent software studio run by Devon Akins, building practical software around money, investing, automation, and reducing repetitive cognitive work.",
  "/products": "Explore ANEVUM products and experiments. RHEN is the current flagship project, with room for focused financial tools, utilities, and future software.",
  "/products/rhen": "RHEN is ANEVUM's live automated trading and research system for measuring market ideas, execution, replay, forecasting, and evidence under real operating constraints.",
  "/live": "Inspect sanitized public RHEN runtime and performance evidence without exposing private account, order, position, or strategy details.",
  "/research": "Read ANEVUM Field Notes: the public build record covering research decisions, failures, engineering changes, releases, and measured evidence.",
  "/architecture": "Inspect RHEN's execution, research, replay, forecasting, control, storage, and evidence boundaries.",
  "/about": "About Devon Akins and ANEVUM, an independent software studio building practical tools around finance, automation, research, and everyday cognitive burden.",
  "/resume": "Résumé for Devon Akins, founder of ANEVUM, covering software systems, infrastructure, research, mathematics, teaching, and production engineering.",
  "/releases": "RHEN release records documenting production changes, verification, limitations, and public system history."
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
    const protectedRoute = path.startsWith("/command") || path === "/private" || path === "/iren";

    let title = titles[path] || "ANEVUM — Independent Software Studio";
    let description = descriptions[path] || descriptions["/"];

    if (path.startsWith("/command")) {
      title = "Command — ANEVUM";
      description = "Protected ANEVUM operating surface.";
    } else if (path === "/releases") {
      const current = currentRhenRelease();
      title = "RHEN Releases — " + current.version + " " + current.codename + " — ANEVUM";
      description = descriptions["/releases"];
    } else if (path.startsWith("/releases/")) {
      const slug = path.slice("/releases/".length);
      const release = rhenReleaseBySlug(slug);
      title = release ? "RHEN " + release.version + " — " + release.codename + " — ANEVUM" : "RHEN Releases — ANEVUM";
      description = release ? "Public release record for RHEN " + release.version + " " + release.codename + ", including production changes, verification, and limits." : descriptions["/releases"];
    } else if (path.startsWith("/research/")) {
      const slug = path.slice("/research/".length);
      const note = fieldNotes.find((item) => item.slug === slug);
      title = note ? note.title + " — ANEVUM Field Notes" : "Field Note — ANEVUM";
      description = note?.summary || descriptions["/research"];
    }

    setRouteMeta(path, title, description, protectedRoute);
  }, [location.pathname]);

  return null;
}

function RouteScrollReset({ children }: { children: ReactNode }) {
  const location = useLocation();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousScrollBehavior;
  }, [location.pathname]);

  return children;
}

function Loader() {
  return <div className="route-loader"><span>ANEVUM</span><i /></div>;
}

function PublicExperience({ children }: { children: ReactNode }) {
  return <PublicShell><Suspense fallback={<Loader />}><RouteScrollReset>{children}</RouteScrollReset></Suspense></PublicShell>;
}

export default function App() {
  return (
    <>
      <RouteEffects />
      <OverflowPan />
      <Routes>
        <Route path="/" element={<PublicExperience><HomeCompany /></PublicExperience>} />
        <Route path="/products" element={<PublicExperience><Products /></PublicExperience>} />
        <Route path="/products/rhen" element={<PublicExperience><RhenProduct /></PublicExperience>} />
        <Route path="/live" element={<PublicExperience><Live /></PublicExperience>} />
        <Route path="/research" element={<PublicExperience><ResearchHub /></PublicExperience>} />
        <Route path="/research/:slug" element={<PublicExperience><FieldNoteDetail /></PublicExperience>} />
        <Route path="/about" element={<PublicExperience><Founder /></PublicExperience>} />
        <Route path="/architecture" element={<PublicExperience><Architecture /></PublicExperience>} />
        <Route path="/resume" element={<PublicExperience><Resume /></PublicExperience>} />
        <Route path="/releases" element={<PublicExperience><Releases /></PublicExperience>} />
        <Route path="/releases/:slug" element={<PublicExperience><ReleaseDetail /></PublicExperience>} />

        <Route path="/founder" element={<Navigate to="/about" replace />} />
        <Route path="/field-notes" element={<Navigate to="/research" replace />} />
        <Route path="/products/rhen/live" element={<Navigate to="/live" replace />} />
        <Route path="/performance" element={<Navigate to="/live" replace />} />
        <Route path="/case-studies" element={<Navigate to="/products" replace />} />
        <Route path="/theory" element={<Navigate to="/research" replace />} />

        <Route path="/iren" element={<Navigate to="/command" replace />} />
        <Route path="/private" element={<Navigate to="/command" replace />} />
        <Route path="/command/*" element={<Suspense fallback={<Loader />}><Command /></Suspense>} />
        <Route path="/rhenlink" element={<Navigate to="/command" replace />} />

        <Route path="/system" element={<Navigate to="/products/rhen" replace />} />
        <Route path="/record" element={<Navigate to="/releases" replace />} />
        <Route path="/work" element={<Navigate to="/research" replace />} />
        <Route path="/lab" element={<Navigate to="/products" replace />} />
        <Route path="/notes" element={<Navigate to="/research" replace />} />
        <Route path="/wiki" element={<Navigate to="/products/rhen" replace />} />
        <Route path="/wiki/archive/transcosmic" element={<Navigate to="/releases" replace />} />
        <Route path="/proof" element={<Navigate to="/live" replace />} />
        <Route path="/method" element={<Navigate to="/research" replace />} />
        <Route path="/the-book" element={<Navigate to="/research" replace />} />
        <Route path="/reply" element={<Navigate to="/research" replace />} />
        <Route path="/stories/reply" element={<Navigate to="/research" replace />} />
        <Route path="/universe" element={<Navigate to="/products" replace />} />
        <Route path="/lattice" element={<Navigate to="/products" replace />} />
        <Route path="/store" element={<Navigate to="/products" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
