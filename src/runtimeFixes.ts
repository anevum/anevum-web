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

export function installRuntimeFixes() {
  const syncViewport = () => {
    resetHorizontalViewport();
    scrollToCurrentHash();
  };

  window.addEventListener("popstate", syncViewport);
  window.addEventListener("hashchange", syncViewport);
  window.addEventListener("pageshow", resetHorizontalViewport);
  window.addEventListener("orientationchange", resetHorizontalViewport);
  window.addEventListener("resize", resetHorizontalViewport, { passive: true });

  resetHorizontalViewport();
  scrollToCurrentHash();
}
