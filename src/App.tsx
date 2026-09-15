import { useEffect, useState } from "react";
import ReplyLaunch from "./ReplyLaunch";
import { BookPage, StoryPage } from "./LaunchPages";
import { Launch404 } from "./Launch404";
import { Rhenlink } from "./RhenlinkV2";
import { AuthBridgePage, SystemSessionBridge } from "./AuthBridge";
import { CommandHome } from "./CommandPage";
import { AchievementLayer } from "./MemberChrome";
import { trackMemberRoute } from "./memberState";
import { UnifiedSystemShell } from "./SystemShell";

const ROOT_HOST = "anevum.com";
const COMMAND_HOST = "command.anevum.com";

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

function publicMeta(pathname: string, knownPublicRoute: boolean) {
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
    case "/rhenlink":
      return {
        title: "RHENLINK — ANEVUM Identity",
        description: "RHENLINK is the persistent member identity for ANEVUM.",
        canonical: "https://anevum.com/rhenlink",
        ogTitle: "RHENLINK — ANEVUM",
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

export default function App() {
  const { pathname, hostname } = useLocationState();
  const routePath = normalizePath(pathname);
  const bridgeRoute = hostname === ROOT_HOST && routePath === "/auth-bridge";
  const commandRoute = hostname === COMMAND_HOST || routePath === "/command";
  const rhenlinkRoute = hostname === ROOT_HOST && routePath === "/rhenlink";
  const bookRoute = hostname === ROOT_HOST && routePath === "/the-book";
  const storyRoute = hostname === ROOT_HOST && routePath === "/the-story";
  const knownPublicRoute = routePath === "/" || rhenlinkRoute || bookRoute || storyRoute;
  const notFoundRoute = hostname === ROOT_HOST && !bridgeRoute && !commandRoute && !knownPublicRoute;

  useEffect(() => {
    const meta = publicMeta(routePath, knownPublicRoute);
    const canonicalUrl = commandRoute ? "https://command.anevum.com/" : meta.canonical;

    document.documentElement.dataset.surface = bridgeRoute
      ? "bridge"
      : commandRoute
        ? "command"
        : rhenlinkRoute
          ? "rhenlink"
          : notFoundRoute
            ? "not-found"
            : "reply";
    document.documentElement.dataset.host = hostname;
    document.title = bridgeRoute ? "ANEVUM Identity Bridge" : commandRoute ? "ANEVUM COMMAND" : meta.title;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = bridgeRoute ? "https://anevum.com/auth-bridge" : canonicalUrl;

    const robots = ensureMeta('meta[name="robots"]', "name", "robots");
    robots.content = bridgeRoute || commandRoute || rhenlinkRoute || hostname !== ROOT_HOST || !knownPublicRoute
      ? "noindex,follow,noarchive"
      : "index,follow,max-image-preview:large";

    const description = ensureMeta('meta[name="description"]', "name", "description");
    description.content = commandRoute ? "Private ANEVUM operations interface." : meta.description;

    const ogTitle = ensureMeta('meta[property="og:title"]', "property", "og:title");
    ogTitle.content = commandRoute ? "ANEVUM COMMAND" : meta.ogTitle;
    const ogDescription = ensureMeta('meta[property="og:description"]', "property", "og:description");
    ogDescription.content = commandRoute ? "Private ANEVUM operations interface." : meta.description;
    const ogUrl = ensureMeta('meta[property="og:url"]', "property", "og:url");
    ogUrl.content = bridgeRoute ? "https://anevum.com/auth-bridge" : canonicalUrl;
    const ogType = ensureMeta('meta[property="og:type"]', "property", "og:type");
    ogType.content = commandRoute ? "website" : meta.ogType;

    const twitterTitle = ensureMeta('meta[name="twitter:title"]', "name", "twitter:title");
    twitterTitle.content = commandRoute ? "ANEVUM COMMAND" : meta.ogTitle;
    const twitterDescription = ensureMeta('meta[name="twitter:description"]', "name", "twitter:description");
    twitterDescription.content = commandRoute ? "Private ANEVUM operations interface." : meta.description;
  }, [routePath, hostname, bridgeRoute, commandRoute, rhenlinkRoute, knownPublicRoute, notFoundRoute]);

  useEffect(() => {
    if (bridgeRoute || commandRoute || hostname !== ROOT_HOST || !knownPublicRoute) return;
    const recordRoute = () => trackMemberRoute(routePath);
    recordRoute();
    window.addEventListener("anevum-member-session", recordRoute);
    return () => window.removeEventListener("anevum-member-session", recordRoute);
  }, [hostname, routePath, bridgeRoute, commandRoute, knownPublicRoute]);

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

  if (rhenlinkRoute) {
    return (
      <div className="editorial-shell editorial-surface-rhenlink launch-rhenlink-shell">
        <Rhenlink />
        <AchievementLayer />
      </div>
    );
  }

  if (bookRoute) return <><BookPage /><AchievementLayer /></>;
  if (storyRoute) return <><StoryPage /><AchievementLayer /></>;
  if (notFoundRoute) return <><Launch404 /><AchievementLayer /></>;

  return (
    <>
      <ReplyLaunch />
      <AchievementLayer />
    </>
  );
}
