import {fileURLToPath,URL} from "node:url";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

// IREN-only assets. Do not alter Creator V1's canonical public/staging build.
export default defineConfig({
 base:"/staff/",
 root:fileURLToPath(new URL(".",import.meta.url)),
 plugins:[
  react(),
  {
   name:"iren-staff-entry",
   enforce:"pre",
   transformIndexHtml(html:string){
    if(!html.includes('src="/src/main.tsx"'))throw Error("Missing canonical React entrypoint");
    return html.replace('src="/src/main.tsx"','src="/src/staff-main.tsx"')
     .replace('<title>ANEVUM — Create Beyond Worlds</title>','<title>IREN / ANEVUM Staff Command</title>')
     .replace('href="#main">Skip to content','href="#iren-workspace">Skip to IREN workspace');
   }
  }
 ],
 build:{
  outDir:fileURLToPath(new URL("../dist/staff",import.meta.url)),
  emptyOutDir:true,
  sourcemap:false,
  target:"es2022"
 }
});
