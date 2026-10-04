import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import "./styles/global.css";
import "./styles/site-v2.css";
import "./styles/performance.css";
import "./styles/rhen-brand.css";
import "./styles/command.css";
import "./styles/command-v2.css";
import "./styles/company.css";
import "./styles/iren.css";
import "./styles/enhancements.css";
import "./styles/public-system-status.css";
import "./styles/visual-ops.css";
import "./styles/visual-pass.css";
import "./styles/operations-terminal.css";
import "./styles/launch-2026.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
