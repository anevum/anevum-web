import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PublicShell } from "./components/Shell";

const Command = lazy(() => import("./pages/Command"));
const Home = lazy(() => import("./pages/Home"));
const PrivateAccess = lazy(() => import("./pages/Rhenlink"));

const titles: Record<string, string> = {
  "/": "ANEVUM — Devon Akins",
  "/private": "Private — ANEVUM",
  "/command": "Command — ANEVUM"
};

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      const hash = location.hash.replace("#", "");
      if (hash) {
        requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
      }
    } else {
      window.scrollTo(0, 0);
    }
    document.title = titles[location.pathname] || "ANEVUM";
  }, [location.pathname, location.hash]);

  return null;
}

function Loader() {
  return <div className="route-loader"><span>ANEVUM</span><i /></div>;
}

function PublicExperience() {
  return (
    <PublicShell>
      <Suspense fallback={<Loader />}>
        <Home />
      </Suspense>
    </PublicShell>
  );
}

export default function App() {
  return (
    <>
      <RouteEffects />
      <Routes>
        <Route path="/" element={<PublicExperience />} />
        <Route path="/private" element={<Suspense fallback={<Loader />}><PrivateAccess /></Suspense>} />
        <Route path="/command" element={<Suspense fallback={<Loader />}><Command /></Suspense>} />
        <Route path="/rhenlink" element={<Navigate to="/" replace />} />
        <Route path="/work" element={<Navigate to="/#now" replace />} />
        <Route path="/lab" element={<Navigate to="/#system" replace />} />
        <Route path="/record" element={<Navigate to="/#evidence" replace />} />
        <Route path="/notes" element={<Navigate to="/#mind" replace />} />
        <Route path="/wiki" element={<Navigate to="/#other" replace />} />
        <Route path="/wiki/archive/transcosmic" element={<Navigate to="/#other" replace />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/proof" element={<Navigate to="/#evidence" replace />} />
        <Route path="/research" element={<Navigate to="/#mind" replace />} />
        <Route path="/method" element={<Navigate to="/#system" replace />} />
        <Route path="/the-book" element={<Navigate to="/#other" replace />} />
        <Route path="/reply" element={<Navigate to="/#other" replace />} />
        <Route path="/stories/reply" element={<Navigate to="/#other" replace />} />
        <Route path="/universe" element={<Navigate to="/#other" replace />} />
        <Route path="/lattice" element={<Navigate to="/#other" replace />} />
        <Route path="/store" element={<Navigate to="/#other" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
