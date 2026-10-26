import {zipSync,strToU8} from 'fflate';
export const SOURCE_LIMITS={file:131072,total:1048576,count:24} as const;
export const safeSourcePath=(s:string)=>/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:html|css|js|json|txt|md)$/.test(s)&&s.length<=120;
/** Produces only a candidate for the canonical private uploader. No network. */
export function sourceArchive(files:Record<string,string>){
 const entries=Object.entries(files);
 if(!Object.hasOwn(files,'index.html')||!files['index.html'].trim())throw Error('A nonempty root index.html is required.');
 if(entries.length>SOURCE_LIMITS.count)throw Error('Too many source files.');
 const binary=Object.fromEntries(entries.map(([path,text])=>{
  if(!safeSourcePath(path)||typeof text!=='string')throw Error('Unsupported source path.');
  const bytes=strToU8(text);if(bytes.length>SOURCE_LIMITS.file)throw Error('Source file exceeds 128 KiB.');return [path,bytes];
 }));
 if(Object.values(binary).reduce((n,b)=>n+b.length,0)>SOURCE_LIMITS.total)throw Error('Source workspace exceeds 1 MiB.');
 return new File([zipSync(binary,{level:6}) as Uint8Array<ArrayBuffer>],'continuance-build.zip',{type:'application/zip'});
}

/** Playable files mirror the restricted source path set's intersection with the
 * existing V003 gateway MIME allowlist (which does not include Markdown).
 * Markdown notes are retained in full-source downloads but never smuggled
 * into a playable ZIP the canonical package validator would reject.
 */
export function localOnlySourcePaths(files:Record<string,string>):string[]{
 // safeSourcePath allows html, css, js, json, txt and md. The canonical
 // V003 playable parser accepts all of those except Markdown.
 return Object.keys(files).filter(path=>path.endsWith('.md'));
}
export function playableSourceArchive(files:Record<string,string>){
 const skipped=localOnlySourcePaths(files);
 const deployable=Object.fromEntries(Object.entries(files).filter(([path])=>!path.endsWith('.md')));
 return {archive:sourceArchive(deployable),skipped};
}
