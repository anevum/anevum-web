import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

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

