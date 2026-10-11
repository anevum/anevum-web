import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { OverflowPan } from "./components/OverflowPan";
import { fieldNotes } from "./data/fieldNotes";
import { rhenLessonBySlug } from "./data/rhen-learning";
import { currentRhenRelease, rhenReleaseBySlug } from "./data/releases";

const RhenTerminal = lazy(() => import("./pages/RhenTerminal"));
const Command = lazy(() => import("./pages/Command"));
const CommonsV5 = lazy(() => import("./commons/CommonsV5"));
const MemberHome = lazy(() => import("./pages/MemberHome"));
const MemberSettings = lazy(() => import("./pages/MemberSettings"));
const MemberBeta = lazy(() => import("./pages/MemberBeta"));
const MemberLearning = lazy(() => import("./pages/MemberLearning"));
const StudioDashboard = lazy(() => import("./pages/StudioDashboard"));
const MemberRewards = lazy(() => import("./pages/MemberRewards"));
const MemberStagingVerify = lazy(() => import("./pages/MemberStagingVerify"));
const RhenApp = lazy(() => import("./pages/RhenApp"));
const RhenReviewConnect = lazy(() => import("./pages/RhenReviewConnect"));

const titles: Record<string, string> = {
  "/": "The Commons — ANEVUM",
  "/communities": "Topics — ANEVUM Commons",
  "/learn": "Learning — ANEVUM Commons",
  "/products": "Projects — ANEVUM",
  "/beta": "Join the ANEVUM Beta — ANEVUM",
  "/feed": "Updates — ANEVUM",
  "/field-notes": "Field Notes — ANEVUM",
  "/updates": "Studio updates — ANEVUM",
  "/studio": "ANEVUM Studio — Administration",
  "/products/rhen": "RHEN — ANEVUM",
  "/products/rhen/learn": "Free RHEN lessons — ANEVUM",
  "/products/rhen/evidence": "RHEN Public Evidence — ANEVUM",
  "/products/rhen/architecture": "RHEN Architecture — ANEVUM",
  "/products/rhen/releases": "RHEN Releases — ANEVUM",
  "/about": "About — ANEVUM",
  "/help": "Help — ANEVUM Commons",
  "/resume": "Résumé — ANEVUM",
  "/sign-in": "Sign in — ANEVUM",
  "/me": "Command — ANEVUM",
  "/me/settings": "Account settings — ANEVUM",
  "/me/learning": "My learning - ANEVUM",
  "/me/beta": "Member beta checklist — ANEVUM",
  "/me/rewards": "Member rewards — ANEVUM",
  "/me/verify": "Staging verification — ANEVUM",
  "/privacy": "Privacy — ANEVUM",
  "/terms": "Terms — ANEVUM"
};

const descriptions: Record<string, string> = {
  "/": "The Commons is ANEVUM's evolving community for builders and researchers. Explore real first-party publications and RHEN development.",
  "/communities": "Browse real published ANEVUM work by topic. Public community discussions are still in development.",
  "/learn": "Learn from published ANEVUM research methods, experiments and engineering decisions.",
  "/products": "The canonical registry of public ANEVUM products. Products appear when they actually exist.",
  "/beta": "Explore ANEVUM member features, account sign-up and the private RHEN beta without requiring a broker.",
  "/feed": "Published ANEVUM Field Notes. New community posting and social interactions remain in development.",
  "/field-notes": "ANEVUM Field Notes document research decisions, failures, engineering changes, releases, and measured evidence.",
  "/updates": "Real published project updates and AHA posts from ANEVUM Studio.",
  "/studio": "Owner and administrator editorial management.",
  "/products/rhen": "RHEN is ANEVUM's research application under V5 reconstruction. Legacy live trading is suspended; member brokerage and execution are not available.",
  "/products/rhen/learn": "Two free lessons covering market orders, trading costs, risk mathematics and research evidence. No account or broker required.",
  "/products/rhen/evidence": "RHEN V5 rebuild and historical public evidence; no active legacy trading telemetry.",
  "/products/rhen/architecture": "Inspect RHEN execution, research, replay, forecasting, control, storage, and evidence boundaries.",
  "/products/rhen/releases": "RHEN release records document production changes, verification, limitations, and public system history.",
  "/about": "About ANEVUM, the independently built and operated software studio.",
  "/help": "Help with ANEVUM public research, member accounts, privacy and RHEN availability.",
  "/resume": "Professional résumé and background for the person responsible for ANEVUM.",
  "/sign-in": "ANEVUM account access.",
  "/me": "Your private ANEVUM project library and follows.",
  "/me/settings": "Private ANEVUM profile and account settings.",
  "/me/learning": "Your optional private lesson progress.",
  "/me/beta": "Private member tools and test availability.",
  "/me/rewards": "Status and future plans for ANEVUM member rewards.",
  "/me/verify": "Private read-only staging member account security checks.",
  "/privacy": "ANEVUM privacy information.",
  "/terms": "ANEVUM website terms."
};

