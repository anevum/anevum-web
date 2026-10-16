// Narrow v6 private Lab integration. Never replace the deployed Lab from the older PR parent.
export const CADETS_LAB_RELEASE='2026-10-16.lab.v6-cadets-family-game';
const previous='2026-10-15.lab.v5-currency-sandbox';
const importLine="import {CADETS_FILES} from './cadets-snapshot.mjs';";
export function integrateCadetsModules(modules,{snapshot,expectedTerminal,newTerminal}){
 if(!Array.isArray(modules)||modules.length<12||new Set(modules.map(x=>x.name)).size!==modules.length)throw Error('Live Lab modules absent or duplicated.');
 const entry=modules.find(x=>x.name==='worker.mjs');
 const consoleModule=modules.find(x=>x.name==='terminal-ui.mjs');
 const currency=modules.find(x=>x.name==='currency-snapshot.mjs');
 if(!entry||!consoleModule||!currency||typeof snapshot!=='string'||snapshot.length<50000)throw Error('Missing Lab baseline or Cadets snapshot.');
 if(modules.some(x=>x.name==='cadets-snapshot.mjs'))throw Error('Cadets already present: inspect the currently deployed version.');
 if(consoleModule.code!==expectedTerminal)throw Error('Live Lab launcher differs from the reviewed baseline. Stop and reconcile.');
 if(!entry.code.includes("const VERSION='"+previous+"';")||!entry.code.includes("CURRENCY_ASSETS")||!entry.code.includes("url.hostname!==HOST"))throw Error('Unexpected live Lab version, currency, or host isolation.');
 if(!entry.code.includes("projects:4")||entry.code.includes("CADETS_FILES"))throw Error('Unexpected project count or Cadets already present.');
 const importAnchor="import {LAB_CSS,LAB_JS,LAB_ICON_SVG,renderLabPage,renderBackstagePage,renderTranscosmicPage} from './terminal-ui.mjs';";
 const routeAnchor=" else if(path==='/projects/the-fold/'||path==='/projects/the-fold/index.html'){";
 if(!entry.code.includes(importAnchor)||!entry.code.includes(routeAnchor))throw Error('Safe route anchors missing.');
 const route=" else if(path==='/projects/cadets')res=response(null,'text/plain; charset=utf-8',308,{Location:'/projects/cadets/'});\n"
 +" else if(path==='/projects/cadets/'||Object.prototype.hasOwnProperty.call(CADETS_FILES,path)){\n"
 +"  const asset=CADETS_FILES[path==='/projects/cadets/'?'/projects/cadets/index.html':path];\n"
 +"  res=response(asset.body,asset.type);\n"
 +" }\n";
 const worker=entry.code.replace(importAnchor,importAnchor+'\n'+importLine).replace(routeAnchor,route+routeAnchor).replace(previous,CADETS_LAB_RELEASE).replace('projects:4','projects:5');
 const patched=modules.map(m=>m.name==='worker.mjs'?{...m,code:worker}:m.name==='terminal-ui.mjs'?{...m,code:newTerminal}:{...m});
 patched.push({name:'cadets-snapshot.mjs',code:snapshot});
 if(patched.length!==modules.length+1)throw Error('Incorrect module count.');
 for(const m of modules)if(!['worker.mjs','terminal-ui.mjs'].includes(m.name)&&patched.find(x=>x.name===m.name)?.code!==m.code)throw Error('Unrelated live module modified: '+m.name);
 return patched;
}
