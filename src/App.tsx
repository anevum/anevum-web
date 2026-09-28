import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { OverflowPan } from "./components/OverflowPan";
import SeasonalEasterEggs from "./components/SeasonalEasterEggs";
import { PublicShell } from "./components/Shell";
import { currentRhenRelease, rhenReleaseBySlug } from "./data/releases";

const Command = lazy(() => import("./pages/Command"));
const Home = lazy(() => import("./pages/Home"));
const Live = lazy(() => import("./pages/Live"));
const System = lazy(() => import("./pages/System"));
const Research = lazy(() => import("./pages/Research"));
const Theory = lazy(() => import("./pages/Theory"));
const Record = lazy(() => import("./pages/Record"));
const Performance = lazy(() => import("./pages/Performance"));
const Releases = lazy(() => import("./pages/Releases"));
const ReleaseDetail = lazy(() => import("./pages/ReleaseDetail"));
const PrivateAccess = lazy(() => import("./pages/Rhenlink"));

const titles: Record<string, string> = {
  "/": "ANEVUM",
  "/live": "Operations — ANEVUM",
  "/system": "System — ANEVUM",
  "/research": "Research — ANEVUM",
  "/theory": "Mathematics & Theory — ANEVUM",
  "/record": "Record — ANEVUM",
  "/performance": "RHEN Performance — ANEVUM",
  "/releases": "RHEN Releases — ANEVUM",
  "/private": "Private — ANEVUM",
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
      document.title = `RHEN Releases — ${current.version} ${current.codename} — ANEVUM`;
      return;
    }

    if (location.pathname.startsWith("/releases/")) {
      const slug = location.pathname.slice("/releases/".length);
      const release = rhenReleaseBySlug(slug);
      document.title = release
        ? `RHEN ${release.version} — ${release.codename} — ANEVUM`
        : "RHEN Releases — ANEVUM";
      return;
    }

    document.title = titles[location.pathname] || "ANEVUM";
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
        <Route path="/" element={<PublicExperience><Home /></PublicExperience>} />
        <Route path="/live" element={<PublicExperience><Live /></PublicExperience>} />
        <Route path="/system" element={<PublicExperience><System /></PublicExperience>} />
        <Route path="/research" element={<PublicExperience><Research /></PublicExperience>} />
        <Route path="/theory" element={<PublicExperience><Theory /></PublicExperience>} />
        <Route path="/record" element={<PublicExperience><Record /></PublicExperience>} />
        <Route path="/performance" element={<PublicExperience><Performance /></PublicExperience>} />
        <Route path="/releases" element={<PublicExperience><Releases /></PublicExperience>} />
        <Route path="/releases/:slug" element={<PublicExperience><ReleaseDetail /></PublicExperience>} />

        <Route path="/private" element={<Suspense fallback={<Loader />}><PrivateAccess /></Suspense>} />
        <Route path="/command/*" element={<Suspense fallback={<Loader />}><Command /></Suspense>} />
        <Route path="/rhenlink" element={<Navigate to="/private" replace />} />

        <Route path="/work" element={<Navigate to="/research" replace />} />
        <Route path="/lab" element={<Navigate to="/research" replace />} />
        <Route path="/notes" element={<Navigate to="/record" replace />} />
        <Route path="/wiki" element={<Navigate to="/system" replace />} />
        <Route path="/wiki/archive/transcosmic" element={<Navigate to="/record" replace />} />
        <Route path="/about" element={<Navigate to="/system" replace />} />
        <Route path="/proof" element={<Navigate to="/performance" replace />} />
        <Route path="/method" element={<Navigate to="/system" replace />} />
        <Route path="/the-book" element={<Navigate to="/record" replace />} />
        <Route path="/reply" element={<Navigate to="/record" replace />} />
        <Route path="/stories/reply" element={<Navigate to="/record" replace />} />
        <Route path="/universe" element={<Navigate to="/record" replace />} />
        <Route path="/lattice" element={<Navigate to="/record" replace />} />
        <Route path="/store" element={<Navigate to="/record" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
