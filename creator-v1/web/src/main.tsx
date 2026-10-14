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
import "./cinematic-discovery.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
