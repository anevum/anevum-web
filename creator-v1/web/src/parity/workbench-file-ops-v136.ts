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
