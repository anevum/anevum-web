import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { OverflowPan } from "./components/OverflowPan";
import { PublicShell } from "./components/Shell";

const Command = lazy(() => import("./pages/Command"));
const Home = lazy(() => import("./pages/Home"));
const Live = lazy(() => import("./pages/Live"));
const System = lazy(() => import("./pages/System"));
const Research = lazy(() => import("./pages/Research"));
const Record = lazy(() => import("./pages/Record"));
const PrivateAccess = lazy(() => import("./pages/Rhenlink"));

const titles: Record<string, string> = {
  "/": "ANEVUM",
  "/live": "Live — ANEVUM",
  "/system": "System — ANEVUM",
  "/research": "Research — ANEVUM",
  "/record": "Record — ANEVUM",
  "/private": "Private — ANEVUM",
  "/command": "Command — ANEVUM"
};

function RouteEffects() {
  const location = useLocation();
  useEffect(() => {
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
      <Routes>
        <Route path="/" element={<PublicExperience><Home /></PublicExperience>} />
        <Route path="/live" element={<PublicExperience><Live /></PublicExperience>} />
        <Route path="/system" element={<PublicExperience><System /></PublicExperience>} />
        <Route path="/research" element={<PublicExperience><Research /></PublicExperience>} />
        <Route path="/record" element={<PublicExperience><Record /></PublicExperience>} />

        <Route path="/private" element={<Suspense fallback={<Loader />}><PrivateAccess /></Suspense>} />
        <Route path="/command" element={<Suspense fallback={<Loader />}><Command /></Suspense>} />
        <Route path="/rhenlink" element={<Navigate to="/private" replace />} />

        <Route path="/work" element={<Navigate to="/research" replace />} />
        <Route path="/lab" element={<Navigate to="/research" replace />} />
        <Route path="/notes" element={<Navigate to="/record" replace />} />
        <Route path="/wiki" element={<Navigate to="/system" replace />} />
        <Route path="/wiki/archive/transcosmic" element={<Navigate to="/record" replace />} />
        <Route path="/about" element={<Navigate to="/system" replace />} />
        <Route path="/proof" element={<Navigate to="/live" replace />} />
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
