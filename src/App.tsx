import { useEffect, useState, type ReactNode } from "react";
import ReplyLaunch from "./ReplyLaunch";
import { BookPage, StorePage, StoryPage } from "./LaunchPages";
import { Launch404 } from "./Launch404";
import { Rhenlink } from "./RhenlinkV2";
import { Lattice } from "./LatticeV2";
import { AuthBridgePage, SystemSessionBridge } from "./AuthBridge";
import { CommandHome } from "./CommandPage";
import { CanonicalWikiArticle, CanonicalWikiHome } from "./CanonicalWiki";
import { WikiAdminPage, WikiContributionPage, WikiSavedPage } from "./ModeratedWiki";
import { AchievementLayer } from "./MemberChrome";
import { ContactPage, PrivacyPage, PublicLegalStrip, RhenlinkAccountNotice, TermsPage } from "./LegalPages";
import { capturePageView, type AnalyticsSurface } from "./analytics";
import { getCanonProjectionRecord } from "./canonProjection";
import { trackMemberRoute } from "./memberState";
import { UnifiedSystemShell } from "./SystemShell";

const ROOT_HOST = "anevum.com";
const WIKI_HOST = "wiki.anevum.com";
const LATTICE_HOST = "lattice.anevum.com";
const COMMAND_HOST = "command.anevum.com";
const STRUCTURED_DATA_ID = "anevum-structured-data";

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function useLocationState() {
  const [location, setLocation] = useState(() => ({
    pathname: window.location.pathname,
    hostname: window.location.hostname.toLowerCase(),
  }));

  useEffect(() => {
    const sync = () => setLocation({
      pathname: window.location.pathname,
      hostname: window.location.hostname.toLowerCase(),
    });
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return location;
}

function ensureMeta(selector: string, attribute: "name" | "property", key: string) {
  let element = document.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  return element;
}

function setStructuredData(value: Record<string, unknown> | null) {
  let script = document.getElementById(STRUCTURED_DATA_ID) as HTMLScriptElement | null;
  if (!value) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.id = STRUCTURED_DATA_ID;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(value);
}

function replyBookSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "REPLY",
    url: "https://anevum.com/the-book",
    description: "REPLY is The Transcosmic Book One, a science-fiction novel by Devon Akins and the first publication from ANEVUM.",
    author: { "@type": "Person", name: "Devon Akins" },
    isPartOf: { "@type": "BookSeries", name: "The Transcosmic" },
  };
}

function rootPublicMeta(pathname: string, knownPublicRoute: boolean) {
  if (!knownPublicRoute) {
    return {
      title: "Signal Lost — ANEVUM",
      description: "This ANEVUM route does not resolve or is not public yet.",
      canonical: `https://anevum.com${pathname}`,
      ogTitle: "Signal Lost — ANEVUM",
      ogType: "website",
    };
  }

  switch (pathname) {
    case "/the-book":
      return {
        title: "REPLY — The Book | ANEVUM",
        description: "REPLY is The Transcosmic Book One, a science-fiction novel by Devon Akins and the first publication from ANEVUM.",
        canonical: "https://anevum.com/the-book",
        ogTitle: "REPLY — The Book",
        ogType: "book",
      };
    case "/the-story":
      return {
        title: "The Story of REPLY | ANEVUM",
        description: "Enter the spoiler-light public story doorway into REPLY, The Transcosmic Book One by Devon Akins.",
        canonical: "https://anevum.com/the-story",
        ogTitle: "The Story of REPLY",
        ogType: "article",
      };
    case "/store":
      return {
        title: "ANEVUM Store — REPLY",
        description: "Official availability and editions for REPLY, The Transcosmic Book One by Devon Akins.",
        canonical: "https://anevum.com/store",
        ogTitle: "ANEVUM Store — REPLY",
        ogType: "website",
      };
    case "/rhenlink":
      return {
        title: "RHENLINK — ANEVUM Identity",
        description: "RHENLINK is the persistent member identity for ANEVUM.",
        canonical: "https://anevum.com/rhenlink",
        ogTitle: "RHENLINK — ANEVUM",
        ogType: "website",
      };
    case "/privacy":
      return {
        title: "Privacy — ANEVUM",
        description: "How the current ANEVUM website and RHENLINK member system use account, progress, release-preference, and optional analytics data.",
        canonical: "https://anevum.com/privacy",
        ogTitle: "Privacy — ANEVUM",
        ogType: "website",
      };
    case "/terms":
      return {
        title: "Terms — ANEVUM",
        description: "Launch-era terms for the ANEVUM website, RHENLINK, Wiki, Lattice, progression systems, and external REPLY purchase links.",
        canonical: "https://anevum.com/terms",
        ogTitle: "Terms — ANEVUM",
        ogType: "website",
      };
    case "/contact":
      return {
        title: "Contact — ANEVUM",
        description: "Current public contact and support status for ANEVUM, REPLY, and RHENLINK.",
        canonical: "https://anevum.com/contact",
        ogTitle: "Contact — ANEVUM",
        ogType: "website",
      };
    default:
      return {
        title: "REPLY by Devon Akins — ANEVUM",
        description: "REPLY, the first Transcosmic novel by Devon Akins. A worker follows a measurement she cannot explain into a civilization already living across worlds.",
        canonical: "https://anevum.com/",
        ogTitle: "REPLY by Devon Akins",
        ogType: "book",
      };
  }
}

