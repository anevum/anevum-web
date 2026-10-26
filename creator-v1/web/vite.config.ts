import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import {rmSync,mkdirSync,readdirSync,cpSync} from "node:fs";

export default defineConfig(({ mode }) => ({
  // Isolated path on next.anevum.com: never replace the existing staging homepage.
  base: mode === "staging-path" ? "/creator/" : "/",
  root: fileURLToPath(new URL(".", import.meta.url)),
  server: {allowedHosts:["terminal.local"]},
  plugins: [
    {
      name:"isolate-owner-review-media",
      configureServer(server){
        server.middlewares.use((req,res,next)=>{
          if(mode==='staging-path'&&req.url==='/creator'){
            res.writeHead(307,{location:'/creator/'});res.end();return;
          }
          next();
        });
      },
      writeBundle(_options,bundle){
        // Worker sub-builds finish earlier; finalize only the actual HTML output.
        if(!Object.prototype.hasOwnProperty.call(bundle,'index.html'))return;
        const ownerReview=mode==='staging-path'&&process.env.VITE_ANEVUM_OWNER_REVIEW==='true';
        // Copy reviewed public files exactly once; worker sub-builds must not
        // restore excluded art or obsolete stable URLs after finalization.
        const output=mode==='staging-path'?'../dist/react-staging':'../dist/web';
        const destination=fileURLToPath(new URL(output,import.meta.url));
        const publicRoot=fileURLToPath(new URL('./public/',import.meta.url));
        cpSync(publicRoot,destination,{recursive:true,filter:source=>{
          const relative=source.slice(publicRoot.length).replaceAll('\\','/');
          return (ownerReview||!relative.startsWith('assets/cinematic-v136/arrival/review-001'))&&
            !relative.startsWith('assets/default-thumbnails')&&
            !['favicon.svg','site.webmanifest'].includes(relative);
        }});
        if(!ownerReview)rmSync(destination+'/assets/cinematic-v136/arrival/review-001',{recursive:true,force:true});
        const site=destination+'/assets/site-v136-005';mkdirSync(site,{recursive:true});
        for(const name of ['favicon.svg','site.webmanifest'])cpSync(publicRoot+name,site+'/'+name);
        const sourceCovers=publicRoot+'assets/default-thumbnails';
        const covers=destination+'/assets/default-thumbnails/v136-baseline-005';mkdirSync(covers,{recursive:true});
        for(const name of readdirSync(sourceCovers).filter(name=>name.endsWith('.svg')))
          cpSync(sourceCovers+'/'+name,covers+'/'+name);

      }
    },
    // Layer order is stable even when a route loads its CSS after the authority.
    // The unlayered Continuance system wins over legacy and inherited PARITY.
    {
      name:"parity-legacy-cascade",
      enforce:"pre",
      transform(code,id){
        const full=process.env.VITE_PARITY_V136_FULL ?? loadEnv(mode,fileURLToPath(new URL(".",import.meta.url)),"VITE_").VITE_PARITY_V136_FULL;
        // Preserve existing explicit root-layer repairs. Nesting those blocks
        // would change !important precedence and revive obsolete route type.
        if(id.includes("/src/parity/")&&/@layer\s/.test(code))return;
        if(full==="true"&&/\.css(?:$|\?)/.test(id)&&!id.includes("/src/parity/continuance-design-system.css")){
          const layer=id.includes("/src/parity/")?'parity':'legacy';
          return {code:"@layer legacy, parity;\n@layer "+layer+" {\n"+code+"\n}",map:null};
        }
      }
    },
    react()
  ],
  build: {
    outDir: fileURLToPath(new URL(mode === "staging-path" ? "../dist/react-staging" : "../dist/web", import.meta.url)),
    emptyOutDir: true,
    copyPublicDir: false,
    sourcemap: false,
    target: "es2022"
  }
}));
