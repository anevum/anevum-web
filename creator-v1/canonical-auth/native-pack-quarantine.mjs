// ANEVUM Native Pack V002: private quarantine-only structural verification.
// Uses the exact same V001 data-only reader as the local player to avoid
// divergent ZIP parsers. Never grants publication, executable content, or XP.
import {openNativePack,MAX_PACK_BYTES} from '../web/src/lib/anevum-native-pack.ts';

export const NATIVE_PACK_MIME='application/vnd.anevum.pack+zip';
export const NATIVE_PACK_CATEGORY=Object.freeze({
 anvg:'games',anva:'music',anvs:'video',anvw:'art',anvp:'writing'
});
export const NATIVE_PACK_EXTENSION=Object.freeze({
 games:'anvg',music:'anva',video:'anvs',art:'anvw',writing:'anvp'
});
export function nativePackExtension(name){
 if(typeof name!=='string')return null;
 const extension=name.split('.').at(-1).toLowerCase();
 return Object.hasOwn(NATIVE_PACK_CATEGORY,extension)?extension:null;
}
export function isNativePackForCategory(name,category){
 const extension=nativePackExtension(name);
 return extension!==null&&NATIVE_PACK_CATEGORY[extension]===category;
}
/** No network, browser DOM, file writes or dynamic code execution. */
export async function inspectNativePackForQuarantine(filename,bytes,category){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_PACK_BYTES)
  throw Error('Invalid native package size');
 if(!isNativePackForCategory(filename,category))
  throw Error('Native package extension does not match project category');
 const opened=await openNativePack(filename,bytes);
 const {manifest,document,assets}=opened;
 const extensions={game:'anvg',album:'anva',series:'anvs',visual:'anvw',project:'anvp'};
 if(NATIVE_PACK_CATEGORY[extensions[manifest.kind]]!==category)
  throw Error('Native package kind does not match project category');
 const referenced=new Set();
 const asset=p=>{if(typeof p==='string')referenced.add(p);};
 if(manifest.kind==='game')for(const scene of document.scenes)asset(scene.background);
 if(manifest.kind==='album'){
  asset(document.cover);
  for(const track of document.tracks)asset(track.file);
 }
 if(manifest.kind==='series'){
  asset(document.poster);
  for(const episode of document.episodes)asset(episode.file);
 }
 if(manifest.kind==='visual')for(const page of document.pages)asset(page.image);
 // .anvp V001 only permits the already strict text-only Workbench blocks.
 // Every archive asset must be referenced, preventing hidden payloads from
 // piggybacking in the private/quarantined ANEVUM file family.
 if(assets.size!==referenced.size||
    [...assets.keys()].some(path=>!referenced.has(path)))
  throw Error('Native package has unexpected or unused assets');
 return Object.freeze({
  kind:manifest.kind,version:manifest.version,
  assetCount:assets.size,byteLength:bytes.byteLength
 });
}
