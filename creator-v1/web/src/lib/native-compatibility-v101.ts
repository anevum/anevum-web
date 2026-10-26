/** V101 local Creator compatibility probe.
 * Advisory only: never sends bytes, persists a file, executes user code, grants
 * approval or substitutes for authoritative ZIP validation on the Worker.
 * Reuses the exact V005 detection engine and canonical V003 structural ZIP
 * parser, instead of maintaining a second archive validator.
 */
import {inspectZip,ZIP_LIMITS} from '../../../../site/alpha/v003/archive.mjs';
import {sniffGodotZipEntries} from './godot-local-sniff-v136.ts';
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

/** Godot V006 bridge for the existing V101 local preflight.
 * The active V003 player does not admit .pck MIME assets. Diagnose locally,
 * never mark a Godot ZIP as uploadable or relax server admission/quotas.
 * This is an adapter to the separately reviewed Creator V006 workstream,
 * not a second package parser or browser/native runtime.
 */
function godotPilotReport(
 entries:ReadonlyArray<{path:string;unpacked:number}>,sourceName:string
):LocalCompatibilityReport|null{
 const names=new Set(entries.map(e=>e.path));
 const hasGodot=names.has('project.godot')||entries.some(e=>e.path.toLowerCase().endsWith('.pck'));
 if(!hasGodot)return null;
 const baseline=detectCompatibility(entries,{sourceName});
 const issues:CompatibilityIssue[]=[...baseline.issues];
 const root=(suffix:string)=>entries.filter(e=>!e.path.includes('/')&&e.path.toLowerCase().endsWith(suffix));
 const packs=root('.pck'),engines=root('.wasm'),loaders=root('.js');
 const web=names.has('index.html');
 const add=(code:string,severity:CompatibilityIssue['severity'],message:string,fix:string)=>
  issues.push({code,severity,message,fix});
 if(web){
  if(packs.length!==1)add('AEP_GODOT_PACK_FILES','blocker',
   'A Godot Web export needs exactly one root .pck resource.',
   'Keep the complete Web export, including its generated .pck, at the archive root.');
  if(engines.length!==1)add('AEP_GODOT_WASM_FILES','blocker',
   'A Godot Web export needs exactly one root .wasm engine module.',
   'Export with Godot Web and keep the generated engine .wasm file.');
  if(loaders.length!==1)add('AEP_GODOT_LOADER_FILES','blocker',
   'A Godot Web export needs exactly one root .js boot loader.',
   'Keep the JavaScript loader generated with the Web export.');
  const stems=[packs[0],engines[0],loaders[0]]
   .filter((e):e is {path:string;unpacked:number}=>Boolean(e))
   .map(e=>e.path.slice(0,e.path.lastIndexOf('.')).toLowerCase());
  if(stems.length===3&&new Set(stems).size!==1)
   add('AEP_GODOT_EXPORT_STEMS','blocker',
    'The exported .pck, .wasm and .js file names are inconsistent.',
    'Export these three files together from one Godot build without renaming them.');
 }
 if(names.has('project.godot'))
  add('AEP_GODOT_SOURCE_INCLUDED','warning',
   'An editable Godot project is present. Source files are not a browser build.',
   'Keep project.godot and source scenes in your local development project; upload only reviewed release exports.');
 add('AEP_GODOT_SMALL_PILOT_UNSUPPORTED','blocker',
  'Godot .pck packages are not admitted by the current small-build player. This export has not been uploaded.',
  'A dedicated, independently reviewed Godot large-build and runtime path is required. Do not rename or split generated engine files to bypass limits.');
 add('AEP_GODOT_DEVICE_QA','info',
  'Godot Web requires WebGL 2 and actual device and input testing; mobile, controller and Xbox support are unverified.',
  'Use Godot 4 Compatibility and single-threaded GDScript first. Test the exact export on each target device when a supported runtime is available.');
 return {...baseline,runtime:web?'godot-web':'godot-source',
  localOnly:true,playableCandidate:false,issues};
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
 try{
  const zip=new Uint8Array(await file.arrayBuffer());
  // Advisory central-directory names can only cause a fail-closed Godot
  // diagnostic. The server's frozen V003 ZIP validator is never modified.
  const names=sniffGodotZipEntries(zip);
  const godot=names?godotPilotReport(names,name):null;
  if(godot)return godot;
  parsed=inspectZip(zip);
 }
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
