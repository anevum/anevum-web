/** Bounded local source operations for ANEVUM's in-memory creator workbench.
 * This is not a server filesystem, account persistence or publishing API.
 * The canonical source archive always validates the resulting payload again.
 */
type SourcePathValidator=(path:string)=>boolean;
// Pass the canonical sourceArchive validator from the real workbench so Node
// native TypeScript tests and the browser bundler use the same rules.

export function renameLocalSource(files:Record<string,string>,previous:string,next:string,isSafePath:SourcePathValidator){
 if(!Object.hasOwn(files,previous))throw Error('That local source file is no longer available.');
 if(previous==='index.html')throw Error('The root index.html entrypoint cannot be renamed.');
 if(!isSafePath(next))throw Error('Use a valid relative HTML, CSS, JS, JSON, Markdown or text source path.');
 if(previous===next)return files;
 // On case-insensitive filesystems, changing only letter case is ambiguous
 // for later export and must not silently alias the original entry.
 if(Object.keys(files).some(path=>path.toLowerCase()===next.toLowerCase()))
  throw Error('A local source file already uses that path.');
 return Object.fromEntries(Object.entries(files).map(([path,content])=>
  [path===previous?next:path,content]));
}

export function removeLocalSource(files:Record<string,string>,path:string){
 if(path==='index.html')throw Error('The root index.html entrypoint cannot be removed.');
 if(!Object.hasOwn(files,path))throw Error('That local source file is no longer available.');
 const next={...files};delete next[path];return next;
}

/** Conservative static path audit for real, local authored files.
 * Resolve quoted references from each referencing file's own directory:
 * HTML href/src, JS imports, JSON strings, CSS url(), and ordinary quoted
 * paths. Ignore external schemes, traversal above root, and fragments.
 * This warns the creator; it deliberately DOES NOT rewrite source text.
 */
function sourceReferencePath(owner:string,reference:string):string|null{
 const raw=reference.trim().split(/[?#]/,1)[0];
 if(!raw||raw.startsWith('//')||raw.startsWith('#')||
  /^[a-z][a-z\d+.-]*:/i.test(raw)||/[\s\\]/.test(raw))return null;
 const parts=raw.startsWith('/')?[]:owner.split('/').slice(0,-1);
 for(const token of raw.split('/')){
  if(!token||token==='.')continue;
  if(token==='..'){if(!parts.length)return null;parts.pop();continue;}
  parts.push(token);
 }
 return parts.join('/');
}
export function sourceReferencesToReview(files:Record<string,string>,previous:string):string[]{
 if(!Object.hasOwn(files,previous))return [];
 const references:string[]=[];
 for(const [owner,content] of Object.entries(files)){
  if(owner===previous||!/\.(?:html|css|js|json)$/i.test(owner))continue;
  // Each match is bounded to one logical line to avoid collecting entire
  // user documents or accidentally treating arbitrary multiline text as URLs.
  const quoted=content.matchAll(/["'`]([^"'`\r\n]{1,240})["'`]/g);
  const cssUrls=owner.endsWith('.css')?
   content.matchAll(/url\(\s*([^\s"'()]{1,240})\s*\)/gi):
   [][Symbol.iterator]();
  if([...quoted,...cssUrls].some(match=>sourceReferencePath(owner,match[1])===previous))references.push(owner);
 }
 return references;
}

/** A bounded advisory diagnostic; never evaluates the user's code or blocks
 * the existing canonical native-compatibility inspection and private uploader.
 * Unquoted JS dynamic paths, remote URLs and unsupported binary media are
 * intentionally outside this static analysis.
 */
export type UnresolvedLocalSourceLink={source:string;target:string};
export function unresolvedLocalSourceLinks(
 files:Record<string,string>,isSafePath:SourcePathValidator
):UnresolvedLocalSourceLink[]{
 const result:UnresolvedLocalSourceLink[]=[],seen=new Set<string>();
 for(const [source,content] of Object.entries(files)){
  const values:string[]=[];
  if(source.endsWith('.html')){
   for(const match of content.matchAll(/<(?:script|link|a|img|source|iframe)\b[^>]{0,1024}?\b(?:src|href)\s*=\s*["']([^"'\r\n]{1,240})["']/gi))
    values.push(match[1]);
  }else if(source.endsWith('.css')){
   for(const match of content.matchAll(/@import\s+["']([^"'\r\n]{1,240})["']/gi))
    values.push(match[1]);
   for(const match of content.matchAll(/url\(\s*(?:"([^"\r\n]{1,240})"|'([^'\r\n]{1,240})'|([^)"'\s]{1,240}))\s*\)/gi))
    values.push(match[1]||match[2]||match[3]);
  }else if(source.endsWith('.js')){
   for(const match of content.matchAll(/\b(?:import\s*(?:\(\s*|[^'"\r\n]*?\bfrom\s*)?|export\s+[^'"\r\n]*?\bfrom\s*|require\s*\(\s*)["']([^'"\r\n]{1,240})["']/g))
    values.push(match[1]);
  }else continue;
  for(const value of values){
   const target=sourceReferencePath(source,value);
   if(!target||!isSafePath(target)||Object.hasOwn(files,target))continue;
   const key=source+'\0'+target;
   if(seen.has(key))continue;
   seen.add(key);result.push({source,target});
  }
 }
 return result;
}


/** Display-only local HTML preview. Execution belongs to the canonical
 * isolated private playtest, never this sandboxed inspector. */
export function sourcePreviewDocument(files:Record<string,string>):string{
 const original=typeof files['index.html']==='string'?files['index.html']:
  '<main><h1>Root index.html required</h1></main>';
 const markup=original
  .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'')
  .replace(/<script\b[^>]*\/\s*>/gi,'')
  .replace(/<link\b[^>]*>/gi,tag=>{
   if(!/\brel\s*=\s*(?:"stylesheet"|'stylesheet')/i.test(tag))return '';
   const href=tag.match(/\bhref\s*=\s*(?:"([^"]{1,240})"|'([^']{1,240})')/i)?.slice(1).find(Boolean);
   const path=href?sourceReferencePath('index.html',href):null;
   if(!path||!path.endsWith('.css')||!Object.hasOwn(files,path))return '';
   return '<style data-local-preview-stylesheet="'+path+'">'+
    files[path].replace(/<\/style\b/gi,'<\\/style')+'</style>';
  });
 const policy='default-src &#39;none&#39;; script-src &#39;none&#39;; '+
  'style-src &#39;unsafe-inline&#39;; img-src data:; font-src data:; '+
  'connect-src &#39;none&#39;; frame-src &#39;none&#39;; '+
  'form-action &#39;none&#39;; base-uri &#39;none&#39;';
 const meta='<meta http-equiv="Content-Security-Policy" content="'+policy+'">'+
  '<meta name="viewport" content="width=device-width, initial-scale=1">';
 return /<head\b[^>]*>/i.test(markup)?
  markup.replace(/<head\b[^>]*>/i,m=>m+meta):
  '<!doctype html><head>'+meta+'</head>'+markup;
}
