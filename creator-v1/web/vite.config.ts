import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import {rmSync} from "node:fs";

export default defineConfig(({ mode }) => ({
  // Isolated path on next.anevum.com: never replace the existing staging homepage.
  base: mode === "staging-path" ? "/creator/" : "/",
  root: fileURLToPath(new URL(".", import.meta.url)),
  server: {allowedHosts:["terminal.local"]},
  plugins: [
    {
      name:"anevum-studio-v143-build-metadata",
      transformIndexHtml(html){
        if(process.env.VITE_ANEVUM_STUDIO_V143!=="true")return html;
        const title="ANEVUM — Original Worlds, Games & Creative Technology";
        const description="ANEVUM is an independent creative studio founded by Devon Akins. Explore original fictional universes, games and open-source creative technology.";
        const replaceMeta=(source:string,kind:string,key:string,value:string)=>source.replace(
          new RegExp('(<meta '+kind+'="'+key+'" content=")[^"]*(")'),
          (_match:string,open:string,close:string)=>open+value+close
        );
        let result=html;
        result=replaceMeta(result,"name","description",description);
        result=replaceMeta(result,"property","og:title",title);
        result=replaceMeta(result,"property","og:description",description);
        result=replaceMeta(result,"property","og:image:alt","ANEVUM orbital emblem and studio identity");
        result=replaceMeta(result,"name","twitter:title",title);
        result=replaceMeta(result,"name","twitter:description",description);
        // The pre-existing ANEVUM-only PNG avoids showing SEVERANCE as the studio's entire identity.
        // Replace this archival graphic with a dedicated V143 share PNG before full public promotion.
        result=result.replaceAll("https://anevum.com/anevum-severance-share-v141-1200x630.png","https://anevum.com/anevum-social-share-v2.png");
        result=result.replace('%BASE_URL%anevum-severance-favicon-v141-64.png','%BASE_URL%favicon.svg');
        result=result.replace('type="image/png" sizes="64x64"','type="image/svg+xml"');
        result=result.replaceAll('%BASE_URL%anevum-severance-apple-touch-v141-180.png','%BASE_URL%apple-touch-icon.png');
        result=result.replace('%BASE_URL%anevum-severance-v141.webmanifest','%BASE_URL%anevum-studio-v143.webmanifest');
        result=result.replace('content="#07060b"','content="#0b0d11"');
        result=result.replace('<title>ANEVUM — Independent Games & Software Studio</title>','<title>'+title+'</title>');
        return result;
      }
    },
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
      closeBundle(){
        if(mode==='staging-path'&&process.env.VITE_ANEVUM_OWNER_REVIEW==='true')return;
        // Public-directory copying must not distribute unaccepted review art.
        const output=mode==='staging-path'?'../dist/react-staging':'../dist/web';
        rmSync(fileURLToPath(new URL(output+'/assets/cinematic-v136/arrival/review-001',import.meta.url)),{recursive:true,force:true});
        // Retired personal-portfolio and RHEN demo images must not be exposed
        // from the V138 public studio/game bundle. Source remains preserved
        // in Git for intentional rollback or archival review.
        rmSync(fileURLToPath(new URL(output+'/portfolio',import.meta.url)),{recursive:true,force:true});
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
        // The V137 stage-focused presentation is a deliberately narrow, late-loaded
        // unlayered authority for its own .av137 selectors only. Existing
        // Continuance/Studio and archived styles keep their original layering.
        if(full==="true"&&/\.css(?:$|\?)/.test(id)&&
          !id.includes("/src/parity/continuance-design-system.css")&&
          !id.includes("/src/stage-focus-v137.css")&&
          !id.includes("/src/severance-cinematic-v138.css")&&
          !id.includes("/src/severance-motion-v139.css")&&
          !id.includes("/src/studio-identity-v143.css")){
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
    sourcemap: false,
    target: "es2022"
  }
}));
