const ROOT_HOST = "anevum.com";
const WIKI_HOST = "wiki.anevum.com";
const LATTICE_HOST = "lattice.anevum.com";
const COMMAND_HOST = "command.anevum.com";

function scrollToCurrentHash() {
  if (!window.location.hash) return;

  window.requestAnimationFrame(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "auto" });
  });
}

function resetHorizontalViewport() {
  window.requestAnimationFrame(() => {
    const top = window.scrollY;
    const scrollingElement = document.scrollingElement;
    if (scrollingElement && scrollingElement.scrollLeft !== 0) scrollingElement.scrollLeft = 0;
    if (window.scrollX !== 0) window.scrollTo({ left: 0, top, behavior: "auto" });
  });
}

export function resolveCanonicalRuntimeTarget(
  rawHostname: string,
  rawPathname: string,
  search = "",
  hash = "",
) {
  const hostname = String(rawHostname || "").trim().toLowerCase();
  const path = String(rawPathname || "/").replace(/\/+$/, "") || "/";

  if (hostname === ROOT_HOST) {
    // Same-origin Wiki, LATTICE and COMMAND routes are canonical now.
    // Never bounce them back to subdomains or RHENLINK storage will fork.
    if (path === "/stories" || path.startsWith("/stories/")) {
      return `/the-book${search}${hash}`;
    }
    return null;
  }

  if (hostname === WIKI_HOST) {
    const targetPath = path === "/" ? "/wiki" : `/wiki${path}`;
    return `https://${ROOT_HOST}${targetPath}${search}${hash}`;
  }

  if (hostname === LATTICE_HOST) {
    const targetPath = path === "/" ? "/lattice" : `/lattice${path}`;
    return `https://${ROOT_HOST}${targetPath}${search}${hash}`;
  }

  if (hostname === COMMAND_HOST) {
    return `https://${ROOT_HOST}/command${search}${hash}`;
  }

  return null;
}

function canonicalSurfaceRedirect() {
  const target = resolveCanonicalRuntimeTarget(
    window.location.hostname,
    window.location.pathname,
    window.location.search,
    window.location.hash,
  );
  if (!target) return false;

  if (target.startsWith("/")) {
    window.history.replaceState({}, "", target);
    return false;
  }

  window.location.replace(target);
  return true;
}

export function installRuntimeFixes() {
  if (canonicalSurfaceRedirect()) return;

  const syncViewport = () => {
    if (canonicalSurfaceRedirect()) return;
    resetHorizontalViewport();
    scrollToCurrentHash();
  };

  window.addEventListener("popstate", syncViewport);
  window.addEventListener("hashchange", syncViewport);
  window.addEventListener("pageshow", () => {
    if (!canonicalSurfaceRedirect()) resetHorizontalViewport();
  });
  window.addEventListener("orientationchange", resetHorizontalViewport);
  window.addEventListener("resize", resetHorizontalViewport, { passive: true });

  resetHorizontalViewport();
  scrollToCurrentHash();
}
