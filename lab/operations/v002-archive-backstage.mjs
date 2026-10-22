// ANEVUM.WEB.MAINT.2026-10-22.001.LAB-BACKSTAGE-RETIREMENT
// Pure, fail-closed source transform. No deployment, database or record mutations.
export const LAB_V002_VERSION = '2026-10-22.lab.v8-backstage-archive';
export const LAB_V002_SESSION = 'ANEVUM.WEB.MAINT.2026-10-22.001.LAB-BACKSTAGE-RETIREMENT';
const STAFF = 'https://anevum.com/staff';
function once(s,needle) {
  const i=s.indexOf(needle);
  if(i<0||s.indexOf(needle,i+needle.length)>=0)throw Error('Missing or ambiguous anchor: '+needle.slice(0,80));
  return i;
}
export function archiveBackstageLab({worker,terminal}) {
  if(typeof worker!=='string'||worker.length<5000||typeof terminal!=='string'||terminal.length<18000)
    throw Error('Expected complete worker and terminal source');
  if(worker.includes(LAB_V002_VERSION)||terminal.includes('function renderLabUtilities()'))
    throw Error('Already patched');
  for(const key of ["const HOST='lab.anevum.com'","if(url.hostname!==HOST)",
    "else if(path==='/projects/backstage/workspace.js')",
    "else if(path==='/projects/the-fold/'",
    "else if(path==='/projects/rhen/api/overview')",
    "else if(path==='/projects/transcosmic/'"]) {
    if(!worker.includes(key))throw Error('Missing preservation invariant: '+key);
  }
  const tag='const LAB_PROJECTS = ',start=once(terminal,tag);
  const end=terminal.indexOf(';\nfunction escapeLab',start);
  if(end<start)throw Error('Project directory anchor missing');
  const projects=JSON.parse(terminal.slice(start+tag.length,end));
  if(!Array.isArray(projects)||projects.filter(p=>p.slug==='backstage').length!==1||
    !['the-fold','rhen','transcosmic'].every(s=>projects.some(p=>p.slug===s)))
    throw Error('Unexpected project registry');
  const active=projects.filter(p=>p.slug!=='backstage');
  const playable=active.filter(p=>p.slug==='the-fold'||p.slug==='cadets').length;
  const moderation=worker.includes("path==='/projects/backstage/moderation/'");
  terminal=terminal.slice(0,start)+tag+JSON.stringify(active)+terminal.slice(end);
  const html='<nav class="lab-ops-links" aria-label="Staff and archived workspaces">'+
    '<a href="'+STAFF+'" target="_blank" rel="noopener noreferrer">IREN / LIVE STAFF</a>'+
    '<a href="/projects/backstage/" title="Export local cases before clearing browser data">BACKSTAGE / EXPORT CASES</a>'+
    (moderation?'<a href="/projects/backstage/moderation/">LOCAL MODERATION ARCHIVE</a>':'')+
    '<a href="/previews/" title="Demonstrations, not live member functionality">PREVIEWS / SIMULATED</a></nav>';
  const renderTag='function renderLabPage(){';
  terminal=terminal.replace(renderTag,'function renderLabUtilities(){return '+JSON.stringify(html)+';}\n'+renderTag);
  const renderStart=once(terminal,renderTag);
  const renderEnd=terminal.indexOf('\nfunction renderBackstagePage()',renderStart);
  if(renderEnd<0)throw Error('Cannot isolate project-page render');
  let chunk=terminal.slice(renderStart,renderEnd);
  const tail="</a></div></section></div>'";
  if(!chunk.includes(tail))throw Error('Project-detail insert anchor missing');
  chunk=chunk.replace(tail,"</a></div>'+renderLabUtilities()+'</section></div>'");
  const index=chunk.indexOf('BACKSTAGE - LOCAL CASE DESK AVAILABLE');
  if(index<0)throw Error('Expected obsolete Backstage boot line');
  const from=chunk.lastIndexOf('<p class=',index),to=chunk.indexOf('</p>',index);
  if(from<0||to<0)throw Error('Unable to isolate obsolete boot line');
  chunk=chunk.slice(0,from)+chunk.slice(to+4);
  const count=chunk.match(/\d+ ENTRIES \/ \d+ PLAYABLE BUILDS?/);
  if(!count)throw Error('Missing project count');
  chunk=chunk.replace(count[0],active.length+' ENTRIES / '+playable+' PLAYABLE BUILD'+(playable===1?'':'S'));
  chunk=chunk.replace('SOURCE / LAB-SHELL-V1','SOURCE / LAB-V002');
  terminal=terminal.slice(0,renderStart)+chunk+terminal.slice(renderEnd);
  terminal=terminal
    .replace(/TRANSCOSMIC: LOCAL STUDIO \/ BACKSTAGE: CASE DESK \/ CADETS: FAMILY GAME/g,
      'TRANSCOSMIC: LOCAL STUDIO / CADETS: PRIVATE GAME / IREN: LIVE STAFF')
    .replace(/TRANSCOSMIC: LOCAL STUDIO  \/  BACKSTAGE: LOCAL CASE DESK/g,
      'TRANSCOSMIC: LOCAL STUDIO / IREN: LIVE STAFF')
    .replace(/\b1[–-][45]\b/g,'1-'+active.length)
    .replace(/grid-template-rows:repeat\((4|5),minmax\(34px,1fr\)\)/,
      'grid-template-rows:repeat('+active.length+',minmax(34px,1fr))');
  const cssEnd='";\nexport const LAB_JS =';
  once(terminal,cssEnd);
  const css='\\n.lab-ops-links{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:7px 10px 9px;border-top:1px solid var(--line);background:#07150eb8}\\n'+
    '.lab-ops-links a{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:6px 9px;border:1px solid #8caf8277;color:var(--gold);font-size:9px;font-weight:800;letter-spacing:.03em;text-align:center;overflow-wrap:anywhere}\\n'+
    '.lab-ops-links a:hover,.lab-ops-links a:focus-visible{background:#183e29;border-color:var(--gold)}\\n'+
    '@media(max-width:600px){.lab-ops-links{gap:4px;padding:5px 7px}.lab-ops-links a{font-size:9px;min-height:32px;padding:5px 6px}}\\n';
  terminal=terminal.replace(cssEnd,css+cssEnd);
  const staff='<a class="file-button" href="'+STAFF+'" target="_blank" rel="noopener noreferrer">IREN STAFF (LIVE)</a>';
  const mod=moderation?'<a class="file-button" href="/projects/backstage/moderation/">LOCAL REVIEW ARCHIVE</a>':'';
  const helper=[
    'function renderArchivedBackstage(){',
    ' const html=renderBackstageWorkspace();',
    ' const marked=html.replace('+JSON.stringify('PRIVATE LAB · NOT CONNECTED TO COMMUNITY DATA')+','+
      JSON.stringify('ARCHIVE ONLY · EXPORT CASES BEFORE CLEARING BROWSER DATA · NOT LIVE MODERATION')+');',
    ' const anchor='+JSON.stringify('<span class="flex"></span>')+';',
    ' const links='+JSON.stringify(staff+mod)+';',
    ' return marked.includes(anchor)?marked.replace(anchor,anchor+links):marked;',
    '}',''
  ].join('\n');
  const host=once(worker,"const HOST='lab.anevum.com';");
  const originalHelper=worker.indexOf('function renderLinkedBackstage(){');
  if(originalHelper>=0&&originalHelper<host) {
    worker=worker.slice(0,originalHelper)+helper+worker.slice(host);
    worker=worker.replace('renderLinkedBackstage());','renderArchivedBackstage());');
  } else {
    worker=worker.slice(0,host)+helper+worker.slice(host);
    worker=worker.replace('res=response(renderBackstageWorkspace());','res=response(renderArchivedBackstage());');
  }
  const version=worker.match(/const VERSION='[^']+';/g);
  const counts=worker.match(/projects:\d+/g);
  if(!version||version.length!==1||!counts||counts.length!==1)
    throw Error('Version or health project count ambiguous');
  worker=worker.replace(version[0],"const VERSION='"+LAB_V002_VERSION+"';")
    .replace(counts[0],'projects:'+active.length);
  if(!worker.includes('renderArchivedBackstage());')||!terminal.includes('BACKSTAGE / EXPORT CASES')||
    terminal.includes('"slug":"backstage"'))
    throw Error('Retirement postcondition failed');
  return {worker,terminal,activeProjects:active.map(p=>p.slug),preservesArchive:true,
    hasModerationArchive:moderation,staffUrl:STAFF};
}
