/**
 * Free public distribution tools for an already-approved ANEVUM project.
 * No rankings, votes, fabricated signals, external calls, or publication.
 */
export type ShareablePublishedProject = Readonly<{id:string;title:string}>;
export type ProjectLaunchKit = Readonly<{url:string;shareText:string;embedHtml:string}>;

const ENTITIES:Record<string,string>={
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
};
function html(value:string):string{
  return value.replace(/[&<>"']/g,char=>ENTITIES[char]||char);
}

/** Caller supplies the real current origin: previews share previews, never
 * falsely claim their test projects are published on the production domain. */
export function buildProjectLaunchKit(project:ShareablePublishedProject,origin:string,basePath="/"):ProjectLaunchKit{
  if(!project||typeof project.id!=="string"||
    !/^[A-Za-z0-9_-]{1,128}$/.test(project.id))
    throw new Error("A verified public project identifier is required");
  if(typeof project.title!=="string")throw new Error("A project title is required");
  const title=project.title.replace(/\s+/g," ").trim();
  if(!title||title.length>180)throw new Error("A valid project title is required");
  let base:URL;
  try{base=new URL(origin);}catch{throw new Error("Invalid public project origin");}
  const local=base.hostname==="localhost"||base.hostname==="127.0.0.1"||base.hostname==="[::1]";
  if((base.protocol!=="https:"&&!(base.protocol==="http:"&&local))||
    base.username||base.password||base.pathname!=="/"||base.search||base.hash)
    throw new Error("Unsafe public project origin");
  // Vite previews may mount under /creator/; preserve that real route prefix.
  if(!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath))
    throw new Error("Invalid project route prefix");
  const url=new URL(basePath+"projects/"+encodeURIComponent(project.id),base.origin).href;
  return Object.freeze({
    url,
    shareText:"Explore "+title+" on ANEVUM: "+url,
    // Intentionally static markup, not a script, iframe, remote tracking pixel
    // or badge with a made-up public rank.
    embedHtml:'<a href="'+html(url)+'" rel="noopener noreferrer">Explore '+html(title)+' on ANEVUM</a>'
  });
}