const publishedPublicPaths = new Set([
  "/", "/products", "/beta", "/feed", "/field-notes", "/updates", "/communities", "/learn",
  "/products/rhen", "/products/rhen/learn", "/products/rhen/evidence", "/products/rhen/architecture",
  "/products/rhen/releases", "/about", "/help", "/resume", "/privacy", "/terms"
]);

function isPublishedPublicPath(pathname: string) {
  if (publishedPublicPaths.has(pathname)) return true;
  if (/^\/updates\/[a-z0-9-]{1,96}$/.test(pathname)) return true;
  if (pathname.startsWith("/products/rhen/learn/")) {
    const slug = pathname.slice("/products/rhen/learn/".length);
    return Boolean(rhenLessonBySlug(slug));
  }
  if (pathname.startsWith("/field-notes/")) {
    const slug = pathname.slice("/field-notes/".length);
    return fieldNotes.some(note => note.slug === slug);
  }
  if (pathname.startsWith("/products/rhen/releases/")) {
    return Boolean(rhenReleaseBySlug(pathname.slice("/products/rhen/releases/".length)));
  }
  return false;
}

function ensureMeta(selector: string, create: () => HTMLElement, content: string) {
  let node = document.head.querySelector(selector) as HTMLElement | null;
  if (!node) {
    node = create();
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function setRouteMeta(pathname: string, title: string, description: string, indexable: boolean) {
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
  }, indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow,noarchive");

  for (const [property, value] of [
    ["og:title", title],
    ["og:description", description],
    ["og:url", indexable ? canonicalUrl : "https://anevum.com/"],
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
  if (!indexable) {
    // Private, moderator and missing pages must not advertise an indexable
    // canonical URL, even when the client navigates from a public page.
    canonical?.remove();
  } else {
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }
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
    // Dynamic Studio detail pages remain noindex until server-verified per-entry metadata ships.
    const protectedRoute = path.startsWith("/updates/") || path.startsWith("/studio") || path.startsWith("/command") || path === "/sign-in" ||
      path.startsWith("/me") || path.startsWith("/apps/") ||
      path === "/communities/moderation";
    const missingRoute = !protectedRoute && !isPublishedPublicPath(path);
    let title = titles[path] || "ANEVUM — Independent Software";
    let description = descriptions[path] || descriptions["/"];

    if (path.startsWith("/apps/rhen/") || path === "/apps/rhen") {
      title = "RHEN Workspace — ANEVUM";
      description = "Authenticated RHEN application workspace.";
    } else if (path.startsWith("/command")) {
      title = path === "/command" ? "Command — ANEVUM" : "RHEN Terminal — ANEVUM";
      description = path === "/command" ? "Your private member profile and programs." : "Protected RHEN operator workspace.";
    } else if (path.startsWith("/products/rhen/learn/")) {
      const slug = path.slice("/products/rhen/learn/".length);
      const lesson = rhenLessonBySlug(slug);
      title = lesson ? lesson.title + " — Free RHEN Learning — ANEVUM" : "Lesson not found — ANEVUM";
      description = lesson?.summary || descriptions["/products/rhen/learn"];
    } else if (path.startsWith("/products/rhen/releases/")) {
      const slug = path.slice("/products/rhen/releases/".length);
      const release = rhenReleaseBySlug(slug);
      title = release ? "RHEN " + release.version + " — " + release.codename + " — ANEVUM" : "RHEN Releases — ANEVUM";
      description = release ? "Public release record for RHEN " + release.version + " " + release.codename + ", including production changes, verification, and limits." : descriptions["/products/rhen/releases"];
    } else if (path.startsWith("/updates/")) {
      title = "Studio publication — ANEVUM";
      description = "Publicly published ANEVUM update.";
    } else if (path.startsWith("/field-notes/")) {
      const slug = path.slice("/field-notes/".length);
      const note = fieldNotes.find((item) => item.slug === slug);
      title = note ? note.title + " — ANEVUM Field Notes" : "Field Note — ANEVUM";
      description = note?.summary || descriptions["/field-notes"];
    } else if (path === "/products/rhen/releases") {
      const current = currentRhenRelease();
      title = "RHEN Releases — " + current.version + " " + current.codename + " — ANEVUM";
    }

    if (missingRoute) {
      title = "Page not found — ANEVUM";
      description = "No published ANEVUM page or record exists at this address.";
    }
    setRouteMeta(path, title, description, !protectedRoute && !missingRoute);
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

export default function App() {
  return (
    <>
      <RouteEffects />
      <RouteScrollReset />
      <OverflowPan />
      <Routes>
        <Route path="/" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/products" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/beta" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/feed" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/field-notes" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/updates" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/updates/:slug" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/communities" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/communities/moderation" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/learn" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/field-notes/:slug" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/help" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/resume" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/sign-in" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/me" element={<Suspense fallback={<Loader />}><CommonsV5 content={<MemberHome />} /></Suspense>} />
        <Route path="/me/settings" element={<Suspense fallback={<Loader />}><CommonsV5 content={<MemberSettings />} /></Suspense>} />
        <Route path="/me/beta" element={<Suspense fallback={<Loader />}><CommonsV5 content={<MemberBeta />} /></Suspense>} />
        <Route path="/me/learning" element={<Suspense fallback={<Loader />}><CommonsV5 content={<MemberLearning />} /></Suspense>} />
        <Route path="/me/rewards" element={<Suspense fallback={<Loader />}><CommonsV5 content={<MemberRewards />} /></Suspense>} />
        <Route path="/me/verify" element={<Suspense fallback={<Loader />}><CommonsV5 content={<MemberStagingVerify />} /></Suspense>} />
        <Route path="/studio" element={<Suspense fallback={<Loader />}><CommonsV5 content={<StudioDashboard />} /></Suspense>} />
        <Route path="/apps/rhen/terminal/*" element={<LegacyRhenOperatorRoute />} />
        <Route path="/apps/rhen/command/*" element={<LegacyRhenOperatorRoute />} />
        <Route path="/apps/rhen/connect" element={<Suspense fallback={<Loader />}><CommonsV5 content={<RhenReviewConnect />} /></Suspense>} />
        <Route path="/apps/rhen/*" element={<Suspense fallback={<Loader />}><CommonsV5 content={<RhenApp />} /></Suspense>} />

        <Route path="/products/rhen" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/products/rhen/learn" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/products/rhen/learn/:slug" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/products/rhen/evidence" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/products/rhen/architecture" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/products/rhen/releases" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
        <Route path="/products/rhen/releases/:slug" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />

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

        <Route path="/iren" element={<Navigate to="/command/rhen/operate" replace />} />
        <Route path="/private" element={<Navigate to="/command/rhen/operate" replace />} />
        <Route path="/command" element={<Suspense fallback={<Loader />}><CommonsV5 content={<Command />} /></Suspense>} />
        <Route path="/command/rhen/*" element={<Suspense fallback={<Loader />}><RhenTerminal /></Suspense>} />
        <Route path="/command/*" element={<LegacyTerminalRedirect />} />
        <Route path="/rhenlink" element={<Navigate to="/command/rhen/operate" replace />} />

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

        <Route path="*" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />
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

function LegacyRhenOperatorRoute() {
  // Cloudflare Access now protects /command/rhen* and /api/command* only.
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);
  const suffix = parts.slice(3).join("/") || "operate";
  return <Navigate to={"/command/rhen/" + suffix} replace />;
}


function LegacyTerminalRedirect() {
  const location = useLocation();
  const suffix = location.pathname.slice("/command/".length) || "operate";
  return <Navigate to={"/command/rhen/" + suffix} replace />;
}
