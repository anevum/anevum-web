/** Bounded local source operations for ANEVUM's in-memory creator workbench.
 * This is not a server filesystem, account persistence or publishing API.
 * The canonical source archive always validates the resulting payload again.
 */
import {safeSourcePath} from './source-archive-v136';

export function renameLocalSource(files:Record<string,string>,previous:string,next:string){
 if(!Object.hasOwn(files,previous))throw Error('That local source file is no longer available.');
 if(previous==='index.html')throw Error('The root index.html entrypoint cannot be renamed.');
 if(!safeSourcePath(next))throw Error('Use a valid relative HTML, CSS, JS, JSON, Markdown or text source path.');
 if(previous===next)return files;
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
