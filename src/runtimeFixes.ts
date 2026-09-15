function scrollToCurrentHash() {
  if (!window.location.hash) return;

  window.requestAnimationFrame(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "auto" });
  });
}

export function installRuntimeFixes() {
  window.addEventListener("popstate", scrollToCurrentHash);
  window.addEventListener("hashchange", scrollToCurrentHash);
  scrollToCurrentHash();
}