function wikiSurfacePath(hostname: string, routePath: string) {
  if (hostname === WIKI_HOST) return routePath;
  if (routePath === "/wiki") return "/";
  if (routePath.startsWith("/wiki/")) return routePath.slice(5) || "/";
  return "/";
}

function wikiContent(pathname: string): ReactNode {
  if (pathname === "/") return <CanonicalWikiHome />;
  if (pathname === "/new") return <WikiContributionPage />;
  if (pathname === "/saved") return <WikiSavedPage />;
  if (pathname === "/admin") return <WikiAdminPage />;

  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  if (normalized.endsWith("/edit")) {
    const slug = normalized.slice(0, -5).replace(/\/$/, "");
    return <WikiContributionPage editSlug={decodeURIComponent(slug)} />;
  }
  return <CanonicalWikiArticle slug={decodeURIComponent(normalized)} />;
}

export default function App() {
  const { pathname, hostname } = useLocationState();
  const routePath = normalizePath(pathname);

  const bridgeRoute = hostname === ROOT_HOST && routePath === "/auth-bridge";
  const commandRoute = hostname === COMMAND_HOST || (hostname === ROOT_HOST && routePath === "/command");
  const wikiRoute = hostname === WIKI_HOST || (hostname === ROOT_HOST && (routePath === "/wiki" || routePath.startsWith("/wiki/")));
  const latticeRoute = hostname === LATTICE_HOST || (hostname === ROOT_HOST && routePath === "/lattice");
  const rhenlinkRoute = hostname === ROOT_HOST && routePath === "/rhenlink";
  const bookRoute = hostname === ROOT_HOST && routePath === "/the-book";
  const storyRoute = hostname === ROOT_HOST && routePath === "/the-story";
  const storeRoute = hostname === ROOT_HOST && routePath === "/store";
  const privacyRoute = hostname === ROOT_HOST && routePath === "/privacy";
  const termsRoute = hostname === ROOT_HOST && routePath === "/terms";
  const contactRoute = hostname === ROOT_HOST && routePath === "/contact";
  const legalRoute = privacyRoute || termsRoute || contactRoute;
  const rootMemberRoute = routePath === "/" || rhenlinkRoute || bookRoute || storyRoute || storeRoute;
  const knownRootPublicRoute = rootMemberRoute || legalRoute || wikiRoute || latticeRoute;
  const notFoundRoute = hostname === ROOT_HOST && !bridgeRoute && !commandRoute && !knownRootPublicRoute;
  const wikiPath = wikiSurfacePath(hostname, routePath);
  const wikiPrivatePath = wikiPath === "/new" || wikiPath === "/saved" || wikiPath === "/admin" || wikiPath.endsWith("/edit");
  const wikiSlug = !wikiPrivatePath && wikiPath !== "/" ? decodeURIComponent(wikiPath.replace(/^\/+|\/+$/g, "")) : "";
  const wikiRecord = wikiSlug ? getCanonProjectionRecord(wikiSlug) : null;
  const memberRoute = wikiRoute
    ? (wikiPath === "/" ? "/wiki" : `/wiki${wikiPath}`)
    : latticeRoute
      ? "/lattice"
      : routePath;
  const trackableMemberSurface = !bridgeRoute && !commandRoute && !wikiPrivatePath && (
    (hostname === ROOT_HOST && rootMemberRoute)
    || (hostname === WIKI_HOST && wikiRoute)
    || (hostname === LATTICE_HOST && latticeRoute)
  );
  const analyticsSurface: AnalyticsSurface = wikiRoute
    ? "wiki"
    : latticeRoute
      ? "lattice"
      : rhenlinkRoute
        ? "rhenlink"
        : bookRoute
          ? "book"
          : storyRoute
            ? "story"
            : storeRoute
              ? "store"
              : legalRoute
                ? "legal"
                : "reply";
  const trackableAnalyticsSurface = !bridgeRoute && !commandRoute && !notFoundRoute && !wikiPrivatePath && (
    (hostname === ROOT_HOST && knownRootPublicRoute)
    || (hostname === WIKI_HOST && wikiRoute)
    || (hostname === LATTICE_HOST && latticeRoute)
  );

  useEffect(() => {
    const rootMeta = rootPublicMeta(routePath, knownRootPublicRoute);
    const meta = commandRoute
      ? {
          title: "ANEVUM COMMAND",
          description: "Private ANEVUM operations interface for Wiki state, Lattice, RHENLINK and system control.",
          canonical: "https://command.anevum.com/",
          ogTitle: "ANEVUM COMMAND",
          ogType: "website",
        }
      : wikiRoute
        ? {
            title: wikiRecord ? `${wikiRecord.title} — ANEVUM Wiki` : "ANEVUM Wiki",
            description: wikiRecord?.summary || "The publication-safe surface of the live ANEVUM Wiki and its canonical lifecycle state.",
            canonical: `https://wiki.anevum.com${wikiPath === "/" ? "/" : wikiPath}`,
            ogTitle: wikiRecord ? `${wikiRecord.title} — ANEVUM Wiki` : "ANEVUM Wiki",
            ogType: wikiRecord ? "article" : "website",
          }
        : latticeRoute
          ? {
              title: "Lattice — ANEVUM",
              description: "ANEVUM records expressed as a relational navigation surface, subordinate to the live Wiki.",
              canonical: "https://lattice.anevum.com/",
              ogTitle: "Lattice — ANEVUM",
              ogType: "website",
            }
          : rootMeta;

    document.documentElement.dataset.surface = bridgeRoute
      ? "bridge"
      : commandRoute
        ? "command"
        : wikiRoute
          ? "wiki"
          : latticeRoute
            ? "lattice"
            : rhenlinkRoute
              ? "rhenlink"
              : legalRoute
                ? "legal"
                : notFoundRoute
                  ? "not-found"
                  : "reply";
    document.documentElement.dataset.host = hostname;
    document.title = bridgeRoute ? "ANEVUM Identity Bridge" : meta.title;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = bridgeRoute ? "https://anevum.com/auth-bridge" : meta.canonical;

    const robots = ensureMeta('meta[name="robots"]', "name", "robots");
    robots.content = bridgeRoute || commandRoute || rhenlinkRoute || notFoundRoute || wikiPrivatePath
      ? "noindex,follow,noarchive"
      : "index,follow,max-image-preview:large";

    const description = ensureMeta('meta[name="description"]', "name", "description");
    description.content = meta.description;

    const ogTitle = ensureMeta('meta[property="og:title"]', "property", "og:title");
    ogTitle.content = meta.ogTitle;
    const ogDescription = ensureMeta('meta[property="og:description"]', "property", "og:description");
    ogDescription.content = meta.description;
    const ogUrl = ensureMeta('meta[property="og:url"]', "property", "og:url");
    ogUrl.content = bridgeRoute ? "https://anevum.com/auth-bridge" : meta.canonical;
    const ogType = ensureMeta('meta[property="og:type"]', "property", "og:type");
    ogType.content = meta.ogType;

    const twitterTitle = ensureMeta('meta[name="twitter:title"]', "name", "twitter:title");
    twitterTitle.content = meta.ogTitle;
    const twitterDescription = ensureMeta('meta[name="twitter:description"]', "name", "twitter:description");
    twitterDescription.content = meta.description;

    if (hostname === ROOT_HOST && (routePath === "/" || routePath === "/the-book")) {
      setStructuredData(replyBookSchema());
    } else if (wikiRoute && wikiRecord) {
      setStructuredData({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: wikiRecord.title,
        description: wikiRecord.summary,
        url: `https://wiki.anevum.com/${wikiRecord.slug}`,
        isPartOf: { "@type": "WebSite", name: "ANEVUM Wiki", url: "https://wiki.anevum.com/" },
      });
    } else {
      setStructuredData(null);
    }
  }, [routePath, hostname, bridgeRoute, commandRoute, wikiRoute, latticeRoute, rhenlinkRoute, legalRoute, knownRootPublicRoute, notFoundRoute, wikiPath, wikiPrivatePath, wikiRecord]);

  useEffect(() => {
    if (!trackableAnalyticsSurface) return;
    capturePageView(analyticsSurface, routePath);
  }, [analyticsSurface, routePath, trackableAnalyticsSurface]);

  useEffect(() => {
    if (!trackableMemberSurface) return;
    const recordRoute = () => trackMemberRoute(memberRoute);
    recordRoute();
    window.addEventListener("anevum-member-session", recordRoute);
    return () => window.removeEventListener("anevum-member-session", recordRoute);
  }, [memberRoute, trackableMemberSurface]);

  if (bridgeRoute) return <AuthBridgePage />;

  if (commandRoute) {
    return (
      <div className="unified-runtime-shell">
        <SystemSessionBridge hostname={hostname} />
        <UnifiedSystemShell surface="command" pathname={routePath} hostname={hostname}>
          <CommandHome />
        </UnifiedSystemShell>
      </div>
    );
  }

  if (wikiRoute) {
    return (
      <div className="unified-runtime-shell">
        <SystemSessionBridge hostname={hostname} />
        <UnifiedSystemShell surface="wiki" pathname={wikiPath} hostname={hostname}>
          {wikiContent(wikiPath)}
        </UnifiedSystemShell>
        <AchievementLayer />
      </div>
    );
  }

  if (latticeRoute) {
    return (
      <div className="unified-runtime-shell">
        <SystemSessionBridge hostname={hostname} />
        <UnifiedSystemShell surface="lattice" pathname={routePath} hostname={hostname}>
          <Lattice />
        </UnifiedSystemShell>
        <AchievementLayer />
      </div>
    );
  }

  if (privacyRoute) return <PrivacyPage />;
  if (termsRoute) return <TermsPage />;
  if (contactRoute) return <ContactPage />;

  if (rhenlinkRoute) {
    return (
      <div className="editorial-shell editorial-surface-rhenlink launch-rhenlink-shell">
        <Rhenlink />
        <RhenlinkAccountNotice />
        <PublicLegalStrip />
        <AchievementLayer />
      </div>
    );
  }

  if (bookRoute) return <><BookPage /><PublicLegalStrip /><AchievementLayer /></>;
  if (storyRoute) return <><StoryPage /><PublicLegalStrip /><AchievementLayer /></>;
  if (storeRoute) return <><StorePage /><PublicLegalStrip /><AchievementLayer /></>;
  if (notFoundRoute) return <><Launch404 /><AchievementLayer /></>;

  return (
    <>
      <ReplyLaunch />
      <PublicLegalStrip />
      <AchievementLayer />
    </>
  );
}
