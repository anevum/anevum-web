import {readFile,writeFile} from "node:fs/promises";
const root = new URL("./",import.meta.url);
const [html,css,model,app] = await Promise.all([
  "index.html","styles.css","model.mjs","app.js"
].map(name=>readFile(new URL(name,root),"utf8")));
const sourceImport='import { EVENT_END, SAMPLE_HOMES, publicDirectory } from "./model.mjs";';
if(!app.includes(sourceImport))throw new Error("Unexpected model import");
const cssTag='<link rel="stylesheet" href="./styles.css">';
const scriptTag='<script type="module" src="./app.js"></script>';
if(!html.includes(cssTag)||!html.includes(scriptTag))throw new Error("Expected external references not found");
const inlineScript=model.replace(/\bexport (const|function)\b/g,"$1")+"\n"+app.replace(sourceImport,"");
if(inlineScript.includes("</script>"))throw new Error("Unsafe inline script terminator");
if(css.includes("</style>"))throw new Error("Unsafe inline style terminator");
const safeCsp='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">';
const bundled=html
  .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/,safeCsp)
  .replace(cssTag,"<style>\n"+css+"\n</style>")
  .replace(scriptTag,"<script type=\"module\">\n"+inlineScript+"\n</script>")
  .replace("<title>Porchlight / Living Neighborhood — Private Concept</title>","<title>Porchlight — Standalone Offline Concept</title>");
if(bundled.includes('src="./app.js"')||bundled.includes('href="./styles.css"'))throw new Error("Bundle still needs linked assets");
await writeFile(new URL("porchlight-offline.html",root),bundled,"utf8");
console.log("Built single-file, offline, synthetic Porchlight review HTML");
