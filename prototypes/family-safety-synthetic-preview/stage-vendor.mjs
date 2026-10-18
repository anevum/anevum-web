/**
 * Stages pinned MapLibre distribution into the isolated synthetic preview.
 * No external import at runtime; never copies node_modules or source maps.
 * Run AFTER \`npm install --ignore-scripts\` in this preview directory.
 */
import {copyFileSync,existsSync,mkdirSync,statSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(fileURLToPath(new URL(".",import.meta.url)));
const from=resolve(root,"node_modules/maplibre-gl/dist");
const to=resolve(root,"public/vendor");
const allowed=["maplibre-gl.mjs","maplibre-gl-worker.mjs","maplibre-gl.css"];
mkdirSync(to,{recursive:true});
for(const file of allowed){
  const source=resolve(from,file);
  if(!existsSync(source)||!statSync(source).isFile())
    throw Error("Missing pinned MapLibre distribution file: "+file);
  copyFileSync(source,resolve(to,file));
}
for(const file of allowed){
  const size=statSync(resolve(to,file)).size;
  if(size===0||size>12_000_000)throw Error("Unexpected MapLibre bundle size: "+file);
}
process.stdout.write("MAPLIBRE_LOCAL_VENDOR_READY=PASS\n");
