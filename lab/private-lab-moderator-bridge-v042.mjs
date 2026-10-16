// Deterministic source-only installer for an independently backed-up private Lab Worker.
// Never contains the current private Worker modules, secrets or private project assets.
// Apply only after checking exact version, original routing, and source-integrity invariants.

export const LAB_V042_VERSION='2026-10-16.lab.v7-moderation-workstation';
export const LAB_V042_ROUTE='/projects/backstage/moderation/';

export function installLabModeratorBridge(source){
 if(typeof source!=='string'||source.length<1000)throw Error('Expected complete Lab Worker source');
 if(source.includes('renderLabModeratorConsole'))throw Error('Lab moderator bridge already present');
 const replaceOne=(text,needle,replacement)=>{
  const first=text.indexOf(needle);
  if(first<0||text.indexOf(needle,first+needle.length)>=0)throw Error('Lab Worker anchor missing or ambiguous: '+needle.slice(0,65));
  return text.replace(needle,replacement);
 };
 let next=source;
 const originalImport="import {BACKSTAGE_CSS,BACKSTAGE_JS,renderBackstageWorkspace} from './backstage-workspace.mjs';";
 next=replaceOne(next,originalImport,originalImport+"\nimport {MODERATOR_LAB_CSS,MODERATOR_LAB_JS,renderLabModeratorConsole} from './moderator-ops-v042.mjs';");
 next=replaceOne(next,"const VERSION='2026-10-16.lab.v6-cadets-family-game';",
  "const VERSION='"+LAB_V042_VERSION+"';");
 const decorate=[
  'function renderLinkedBackstage(){',
  ' const html=renderBackstageWorkspace();',
  ' const anchor=\'<span class="flex"></span>\';',
  ' const link=\'<a class="file-button" href="/projects/backstage/moderation/" aria-label="Open the private Lab moderation console">MODERATOR CONSOLE ↗</a>\';',
  ' return html.includes(anchor)?html.replace(anchor,anchor+link):html;',
  '}',
  ''
 ].join('\n');
 next=replaceOne(next,"const HOST='lab.anevum.com';",decorate+"const HOST='lab.anevum.com';");
 const backstage="else if(path==='/projects/backstage/'||path==='/projects/backstage/index.html')res=response(renderBackstageWorkspace());";
 next=replaceOne(next,backstage,
  "else if(path==='/projects/backstage/'||path==='/projects/backstage/index.html')res=response(renderLinkedBackstage());");
 const anchor="else if(path==='/projects/transcosmic')res=response(null,'text/plain; charset=utf-8',308,{Location:'/projects/transcosmic/'});";
 const routes=[
  "else if(path==='/projects/backstage/moderation')res=response(null,'text/plain; charset=utf-8',308,{Location:'/projects/backstage/moderation/'});",
  "else if(path==='/projects/backstage/moderation/'||path==='/projects/backstage/moderation/index.html')res=response(renderLabModeratorConsole());",
  "else if(path==='/projects/backstage/moderation/console.css')res=response(MODERATOR_LAB_CSS,'text/css; charset=utf-8');",
  "else if(path==='/projects/backstage/moderation/console.js')res=response(MODERATOR_LAB_JS,'text/javascript; charset=utf-8');",
  ""
 ].map(x=>' '+x).join('\n');
 next=replaceOne(next,anchor,routes+" "+anchor);
 if(!next.includes('if(url.hostname!==HOST)')||
  !next.includes("if(!['GET','HEAD'].includes(request.method))")||
  !next.includes("else if(path==='/projects/cadets')")||
  !next.includes("else if(path==='/projects/the-fold/'"))
   throw Error('Lab host, method, or other project invariant missing');
 return next;
}
