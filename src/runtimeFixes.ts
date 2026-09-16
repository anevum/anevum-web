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

function canonicalSurfaceRedirect() {
  const hostname = window.location.hostname.toLowerCase();
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (hostname !== ROOT_HOST && !hostname.endsWith(".anevum.com")) return false;

  if (hostname === ROOT_HOST && (path === "/stories" || path.startsWith("/stories/"))) {
    window.location.replace(`https://${ROOT_HOST}/the-book${window.location.search}${window.location.hash}`);
    return true;
  }

  if (hostname === ROOT_HOST && (path === "/wiki" || path.startsWith("/wiki/"))) {
    const relative = path === "/wiki" ? "/" : path.slice(5) || "/";
    window.location.replace(`https://${WIKI_HOST}${relative}${window.location.search}${window.location.hash}`);
    return true;
  }

  if (hostname === ROOT_HOST && (path === "/lattice" || path.startsWith("/lattice/"))) {
    const relative = path === "/lattice" ? "/" : path.slice(8) || "/";
    window.location.replace(`https://${LATTICE_HOST}${relative}${window.location.search}${window.location.hash}`);
    return true;
  }

  if (hostname === ROOT_HOST && (path === "/command" || path.startsWith("/command/"))) {
    const relative = path === "/command" ? "/" : path.slice(8) || "/";
    window.location.replace(`https://${COMMAND_HOST}${relative}${window.location.search}${window.location.hash}`);
    return true;
  }

  return false;
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
