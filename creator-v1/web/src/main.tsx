import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// A separately reviewed NEXT style layer. Default and V131 builds keep it off.
if (import.meta.env.VITE_NEXT_VISUAL_SYSTEM === "true") {
  document.documentElement.dataset.avNextVisual = "v134";
  void import("./continuance-next-visual-v134.css");
  void import("./next-visual-primitives-v135.css");
}
// V136 is a successor increment; old visual flags and frozen guards stay intact.
if (import.meta.env.VITE_PARITY_V136 === "true") {
  document.documentElement.dataset.avNextVisual = "v134";
  document.documentElement.dataset.avParity = "v136";
  void import("./continuance-next-visual-v134.css");
  void import("./next-visual-primitives-v135.css");
  void import("./parity-v136.css");
}
// Resolve stylesheet ownership before rendering, so the independent shell never
// flashes the historical theme. Existing routes retain the exact legacy order.
if (import.meta.env.VITE_PARITY_V136_FULL === "true") {
  document.documentElement.dataset.avParity = "v136-full";
  await import("./parity/parity-entry.css");
} else {
  await import("./legacy-styles.css");
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

