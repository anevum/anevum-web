// Add the tested currency assets to the currently deployed Lab without replacing other projects.
export const RELEASE='2026-10-15.lab.v5-currency-sandbox';
export function integrateCurrencyModules(modules,currencySource){
 const original=modules.find(m=>m.name==='worker.mjs');
 const terminal=modules.find(m=>m.name==='rhen-terminal.mjs');
 if(!original||!terminal||!original.code.includes("const VERSION='2026-10-13.lab.v4-integrated-workspaces';"))throw Error('Unexpected deployed Lab baseline. Inspect the current deployment before retrying.');
 if(modules.some(m=>m.name==='currency-snapshot.mjs'))throw Error('Currency module already exists; inspect rather than overwrite.');
 const marker=" else if(path==='/projects/rhen/terminal.css')";
 const link='<a href="/projects/rhen/research/">OPEN RESEARCH CONSOLE</a>';
 if(!original.code.includes(marker)||!terminal.code.includes(link))throw Error('Expected live integration anchors missing.');
 const routes=" else if(path==='/projects/rhen/currency')res=response(null,'text/plain; charset=utf-8',308,{Location:'/projects/rhen/currency/'});\n else if(Object.prototype.hasOwnProperty.call(CURRENCY_ASSETS,path))res=response(CURRENCY_ASSETS[path],path.endsWith('.css')?'text/css; charset=utf-8':path.endsWith('.mjs')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');\n";
 const worker="import {CURRENCY_ASSETS} from './currency-snapshot.mjs';\n"+original.code.replace("2026-10-13.lab.v4-integrated-workspaces",RELEASE).replace(marker,routes+marker);
 const terminalCode=terminal.code.replace(link,link+' · <a href="/projects/rhen/currency/">OPEN CURRENCY SANDBOX</a>');
 return [...modules.map(m=>m.name==='worker.mjs'?{...m,code:worker}:m.name==='rhen-terminal.mjs'?{...m,code:terminalCode}:{...m}),{name:'currency-snapshot.mjs',code:currencySource}];
}
