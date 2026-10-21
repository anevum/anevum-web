/** V101 local Creator compatibility probe.
 * Advisory only: never sends bytes, persists a file, executes user code, grants
 * approval or substitutes for authoritative ZIP validation on the Worker.
 * Reuses the exact V005 detection engine and canonical V003 structural ZIP
 * parser, instead of maintaining a second archive validator.
 */
import {inspectZip,ZIP_LIMITS} from '../../../../site/alpha/v003/archive.mjs';
import {detectCompatibility,type CompatibilityReport,type CompatibilityIssue}
 from '../../../../site/alpha/v003/compatibility-v005.mjs';

export type LocalCompatibilityReport=CompatibilityReport & {localOnly:true};
const MiB=1048576;
function blocked(name:string,reason:string,fix:string):LocalCompatibilityReport{
 return {schemaVersion:'0.1',sourceName:name,runtime:'unknown',entrypoint:null,
  playableCandidate:false,securityReviewed:false,mobileVerified:false,
  publicationApproved:false,localOnly:true,
  issues:[{code:'AEP_LOCAL_CHECK',severity:'blocker',message:reason,fix}]};
}
export async function inspectLocalBrowserBuild(file:File):Promise<LocalCompatibilityReport>{
 const name=typeof file.name==='string'?file.name.slice(0,180):'selected-file';
 if(!Number.isSafeInteger(file.size)||file.size<=0)
  return blocked(name,'The chosen file is empty or its size cannot be verified.','Choose an exported ZIP or standalone HTML.');
 const ext=name.toLowerCase().endsWith('.zip')?'zip':name.toLowerCase().endsWith('.html')?'html':'other';
 if(ext==='other')
  return blocked(name,'This player accepts exported browser builds, not raw source or Python files.',
   'Export a browser-ready build with index.html at the root, or use a separately hosted HTTPS application.');
 if(ext==='html'){
  if(file.size>5*MiB)
   return blocked(name,'Standalone HTML exceeds the 5 MiB limit.',
    'Export a ZIP with index.html at the root, within the package limits.');
  const head=await file.slice(0,4096).text();
  if(!/(?:<!doctype\s+html|<html[\s>])/i.test(head))
   return blocked(name,'This file does not begin with a recognizable HTML document.',
    'Export a complete HTML file, including the HTML document element.');
  const result=detectCompatibility([{path:'index.html',unpacked:file.size}],{sourceName:name});
  const warning:CompatibilityIssue={code:'AEP_HTML_DEPENDENCIES_UNVERIFIED',
   severity:'warning',message:'A standalone HTML file may depend on scripts, assets or network services not contained in it.',
   fix:'Check all dependencies offline in the isolated player. External APIs require separately hosted HTTPS services.'};
  return {...result,localOnly:true,issues:[...result.issues,warning]};
 }
 if(file.size>ZIP_LIMITS.archive)
  return blocked(name,'The ZIP exceeds the 20 MiB browser-build limit.',
   'Reduce the exported production build. Do not include source dependencies or credentials.');
 let parsed;
 try{parsed=inspectZip(new Uint8Array(await file.arrayBuffer()));}
 catch(e){return blocked(name,e instanceof Error?e.message:'ZIP structure could not be verified.',
  'ZIP the exported build contents, not the containing folder, with index.html at the root.');}
 const result=detectCompatibility(parsed.entries,{sourceName:name});
 if(parsed.entries.some(entry=>entry.path.startsWith('_anevum/'))){
  return {...result,localOnly:true,playableCandidate:false,issues:[...result.issues,{
   code:'AEP_RESERVED_METADATA',severity:'blocker',
   message:'The build contains a reserved _anevum/ path.',
   fix:'Remove the reserved folder and prepare a clean, self-contained browser export.'
  }]};
 }
 return {...result,localOnly:true};
}
