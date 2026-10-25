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

/** Preview the source links that need manual review after a file move.
 * Does not rewrite user-authored imports, HTML, or CSS.
 */
export function sourceReferencesToReview(files:Record<string,string>,previous:string){
 const escaped=previous.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');
 const matcher=new RegExp('(?:^|[\\"\\\x27\\(\\s])(?:\\./|/)?'+escaped+'(?=[\\"\\\x27\\)\\s?#]|$)','m');
 return Object.entries(files).filter(([path,body])=>path!==previous&&matcher.test(body)).map(([path])=>path);
}
