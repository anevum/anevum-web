// ANEVUM Sites V005 — deterministic, dependency-free asset packager.
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,dirname} from "node:path";
const root=dirname(new URL(import.meta.url).pathname);
const files={HTML:"site.html",CSS:"site.css",JS:"site.js",SW:"sw.js",MANIFEST:"site.webmanifest",ICON:"icon.svg"};
const parts=await Promise.all(Object.entries(files).map(async([name,file])=>[name,await readFile(resolve(root,file),"utf8")]));
const moduleSource=parts.map(([name,content])=>"export const SITE_V005_"+name+"="+JSON.stringify(content)+";").join("\n")+"\n";
await writeFile(resolve(root,"../site-v005.mjs"),moduleSource);
const output=process.argv[2];
if(output){await mkdir(output,{recursive:true});for(const[name,content]of parts){await writeFile(resolve(output,files[name]),content);}await writeFile(resolve(output,"index.html"),parts.find(([name])=>name==="HTML")[1]);}
console.log("ANEVUM Sites V005 bundle created",moduleSource.length,"bytes");
