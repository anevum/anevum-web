import { useEffect, useState } from "react";
import ReplyLaunch from "./ReplyLaunch";
import { Rhenlink } from "./RhenlinkV2";
import { AuthBridgePage, SystemSessionBridge } from "./AuthBridge";
import { CommandHome } from "./CommandPage";
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

export default function App() {
  const { pathname, hostname } = useLocationState();
  const bridgeRoute = hostname === ROOT_HOST && pathname === "/auth-bridge";
  const commandRoute = hostname === COMMAND_HOST || pathname === "/command";
  const rhenlinkRoute = hostname === ROOT_HOST && pathname === "/rhenlink";

  useEffect(() => {
    const canonicalUrl = commandRoute
      ? "https://command.anevum.com/"
      : rhenlinkRoute
        ? "https://anevum.com/rhenlink"
        : "https://anevum.com/";

    document.documentElement.dataset.surface = bridgeRoute
      ? "bridge"
      : commandRoute
        ? "command"
        : rhenlinkRoute
          ? "rhenlink"
          : "reply";
    document.documentElement.dataset.host = hostname;
    document.title = bridgeRoute
      ? "ANEVUM Identity Bridge"
      : commandRoute
        ? "ANEVUM COMMAND"
        : rhenlinkRoute
          ? "RHENLINK — ANEVUM Identity"
          : "REPLY by Devon Akins — ANEVUM";

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = bridgeRoute ? "https://anevum.com/auth-bridge" : canonicalUrl;

    const robots = ensureMeta('meta[name="robots"]', "name", "robots");
    robots.content = bridgeRoute || commandRoute || rhenlinkRoute || hostname !== ROOT_HOST
      ? "noindex,follow,noarchive"
      : "index,follow,max-image-preview:large";

    const description = ensureMeta('meta[name="description"]', "name", "description");
    description.content = commandRoute
      ? "Private ANEVUM operations interface."
      : rhenlinkRoute
        ? "RHENLINK is the persistent member identity for ANEVUM."
        : "REPLY, the first Transcosmic novel by Devon Akins. A worker follows a measurement she cannot explain into a civilization already living across worlds.";

    const ogTitle = ensureMeta('meta[property="og:title"]', "property", "og:title");
    ogTitle.content = commandRoute ? "ANEVUM COMMAND" : rhenlinkRoute ? "RHENLINK — ANEVUM" : "REPLY by Devon Akins";
    const ogDescription = ensureMeta('meta[property="og:description"]', "property", "og:description");
    ogDescription.content = commandRoute
      ? "Private ANEVUM operations interface."
      : rhenlinkRoute
        ? "Your persistent identity across ANEVUM."
        : "The first Transcosmic novel. A measurement that should be ordinary opens a larger universe.";
    const ogUrl = ensureMeta('meta[property="og:url"]', "property", "og:url");
    ogUrl.content = bridgeRoute ? "https://anevum.com/auth-bridge" : canonicalUrl;
  }, [pathname, hostname, bridgeRoute, commandRoute, rhenlinkRoute]);

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
      <div className="unified-runtime-shell">
        <SystemSessionBridge hostname={hostname} />
        <Rhenlink />
      </div>
    );
  }

  return <ReplyLaunch />;
}
