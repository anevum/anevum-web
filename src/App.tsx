import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PublicShell } from "./components/Shell";
import About from "./pages/About";
import Archive from "./pages/Archive";
import Command from "./pages/Command";
import Home from "./pages/Home";
import Lab from "./pages/Lab";
import Notes from "./pages/Notes";
import NotFound from "./pages/NotFound";
import Record from "./pages/Record";
import Rhenlink from "./pages/Rhenlink";
import Wiki from "./pages/Wiki";
import Work from "./pages/Work";

const titles: Record<string, string> = {
  "/": "ANEVUM — Devon Akins",
  "/work": "Work — ANEVUM",
  "/lab": "Lab — ANEVUM",
  "/record": "Record — ANEVUM",
  "/notes": "Notes — ANEVUM",
  "/wiki": "Wiki — ANEVUM",
  "/wiki/archive/transcosmic": "Transcosmic Archive — ANEVUM",
  "/about": "About — ANEVUM",
  "/rhenlink": "RHENLINK — ANEVUM",
  "/command": "Command — ANEVUM"
};

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = titles[location.pathname] || "ANEVUM";
  }, [location.pathname]);

  return null;
}

function PublicRoutes() {
  return (
    <PublicShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work" element={<Work />} />
        <Route path="/lab" element={<Lab />} />
        <Route path="/record" element={<Record />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/wiki" element={<Wiki />} />
        <Route path="/wiki/archive/transcosmic" element={<Archive />} />
        <Route path="/about" element={<About />} />
        <Route path="/rhenlink" element={<Rhenlink />} />
        <Route path="/proof" element={<Navigate to="/record" replace />} />
        <Route path="/research" element={<Navigate to="/lab" replace />} />
        <Route path="/method" element={<Navigate to="/work" replace />} />
        <Route path="/the-book" element={<Navigate to="/wiki/archive/transcosmic" replace />} />
        <Route path="/reply" element={<Navigate to="/wiki/archive/transcosmic" replace />} />
        <Route path="/stories/reply" element={<Navigate to="/wiki/archive/transcosmic" replace />} />
        <Route path="/universe" element={<Navigate to="/wiki/archive/transcosmic" replace />} />
        <Route path="/lattice" element={<Navigate to="/wiki/archive/transcosmic" replace />} />
        <Route path="/store" element={<Navigate to="/wiki/archive/transcosmic" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PublicShell>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <>
      <RouteEffects />
      {location.pathname === "/command" ? <Command /> : <PublicRoutes />}
    </>
  );
}
