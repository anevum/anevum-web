import {fileURLToPath,URL} from "node:url";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

// IREN-only assets. Do not alter Creator V1's canonical public/staging build.
export default defineConfig({
 base:"/staff/",
 root:fileURLToPath(new URL(".",import.meta.url)),
 plugins:[react()],
 build:{
  outDir:fileURLToPath(new URL("../dist/staff",import.meta.url)),
  emptyOutDir:true,
  sourcemap:false,
  target:"es2022"
 }
});
