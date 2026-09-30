import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { OverflowPan } from "./components/OverflowPan";
import SeasonalEasterEggs from "./components/SeasonalEasterEggs";
import { PublicShell } from "./components/Shell";
import { currentRhenRelease, rhenReleaseBySlug } from "./data/releases";
import { dispatchBySlug } from "./data/dispatches";

const Command = lazy(() => import("./pages/Command"));
const Iren = lazy(() => import("./pages/Iren"));
const HomeCompany = lazy(() => import("./pages/HomeCompany"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Live = lazy(() => import("./pages/Live"));
const ResearchHub = lazy(() => import("./pages/ResearchHub"));
const Theory = lazy(() => import("./pages/Theory"));
const Performance = lazy(() => import("./pages/Performance"));
const Dispatches = lazy(() => import("./pages/Dispatches"));
const DispatchDetail = lazy(() => import("./pages/DispatchDetail"));
const Founder = lazy(() => import("./pages/Founder"));
const Resume = lazy(() => import("./pages/Resume"));
const Releases = lazy(() => import("./pages/Releases"));
const ReleaseDetail = lazy(() => import("./pages/ReleaseDetail"));
const PrivateAccess = lazy(() => import("./pages/Rhenlink"));

const titles: Record<string, string> = {
  "/": "ANEVUM — Software Systems & Research",
  "/products": "Products — ANEVUM",
  "/products/iren": "IREN — Operating Intelligence — ANEVUM",
  "/products/rhen": "RHEN — Market System — ANEVUM",
  "/products/nostra": "NOSTRA — Forecasting — ANEVUM",
  "/products/graen": "GRAEN — Mathematical Research — ANEVUM",
  "/products/velum": "VELUM — Replay & Simulation — ANEVUM",
  "/live": "Live Systems — ANEVUM",
  "/research": "Research — ANEVUM",
  "/theory": "Theory Registry — ANEVUM",
  "/performance": "Performance — ANEVUM",
  "/dispatches": "Dispatches — ANEVUM",
  "/founder": "Devon Akins — Founder, ANEVUM",
  "/resume": "Devon Akins — Resume",
  "/releases": "Releases — ANEVUM",
  "/private": "Private — ANEVUM",
  "/iren": "IREN Operations — ANEVUM"
};

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/command")) {
      document.title = "Command — ANEVUM";
      return;
    }

    if (location.pathname === "/releases") {
      const current = currentRhenRelease();
      document.title = "Releases — RHEN " + current.version + " " + current.codename + " — ANEVUM";
      return;
    }

    if (location.pathname.startsWith("/dispatches/")) {
      const slug = location.pathname.slice("/dispatches/".length);
      const dispatch = dispatchBySlug(slug);
      document.title = dispatch
        ? dispatch.title + " — ANEVUM Dispatches"
        : "Dispatches — ANEVUM";
      return;
    }

    if (location.pathname.startsWith("/releases/")) {
      const slug = location.pathname.slice("/releases/".length);
      const release = rhenReleaseBySlug(slug);
      document.title = release
        ? "RHEN " + release.version + " — " + release.codename + " — ANEVUM"
        : "Releases — ANEVUM";
      return;
    }

    document.title = titles[location.pathname] || "ANEVUM — Software Systems & Research";
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
        <Route path="/dispatches" element={<PublicExperience><Dispatches /></PublicExperience>} />
        <Route path="/dispatches/:slug" element={<PublicExperience><DispatchDetail /></PublicExperience>} />
        <Route path="/founder" element={<PublicExperience><Founder /></PublicExperience>} />
        <Route path="/resume" element={<PublicExperience><Resume /></PublicExperience>} />
        <Route path="/releases" element={<PublicExperience><Releases /></PublicExperience>} />
        <Route path="/releases/:slug" element={<PublicExperience><ReleaseDetail /></PublicExperience>} />
        <Route path="/live" element={<PublicExperience><Live /></PublicExperience>} />
        <Route path="/theory" element={<PublicExperience><Theory /></PublicExperience>} />

        <Route path="/iren" element={<Suspense fallback={<Loader />}><Iren /></Suspense>} />
        <Route path="/private" element={<Suspense fallback={<Loader />}><PrivateAccess /></Suspense>} />
        <Route path="/command/*" element={<Suspense fallback={<Loader />}><Command /></Suspense>} />
        <Route path="/rhenlink" element={<Navigate to="/private" replace />} />

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
