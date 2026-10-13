import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  // Isolated path on next.anevum.com: never replace the existing staging homepage.
  base: mode === "staging-path" ? "/creator/" : "/",
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL(mode === "staging-path" ? "../dist/react-staging" : "../dist/web", import.meta.url)),
    emptyOutDir: true,
    sourcemap: mode !== "staging-path",
    target: "es2022"
  }
}));
