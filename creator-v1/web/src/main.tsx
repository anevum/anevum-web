import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import "./portal-overhaul.css";
import "./depth-system.css";
import "./member-profile.css";
import "./project-editor.css";
import "./start-page.css";
import "./field-guide.css";
import "./portal-launcher.css";
import "./cosmic-observatory.css";
import "./celestial-artifacts.css";
import "./cinematic-worlds.css";
import "./cinematic-polish.css";
import "./cinematic-subpages.css";
import "./cinematic-mobile-review.css";
import "./cinematic-raster-art.css";
import "./cinematic-final-polish.css";
import "./main-site-polish.css";
import "./cinematic-reference.css";
import "./cinematic-catalogue.css";
import "./cinematic-discovery.css";
import "./cinematic-world-v005.css";
import "./tactile-editorial-v006.css";
import "./live-signal-v008.css";
import "./creator-showcase-v007.css";
import "./site-experience-v009.css";
import "./visual-kit-v010.css";
import "./cinematic-depth-v011.css";
import "./sitewide-cleanup-v012.css";
import "./join-page.css";
import "./phase1-member.css";
import "./member-experience-v017.css";
import "./member-world-v018.css";
import "./canonical-email.css";
import "./staging-integration-v013.css";
import "./community-home-v014.css";

// Legacy route CSS keeps its exact import order. The build places it in a
// lower-priority cascade layer only when this presentation flag is enabled.
if (import.meta.env.VITE_PARITY_V136_FULL === "true") {
  document.documentElement.dataset.avParity = "v136-full";
  await import("./parity/visual-foundation-v136.css");
  await import("./parity/concept-convergence-v136017.css");
}
// Final presentation layer applies to every public route, not only QA-only parity.
await import("./parity/sitewide-interface-v136.css");
if (import.meta.env.VITE_PARITY_V136_FULL === "true") {
  await import("./parity/continuance-design-system.css");
}
// Keep the existing private and creator systems; scope the current studio presentation last.
await import("./stage-focus-v137.css");
// V138 is a reviewed public presentation layer, not a backend or member-system fork.
await import("./severance-cinematic-v138.css");
// V139 first-party hero film and scroll-depth cinematic interface.
await import("./severance-motion-v139.css");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

import "./member-space.css";
import "./supporter-v032.css";
import "./supporter-rewards-v034.css";
import "./member-closure-v036.css";
import "./supporter-transparency-v037.css";
import "./supporter-compact-v045.css";
import "./continuance-sitewide-v063.css";
import "./continuance-worldstage-v064.css";
import "./module-experience-v073.css";
import "./discover-experience-v073.css";
import "./level-icon-preservation-v074.css";
import "./earned-rewards-v075.css";
import "./home-navigation-v079.css";
import "./iren-guided-v080.css";
import "./continuance-entry-v052.css";
import "./iren-living-v088.css";
import "./iren-spatial-v097.css";
import "./continuance-experience-v091.css";
import "./staff-verified-shortcut-v099.css";
import "./home-first-contact-v111.css";
import "./first-load-experience-v114.css";
import "./first-contact-wayfinder-v115.css";
import "./continuance-journey-v123.css";
import "./continuance-signal-atlas-v125.css";
