import { lazy, Suspense, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useNavigationType } from "react-router-dom";
import { OverflowPan } from "./components/OverflowPan";
import SeasonalEasterEggs from "./components/SeasonalEasterEggs";
import { PublicShell } from "./components/Shell";
import { fieldNotes } from "./data/fieldNotes";
import { currentRhenRelease, rhenReleaseBySlug } from "./data/releases";

const Command = lazy(() => import("./pages/Command"));
const HomeCompany = lazy(() => import("./pages/HomeCompany"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Live = lazy(() => import("./pages/Live"));
const ResearchHub = lazy(() => import("./pages/ResearchHub"));
const FieldNoteDetail = lazy(() => import("./pages/FieldNoteDetail"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const Architecture = lazy(() => import("./pages/Architecture"));
const Theory = lazy(() => import("./pages/Theory"));
const Performance = lazy(() => import("./pages/Performance"));
const Founder = lazy(() => import("./pages/Founder"));
const Resume = lazy(() => import("./pages/Resume"));
const Releases = lazy(() => import("./pages/Releases"));
const ReleaseDetail = lazy(() => import("./pages/ReleaseDetail"));

const titles: Record<string, string> = {
  "/": "ANEVUM — Live Systems, Research & Engineering",
  "/products": "Systems — ANEVUM",
  "/products/iren": "IREN — Operating Intelligence — ANEVUM",
  "/products/rhen": "RHEN — Market System — ANEVUM",
  "/products/nostra": "NOSTRA — Forecasting — ANEVUM",
  "/products/graen": "GRAEN — Mathematical Research — ANEVUM",
  "/products/velum": "VELUM — Replay & Simulation — ANEVUM",
  "/live": "Live Systems — ANEVUM",
  "/research": "Field Notes — ANEVUM",
  "/case-studies": "Case Studies — ANEVUM",
  "/architecture": "Architecture — ANEVUM",
  "/theory": "Theory Registry — ANEVUM",
  "/performance": "Performance — ANEVUM",
  "/founder": "Devon Akins — Founder, ANEVUM",
  "/resume": "Devon Akins — Résumé",
  "/releases": "Releases — ANEVUM",
  "/private": "Private — ANEVUM",
  "/iren": "IREN Operations — ANEVUM"
};

const descriptions: Record<string, string> = {
  "/": "ANEVUM is a live software and research system spanning IREN, RHEN, GRAEN, NOSTRA, and VELUM, with public-safe runtime state, research records, and explicit authority boundaries.",
  "/products": "Explore IREN, RHEN, NOSTRA, GRAEN, and VELUM: ANEVUM's orchestration, market, forecasting, mathematical research, and replay systems.",
  "/products/iren": "IREN is ANEVUM's operating-intelligence layer for cross-system state, coordination, research visibility, and protected operator workflows.",
  "/products/rhen": "RHEN is ANEVUM's deterministic market system for observation, evaluation, bounded execution, reconciliation, telemetry, and evidence.",
  "/products/nostra": "NOSTRA is ANEVUM's forecasting and prediction research system for regimes, forward horizons, uncertainty, outcomes, and calibration.",
  "/products/graen": "GRAEN is ANEVUM's mathematical and theoretical research program for falsification, bias control, dependence, validation, and bounded claims.",
  "/products/velum": "VELUM is ANEVUM's broker-isolated replay and counterfactual system for historical reconstruction, simulation, comparison, and failure analysis.",
  "/live": "Inspect ANEVUM's public-safe live system state, sanitized telemetry activity, runtime freshness, and current research status.",
  "/research": "Read ANEVUM Field Notes: progress reports, architecture changes, research results, failures, releases, and operating lessons.",
  "/case-studies": "Engineering and research case studies showing how ANEVUM systems interact across validation, forecasting, replay, and production evidence.",
  "/architecture": "See ANEVUM's system architecture, production stack, authority boundaries, evidence path, and separation between research, simulation, and live execution.",
  "/theory": "Browse ANEVUM's public theory registry and mathematical research artifacts.",
  "/performance": "Public-safe live performance evidence for RHEN market lanes with normalized methodology, sample boundaries, and strict separation from simulation.",
  "/founder": "Devon Akins is the founder of ANEVUM, building software systems, research infrastructure, forecasting, simulation, telemetry, and production controls.",
  "/resume": "Résumé for Devon Akins, founder of ANEVUM, covering software systems, infrastructure, research tooling, mathematics, and production engineering.",
  "/releases": "ANEVUM release records documenting RHEN versions, production changes, verification, and public system history."
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
  const navigationType = useNavigationType();
  const mounted = useRef(false);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    const isInitialMount = !mounted.current;
    mounted.current = true;
    if (!isInitialMount && navigationType === "POP") return;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousScrollBehavior;
  }, [location.pathname, navigationType]);

  useEffect(() => {
    const path = location.pathname;
    const protectedRoute = path.startsWith("/command") || path === "/private" || path === "/iren";

    let title = titles[path] || "ANEVUM — Software Systems & Research";
    let description = descriptions[path] || descriptions["/"];

    if (path.startsWith("/command")) {
      title = "Command — ANEVUM";
      description = "Protected ANEVUM operator surface.";
    } else if (path === "/releases") {
      const current = currentRhenRelease();
      title = "Releases — RHEN " + current.version + " " + current.codename + " — ANEVUM";
      description = descriptions["/releases"];
    } else if (path.startsWith("/releases/")) {
      const slug = path.slice("/releases/".length);
      const release = rhenReleaseBySlug(slug);
      title = release
        ? "RHEN " + release.version + " — " + release.codename + " — ANEVUM"
        : "Releases — ANEVUM";
      description = release
        ? "Public release record for RHEN " + release.version + " " + release.codename + ", including production changes and verification."
        : descriptions["/releases"];
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
      <OverflowPan />
      <SeasonalEasterEggs />
      <Routes>
        <Route path="/" element={<PublicExperience><HomeCompany /></PublicExperience>} />
        <Route path="/products" element={<PublicExperience><Products /></PublicExperience>} />
        <Route path="/products/:slug" element={<PublicExperience><ProductDetail /></PublicExperience>} />
        <Route path="/performance" element={<PublicExperience><Performance /></PublicExperience>} />
        <Route path="/research" element={<PublicExperience><ResearchHub /></PublicExperience>} />
        <Route path="/research/:slug" element={<PublicExperience><FieldNoteDetail /></PublicExperience>} />
        <Route path="/case-studies" element={<PublicExperience><CaseStudies /></PublicExperience>} />
        <Route path="/architecture" element={<PublicExperience><Architecture /></PublicExperience>} />
        <Route path="/founder" element={<PublicExperience><Founder /></PublicExperience>} />
        <Route path="/resume" element={<PublicExperience><Resume /></PublicExperience>} />
        <Route path="/releases" element={<PublicExperience><Releases /></PublicExperience>} />
        <Route path="/releases/:slug" element={<PublicExperience><ReleaseDetail /></PublicExperience>} />
        <Route path="/live" element={<PublicExperience><Live /></PublicExperience>} />
        <Route path="/theory" element={<PublicExperience><Theory /></PublicExperience>} />

        <Route path="/iren" element={<Navigate to="/command" replace />} />
        <Route path="/private" element={<Navigate to="/command" replace />} />
        <Route path="/command/*" element={<Suspense fallback={<Loader />}><Command /></Suspense>} />
        <Route path="/rhenlink" element={<Navigate to="/command" replace />} />

        <Route path="/system" element={<Navigate to="/products/iren" replace />} />
        <Route path="/record" element={<Navigate to="/releases" replace />} />
        <Route path="/work" element={<Navigate to="/research" replace />} />
        <Route path="/lab" element={<Navigate to="/products/velum" replace />} />
        <Route path="/notes" element={<Navigate to="/research" replace />} />
        <Route path="/wiki" element={<Navigate to="/products" replace />} />
        <Route path="/wiki/archive/transcosmic" element={<Navigate to="/releases" replace />} />
        <Route path="/about" element={<Navigate to="/founder" replace />} />
        <Route path="/proof" element={<Navigate to="/performance" replace />} />
        <Route path="/method" element={<Navigate to="/research" replace />} />
        <Route path="/the-book" element={<Navigate to="/releases" replace />} />
        <Route path="/reply" element={<Navigate to="/releases" replace />} />
        <Route path="/stories/reply" element={<Navigate to="/releases" replace />} />
        <Route path="/universe" element={<Navigate to="/releases" replace />} />
        <Route path="/lattice" element={<Navigate to="/releases" replace />} />
        <Route path="/store" element={<Navigate to="/releases" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
