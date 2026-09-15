import { useEffect, useState } from "react";
import ReplyLaunch from "./ReplyLaunch";
import { BookPage, StoryPage, StorePage } from "./LaunchPages";
import { Rhenlink } from "./RhenlinkV2";
import { AuthBridgePage, SystemSessionBridge } from "./AuthBridge";
import { CommandHome } from "./CommandPage";
import { AchievementLayer } from "./MemberChrome";
import { trackMemberRoute } from "./memberState";
import { UnifiedSystemShell } from "./SystemShell";

const ROOT_HOST = "anevum.com";
const COMMAND_HOST = "command.anevum.com";

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

function publicMeta(pathname: string) {
  switch (pathname) {
    case "/the-book":
      return {
        title: "REPLY — The Book | ANEVUM",
        description: "REPLY is The Transcosmic Book One, a science-fiction novel by Devon Akins and the first publication from ANEVUM.",
        canonical: "https://anevum.com/the-book",
        ogTitle: "REPLY — The Book",
      };
    case "/the-story":
      return {
        title: "The Story of REPLY | ANEVUM",
        description: "Enter the spoiler-light public story doorway into REPLY, The Transcosmic Book One by Devon Akins.",
        canonical: "https://anevum.com/the-story",
        ogTitle: "The Story of REPLY",
      };
    case "/store":
      return {
        title: "ANEVUM Store — REPLY",
        description: "The ANEVUM store begins with REPLY by Devon Akins. Edition and purchase details appear only when they are live.",
        canonical: "https://anevum.com/store",
        ogTitle: "ANEVUM Store — REPLY",
      };
    case "/rhenlink":
      return {
        title: "RHENLINK — ANEVUM Identity",
        description: "RHENLINK is the persistent member identity for ANEVUM.",
        canonical: "https://anevum.com/rhenlink",
        ogTitle: "RHENLINK — ANEVUM",
      };
    default:
      return {
        title: "REPLY by Devon Akins — ANEVUM",
        description: "REPLY, the first Transcosmic novel by Devon Akins. A worker follows a measurement she cannot explain into a civilization already living across worlds.",
        canonical: "https://anevum.com/",
        ogTitle: "REPLY by Devon Akins",
      };
  }
}

export default function App() {
  const { pathname, hostname } = useLocationState();
  const bridgeRoute = hostname === ROOT_HOST && pathname === "/auth-bridge";
  const commandRoute = hostname === COMMAND_HOST || pathname === "/command";
  const rhenlinkRoute = hostname === ROOT_HOST && pathname === "/rhenlink";
  const bookRoute = hostname === ROOT_HOST && pathname === "/the-book";
  const storyRoute = hostname === ROOT_HOST && pathname === "/the-story";
  const storeRoute = hostname === ROOT_HOST && pathname === "/store";
  const knownPublicRoute = pathname === "/" || rhenlinkRoute || bookRoute || storyRoute || storeRoute;

  useEffect(() => {
    const meta = publicMeta(pathname);
    const canonicalUrl = commandRoute ? "https://command.anevum.com/" : meta.canonical;

    document.documentElement.dataset.surface = bridgeRoute
      ? "bridge"
      : commandRoute
        ? "command"
        : rhenlinkRoute
          ? "rhenlink"
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
  }, [pathname, hostname, bridgeRoute, commandRoute, rhenlinkRoute, knownPublicRoute]);

  useEffect(() => {
    if (bridgeRoute || commandRoute || hostname !== ROOT_HOST || !knownPublicRoute) return;
    const recordRoute = () => trackMemberRoute(pathname || "/");
    recordRoute();
    window.addEventListener("anevum-member-session", recordRoute);
    return () => window.removeEventListener("anevum-member-session", recordRoute);
  }, [hostname, pathname, bridgeRoute, commandRoute, knownPublicRoute]);

  if (bridgeRoute) return <AuthBridgePage />;

  if (commandRoute) {
    return (
      <div className="unified-runtime-shell">
        <SystemSessionBridge hostname={hostname} />
        <UnifiedSystemShell surface="command" pathname={pathname} hostname={hostname}>
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
  if (storeRoute) return <><StorePage /><AchievementLayer /></>;

  return (
    <>
      <ReplyLaunch />
      <AchievementLayer />
    </>
  );
}
