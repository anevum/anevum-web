import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  // Isolated path on next.anevum.com: never replace the existing staging homepage.
  base: mode === "staging-path" ? "/creator/" : "/",
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [
    // Preserve all route CSS order and behavior while PARITY owns its components.
    // Wrapping source CSS (before Vite processing) also covers lazy route chunks.
    {
      name:"parity-legacy-cascade",
      enforce:"pre",
      transform(code,id){
        const full=process.env.VITE_PARITY_V136_FULL ?? loadEnv(mode,fileURLToPath(new URL(".",import.meta.url)),"VITE_").VITE_PARITY_V136_FULL;
        if(full==="true"&&/\.css(?:$|\?)/.test(id)&&!id.includes("/src/parity/"))
          return {code:"@layer legacy {\n"+code+"\n}",map:null};
      }
    },
    react()
  ],
  build: {
    outDir: fileURLToPath(new URL(mode === "staging-path" ? "../dist/react-staging" : "../dist/web", import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    target: "es2022"
  }
}));
